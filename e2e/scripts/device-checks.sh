#!/bin/zsh
# device-checks — one command, run on demand: what the phone ACTUALLY has armed.
#
# Reports build identity, notification channels, permissions and every alarm the
# app has scheduled, and FAILS on the things that silently break an alarm clock:
# nothing armed, a missing channel, or a trigger that is not a prayer time.
#
# Usage: device-checks.sh [device-serial] [package] [expected-times.json]
#
# expected-times.json (optional) is a JSON list of "YYYY-MM-DD HH:MM" strings —
# the moments the app should be firing at. When given, every future alarm must
# match one, or sit one of the reminder intervals ahead of one. Which prayers are
# armed is a user preference, so an expected time with no alarm is not a failure.
# Generate it from the timetable the app is using (see e2e/README.md). No API key
# is read, passed or stored by this script.
#
# Alarm TIMES are only meaningful on a PRODUCTION build: local/dev builds run the
# mock API, whose prayers sit a few minutes either side of launch and have
# usually already fired. Everything else here is build-agnostic.
#
# Exit status: 0 all checks passed, 1 at least one FAIL.

set -u
SERIAL=${1:-8f7ada76}
PKG=${2:-com.mugtaba.athan}
EXPECTED=${3:-}
ROOT=${0:A:h:h}
OUT=$(mktemp -d)
# zsh does not word-split a command held in a variable — use a function
a() { adb -s "$SERIAL" "$@"; }

FAIL=0
pass() { print -r -- "  PASS  $1"; }
fail() { print -r -- "  FAIL  $1"; FAIL=1; }
note() { print -r -- "        $1"; }

# --- device and build -------------------------------------------------------
print -r -- "== device =="
if ! a get-state >/dev/null 2>&1; then
  print -r -- "  FAIL  device $SERIAL is not reachable (adb devices)"
  exit 1
fi
SDK=$(a shell getprop ro.build.version.sdk | tr -d '\r')
print -r -- "  $(a shell getprop ro.product.model | tr -d '\r') — Android $(a shell getprop ro.build.version.release | tr -d '\r') (SDK $SDK), serial $SERIAL"
# The format string must be quoted FOR THE REMOTE SHELL: adb shell re-splits its
# arguments, so an unquoted '+%Y-%m-%d %H:%M:%S' reaches date as two arguments
# and silently returns just the date
print -r -- "  device clock: $(a shell "date '+%Y-%m-%d %H:%M:%S %Z'" | tr -d '\r')"

VERSION=$(a shell dumpsys package "$PKG" 2>/dev/null | grep -m1 versionName | tr -d ' \r')
if [[ -z $VERSION ]]; then
  fail "$PKG is not installed"
  exit 1
fi
pass "installed: $PKG ${VERSION#versionName=}"
PID=$(a shell pidof "$PKG" | tr -d '\r ')
[[ -n $PID ]] && note "running (pid $PID)" || note "not running (alarms survive; they are armed while it runs)"

# Every check below measures whatever is installed. Against a stale build that is a
# confident pass describing a build nobody is shipping — the same class of lie findings
# 28-35 were about, one layer out. Compared per component because 1.25.100 sorts BELOW
# 1.25.95 lexically. ALLOW_STALE=1 for a deliberate comparison against an older build.
TREE_VERSION=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["expo"]["version"])' \
  "${0:A:h:h:h}/app.json" 2>/dev/null)
INSTALLED_VERSION=${VERSION#versionName=}
if [[ -n $TREE_VERSION && $TREE_VERSION != "$INSTALLED_VERSION" ]]; then
  ORDER=$(python3 -c '
import sys
a = [int(p) for p in sys.argv[1].split(".")]
b = [int(p) for p in sys.argv[2].split(".")]
print("behind" if a < b else "ahead")' "$INSTALLED_VERSION" "$TREE_VERSION" 2>/dev/null)
  if [[ $ORDER == behind && -z ${ALLOW_STALE:-} ]]; then
    fail "installed $INSTALLED_VERSION is BEHIND the tree's $TREE_VERSION — every check below measures the old build"
    note "rebuild and reinstall, or set ALLOW_STALE=1 to compare against it deliberately"
  else
    note "installed $INSTALLED_VERSION differs from the tree's $TREE_VERSION ($ORDER)"
  fi
fi

# --- permissions ------------------------------------------------------------
print -r -- "== permissions =="
a shell dumpsys package "$PKG" > "$OUT/package.txt" 2>/dev/null
if [[ ! -s $OUT/package.txt ]]; then
  fail "dumpsys package returned nothing — permissions were not checked"
  exit 1
fi
# dumpsys lists what the manifest asked for in one block and what was actually
# granted in another, as `<permission>: granted=<bool>`. Reading only the first
# says nothing about whether an alert can fire.
# Anchored at the end of the name: permission names are uppercase and underscores,
# so anything else means the name stopped there and a longer one is not a match.
declared() { grep -qE "android\.permission\.$1([^A-Z0-9_]|$)" "$OUT/package.txt"; }
granted() { grep -q "android.permission.$1: granted=true" "$OUT/package.txt"; }
for perm in RECEIVE_BOOT_COMPLETED WAKE_LOCK; do
  if granted "$perm"; then pass "$perm granted"
  elif declared "$perm"; then fail "$perm declared but NOT granted"
  else fail "$perm not declared"; fi
done
# POST_NOTIFICATIONS only becomes a runtime decision on Android 13. Below that it
# is declared and never granted, and notifications are on unless the user turns
# them off in settings, which this dump does not express.
if granted POST_NOTIFICATIONS; then
  pass "POST_NOTIFICATIONS granted"
elif ! declared POST_NOTIFICATIONS; then
  fail "POST_NOTIFICATIONS not declared — nothing can be posted on Android 13 and above"
elif (( SDK >= 33 )); then
  fail "POST_NOTIFICATIONS declared but DENIED — no prayer alert can fire"
else
  pass "POST_NOTIFICATIONS declared (not a runtime grant below SDK 33, this device is $SDK)"
fi
if (( SDK >= 31 )); then
  # Only from Android 12 is exact-alarm a runtime decision worth checking
  STATE=$(a shell cmd appops get "$PKG" SCHEDULE_EXACT_ALARM 2>/dev/null | tr -d '\r' | head -1)
  if grep -q "USE_EXACT_ALARM" "$OUT/package.txt"; then
    pass "USE_EXACT_ALARM declared (exact alarms need no user grant)"
  elif [[ $STATE == *allow* ]]; then
    pass "SCHEDULE_EXACT_ALARM allowed"
  else
    fail "exact alarms not permitted — prayer alerts will be delayed (${STATE:-no appops entry})"
  fi
else
  note "exact-alarm grant is not a thing below SDK 31 (this device is $SDK) — alarms are exact by default"
fi
if a shell dumpsys deviceidle whitelist 2>/dev/null | grep -q "$PKG"; then
  pass "on the battery (doze) allowlist"
else
  note "not on the doze allowlist — Android may defer non-exact work; exact alarms still fire"
fi

# --- notification channels --------------------------------------------------
print -r -- "== notification channels =="
a shell dumpsys notification --noredact > "$OUT/notification.txt" 2>/dev/null
if [[ ! -s $OUT/notification.txt ]]; then
  # Without this the empty dump yields zero channels and the app is blamed for
  # what is an adb transport problem
  fail "dumpsys notification returned nothing — channels were not checked"
  print -r -- "== FAILED =="
  note "dumps kept in $OUT"
  exit 1
fi
awk -v pkg="$PKG" '
  $0 ~ "AppSettings: " pkg " " { inblk = 1; next }
  /AppSettings: / { inblk = 0 }
  inblk && /NotificationChannel\{/ { print }
' "$OUT/notification.txt" > "$OUT/channels.txt"

CHANNELS=$(grep -c . "$OUT/channels.txt")
if (( CHANNELS == 0 )); then
  fail "no notification channels — the app has never initialised notifications on this device"
else
  pass "$CHANNELS channel(s)"
  grep -oE "mId='[^']*'.*mImportance=[0-9-]+" "$OUT/channels.txt" |
    sed -E "s/mId='([^']*)'.*mImportance=([0-9-]+)/        \1 (importance \2)/" | sort | head -12
  # extras_at_time carries Sunrise + every extra; a missing channel means Android
  # silently drops those notifications (ISSUES #23)
  # Generation-agnostic: a channel's sound, attributes and importance are frozen at creation,
  # so every fix ships a new suffix and a check pinned to one generation fails on the next
  grep -qE "mId='extras_at_time(_v[0-9]+)?'" "$OUT/channels.txt" &&
    pass "extras_at_time present" || fail "extras_at_time MISSING — extras alerts would be dropped"
  grep -qE "mId='athan_[0-9]+(_v[0-9]+)?'" "$OUT/channels.txt" &&
    pass "an athan channel is present" || note "no athan channel yet (created when a Sound alert is first set)"
  # Count first. With no matching channels the inner grep fails and the `||`
  # branch fires, which printed a pass for a set that was never examined.
  grep -E "mId='(extras_at_time(_v[0-9]+)?|athan_[0-9]+(_v[0-9]+)?)'" "$OUT/channels.txt" > "$OUT/prayer-channels.txt"
  PRAYER_CHANNELS=$(grep -c . "$OUT/prayer-channels.txt")
  if (( PRAYER_CHANNELS == 0 )); then
    fail "no prayer channels to inspect — their sound was not checked"
  elif grep -q "mSound=null" "$OUT/prayer-channels.txt"; then
    fail "a prayer channel has mSound=null — it would fire silently"
  else
    pass "all $PRAYER_CHANNELS prayer channel(s) carry a sound"
  fi
fi

# --- scheduled alarms -------------------------------------------------------
print -r -- "== scheduled alarms =="
a shell dumpsys alarm > "$OUT/alarm.txt" 2>/dev/null
NOW=$(a shell "date '+%Y-%m-%d %H:%M:%S'" | tr -d '\r')
if [[ ! -s $OUT/alarm.txt ]]; then
  fail "dumpsys alarm returned nothing"
else
  if [[ -n $EXPECTED ]]; then
    python3 "$ROOT/scripts/device_checks.py" "$OUT/alarm.txt" "$PKG" "$NOW" "$EXPECTED" || FAIL=1
  else
    python3 "$ROOT/scripts/device_checks.py" "$OUT/alarm.txt" "$PKG" "$NOW" || FAIL=1
  fi
fi

print -r -- "== $( ((FAIL)) && print -n 'FAILED' || print -n 'all checks passed' ) =="
note "dumps kept in $OUT"
exit $FAIL
