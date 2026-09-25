#!/usr/bin/env bash
# Session 25, step 1 breaks. Run from the repository root.
# The change is Kotlin and this module has no test source set, so each break
# substitutes the source and asserts a grep-based invariant fails.
set -u

K=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh
TARGET=$K/WidgetRefreshScheduler.kt
BACKUP=$(mktemp)
CAUGHT=0
EXPECTED=2

cp "$TARGET" "$BACKUP"
restore() { cp "$BACKUP" "$TARGET"; }
trap restore EXIT

# The invariant the plan fixes: ensureArmed arms unconditionally, so the file
# must not consult a PendingIntent to decide, and ensureArmed must call armNext.
check_invariant() {
  # 1: no FLAG_NO_CREATE anywhere in the scheduler
  grep -q 'FLAG_NO_CREATE' "$TARGET" && return 1
  # 2: ensureArmed's body calls armNext
  python3 - "$TARGET" <<'PY'
import re, sys
src = open(sys.argv[1]).read()
m = re.search(r'fun ensureArmed\(context: Context\) \{(.*?)\n    \}', src, re.S)
sys.exit(0 if (m and 'armNext' in m.group(1)) else 1)
PY
}

run_break() {
  local label="$1" subst="$2"
  cp "$BACKUP" "$TARGET"
  perl -0pi -e "$subst" "$TARGET"
  if cmp -s "$BACKUP" "$TARGET"; then
    echo "BREAK NOT APPLIED: $label"; restore; return
  fi
  if check_invariant; then
    echo "NOT CAUGHT: $label (the invariant still held against broken source)"
  else
    echo "caught: $label"; CAUGHT=$((CAUGHT + 1))
  fi
  restore
}

# 1. Restore the guard that blocked recovery: a PendingIntent lookup deciding
#    whether to arm. This is the exact defect measured on the 3T.
run_break 'the FLAG_NO_CREATE guard returns' \
  's/fun ensureArmed\(context: Context\) \{/fun ensureArmed(context: Context) {\n        val existing = PendingIntent.getBroadcast(context.applicationContext, 0, Intent(context.applicationContext, WidgetRefreshReceiver::class.java), PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)\n        if (existing != null) return/'

# 2. ensureArmed stops arming at all.
run_break 'ensureArmed no longer calls armNext' \
  's/fun ensureArmed\(context: Context\) \{\n        armNext\(context.applicationContext\)\n    \}/fun ensureArmed(context: Context) {\n        context.applicationContext\n    }/'

echo "CAUGHT: $CAUGHT of $EXPECTED"
if [ "$CAUGHT" = "$EXPECTED" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
