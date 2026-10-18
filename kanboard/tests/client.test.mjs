import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { test } from 'node:test';

import { createClient } from '../client.mjs';

function startStub(handler) {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

test('the client posts JSON-RPC with Basic auth and unwraps the result', async () => {
  const seen = [];
  const { server, port } = await startStub((request, response) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      seen.push({
        url: request.url,
        auth: request.headers.authorization,
        contentType: request.headers['content-type'],
        body,
      });
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { version: '1.2.54' } }));
    });
  });
  try {
    const client = createClient({ baseUrl: `http://127.0.0.1:${port}`, token: 'the-token' });
    const result = await client.call('getVersion');
    assert.deepStrictEqual(result, { version: '1.2.54' });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, '/jsonrpc.php');
    assert.equal(seen[0].auth, `Basic ${Buffer.from('jsonrpc:the-token').toString('base64')}`);
    assert.equal(seen[0].contentType, 'application/json');
    const parsed = JSON.parse(seen[0].body);
    assert.equal(parsed.jsonrpc, '2.0');
    assert.equal(parsed.method, 'getVersion');
    assert.equal(typeof parsed.id, 'number');
  } finally {
    server.close();
  }
});

test('the client throws Kanboard error messages and HTTP failures', async () => {
  const { server, port } = await startStub((request, response) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body);
      if (parsed.method === 'getVersion') {
        response.statusCode = 401;
        response.end('no');
        return;
      }
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ jsonrpc: '2.0', id: parsed.id, error: { code: 1, message: 'Wrong credentials' } }));
    });
  });
  try {
    const client = createClient({ baseUrl: `http://127.0.0.1:${port}/`, token: 'bad' });
    await assert.rejects(() => client.call('getVersion'), /HTTP 401/);
    await assert.rejects(() => client.call('getProjectByName', { name: 'x' }), /Wrong credentials/);
  } finally {
    server.close();
  }
});
