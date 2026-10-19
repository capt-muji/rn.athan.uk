#!/usr/bin/env bash
# Break step 3: read the board's MCP endpoint with no key and record the refusal.
set -u
curl -s -o /dev/null -w 'mcp without a key answers %{http_code}\n' \
  -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"break","version":"0"}}}'
