#!/usr/bin/env bash
# Pre-flight for ticket 78. This run works in the ticket/78 worktree, not on uat
# (the owner's run order, 2026-10-14). Save a copy to $TMPDIR and run from there.
set -u
cd "$HOME/athan-gitree/run-78" || { echo "PREFLIGHT FAILED: no worktree at $HOME/athan-gitree/run-78"; exit 1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "ticket/78" ] || { echo "PREFLIGHT FAILED: branch is $branch, want ticket/78"; exit 1; }

[ -z "$(git status --porcelain -- . ':!ai/plans/78-rtl-reload-starvation')" ] || { echo "PREFLIGHT FAILED: tree not clean outside the plan folder"; git status --short; exit 1; }

git merge-base --is-ancestor b1bf6f89 HEAD || { echo "PREFLIGHT FAILED: head does not descend from the anchor b1bf6f89"; exit 1; }

version="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 -c 'import sys;raise SystemExit(0 if "2.0.255" <= sys.argv[1] < "2.0.400" else 1)' "$version" || {
  echo "PREFLIGHT FAILED: version $version is outside the planned range 2.0.255 to 2.0.399"; exit 1; }

[ -e node_modules/.bin/jest ] || { echo "PREFLIGHT FAILED: node_modules missing (ln -s $HOME/repos/rn.athan.uk/node_modules node_modules)"; exit 1; }

anchor_root="ai/plans/78-rtl-reload-starvation/scripts/anchors"
check() {
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor_root/$1" "$2")"
  [ "$count" = "1" ] || { echo "PREFLIGHT FAILED: anchor $1 counts $count in $2 (want 1)"; exit 1; }
}
check language-commit-await.txt stores/language.ts
check scheduling-queue.txt stores/notifications.ts
check native-call-timeout.txt shared/notifications.ts
check launch-init-latch.txt app/index.tsx
check updates-js-reload.txt node_modules/expo-updates/build/Updates.js
check updates-recreate-procedure.txt node_modules/expo-updates/android/src/main/java/expo/modules/updates/procedures/RecreateReactContextProcedure.kt

echo "PREFLIGHT OK"
