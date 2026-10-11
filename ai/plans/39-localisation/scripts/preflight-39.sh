#!/usr/bin/env bash
# Job 39 pre-flight. The executor saves a copy to $TMPDIR and runs it from there.
# Ends PREFLIGHT OK, or names the failure.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "PREFLIGHT FAILED: not a git repo"; exit 1; }

fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

branch="$(git branch --show-current)"
[ "$branch" = "uat" ] || fail "checkout is on $branch, not uat"
[ -z "$(git status --porcelain)" ] || fail "tree is not clean"

git fetch -q origin uat || fail "cannot fetch origin uat"
merged=$(git merge-base --is-ancestor origin/uat uat && echo yes || echo no)
[ "$merged" = "yes" ] || fail "origin/uat is not merged into uat"

version=$(python3 -c "import json;print(json.load(open('app.json'))['expo']['version'])")
python3 - "$version" <<'EOF' || exit 1
import sys
v = sys.argv[1]
parts = [int(p) for p in v.split('.')]
if parts < [2, 0, 16]:
    print(f"PREFLIGHT FAILED: version {v} is below the planned-at 2.0.16")
    sys.exit(1)
EOF

queue=$(grep -c '^| 38 |.*DONE' ai/plans/README.md)
[ "$queue" -ge 1 ] || fail "row 38 is not DONE in the queue"
queue=$(grep -c '^| 55 |.*DONE' ai/plans/README.md)
[ "$queue" -ge 1 ] || fail "row 55 is not DONE in the queue"

anchors_dir="ai/plans/39-localisation/scripts/anchors"
[ -d "$anchors_dir" ] || fail "no anchors directory"
count=0
for f in "$anchors_dir"/*.txt; do
  [ -f "$f" ] || continue
  count=$((count + 1))
done
[ "$count" -ge 40 ] || fail "only $count anchors present (need 42)"

python3 - <<'EOF' || exit 1
import pathlib, re, sys
root = pathlib.Path('.')
anchors = pathlib.Path('ai/plans/39-localisation/scripts/anchors')
txt = pathlib.Path('ai/plans/39-localisation/scripts/extract-anchors-39.sh').read_text()
pairs = re.findall(r"\('([\w-]+)', '([^']+)'", txt)
bad = 0
for name, src in pairs:
    f = anchors / f'{name}.txt'
    if not f.exists():
        print(f'PREFLIGHT FAILED: anchor {name} missing'); bad += 1; continue
    n = (root / src).read_text().count(f.read_text())
    if n != 1:
        print(f'PREFLIGHT FAILED: anchor {name} counts {n} in {src}'); bad += 1
if bad:
    sys.exit(1)
print(f'anchors: {len(pairs)} verified')
EOF

node ai/plans/39-localisation/scripts/gate-catalogs.mjs >/dev/null 2>&1 || fail "catalog gates fail (node scripts/gate-catalogs.mjs to see)"

echo "PREFLIGHT OK"
