#!/usr/bin/env bash
# Ticket 72 pre-flight. Copy to $TMPDIR and run from there.
set -u
fail=0
reasons=""

say() { reasons="${reasons}$1\n"; fail=1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "uat" ] || say "not on uat (on $branch)"

[ -z "$(git status --porcelain)" ] || say "tree not clean"

git fetch origin uat >/dev/null 2>&1
merged=$(git rev-list --count uat..origin/uat)
[ "$merged" = "0" ] || say "origin/uat not merged in ($merged commits not in uat)"

ver="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.195"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 195) else 1)
EOF

# Anchor counts. With arguments, only the named anchors are checked (each step's
# Anchor check passes its own list, because earlier steps rewrite the bytes later
# anchors quote). With no arguments, all 17 are checked.
declare -a pairs
pairs=(
  "time-format-core.txt shared/time.ts"
  "time-ago.txt shared/time.ts"
  "display-atom.txt stores/countdown.ts"
  "hero-render.txt components/countdown/Countdown.tsx"
  "ago-render.txt components/prayer/Ago.tsx"
  "en-reminder.txt shared/i18n/en.ts"
  "en-channel.txt shared/i18n/en.ts"
  "cascade-pair.txt components/prayer/Prayer.tsx"
  "derived-color.txt hooks/useAnimation.ts"
  "notif-pin.txt shared/__tests__/notifications.test.ts"
  "contract-pin.txt shared/__tests__/prayerIdContract.test.ts"
  "bridge-pin.txt shared/__tests__/i18nBridge.test.ts"
  "countdown-pin.txt stores/__tests__/countdown.test.ts"
  "schedule-pin.txt stores/__tests__/schedule.test.ts"
  "screen-pin.txt __tests__/app/Screen.test.tsx"
  "hero-pin.txt components/countdown/__tests__/Countdown.test.tsx"
  "usecountdown-pin.txt hooks/__tests__/useCountdown.test.ts"
)
here="ai/plans/72-countdown-fixed-width/scripts"
wanted=("$@")
if [ "${#wanted[@]}" -gt 0 ]; then
  filtered=()
  for entry in "${pairs[@]}"; do
    a="${entry%% *}"
    for name in "${wanted[@]}"; do
      if [ "$a" = "${name}.txt" ]; then
        filtered+=("$entry")
        break
      fi
    done
  done
  pairs=("${filtered[@]}")
fi
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
