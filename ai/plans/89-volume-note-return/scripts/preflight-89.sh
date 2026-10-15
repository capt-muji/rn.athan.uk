#!/usr/bin/env bash
# Ticket 89 pre-flight. The executor saves a copy to $TMPDIR and runs it from there.
# Checks the lane checkout, the tree, the anchor ancestry, the version floor, the queue
# status and every anchor count, all resolved under the lane path. Prints PREFLIGHT OK
# when everything holds.
set -u
die() { printf 'PREFLIGHT FAILED: %s\n' "$1"; exit 1; }

LANE="$HOME/athan-gitree/lanes/89"
ANCHOR_SHA="5a3fba847a67e216988c3dca89144b0128faf4d3"
ANCHOR_VERSION="2.0.733"
A="$LANE/ai/plans/89-volume-note-return/scripts/anchors"

printf '1. the working tree is the lane\n'
[ "$(pwd)" = "$LANE" ] || die "run from $LANE, not $(pwd)"

printf '2. the branch and the tree\n'
[ "$(git -C "$LANE" branch --show-current)" = "lane/89" ] || die "branch is $(git -C "$LANE" branch --show-current), expected lane/89"
[ -z "$(git -C "$LANE" status --porcelain)" ] || die "tree is dirty: $(git -C "$LANE" status --porcelain | head -3)"

printf '3. the anchor ancestry\n'
git -C "$LANE" merge-base --is-ancestor "$ANCHOR_SHA" HEAD || die "HEAD does not descend from $ANCHOR_SHA"

printf '4. the version floor\n'
V="$(node -e "console.log(require('$LANE/package.json').version)")"
node -e "const a=process.argv[1].split('.').map(Number),b=process.argv[2].split('.').map(Number);process.exit(a<=b?1:0)" "$V" "$ANCHOR_VERSION" || die "version $V is not above the Planned-at version $ANCHOR_VERSION"

printf '5. the queue holds this ticket READY\n'
grep -q '^| 89 |' "$LANE/ai/plans/README.md" || die "queue has no row 89"
grep '^| 89 |' "$LANE/ai/plans/README.md" | grep -q 'READY' || die "row 89 is not READY"

printf '6. every anchor counts exactly 1\n'
while read -r anchor source; do
  n="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$anchor" "$LANE/$source")"
  [ "$n" = "1" ] || die "anchor $anchor counts $n in $source"
done <<'PAIRS'
alert-sheet-children.txt components/sheets/screens/Alert.tsx
sound-sheet-card.txt components/sheets/screens/Sound.tsx
parts-index.txt components/sheets/parts/index.ts
en-volume-keys.txt shared/i18n/en.ts
ar-volume-keys.txt shared/i18n/ar.ts
hi-volume-keys.txt shared/i18n/hi.ts
ms-volume-keys.txt shared/i18n/ms.ts
so-volume-keys.txt shared/i18n/so.ts
th-volume-keys.txt shared/i18n/th.ts
i18n-pins.txt shared/__tests__/i18n.test.ts
sweep-inventory.txt components/__tests__/typographySweep.test.tsx
alert-test-anchor.txt components/sheets/screens/__tests__/Alert.test.tsx
sound-test-anchor.txt components/sheets/screens/__tests__/Sound.test.tsx
PAIRS

printf 'PREFLIGHT OK\n'
