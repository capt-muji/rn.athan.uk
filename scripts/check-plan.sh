#!/usr/bin/env bash
# Structural gate for a plan folder. A row is not READY until this prints PLAN OK.
# Usage: bash scripts/check-plan.sh <plan-folder>
# bash 3.2 compatible (macOS): no assoc arrays, no mapfile.
set -u
folder="${1:?usage: check-plan.sh <plan-folder>}"
fail=0
reasons=""

reason() {
  reasons="${reasons}- $1
"
  fail=1
}

plan="$folder/PLAN.md"
if [ ! -f "$plan" ]; then
  echo "PLAN CHECK FAILED"
  echo "- no PLAN.md in $folder"
  exit 1
fi

# 1. Required sections.
for s in "1. Goal" "2. Decisions" "3. Pre-flight" "4. Background" "5. Design" \
         "6. Steps" "7. Device proof" "8. Records" "9. Push" \
         "10. When something goes wrong" "11. Subagents" "12. Report"; do
  grep -q "$s" "$plan" || reason "missing section: $s"
done

# 2. Header table carries the planned-at anchor and the needs-first column.
grep -q "Planned at" "$plan" || reason "header table has no Planned at"
grep -q "Needs first" "$plan" || reason "header table has no Needs first"

# 3. Banned hedge words (TEMPLATE.md word list).
hedges="as appropriate as needed as necessary if needed if applicable if relevant \
where appropriate where needed where applicable as per accordingly etc. and so on \
and/or TBD for example e.g. i.e. various several some appropriate reasonable \
properly correctly"
for w in $hedges; do
  if grep -rw --include='*.md' -e "$w" "$folder" >/dev/null 2>&1; then
    reason "banned hedge word in plan text: $w (say the exact condition and action)"
  fi
done

# 4. Acceptance criteria are EARS sentences tagged [Rk.n].
criteria="$(grep -hE '^\s*[-*] \[R[0-9]+\.[0-9]+\]' "$folder"/PLAN.md "$folder"/steps/*.md 2>/dev/null || true)"
if [ -z "$criteria" ]; then
  reason "no tagged acceptance criteria: every criterion is a line like '- [R1.2] WHEN <event> THE SYSTEM SHALL <observable response>'"
else
  bad_ears="$(echo "$criteria" | grep -vE '\[R[0-9]+\.[0-9]+\] (WHEN|IF|WHILE|UNTIL) .+ (THE SYSTEM SHALL|MUST|WILL) .+' || true)"
  if [ -n "$bad_ears" ]; then
    reason "criterion not an EARS sentence: $(echo "$bad_ears" | head -1)"
  fi
fi

# 5. Every step cites Requirements IDs, and every ID resolves.
step_files="$folder/steps/*.md"
found_steps=0
for f in $step_files; do
  [ -f "$f" ] || continue
  found_steps=1
  if ! grep -q "^Requirements:" "$f" && ! grep -q "^\*\*Requirements" "$f"; then
    reason "step file $f has no Requirements: line citing criterion IDs"
  else
    for id in $(grep -hoE 'R[0-9]+\.[0-9]+' "$f" | sort -u); do
      echo "$criteria" | grep -q "\[$id\]" || reason "step $f cites $id, no such criterion"
    done
  fi
done
if [ "$found_steps" -eq 0 ] && ! grep -q "Requirements:" "$plan"; then
  reason "no steps/ files and no Requirements: lines in PLAN.md section 6"
fi

# 6. Orphan criteria: every criterion is cited by some step or the device proof.
for id in $(echo "$criteria" | grep -oE 'R[0-9]+\.[0-9]+' | sort -u); do
  if ! grep -rq "\[$id\]" "$folder"/steps/*.md 2>/dev/null && ! grep -q "\[$id\]" "$plan"; then
    reason "criterion $id is cited by no step"
  fi
done

# 7. Anchors: present, 3 to 15 lines.
anchor_count=0
for f in "$folder"/scripts/anchors/*; do
  [ -f "$f" ] || continue
  anchor_count=$((anchor_count + 1))
  lines=$(wc -l < "$f" | tr -d ' ')
  if [ "$lines" -lt 3 ] || [ "$lines" -gt 15 ]; then
    reason "anchor $f has $lines lines, must be 3 to 15"
  fi
done
if [ "$anchor_count" -eq 0 ]; then
  reason "no anchors under scripts/anchors/"
fi

# 8. Pre-flight script exists and reports PREFLIGHT OK.
preflight="$(ls "$folder"/scripts/preflight-*.sh 2>/dev/null | head -1)"
if [ -z "$preflight" ]; then
  reason "no scripts/preflight-<N>.sh"
elif ! grep -q "PREFLIGHT OK" "$preflight"; then
  reason "preflight script never prints PREFLIGHT OK"
fi

# 9. Push section stays None.
if ! grep -A2 "9. Push" "$plan" | grep -qi "none"; then
  reason "section 9 Push must say None: the executor never pushes"
fi

if [ "$fail" -eq 0 ]; then
  echo "PLAN OK"
  exit 0
fi
echo "PLAN CHECK FAILED"
printf '%s' "$reasons"
exit 1
