#!/bin/zsh
# idle-cpu: cold-launch the installed build, leave it untouched until the mock's
# compressed "today" window has passed, then measure per-thread CPU from /proc for 60s.
#
# Usage: idle-cpu.sh <label> [device-serial]
# Requires: adb, python3, a Release build (any env). Prints the summary; raw samples
# and an idle screenshot are kept in the printed output directory.

set -u
LABEL=${1:?usage: idle-cpu.sh <label> [device-serial]}
SERIAL=${2:-3T_SERIAL}
ROOT=${0:A:h:h}
OUT=$(mktemp -d)/idle-$LABEL; mkdir -p "$OUT"
a() { adb -s "$SERIAL" "$@"; }

echo "== $LABEL: $(a shell dumpsys package com.mugtaba.athan | grep versionName | tr -d ' \r')"

# What's New marks itself shown the moment it appears: one throwaway launch consumes it
a shell am force-stop com.mugtaba.athan
a shell am start -n com.mugtaba.athan/.MainActivity >/dev/null
sleep 12
a shell am force-stop com.mugtaba.athan
sleep 2

# Launch early in a minute so the mock's launch-relative prayers land on known minutes
while :; do s=$(date +%S); s=${s#0}; (( s >= 5 && s <= 30 )) && break; sleep 1; done
a shell am start -n com.mugtaba.athan/.MainActivity >/dev/null
M=$(( $(date +%s) / 60 * 60 ))
echo "== untouched until $(date -r $((M + 270)) +%H:%M:%S) (today's mock prayers end ~$(date -r $((M + 180)) +%H:%M:%S))"
while (( $(date +%s) < M + 270 )); do sleep 2; done

PID=$(a shell pidof com.mugtaba.athan | tr -d '\r ')
[[ -n $PID ]] || { echo "app not running"; exit 1; }
a exec-out screencap -p > "$OUT/idle_state.png"
for i in {0..6}; do
  a shell "cat /proc/uptime; cat /proc/$PID/task/*/stat" > "$OUT/stat_$i.txt"
  (( i < 6 )) && sleep 10
done

python3 "$ROOT/scripts/idle_cpu.py" "$OUT"
echo "== raw samples + idle screenshot: $OUT"
