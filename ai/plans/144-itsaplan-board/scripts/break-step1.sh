#!/usr/bin/env bash
# Break step 1: stop the stack and record that the login screen answers nothing.
set -u
docker compose --env-file "$HOME/athan-gitree/sessions/144/.env" \
  -f "$HOME/athan-gitree/sessions/144/itsaplan/docker-compose.yml" down >/dev/null 2>&1
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3001/login || true)"
echo "web /login answers ${code:-no response} with the stack down"
