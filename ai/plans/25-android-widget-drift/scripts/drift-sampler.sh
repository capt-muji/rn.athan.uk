#!/bin/bash
# Session 25 drift sampler (v2).
#
# Measures how far behind an Android widget's countdown label is, in minutes.
#
# Two confounds this handles:
#  1. uiautomator dump needs the screen ON, and ACTION_TIME_TICK only fires
#     while the screen is ON. So sampling itself can trigger the redraw whose
#     absence is the bug. Each sample therefore keeps the screen OFF for the
#     whole gap, then wakes and reads immediately.
#  2. Waking lands on the lock screen, whose own clock widget looks like widget
#     text. A swipe-up dismisses it, then HOME guarantees the launcher page.
#
# Usage: drift25.sh <serial> <out.tsv> <samples> <minutes-between>

SERIAL="$1"
OUT="$2"
SAMPLES="${3:-20}"
GAP_MIN="${4:-2}"

sleep_seconds() {  # never sleeps more than 15s per call
  local total="$1" acc=0
  while [ "$acc" -lt "$total" ]; do
    sleep 15
    acc=$((acc + 15))
  done
}

wake_to_launcher() {
  adb -s "$SERIAL" shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1
  sleep 1
  adb -s "$SERIAL" shell input swipe 540 1800 540 600 200 >/dev/null 2>&1
  sleep 1
  adb -s "$SERIAL" shell input keyevent KEYCODE_HOME >/dev/null 2>&1
  sleep 1
}

if [ ! -f "$OUT" ]; then
  printf 'clock\ttarget\ttarget_hhmm\tlabels\ttrue_label\tdrift_min\tproc\tfires\n' > "$OUT"
fi

for i in $(seq 1 "$SAMPLES"); do
  adb -s "$SERIAL" shell input keyevent KEYCODE_SLEEP >/dev/null 2>&1
  sleep_seconds $((GAP_MIN * 60))

  wake_to_launcher
  CLK=$(adb -s "$SERIAL" shell date '+%H:%M:%S' 2>/dev/null | tr -d '\r')

  DUMP=""
  for try in 1 2 3; do
    adb -s "$SERIAL" shell uiautomator dump /sdcard/d25.xml >/dev/null 2>&1
    DUMP=$(adb -s "$SERIAL" shell cat /sdcard/d25.xml 2>/dev/null)
    # Our widget always names its target in caps; that proves we're on the right page
    echo "$DUMP" | grep -qE 'text="(FAJR|SUNRISE|DHUHR|ASR|MAGRIB|ISHA|MIDNIGHT|SUHOOR|DUHA|ISTIJABA|LAST THIRD)"' && break
    adb -s "$SERIAL" shell input keyevent KEYCODE_HOME >/dev/null 2>&1
    sleep 2
  done

  TARGET=$(echo "$DUMP" | grep -oE 'text="(FAJR|SUNRISE|DHUHR|ASR|MAGRIB|ISHA|MIDNIGHT|SUHOOR|DUHA|ISTIJABA|LAST THIRD)"' \
           | sed 's/text="//;s/"//' | head -1)
  if [ -z "$TARGET" ]; then
    printf '%s\tNO-WIDGET-PAGE\t-\t-\t-\t-\t%s\t-\n' "$CLK" "$(adb -s "$SERIAL" shell pidof com.mugtaba.athan | tr -d '\r')" >> "$OUT"
    continue
  fi

  # Labels: the countdown strings. Take only those, in order.
  LABELS=$(echo "$DUMP" | grep -oE 'text="[0-9]+h [0-9]+m"|text="[0-9]+h"|text="[0-9]+m"' \
           | sed 's/text="//;s/"//' | tr '\n' '/' | sed 's|/$||')

  # The target's absolute time: first HH:MM that appears AFTER the target name.
  THHMM=$(echo "$DUMP" | tr '>' '\n' | grep -A400 "text=\"$TARGET\"" \
          | grep -oE 'text="[0-9]{2}:[0-9]{2}"' | sed 's/text="//;s/"//' | head -1)

  PROC=$(adb -s "$SERIAL" shell pidof com.mugtaba.athan 2>/dev/null | tr -d '\r')
  FIRES=$(adb -s "$SERIAL" shell dumpsys alarm 2>/dev/null \
          | grep -oE '[0-9]+ wakeups, [0-9]+ alarms: u0a[0-9]+:com.mugtaba.athan' \
          | grep -oE '^[0-9]+' | head -1)

  READ=$(python3 - "$CLK" "$THHMM" "$LABELS" <<'PY'
import re, sys
now, tgt, labels = sys.argv[1], sys.argv[2], sys.argv[3]
def mins_of(lab):
    m = re.fullmatch(r'(?:(\d+)h)?\s*(?:(\d+)m)?', lab.strip())
    if not m or not any(m.groups()): return None
    return int(m.group(1) or 0)*60 + int(m.group(2) or 0)
try:
    h, mi, s = (int(x) for x in now.split(':'))
    th, tm = (int(x) for x in tgt.split(':'))
    cur, end = h*3600+mi*60+s, th*3600+tm*60
    if end <= cur: end += 86400
    true_min = -(-(end-cur)//60)
    shown = [mins_of(x) for x in labels.split('/') if x]
    shown = [x for x in shown if x is not None]
    drift = ','.join(f"{x-true_min:+d}" for x in shown) if shown else "no-label"
    print(f"{true_min//60}h {true_min%60}m\t{drift}")
except Exception:
    print("?\t?")
PY
)
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$CLK" "$TARGET" "$THHMM" "$LABELS" "$READ" "${PROC:-dead}" "${FIRES:-?}" >> "$OUT"
done

echo "DONE" >> "$OUT"
