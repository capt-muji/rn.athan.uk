// The JSON-RPC 2.0 client for Kanboard's API: one POST per call, HTTP Basic auth with
// the application token user, a 15-second abort, and errors thrown as Error carrying
// Kanboard's own message. No dependencies.

const TIMEOUT_MS = 15000;

let nextId = 0;

export function createClient({ baseUrl, token, username = 'jsonrpc', fetchImpl = globalThis.fetch }) {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const auth = `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`;

  if (typeof fetchImpl !== 'function') {
    throw new Error('kanboard client: no fetch implementation available');
  }

  async function call(method, params = {}) {
    nextId += 1;
    const body = { jsonrpc: '2.0', id: nextId, method, params };
    let response;
    try {
      response = await fetchImpl(`${root}jsonrpc.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (failure) {
      throw new Error(`kanboard client: ${method} unreachable: ${failure.message}`);
    }
    if (!response.ok) {
      throw new Error(`kanboard client: ${method} HTTP ${response.status}`);
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`kanboard client: ${method} returned a non-JSON body`);
    }
    if (payload.error) {
      throw new Error(`kanboard client: ${method}: ${payload.error.message}`);
    }
    return payload.result;
  }

  return { call, username, baseUrl: root };
}
