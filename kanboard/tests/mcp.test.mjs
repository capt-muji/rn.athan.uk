import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { handleMessage } from '../mcp-server.mjs';
import { resolveTicket, TOOLS } from '../mcp-tools.mjs';

function fakeClient(responses) {
  const calls = [];
  const client = {
    calls,
    username: 'jsonrpc',
    baseUrl: 'http://fake/',
    async call(method, params) {
      calls.push({ method, params });
      const handler = responses[method];
      if (handler === undefined) {
        throw new Error(`fake client: unexpected method ${method}`);
      }
      return typeof handler === 'function' ? handler(params) : handler;
    },
  };
  return client;
}

const ctx = (client) => ({ client, projectId: 1, projectName: 'rn.athan.uk' });

const tool = (name) => {
  const found = TOOLS.find((entry) => entry.name === name);
  if (!found) {
    throw new Error(`no tool ${name}`);
  }
  return found;
};

test('the toolset carries exactly the twenty workflow tools', () => {
  assert.deepStrictEqual(
    TOOLS.map((entry) => entry.name),
    [
      'board_get',
      'ticket_get',
      'ticket_create',
      'ticket_update',
      'ticket_move',
      'ticket_open',
      'ticket_close',
      'ticket_delete',
      'tickets_search',
      'ticket_comment',
      'ticket_comments',
      'link_tickets',
      'unlink_tickets',
      'subtask_list',
      'subtask_create',
      'subtask_update',
      'subtask_delete',
      'project_list',
      'project_create',
      'sync_status',
    ]
  );
});

test('resolveTicket reads references as queue orders and numbers as task ids', async () => {
  const client = fakeClient({
    getTaskByReference: { id: '7', reference: '70', title: 'the mirrored ticket' },
    getTask: { id: '12', reference: '', title: 'agent ticket' },
  });
  const byReference = await resolveTicket(ctx(client), '#70');
  assert.equal(byReference.id, '7');
  assert.deepStrictEqual(client.calls[0], { method: 'getTaskByReference', params: { project_id: 1, reference: '70' } });
  const byId = await resolveTicket(ctx(client), 12);
  assert.equal(byId.id, '12');
});

test('ticket_create lands in the named column with tags and reference', async () => {
  const client = fakeClient({
    getColumns: [{ id: '2', title: 'Backlog', position: '1' }],
    createTask: 41,
  });
  const result = await tool('ticket_create').handler(
    { title: 'New job', tags: ['agent'], reference: '900' },
    ctx(client)
  );
  assert.deepStrictEqual(result, { taskId: 41, reference: '900' });
  assert.deepStrictEqual(client.calls[1], {
    method: 'createTask',
    params: {
      title: 'New job',
      project_id: 1,
      color_id: '',
      column_id: 2,
      description: '',
      reference: '900',
      tags: ['agent'],
    },
  });
});

test('ticket_move appends by counting the target column when no position is given', async () => {
  const client = fakeClient({
    getTask: { id: '41', project_id: '1', swimlane_id: '1' },
    getColumns: [{ id: '4', title: 'Ready', position: '3' }],
    getBoard: [
      {
        columns: [
          { title: 'Backlog', tasks: [{ id: '1' }, { id: '2' }] },
          { title: 'Ready', tasks: [{ id: '9' }, { id: '10' }, { id: '11' }] },
        ],
      },
    ],
    moveTaskPosition: true,
  });
  const result = await tool('ticket_move').handler({ ticket: 41, column: 'Ready' }, ctx(client));
  assert.deepStrictEqual(result, { moved: true, taskId: 41, column: 'Ready', position: 4 });
  assert.deepStrictEqual(client.calls.at(-1).params, {
    project_id: 1,
    task_id: 41,
    column_id: 4,
    position: 4,
    swimlane_id: 1,
  });
});

test('link_tickets resolves the label to an id at call time', async () => {
  const client = fakeClient({
    getTask: { id: '41', project_id: '1' },
    getTaskByReference: { id: '7', project_id: '1' },
    getLinkByLabel: { id: '3', label: 'is blocked by' },
    createTaskLink: { task_id: '41', opposite_task_id: '7' },
  });
  const result = await tool('link_tickets').handler(
    { ticket: 41, opposite: '#70', link: 'is blocked by' },
    ctx(client)
  );
  assert.deepStrictEqual(result, { taskLinkId: { task_id: '41', opposite_task_id: '7' }, link: 'is blocked by' });
  const linkCall = client.calls.find((entry) => entry.method === 'createTaskLink');
  assert.deepStrictEqual(linkCall.params, { task_id: 41, opposite_task_id: 7, link_id: 3 });
  const labelCall = client.calls.find((entry) => entry.method === 'getLinkByLabel');
  assert.deepStrictEqual(labelCall.params, { label: 'is blocked by' });
});

test('an API error becomes isError content through the dispatcher', async () => {
  const client = fakeClient({});
  const response = await handleMessage(
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'project_list', arguments: {} } },
    { contextFor: async () => ctx(client) }
  );
  assert.equal(response.id, 5);
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /unexpected method getAllProjects/);
  assert.deepStrictEqual(client.calls, [{ method: 'getAllProjects', params: undefined }]);
});

test('the dispatcher answers initialize, ping, tools/list and absorbs notifications', async () => {
  const init = await handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18' },
  });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.deepStrictEqual(init.result.capabilities, { tools: {} });

  const pong = await handleMessage({ jsonrpc: '2.0', id: 2, method: 'ping' });
  assert.deepStrictEqual(pong.result, {});

  const list = await handleMessage({ jsonrpc: '2.0', id: 3, method: 'tools/list' });
  assert.equal(list.result.tools.length, 20);
  for (const entry of list.result.tools) {
    assert.equal(typeof entry.name, 'string');
    assert.equal(typeof entry.description, 'string');
    assert.equal(entry.inputSchema.type, 'object');
  }

  const absorbed = await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(absorbed, null);

  const unknown = await handleMessage({ jsonrpc: '2.0', id: 4, method: 'nope' });
  assert.equal(unknown.error.code, -32601);
});

test('sync_status answers before the state file exists and reads it once written', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kanboard-syncstatus-'));
  const stateFile = path.join(dir, 'sync.json');
  const saved = process.env.KANBOARD_STATE_FILE;
  process.env.KANBOARD_STATE_FILE = stateFile;
  try {
    const absent = await tool('sync_status').handler({}, ctx(fakeClient({})));
    assert.equal(absent.running, false);
    assert.match(absent.note, /no sync state file/);

    writeFileSync(stateFile, '{"lastRun":"2026-10-18T20:00:00Z","taskCount":127}\n');
    const present = await tool('sync_status').handler({}, ctx(fakeClient({})));
    assert.equal(present.taskCount, 127);
  } finally {
    if (saved === undefined) {
      delete process.env.KANBOARD_STATE_FILE;
    } else {
      process.env.KANBOARD_STATE_FILE = saved;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test('board_get flattens swimlanes into columns and tasks', async () => {
  const client = fakeClient({
    getAllProjects: [{ id: '1', name: 'rn.athan.uk' }],
    getBoard: [
      {
        columns: [
          {
            title: 'Backlog',
            tasks: [
              {
                id: '3',
                reference: '70',
                title: '#70 the board',
                color_id: 'grey',
                tags: [],
                position: '1',
                is_active: '1',
              },
            ],
          },
          { title: 'Ready', tasks: [] },
        ],
      },
    ],
  });
  const result = await tool('board_get').handler({}, ctx(client));
  assert.equal(result.project, 'rn.athan.uk');
  assert.deepStrictEqual(result.tasks, [
    {
      id: 3,
      reference: '70',
      title: '#70 the board',
      column: 'Backlog',
      position: 1,
      color: 'grey',
      tags: [],
      score: undefined,
      priority: undefined,
      is_open: true,
    },
  ]);
});

test('subtask_update maps status words to codes', async () => {
  const client = fakeClient({ updateSubtask: true });
  const result = await tool('subtask_update').handler({ subtask: 9, status: 'done' }, ctx(client));
  assert.deepStrictEqual(result, { updated: true, subtaskId: 9 });
  assert.deepStrictEqual(client.calls[0], { method: 'updateSubtask', params: { id: 9, status: 2 } });
});

test('project_create fails loudly when Kanboard refuses', async () => {
  const client = fakeClient({ createProject: false });
  await assert.rejects(
    () => tool('project_create').handler({ name: 'x' }, ctx(client)),
    /createProject returned false/
  );
});

test('ticket_update sends only the changed fields', async () => {
  const client = fakeClient({
    getTaskByReference: { id: '41', project_id: '1' },
    updateTask: true,
  });
  const result = await tool('ticket_update').handler({ ticket: '#41', title: 'Renamed', tags: ['a'] }, ctx(client));
  assert.deepStrictEqual(result, { updated: true, taskId: 41 });
  assert.deepStrictEqual(client.calls[1], { method: 'updateTask', params: { id: 41, title: 'Renamed', tags: ['a'] } });
});

test('the env fallback chain merges process env over the .env file over defaults', async () => {
  const { resolveConfig } = await import('../mcp-server.mjs');
  const fromFile = { KANBOARD_URL: 'http://from-file:9000/', KANBOARD_PROJECT: 'from-file-project' };
  const merged = resolveConfig({ KANBOARD_API_TOKEN: 'from-env' }, fromFile);
  assert.equal(merged.baseUrl, 'http://from-file:9000/');
  assert.equal(merged.token, 'from-env');
  assert.equal(merged.projectName, 'from-file-project');

  const allDefaults = resolveConfig({}, {});
  assert.equal(allDefaults.baseUrl, 'http://127.0.0.1:8789');
  assert.equal(allDefaults.projectName, 'rn.athan.uk');
  assert.equal(allDefaults.token, '');

  const envWins = resolveConfig({ KANBOARD_URL: 'http://from-env:1/' }, fromFile);
  assert.equal(envWins.baseUrl, 'http://from-env:1/');
});
