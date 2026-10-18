#!/usr/bin/env bash
# Break step 2: delete the project and record that the board holds no issues.
set -u
session="$HOME/athan-gitree/sessions/144"
curl -s -b "$session/cookies.txt" -X DELETE \
  http://localhost:3000/projects/athan-uk.QUEUE >/dev/null
curl -s -b "$session/cookies.txt" \
  "http://localhost:3000/projects/athan-uk.QUEUE/issues?limit=500"
echo
