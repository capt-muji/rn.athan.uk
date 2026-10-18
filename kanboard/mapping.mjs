// The queue-to-Kanboard mapping: the markdown queue plus plan folders into the desired
// Kanboard state. Pure and deterministic: fixed key order, sorted iteration, no clock,
// no randomness. The same markdown produces a byte-identical object on every call.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  closedStatus,
  findPlanFolder,
  isMet,
  mapStatus,
  parseNeeds,
  parsePlan,
  parseQueue,
  platformOf,
  waitingLine,
} from '../board/reader.mjs';

export const COLUMNS = [
  'Backlog',
  'Planning',
  'Ready',
  'In progress',
  'Blocked',
  'Audit',
  'Owner-led',
  'Deferred',
  'Upstream',
  'Done',
];

export const STATUS_TO_COLUMN = {
  'IN PROGRESS': 'In progress',
  'NEEDS REPLAN': 'Planning',
  'NOT PLANNED': 'Backlog',
  PLANNING: 'Planning',
  READY: 'Ready',
  EXECUTED: 'Audit',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  UPSTREAM: 'Upstream',
  'OWNER-BLOCKED': 'Blocked',
  'OWNER-LED': 'Owner-led',
  DEFERRED: 'Deferred',
};

export const STATUS_TO_COLOR = {
  'NOT PLANNED': 'grey',
  PLANNING: 'blue',
  'NEEDS REPLAN': 'blue',
  READY: 'cyan',
  'IN PROGRESS': 'amber',
  EXECUTED: 'orange',
  DONE: 'dark_grey',
  BLOCKED: 'red',
  'OWNER-BLOCKED': 'red',
  UPSTREAM: 'teal',
  'OWNER-LED': 'purple',
  DEFERRED: 'yellow',
};

const LINK_BLOCKED_BY = 3;
const LINK_CHILD_OF = 6;
const TITLE_CAP = 120;
const STATUS_TEXT_CAP = 300;

const collapse = (text) => text.replace(/\s+/g, ' ').trim();

function readDoneCap(repoRoot) {
  const file = path.join(repoRoot, 'board', 'config.json');
  if (!existsSync(file)) return 5;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return Number.isInteger(parsed.doneColumnCount) ? parsed.doneColumnCount : 5;
  } catch {
    return 5;
  }
}

function unparseableRows(markdown) {
  const orders = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const fields = line.split('|');
    const order = Number.parseInt(fields[1].trim(), 10);
    if (!Number.isInteger(order)) continue;
    if (fields.length === 5 || fields.length === 7) continue;
    orders.push(order);
  }
  return { count: orders.length, orders: [...new Set(orders)].sort((a, b) => a - b) };
}

function descriptionOf(row, ticket) {
  const statusText = collapse(row.statusCell ?? ticket.statusPhrase).slice(0, STATUS_TEXT_CAP);
  const needs = ticket.needs.length > 0 ? `${ticket.needs.join(', ')} (unmet: ${ticket.unmet.join(', ')})` : '-';
  const waiting = ticket.awaitingOwner && ticket.waitingOn !== null ? ticket.waitingOn : '-';
  const lines = [
    `Status: ${statusText}`,
    `Needs: ${needs}`,
    `Waiting on: ${waiting}`,
    `Group: ${ticket.group ?? '-'}`,
    `Parent: ${ticket.parent === null ? '-' : `#${ticket.parent}`}`,
    `Platform: ${ticket.platform ?? '-'}`,
    `Plan: ${ticket.planName ?? '-'}`,
    '',
    row.brief ?? '',
  ];
  return lines.join('\n').trimEnd();
}

function taskOf(order, name, row, ticket, mirroredRefs) {
  const title = `#${order} ${collapse(name)}`.slice(0, TITLE_CAP);
  const tags = [ticket.statusPhrase];
  if (ticket.group !== null) tags.push(`group:${ticket.group}`);
  if (ticket.platform !== null) tags.push(`platform:${ticket.platform}`);
  if (ticket.blockedOverride) tags.push('unmet-needs');
  if (ticket.dangling) tags.push('dangling-need');
  if (ticket.unmapped) tags.push('unmapped-status');

  const links = [];
  for (const need of ticket.unmet) {
    if (!mirroredRefs.has(String(need))) continue;
    links.push({ oppositeReference: String(need), linkId: LINK_BLOCKED_BY });
  }
  if (ticket.parent !== null && mirroredRefs.has(String(ticket.parent))) {
    links.push({ oppositeReference: String(ticket.parent), linkId: LINK_CHILD_OF });
  }

  const subtasks = ticket.steps.map((step) => ({
    title: `Step ${step.n}: ${step.title}`,
    status: step.ticked ? 2 : step.n === ticket.cursor ? 1 : 0,
  }));

  return {
    reference: String(order),
    title,
    columnName: ticket.blockedOverride ? 'Blocked' : ticket.columnName,
    colorId: ticket.colorId,
    description: descriptionOf(row, ticket),
    tags,
    links,
    subtasks,
  };
}

function ticketFromRow(row, mapped, lookup, metOrders, repoRoot) {
  const planFolder = findPlanFolder(repoRoot, row.order);
  const plan = planFolder ? parsePlan(planFolder) : { parent: null, group: null, steps: [] };
  const needs = parseNeeds(row.needsCell ?? 'nothing');
  const needsMet = needs.map((need) => isMet(need, lookup, metOrders));
  const unmet = needs.filter((_, at) => !needsMet[at]);
  const columnKnown = Object.hasOwn(STATUS_TO_COLUMN, mapped.status);
  const columnName = columnKnown ? STATUS_TO_COLUMN[mapped.status] : 'Deferred';
  const colorId = STATUS_TO_COLOR[mapped.status] ?? 'yellow';
  return {
    planName: planFolder ? path.basename(planFolder) : null,
    statusPhrase: mapped.status,
    unmapped: !columnKnown,
    columnName,
    colorId,
    needs,
    unmet,
    awaitingOwner: mapped.status === 'OWNER-LED',
    waitingOn: row.needsCell === undefined ? null : waitingLine(row.needsCell),
    group: plan.group,
    parent: plan.parent,
    platform: planFolder ? platformOf(planFolder) : null,
    cursor: mapped.cursor,
    steps: plan.steps,
    blockedOverride: mapped.status !== 'DONE' && mapped.status !== 'OWNER-LED' && unmet.length > 0,
    dangling: unmet.some((need) => !lookup.some((entry) => entry.order === need)),
  };
}

export function desiredState(markdown, repoRoot) {
  const queue = parseQueue(markdown);
  const mappedRows = queue.open.map((row) => ({ row, mapped: mapStatus(row.statusCell) }));
  const lookup = mappedRows.map(({ row, mapped }) => ({ order: row.order, rendered: mapped.rendered }));
  const metOrders = [...queue.doneOrders, ...queue.settled];

  const openTickets = mappedRows
    .filter(({ mapped }) => mapped.rendered)
    .map(({ row, mapped }) => ({ row, ticket: ticketFromRow(row, mapped, lookup, metOrders, repoRoot) }));

  const doneCap = readDoneCap(repoRoot);
  const doneTop = [...queue.doneRows].sort((a, b) => b.order - a.order).slice(0, doneCap);
  const doneTickets = doneTop.map((row) => {
    const mapped = mapStatus(row.statusCell ?? 'DONE');
    const ticket = ticketFromRow(
      { ...row, needsCell: row.needsCell ?? 'nothing' },
      mapped,
      lookup,
      metOrders,
      repoRoot
    );
    return { row, ticket };
  });

  const mirroredRefs = new Set([...openTickets, ...doneTickets].map(({ row }) => String(row.order)));

  const tasks = [...openTickets, ...doneTickets].map(({ row, ticket }) =>
    taskOf(row.order, row.name, { brief: row.brief, statusCell: row.statusCell }, ticket, mirroredRefs)
  );

  return {
    project: 'rn.athan.uk',
    columns: COLUMNS,
    tasks,
    unparseable: unparseableRows(markdown),
  };
}

export { closedStatus };
