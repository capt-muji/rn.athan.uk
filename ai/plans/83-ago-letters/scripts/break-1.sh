#!/bin/bash
# Step 1 break: four mutations of the lettered rule must each be caught by the suite
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
T=shared/time.ts
C=components/prayer/Ago.tsx
TB="$TMPDIR/83-break-time-backup.ts"
CB="$TMPDIR/83-break-ago-backup.tsx"
LOG="$TMPDIR/break83-jest.log"

cp "$T" "$TB"
cp "$C" "$CB"

run_unit() {
  npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit > "$LOG" 2>&1
}

run_components() {
  npx jest components/prayer/__tests__/Ago.test.tsx --watchman=false --selectProjects=components > "$LOG" 2>&1
}

restore() {
  cp "$TB" "$T"
  cp "$CB" "$C"
}

mutate() {
  python3 - "$1" "$2" "$3" <<'EOF' || exit 1
import pathlib, sys
path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
p = pathlib.Path(path)
s = p.read_text()
assert s.count(old) == 1, f'mutation target not found exactly once in {path}: {old!r}'
p.write_text(s.replace(old, new))
EOF
}

# 1. The now-word boundary moves: 59 seconds must still read now
mutate "$T" 'if (seconds < 60) {' 'if (seconds < 59) {'
run_unit
if [ $? -eq 0 ] || ! grep -q 'returns "now" for < 60 seconds' "$LOG"; then
  restore; echo "BREAK NOT APPLIED: mutation 1 survived"; exit 1
fi
cp "$TB" "$T"

# 2. The zero-minute drop breaks: a whole hour must read Xh alone
mutate "$T" 'if (remainingMinutes === 0) {' 'if (remainingMinutes === 1) {'
run_unit
if [ $? -eq 0 ] || ! grep -q 'dropping a zero-minute group' "$LOG"; then
  restore; echo "BREAK NOT APPLIED: mutation 2 survived"; exit 1
fi
cp "$TB" "$T"

# 3. The minutes branch of the pattern dies: 58m must not split
mutate "$T" 'const match = value.match(/\d+h(?: \d+m)?|\d+m/);' 'const match = value.match(/\d+h \d+m/);'
run_components
if [ $? -eq 0 ] || ! grep -q 'Dhuhr 58 m ago' "$LOG"; then
  restore; echo "BREAK NOT APPLIED: mutation 3 survived"; exit 1
fi
cp "$TB" "$T"

# 4. The ruled letter ink dies: the opacity must be asserted
mutate "$C" '    opacity: 0.4,' ''
run_components
if [ $? -eq 0 ] || ! grep -q '40 percent of its ink' "$LOG"; then
  restore; echo "BREAK NOT APPLIED: mutation 4 survived"; exit 1
fi
cp "$CB" "$C"

cmp -s "$TB" "$T" && cmp -s "$CB" "$C" || { echo "BREAK NOT APPLIED: source left modified"; exit 1; }
echo "ALL AS EXPECTED: 1"
