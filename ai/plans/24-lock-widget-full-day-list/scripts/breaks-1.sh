#!/usr/bin/env bash
# Session 24, step 1 break script. Run from the repository root:
#   bash ai/plans/24-lock-widget-full-day-list/scripts/breaks-1.sh
#
# Each break applies ONE perl substitution to widgets/LockPrayerWidget.tsx,
# confirms the file changed, runs the named suite expecting it to FAIL, and
# restores the file. A substitution that changed nothing prints
# BREAK NOT APPLIED and counts as not caught.
set -u

TARGET=widgets/LockPrayerWidget.tsx
SUITE=shared/__tests__/widgetLockListRenderer.test.ts
BACKUP=$(mktemp)
CAUGHT=0
EXPECTED=6

cp "$TARGET" "$BACKUP"
restore() { cp "$BACKUP" "$TARGET"; }
trap restore EXIT

run_break() {
  local label="$1" subst="$2"

  cp "$BACKUP" "$TARGET"
  perl -0pi -e "$subst" "$TARGET"

  if cmp -s "$BACKUP" "$TARGET"; then
    echo "BREAK NOT APPLIED: $label"
    restore
    return
  fi

  if npx jest "$SUITE" --watchman=false --selectProjects=unit > /dev/null 2>&1; then
    echo "NOT CAUGHT: $label (the suite passed against the broken code)"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  restore
}

# 1. Flatten the three row tiers to one: a passed row and an upcoming row
#    become indistinguishable from the active row.
#    Fails: "marks only the active row on ..., and tiers passed against upcoming"
run_break 'row tiers flattened to one colour' \
  's/const colour = index === activeIndex \? WHITE : index < activeIndex \? WHITE_MUTED : WHITE_FAINT;/const colour = WHITE;/g'

# 2. Drop the active row's weight, so nothing is marked by weight.
#    Fails: "marks only the active row on ..., and tiers passed against upcoming"
run_break 'active row loses its bold' \
  "s/const weight = index === activeIndex \? 'bold' : 'medium';/const weight = 'medium';/g"

# 3. Let an absent activeIndex read as row 0 instead of -1, so a held day
#    wrongly marks its first row active.
#    Fails: "lists a held day with no active row on ..., marking nothing"
run_break 'absent activeIndex defaults to 0' \
  "s/typeof props.activeIndex === 'number' \? props.activeIndex : -1/typeof props.activeIndex === 'number' ? props.activeIndex : 0/g"

# 4. Change layout 5's split from ceil to floor: the odd Friday row moves to
#    the right column.
#    Fails: "gives the odd row to the left column on a Friday extras list"
run_break 'layout 5 split uses floor' \
  's/const splitAt = Math.ceil\(rows.length \/ 2\);/const splitAt = Math.floor(rows.length \/ 2);/'

# 5. Inflate layout 4's time size only, leaving its names alone: the sizes
#    drift apart, which a names-only assertion would miss.
#    Fails: "sizes every name AND every time on one column alike"
run_break 'layout 4 row size drifts to 13' \
  's/const ROW_SIZE = 11;/const ROW_SIZE = 13;/'

# 6. Stop honouring the terminal stale entry, so a dead timeline renders a
#    silently stale list instead of the refresh card.
#    Fails: "renders the gallery placeholder and the terminal card on ..."
run_break 'stale entry no longer reaches its card' \
  's/if \(props.stale === true\) \{/if (false) {/g'

echo "CAUGHT: $CAUGHT of $EXPECTED"
if [ "$CAUGHT" = "$EXPECTED" ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "ALL AS EXPECTED: 0"
fi
