// The stdio MCP server: newline-delimited JSON-RPC 2.0 on stdin and stdout, no
// dependencies. Everything diagnostic goes to stderr; stdout carries protocol
// messages only, one per line.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import { createClient } from './client.mjs';
import { TOOLS } from './mcp-tools.mjs';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS = {
  KANBOARD_URL: 'http://127.0.0.1:8789',
  KANBOARD_PROJECT: 'rn.athan.uk',
};

function loadEnvFile() {
  const file = path.join(MODULE_DIR, '.env');
  if (!existsSync(file)) {
    return {};
  }
  const values = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      values[match[1]] = match[2];
    }
  }
  return values;
}

export function resolveConfig(env = process.env, fileValues = loadEnvFile()) {
  const read = (key) => env[key] ?? fileValues[key] ?? DEFAULTS[key];
  return {
    baseUrl: read('KANBOARD_URL'),
    token: read('KANBOARD_API_TOKEN') ?? '',
    projectName: read('KANBOARD_PROJECT'),
  };
}

let cachedContext = null;

async function contextFor() {
  if (cachedContext !== null) {
    return cachedContext;
  }
  const config = resolveConfig();
  const client = createClient({ baseUrl: config.baseUrl, token: config.token });
  const projects = await client.call('getAllProjects');
  const found = projects.find((project) => project.name === config.projectName);
  if (!found) {
    throw new Error(`kanboard: configured project ${config.projectName} does not exist`);
  }
  cachedContext = { client, projectId: Number(found.id), projectName: found.name };
  return cachedContext;
}

const toolByName = new Map(TOOLS.map((tool) => [tool.name, tool]));

async function callTool(name, args, ctx) {
  const tool = toolByName.get(name);
  if (!tool) {
    throw new Error(`unknown tool: ${name}`);
  }
  return tool.handler(args ?? {}, ctx);
}

export async function handleMessage(message, deps = {}) {
  const resolveContext = deps.contextFor ?? contextFor;
  if (message === null || typeof message !== 'object' || Array.isArray(message)) {
    return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'invalid request' } };
  }
  const method = message.method;
  const id = message.id ?? null;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: message.params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'kanboard-board', version: '1.0.0' },
      },
    };
  }
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema })),
      },
    };
  }
  if (method === 'tools/call') {
    const name = message.params?.name;
    const args = message.params?.arguments ?? {};
    try {
      const ctx = await resolveContext();
      const value = await callTool(name, args, ctx);
      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] },
      };
    } catch (failure) {
      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: failure.message }], isError: true },
      };
    }
  }
  if (id === null) {
    return null;
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } };
}

export function main(stdin = process.stdin, stdout = process.stdout) {
  const lines = createInterface({ input: stdin });
  lines.on('line', (line) => {
    const trimmed = line.trim();
    if (trimmed === '') {
      return;
    }
    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      stdout.write(
        `${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } })}\n`
      );
      return;
    }
    handleMessage(message)
      .then((response) => {
        if (response !== null) {
          stdout.write(`${JSON.stringify(response)}\n`);
        }
      })
      .catch((failure) => {
        stdout.write(
          `${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: failure.message } })}\n`
        );
      });
  });
  lines.on('close', () => {
    process.exit(0);
  });
}

const invokedAsScript = process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (invokedAsScript) {
  main();
}
