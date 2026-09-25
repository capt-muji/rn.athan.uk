#!/usr/bin/env bash
# Session 25, step 2 breaks. Run from the repository root.
set -u

K=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh
SCHED=$K/WidgetRefreshScheduler.kt
WORKER=$K/WidgetRefreshWatchdogWorker.kt
MODULE=$K/WidgetRefreshModule.kt
B_SCHED=$(mktemp); B_WORKER=$(mktemp); B_MODULE=$(mktemp)
CAUGHT=0
EXPECTED=5

cp "$SCHED" "$B_SCHED"; cp "$WORKER" "$B_WORKER"; cp "$MODULE" "$B_MODULE"
restore() { cp "$B_SCHED" "$SCHED"; cp "$B_WORKER" "$WORKER"; cp "$B_MODULE" "$MODULE"; }
trap restore EXIT

# The invariants the plan fixes.
check_invariant() {
  # KEEP, never REPLACE or UPDATE: those restart the period on every enqueue.
  grep -q 'ExistingPeriodicWorkPolicy.KEEP' "$SCHED" || return 1
  grep -qE 'ExistingPeriodicWorkPolicy\.(REPLACE|UPDATE)' "$SCHED" && return 1
  # The period is the platform floor, in minutes.
  grep -q 'WATCHDOG_PERIOD_MINUTES = 15L' "$SCHED" || return 1
  grep -q 'TimeUnit.MINUTES' "$SCHED" || return 1
  # The worker re-arms, and never renders.
  grep -q 'ensureArmed' "$WORKER" || return 1
  grep -q 'updateAll' "$WORKER" && return 1
  # The JS entry point starts the watchdog, not only the alarm.
  grep -q 'ensureWatchdog' "$MODULE" || return 1
  return 0
}

run_break() {
  local label="$1" file="$2" subst="$3" backup="$4"
  restore
  perl -0pi -e "$subst" "$file"
  if cmp -s "$backup" "$file"; then
    echo "BREAK NOT APPLIED: $label"; restore; return
  fi
  if check_invariant; then
    echo "NOT CAUGHT: $label"
  else
    echo "caught: $label"; CAUGHT=$((CAUGHT + 1))
  fi
  restore
}

# 1. REPLACE restarts the 15-minute period on every app open, so a frequently
#    opened phone never reaches a run. This is the subtle killer.
run_break 'policy becomes REPLACE' "$SCHED" \
  's/ExistingPeriodicWorkPolicy\.KEEP/ExistingPeriodicWorkPolicy.REPLACE/' "$B_SCHED"

# 2. UPDATE has the same defect.
run_break 'policy becomes UPDATE' "$SCHED" \
  's/ExistingPeriodicWorkPolicy\.KEEP/ExistingPeriodicWorkPolicy.UPDATE/' "$B_SCHED"

# 3. A period below the platform floor, which Android silently clamps, so the
#    number in the source would lie about what runs.
run_break 'period drops below the floor' "$SCHED" \
  's/WATCHDOG_PERIOD_MINUTES = 15L/WATCHDOG_PERIOD_MINUTES = 1L/' "$B_SCHED"

# 4. The worker stops re-arming, which is its whole job.
run_break 'worker no longer re-arms' "$WORKER" \
  's/WidgetRefreshScheduler\.ensureArmed\(applicationContext\)/applicationContext/' "$B_WORKER"

# 5. The JS entry point arms the alarm but never starts the watchdog, so the
#    OEM-kill window stays uncovered.
run_break 'JS entry point skips the watchdog' "$MODULE" \
  's/WidgetRefreshScheduler\.ensureWatchdog\(reactContext\)//' "$B_MODULE"

echo "CAUGHT: $CAUGHT of $EXPECTED"
if [ "$CAUGHT" = "$EXPECTED" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
