#!/bin/bash
# Job 57 pre-flight. Save a copy to $TMPDIR and run it from there; it resolves
# paths relative to the repository.
set -euo pipefail
cd "$HOME/repos/rn.athan.uk"

fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || fail "not on uat"
[ -z "$(git status --porcelain | grep -v 'ai/plans/')" ] || fail "tree not clean"
git fetch -q origin uat || fail "fetch failed"
git merge-base --is-ancestor origin/uat uat || fail "origin/uat not merged"

python3 - <<'EOF' || exit 1
import pathlib, sys
root = pathlib.Path('.')
anchors = pathlib.Path('ai/plans/57-native-numerals/scripts/anchors')
pairs = [
    ('time-format-prayer', 'shared/time.ts'),
    ('time-format-elapsed', 'shared/time.ts'),
    ('time-date-localized', 'shared/time.ts'),
    ('bridge-substitution', 'shared/i18n/index.ts'),
    ('sounditem-local-format', 'components/sheets/parts/SoundItem.tsx'),
    ('widget-alabel', 'widgets/PrayerWidget.tsx'),
    ('stepper-raw-value', 'components/sheets/parts/Stepper.tsx'),
    ('useprayer-getshown', 'hooks/usePrayer.ts'),
    ('widget-daylist-time', 'shared/widgetTimeline.ts'),
    ('widget-next-time', 'shared/widgetTimeline.ts'),
    ('widget-stale-time', 'shared/widgetTimeline.ts'),
    ('widget-android-time', 'shared/widgetTimeline.ts'),
]
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

awk -F'|' '/^\| 39 \|/{sub(/^ +/,"",$5); exit ($5 ~ /^DONE 2026/)?0:1}' ai/plans/README.md || fail "row 39 not DONE"

version=$(python3 -c "import json; print(json.load(open('app.json'))['expo']['version'])")
python3 -c "import sys; sys.exit(0 if tuple(map(int,'$version'.split('.'))) >= (2,0,49) else 1)" || fail "version $version below the queue version 2.0.49"

echo "PREFLIGHT OK"
