#!/bin/bash
# Step 1 break: two mutations of the zero-drop rule must each be caught by the suite
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
F=components/countdown/Countdown.tsx
CP="$TMPDIR/countdown-break-backup.tsx"
run_suite() {
  npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components > "$TMPDIR/break1-jest.log" 2>&1
}

cp "$F" "$CP"

python3 - <<'EOF' || exit 1
import pathlib
p = pathlib.Path('components/countdown/Countdown.tsx')
s = p.read_text()
old = 'spent: value === 0 && (!isSeconds || !largerAllZero)'
assert s.count(old) == 1, 'mutation target not found exactly once'
p.write_text(s.replace(old, 'spent: false'))
EOF
run_suite
if [ $? -eq 0 ] || ! grep -q "1H alone" "$TMPDIR/break1-jest.log"; then
  cp "$CP" "$F"; echo "BREAK NOT APPLIED: mutation 1 survived"; exit 1
fi
cp "$CP" "$F"

python3 - <<'EOF' || exit 1
import pathlib
p = pathlib.Path('components/countdown/Countdown.tsx')
s = p.read_text()
old = 'spent: value === 0 && (!isSeconds || !largerAllZero)'
assert s.count(old) == 1, 'mutation target not found exactly once'
p.write_text(s.replace(old, 'spent: value === 0 && largerAllZero'))
EOF
run_suite
if [ $? -eq 0 ] || ! grep -q "1H alone" "$TMPDIR/break1-jest.log"; then
  cp "$CP" "$F"; echo "BREAK NOT APPLIED: mutation 2 survived"; exit 1
fi
cp "$CP" "$F"

git diff --quiet -- "$F" || { echo "BREAK NOT APPLIED: component left modified"; exit 1; }
echo "ALL ASPECTED: 1"
