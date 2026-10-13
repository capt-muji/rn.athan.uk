#!/usr/bin/env bash
# Ticket 82 pre-flight. Copy to $TMPDIR and run from there, from the repository root.
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
python3 - "$ver" <<'EOF' || say "package.json version $ver is below 2.0.218"
import sys
sys.exit(0 if tuple(int(x) for x in sys.argv[1].split(".")) >= (2, 0, 218) else 1)
EOF

# Row 82's Needs first is nothing (ground rows 57, 72 and 74 are DONE). The queue row
# must still name this ticket with a plan-pointer status (PLANNING, READY or IN
# PROGRESS), never NOT PLANNED.
queue_status="$(grep -c '^| 82 |' ai/plans/README.md)"
[ "$queue_status" -ge 1 ] || say "queue row 82 missing from ai/plans/README.md"
grep '^| 82 |' ai/plans/README.md | grep -q "NOT PLANNED" && say "queue row 82 reads NOT PLANNED"

# Anchor counts. With arguments, only the named anchors are checked (each step's
# anchor check passes its own list, because landed steps rewrite the bytes later
# anchors quote). With no arguments, all 30 are checked.
declare -a pairs
pairs=(
  "dispatcher.txt shared/time.ts"
  "ago-dispatcher.txt shared/time.ts"
  "duration-labels.txt shared/time.ts"
  "date-compose.txt shared/time.ts"
  "sections-regex.txt shared/time.ts"
  "digits-map.txt shared/i18n/digits.ts"
  "t-interpolate.txt shared/i18n/index.ts"
  "countdown-gate.txt components/countdown/Countdown.tsx"
  "countdown-styles.txt components/countdown/Countdown.tsx"
  "ago-gate.txt components/prayer/Ago.tsx"
  "typography-arabic.txt shared/typography.ts"
  "typography-pin.txt shared/__tests__/typography.test.ts"
  "shown-time.txt hooks/usePrayer.ts"
  "widget-digits.txt widgets/PrayerWidget.tsx"
  "widget-bake.txt shared/widgetTimeline.ts"
  "stepper-visible.txt components/sheets/parts/Stepper.tsx"
  "sounditem-format.txt components/sheets/parts/SoundItem.tsx"
  "time-en-pin.txt shared/__tests__/time.test.ts"
  "time-ar-pin.txt shared/__tests__/time.test.ts"
  "selector-pin.txt stores/__tests__/countdown.test.ts"
  "selector-ar-pin.txt stores/__tests__/countdown.test.ts"
  "countdown-pin.txt components/countdown/__tests__/Countdown.test.tsx"
  "countdown-ar-pin.txt components/countdown/__tests__/Countdown.test.tsx"
  "ago-pin.txt components/prayer/__tests__/Ago.test.tsx"
  "notif-pin.txt shared/__tests__/notifications.test.ts"
  "date-pin.txt shared/__tests__/dateLocalized.test.ts"
  "digits-pin.txt shared/__tests__/digits.test.ts"
  "widget-renderer-pin.txt shared/__tests__/widgetRenderer.test.ts"
  "widget-timeline-pin.txt shared/__tests__/widgetTimeline.test.ts"
  "time-row-pin.txt components/prayer/__tests__/Time.test.tsx"
)
here="ai/plans/82-latin-numerals/scripts"
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
  # bash 3.2 aborts on expanding an empty array under set -u, so check before assigning
  if [ "${#filtered[@]}" -eq 0 ]; then
    say "no named anchor matches the step's list (a step asked for an anchor this pre-flight does not carry)"
  else
    pairs=("${filtered[@]}")
  fi
fi

for entry in "${pairs[@]}"; do
  a="${entry%% *}"
  f="${entry#* }"
  if [ ! -f "$here/anchors/$a" ]; then
    say "anchor file missing: $a"
    continue
  fi
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$here/anchors/$a" "$f")
  [ "$count" = "1" ] || say "anchor $a counts $count in $f (want 1)"
done

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
  exit 0
fi
echo "PREFLIGHT FAILED"
printf "$reasons"
exit 1
