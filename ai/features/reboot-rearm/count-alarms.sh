#!/usr/bin/env bash
# Prayer alarms AlarmManager currently holds for one device.
#
# Counts distinct Alarm{<id>} objects tagged NOTIFICATION_EVENT. The dump repeats
# an alarm under "Next wake from idle" and inside its batch, so a plain grep -c
# double-counts; deduplicating on the object id is what makes the number real.
#
# Usage: count-alarms.sh <serial> [--list]
set -euo pipefail

serial="${1:?usage: count-alarms.sh <serial> [--list]}"
dump=$(adb -s "$serial" shell dumpsys alarm)

ids=$(printf '%s\n' "$dump" | grep -B2 'expo\.modules\.notifications\.NOTIFICATION_EVENT' |
  grep -oE 'Alarm\{[a-f0-9]+' | sort -u || true)

if [ "${2:-}" = "--list" ]; then
  printf '%s\n' "$dump" | grep -A3 'expo\.modules\.notifications\.NOTIFICATION_EVENT' |
    grep -oE 'when=[0-9-]+ [0-9:.]+' | sort -u || true
fi

if [ -z "$ids" ]; then echo 0; else printf '%s\n' "$ids" | wc -l | tr -d ' '; fi
