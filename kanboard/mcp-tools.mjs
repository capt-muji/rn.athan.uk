// The MCP tool surface: twenty workflow-shaped tools over Kanboard's JSON-RPC API.
// Every handler is async, returns a plain value the server stringifies, and throws
// Error on failure (the server turns that into isError content).

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STATE_FILE = path.join(MODULE_DIR, '..', 'state', 'sync.json');
const stateFile = () => process.env.KANBOARD_STATE_FILE ?? DEFAULT_STATE_FILE;

const SUBTASK_STATUS = { todo: 0, in_progress: 1, done: 2 };

async function resolveProject(ctx, name) {
  const wanted = name ?? ctx.projectName;
  const projects = await ctx.client.call('getAllProjects');
  const found = projects.find((project) => project.name === wanted || String(project.id) === String(wanted));
  if (!found) {
    throw new Error(`kanboard: no project named ${wanted}`);
  }
  return found;
}

async function resolveTicket(ctx, ticket) {
  const raw = typeof ticket === 'string' ? ticket.replace(/^#/, '') : ticket;
  if (Number.isInteger(raw) || /^\d+$/.test(String(raw))) {
    if (typeof raw === 'string' && ctx.projectId !== null) {
      const byReference = await ctx.client.call('getTaskByReference', {
        project_id: ctx.projectId,
        reference: raw,
      });
      if (byReference) {
        return byReference;
      }
      throw new Error(`kanboard: no task with reference ${raw} in ${ctx.projectName}`);
    }
    const byId = await ctx.client.call('getTask', { task_id: Number(raw) });
    if (!byId) {
      throw new Error(`kanboard: no task ${raw}`);
    }
    return byId;
  }
  throw new Error(`kanboard: cannot resolve ticket ${JSON.stringify(ticket)}`);
}

async function columnByName(ctx, name) {
  const columns = await ctx.client.call('getColumns', { project_id: ctx.projectId });
  const found = columns.find((column) => column.title === name);
  if (!found) {
    throw new Error(`kanboard: no column named ${name} in ${ctx.projectName}`);
  }
  return found;
}

async function boardTasks(ctx) {
  const board = await ctx.client.call('getBoard', { project_id: ctx.projectId });
  const tasks = [];
  for (const swimlane of board) {
    for (const column of swimlane.columns) {
      for (const task of column.tasks) {
        tasks.push({
          id: Number(task.id),
          reference: task.reference,
          title: task.title,
          column: column.title,
          position: Number(task.position),
          color: task.color_id,
          tags: task.tags ?? [],
          score: task.score,
          priority: task.priority,
          is_open: task.is_active === 1 || task.is_active === '1',
        });
      }
    }
  }
  return tasks;
}

async function withProject(ctx, args, build) {
  const project = args.project === undefined ? null : await resolveProject(ctx, args.project);
  const inner = {
    ...ctx,
    projectId: project === null ? ctx.projectId : Number(project.id),
    projectName: project === null ? ctx.projectName : project.name,
  };
  return build(inner);
}

const TOOLS = [
  {
    name: 'board_get',
    description: 'Read the whole board: every column with its tasks, ids, references, colors, tags and positions.',
    inputSchema: {
      type: 'object',
      properties: { project: { type: 'string', description: 'Project name or id; default the configured one' } },
    },
    async handler(args, ctx) {
      return withProject(ctx, args, async (inner) => ({
        project: inner.projectName,
        projectId: inner.projectId,
        tasks: await boardTasks(inner),
      }));
    },
  },
  {
    name: 'ticket_get',
    description:
      'Read one ticket in full: fields, description, links, subtasks and comment count. The ticket argument is a task id or a queue order like 70 or #70.',
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: ['integer', 'string'] } },
      required: ['ticket'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const [links, subtasks, comments] = await Promise.all([
        ctx.client.call('getAllTaskLinks', { task_id: Number(task.id) }),
        ctx.client.call('getAllSubtasks', { task_id: Number(task.id) }),
        ctx.client.call('getAllComments', { task_id: Number(task.id) }),
      ]);
      return { task, links, subtasks, commentCount: comments.length };
    },
  },
  {
    name: 'ticket_create',
    description:
      'Create a ticket. Column defaults to Backlog; reference is the queue-order key the sync respects when numeric.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        column: { type: 'string', description: 'Column title; default Backlog' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        color: {
          type: 'string',
          description: 'Color slot: grey, blue, cyan, amber, orange, red, teal, purple, yellow, dark_grey',
        },
        reference: { type: 'string' },
      },
      required: ['title'],
    },
    async handler(args, ctx) {
      return withProject(ctx, args, async (inner) => {
        const column = await columnByName(inner, args.column ?? 'Backlog');
        const taskId = await inner.client.call('createTask', {
          title: args.title,
          project_id: inner.projectId,
          color_id: args.color ?? '',
          column_id: Number(column.id),
          description: args.description ?? '',
          reference: args.reference ?? '',
          tags: args.tags ?? [],
        });
        if (!taskId) {
          throw new Error('kanboard: createTask returned false');
        }
        return { taskId, reference: args.reference ?? '' };
      });
    },
  },
  {
    name: 'ticket_update',
    description: 'Update a ticket title, description, tags, color or priority. Only the given fields change.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket: { type: ['integer', 'string'] },
        title: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        color: { type: 'string' },
        priority: { type: 'integer' },
      },
      required: ['ticket'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const values = { id: Number(task.id) };
      for (const field of ['title', 'description', 'priority']) {
        if (args[field] !== undefined) {
          values[field] = args[field];
        }
      }
      if (args.color !== undefined) {
        values.color_id = args.color;
      }
      if (args.tags !== undefined) {
        values.tags = args.tags;
      }
      const ok = await ctx.client.call('updateTask', values);
      return { updated: ok === true, taskId: Number(task.id) };
    },
  },
  {
    name: 'ticket_move',
    description: 'Move a ticket to a column; without a position it appends to the end of that column.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket: { type: ['integer', 'string'] },
        column: { type: 'string' },
        position: { type: 'integer', description: '1-based; omit to append' },
      },
      required: ['ticket', 'column'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const column = await columnByName(ctx, args.column);
      const position = args.position ?? (await boardTasks(ctx)).filter((t) => t.column === args.column).length + 1;
      const ok = await ctx.client.call('moveTaskPosition', {
        project_id: Number(task.project_id),
        task_id: Number(task.id),
        column_id: Number(column.id),
        position,
        swimlane_id: Number(task.swimlane_id),
      });
      return { moved: ok === true, taskId: Number(task.id), column: args.column, position };
    },
  },
  {
    name: 'ticket_open',
    description: 'Reopen a closed ticket so it shows on the board again.',
    inputSchema: { type: 'object', properties: { ticket: { type: ['integer', 'string'] } }, required: ['ticket'] },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const ok = await ctx.client.call('openTask', { task_id: Number(task.id) });
      return { opened: ok === true, taskId: Number(task.id) };
    },
  },
  {
    name: 'ticket_close',
    description: 'Close a ticket: it leaves the board but keeps its history.',
    inputSchema: { type: 'object', properties: { ticket: { type: ['integer', 'string'] } }, required: ['ticket'] },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const ok = await ctx.client.call('closeTask', { task_id: Number(task.id) });
      return { closed: ok === true, taskId: Number(task.id) };
    },
  },
  {
    name: 'ticket_delete',
    description: 'Delete a ticket permanently.',
    inputSchema: { type: 'object', properties: { ticket: { type: ['integer', 'string'] } }, required: ['ticket'] },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const ok = await ctx.client.call('removeTask', { task_id: Number(task.id) });
      return { deleted: ok === true, taskId: Number(task.id) };
    },
  },
  {
    name: 'tickets_search',
    description: 'Search tickets with Kanboard search syntax, scoped to the configured project.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, project: { type: 'string' } },
      required: ['query'],
    },
    async handler(args, ctx) {
      return withProject(ctx, args, (inner) =>
        inner.client.call('searchTasks', { project_id: inner.projectId, query: args.query })
      );
    },
  },
  {
    name: 'ticket_comment',
    description: 'Add a comment to a ticket. Comments are agent-writable: the sync never touches them.',
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: ['integer', 'string'] }, text: { type: 'string' } },
      required: ['ticket', 'text'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const id = await ctx.client.call('createComment', {
        task_id: Number(task.id),
        user_id: 0,
        content: args.text,
      });
      return { commentId: id, taskId: Number(task.id) };
    },
  },
  {
    name: 'ticket_comments',
    description: 'List every comment on a ticket.',
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: ['integer', 'string'] } },
      required: ['ticket'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      return ctx.client.call('getAllComments', { task_id: Number(task.id) });
    },
  },
  {
    name: 'link_tickets',
    description:
      'Link two tickets: blocks, is blocked by, duplicates, is duplicated by, is a child of, is a parent of, relates to.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket: { type: ['integer', 'string'] },
        opposite: { type: ['integer', 'string'] },
        link: {
          type: 'string',
          enum: [
            'blocks',
            'is blocked by',
            'duplicates',
            'is duplicated by',
            'is a child of',
            'is a parent of',
            'relates to',
          ],
        },
      },
      required: ['ticket', 'opposite', 'link'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const opposite = await resolveTicket(ctx, args.opposite);
      const label = await ctx.client.call('getLinkByLabel', { label: args.link });
      if (!label) {
        throw new Error(`kanboard: no link label ${args.link}`);
      }
      const id = await ctx.client.call('createTaskLink', {
        task_id: Number(task.id),
        opposite_task_id: Number(opposite.id),
        link_id: Number(label.id),
      });
      return { taskLinkId: id, link: args.link };
    },
  },
  {
    name: 'unlink_tickets',
    description: 'Remove links from a ticket; without an opposite, every link goes.',
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: ['integer', 'string'] }, opposite: { type: ['integer', 'string'] } },
      required: ['ticket'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const links = await ctx.client.call('getAllTaskLinks', { task_id: Number(task.id) });
      const oppositeId = args.opposite === undefined ? null : Number((await resolveTicket(ctx, args.opposite)).id);
      const removed = [];
      for (const link of links) {
        if (oppositeId !== null && Number(link.task_id) !== oppositeId) {
          continue;
        }
        const ok = await ctx.client.call('removeTaskLink', { task_id: Number(task.id), task_link_id: Number(link.id) });
        if (ok) {
          removed.push(link.label);
        }
      }
      return { removed };
    },
  },
  {
    name: 'subtask_list',
    description: 'List the subtasks (plan steps) on a ticket.',
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: ['integer', 'string'] } },
      required: ['ticket'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      return ctx.client.call('getAllSubtasks', { task_id: Number(task.id) });
    },
  },
  {
    name: 'subtask_create',
    description: 'Add a subtask to a ticket.',
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: ['integer', 'string'] }, title: { type: 'string' } },
      required: ['ticket', 'title'],
    },
    async handler(args, ctx) {
      const task = await resolveTicket(ctx, args.ticket);
      const id = await ctx.client.call('createSubtask', { task_id: Number(task.id), title: args.title });
      return { subtaskId: id, taskId: Number(task.id) };
    },
  },
  {
    name: 'subtask_update',
    description: 'Rename a subtask or set its status: todo, in_progress or done.',
    inputSchema: {
      type: 'object',
      properties: {
        subtask: { type: 'integer' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
      },
      required: ['subtask'],
    },
    async handler(args, ctx) {
      const values = { id: args.subtask };
      if (args.title !== undefined) {
        values.title = args.title;
      }
      if (args.status !== undefined) {
        values.status = SUBTASK_STATUS[args.status];
      }
      const ok = await ctx.client.call('updateSubtask', values);
      return { updated: ok === true, subtaskId: args.subtask };
    },
  },
  {
    name: 'subtask_delete',
    description: 'Delete a subtask.',
    inputSchema: {
      type: 'object',
      properties: { subtask: { type: 'integer' } },
      required: ['subtask'],
    },
    async handler(args, ctx) {
      const ok = await ctx.client.call('removeSubtask', { subtask_id: args.subtask });
      return { deleted: ok === true, subtaskId: args.subtask };
    },
  },
  {
    name: 'project_list',
    description: 'List every project on the instance.',
    inputSchema: { type: 'object', properties: {} },
    async handler(_args, ctx) {
      const projects = await ctx.client.call('getAllProjects');
      return projects.map((project) => ({
        id: Number(project.id),
        name: project.name,
        identifier: project.identifier ?? '',
        is_active: project.is_active === 1 || project.is_active === '1',
      }));
    },
  },
  {
    name: 'project_create',
    description: 'Create a new project on the instance.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' }, description: { type: 'string' } },
      required: ['name'],
    },
    async handler(args, ctx) {
      const id = await ctx.client.call('createProject', { name: args.name, description: args.description ?? '' });
      if (!id) {
        throw new Error('kanboard: createProject returned false');
      }
      return { projectId: id };
    },
  },
  {
    name: 'sync_status',
    description: 'Read the queue mirror state: last run, counts, unparseable queue rows, errors.',
    inputSchema: { type: 'object', properties: {} },
    async handler(_args, _ctx) {
      const file = stateFile();
      if (!existsSync(file)) {
        return { running: false, note: 'no sync state file yet; the sync service has not completed a pass' };
      }
      try {
        return JSON.parse(readFileSync(file, 'utf8'));
      } catch {
        return { running: false, note: 'sync state file unreadable' };
      }
    },
  },
];

export { boardTasks, columnByName, resolveProject, resolveTicket, TOOLS };
