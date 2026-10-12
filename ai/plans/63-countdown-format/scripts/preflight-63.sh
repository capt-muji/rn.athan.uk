#!/usr/bin/env bash
# Ticket 63 pre-flight. Copy to $TMPDIR and run from there.
set -u
fail=0
reasons=""

say() { reasons="${reasons}$1\n"; fail=1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "uat" ] || say "not on uat (on $branch)"

[ -z "$(git status --porcelain)" ] || say "tree not clean"

git fetch origin uat >/dev/null 2>&1
merged=$(git rev-list --count origin/uat..uat)
[ "$merged" = "0" ] || say "origin/uat not merged in ($merged commits ahead)"

ver="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.122"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 122) else 1)
EOF

# Anchor counts: every file under scripts/anchors must count exactly 1 in its source.
declare -a pairs
pairs=(
  "time-imports.txt shared/time.ts"
  "time-labels.txt shared/time.ts"
  "time-format-core.txt shared/time.ts"
  "time-ago.txt shared/time.ts"
  "en-notification.txt shared/i18n/en.ts"
  "en-channel.txt shared/i18n/en.ts"
  "ar-notification.txt shared/i18n/ar.ts"
  "ar-channel.txt shared/i18n/ar.ts"
  "notif-pin.txt shared/__tests__/notifications.test.ts"
  "contract-pin.txt shared/__tests__/prayerIdContract.test.ts"
  "bridge-pin.txt shared/__tests__/i18nBridge.test.ts"
  "countdown-pin.txt stores/__tests__/countdown.test.ts"
  "countdown-ar-pin.txt stores/__tests__/countdown.test.ts"
  "schedule-pin.txt stores/__tests__/schedule.test.ts"
  "screen-pin.txt __tests__/app/Screen.test.tsx"
  "hero-pin.txt components/countdown/__tests__/Countdown.test.tsx"
  "ago-pin.txt components/prayer/__tests__/Ago.test.tsx"
)
here="ai/plans/63-countdown-format/scripts"
for entry in "${pairs[@]}"; do
  a="${entry%% *}"
  src="${entry#* }"
  anchor="$here/anchors/$a"
  if [ ! -f "$anchor" ]; then
    say "anchor file missing: $a"
    continue
  fi
  lines=$(wc -l < "$anchor" | tr -d ' ')
  if [ "$lines" -lt 3 ] || [ "$lines" -gt 15 ]; then
    say "anchor $a is $lines lines (must be 3 to 15)"
  fi
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$src")
  [ "$count" = "1" ] || say "anchor $a counts $count in $src (must be 1)"
done

if [ "$fail" = "0" ]; then
  echo "PREFLIGHT OK"
else
  echo "PREFLIGHT FAILED"
  printf "$reasons"
  exit 1
fi
