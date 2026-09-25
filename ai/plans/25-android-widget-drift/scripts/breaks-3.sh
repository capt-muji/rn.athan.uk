#!/usr/bin/env bash
# Session 25, step 3 breaks. Run from the repository root.
set -u

K=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh
LISTENER=$K/WidgetRefreshTickListener.kt
MODULE=$K/WidgetRefreshModule.kt
B_LISTENER=$(mktemp); B_MODULE=$(mktemp)
CAUGHT=0
EXPECTED=5

cp "$LISTENER" "$B_LISTENER"; cp "$MODULE" "$B_MODULE"
restore() { cp "$B_LISTENER" "$LISTENER"; cp "$B_MODULE" "$MODULE"; }
trap restore EXIT

check_invariant() {
  # Runtime registration of the system minute tick.
  grep -q 'registerReceiver' "$LISTENER" || return 1
  grep -q 'IntentFilter(Intent.ACTION_TIME_TICK)' "$LISTENER" || return 1
  grep -qE 'Intent\.ACTION_TIME_(CHANGED|SET)' "$LISTENER" && return 1
  # Never in a manifest: blocked for manifest receivers from API 26.
  grep -rq 'WidgetRefreshTickListener' modules/widgetrefresh/android/src/main/AndroidManifest.xml && return 1
  grep -rq 'TIME_TICK' modules/widgetrefresh/android/src/main/AndroidManifest.xml && return 1
  # Guarded against double registration, since it fires every minute: the flag
  # must be declared AND both read and written, so a rename cannot satisfy it.
  grep -q 'private var registered = false' "$LISTENER" || return 1
  grep -q 'if (registered) return' "$LISTENER" || return 1
  grep -q 'registered = true' "$LISTENER" || return 1
  # Its body RENDERS. It must never re-arm: TIME_TICK lands 500ms before the
  # alarm fires, so re-arming here pushes the alarm forward forever.
  grep -q 'updateAll' "$LISTENER" || return 1
  grep -q 'ensureArmed' "$LISTENER" && return 1
  # The JS entry point registers it.
  grep -q 'WidgetRefreshTickListener.ensureRegistered' "$MODULE" || return 1
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

# 1. The listener stops re-arming, which is its only job.
run_break 'listener no longer redraws' "$LISTENER" \
  's/WidgetRefreshScheduler\.updateAll\(context\)/context/' "$B_LISTENER"

# 1b. The regression this step shipped and then fixed: re-arming from
#     TIME_TICK pushes the pending alarm forward 500ms before it fires, every
#     minute, so it never fires and the widget freezes.
run_break 'listener re-arms instead of redrawing' "$LISTENER" \
  's/WidgetRefreshScheduler\.updateAll\(context\)/WidgetRefreshScheduler.ensureArmed(context)/' "$B_LISTENER"

# 2. The double-registration guard goes, so every push adds another receiver
#    and each fires every minute for the life of the process.
run_break 'double-registration guard removed' "$LISTENER" \
  's/@Volatile\n    private var registered = false/private var unusedFlag = false/' "$B_LISTENER"

# 3. It listens for the wrong broadcast, so it never fires on the minute.
run_break 'wrong broadcast action' "$LISTENER" \
  's/Intent\.ACTION_TIME_TICK/Intent.ACTION_TIME_CHANGED/' "$B_LISTENER"

# 4. The JS entry point never registers it, so a live app gains nothing.
run_break 'JS entry point skips the listener' "$MODULE" \
  's/WidgetRefreshTickListener\.ensureRegistered\(reactContext\)//' "$B_MODULE"

echo "CAUGHT: $CAUGHT of $EXPECTED"
if [ "$CAUGHT" = "$EXPECTED" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
