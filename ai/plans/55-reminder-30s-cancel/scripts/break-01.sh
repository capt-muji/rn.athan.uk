#!/bin/bash
# Break for job 55 step 01: the keep-alive branch reverts to a skip, and the two
# keep-alive tests must fail exactly as they did before the change.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

FILE=stores/notifications.ts
BACKUP="$TMPDIR/break-55-backup.ts"
cp "$FILE" "$BACKUP" || { echo "BREAK NOT APPLIED: no backup"; exit 1; }

python3 - <<'EOF' || exit 1
from pathlib import Path

path = Path("stores/notifications.ts")
source = path.read_text()
target = "      return { identifier, refused: false };"
count = source.count(target)
if count != 1:
    print(f"BREAK NOT APPLIED: keep-alive return count {count}")
    raise SystemExit(1)
path.write_text(source.replace(target, "      return SKIPPED_DAY;"))
EOF

npx jest stores/__tests__/reminderImminentKeepAlive.test.ts --watchman=false --selectProjects=unit --verbose \
  > "$TMPDIR/break-55.log" 2>&1
FAILS=$(grep -c "✕" "$TMPDIR/break-55.log")

cp "$BACKUP" "$FILE"

npx jest stores/__tests__/reminderImminentKeepAlive.test.ts --watchman=false --selectProjects=unit \
  > "$TMPDIR/break-55-restore.log" 2>&1
RESTORED=$(grep -cE "Tests: +5 passed" "$TMPDIR/break-55-restore.log")

if [ "$FAILS" = "2" ] && [ "$RESTORED" = "1" ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED: expected 2 failing tests and a restored 5-pass run, saw $FAILS and $RESTORED"
  exit 1
fi
