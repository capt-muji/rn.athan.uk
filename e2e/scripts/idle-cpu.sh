#!/bin/zsh
# idle-cpu: cold-launch the installed build, leave it untouched until the mock's
# compressed "today" window has passed, then measure per-thread CPU from /proc for 60s.
# Every process the package runs is sampled, not just the first pidof reports.
#
# Usage: idle-cpu.sh <label> [device-serial]
# Requires: adb, python3, a Release build (any env). Prints the summary; raw samples
# and an idle screenshot are kept in the printed output directory.

set -u
LABEL=${1:?usage: idle-cpu.sh <label> [device-serial]}
SERIAL=${2:-8f7ada76}
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

# Launch early in a minute so the prayers the mock seeds from this launch's download land on known minutes
while :; do s=$(date +%S); s=${s#0}; (( s >= 5 && s <= 30 )) && break; sleep 1; done
a shell am start -n com.mugtaba.athan/.MainActivity >/dev/null
M=$(( $(date +%s) / 60 * 60 ))
echo "== untouched until $(date -r $((M + 330)) +%H:%M:%S) (today's mock prayers end ~$(date -r $((M + 240)) +%H:%M:%S))"
while (( $(date +%s) < M + 330 )); do sleep 2; done

# pidof emits every matching process, space separated: strip the CR only and
# split on whitespace. Deleting the spaces too welds two pids into one number
# that names no process, /proc yields nothing, and the tool reports a confident
# 0.0% — a clean idle reading from an empty measurement.
PIDS=(${=$(a shell pidof com.mugtaba.athan | tr -d '\r')})
(( ${#PIDS} )) || { echo "app not running"; exit 1; }
echo "== sampling ${#PIDS} process(es): $PIDS"

# One glob per pid, expanded on the DEVICE (the quotes keep the host shell off
# it) so every process the app runs is counted, not just the first
TASKS=
for p in $PIDS; do TASKS="$TASKS /proc/$p/task/*/stat"; done

a exec-out screencap -p > "$OUT/idle_state.png"
for i in {0..6}; do
  a shell "cat /proc/uptime; cat$TASKS" > "$OUT/stat_$i.txt"
  (( i < 6 )) && sleep 10
done

python3 "$ROOT/scripts/idle_cpu.py" "$OUT"
echo "== raw samples + idle screenshot: $OUT"
