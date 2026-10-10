#!/usr/bin/env bash
# Regenerates the eleven anchors whose verbatim text steps 02 to 04 consumed, from the
# post-step-04 tree. The original extraction (extract-anchors-38.sh, at the planned-at sha)
# stays the historical record; this script owns these eleven files from the replan on.
# The sha guard refuses any later run, because steps 05 onward move the text again.
# Reproduce only from a worktree checked out at the sha below.
set -euo pipefail
cd "$(dirname "$0")/../../../.."

EXPECTED_SHA=$(git rev-parse 76a40d3f)
[ "$(git rev-parse HEAD)" = "$EXPECTED_SHA" ] || { echo "REGENERATE FAILED: HEAD is not 76a40d3f"; exit 1; }

OUT=ai/plans/39-localisation/scripts/anchors

extract() {
  local name=$1 file=$2 start=$3 end=$4
  sed -n "${start},${end}p" "$file" > "$OUT/${name}.txt"
  if [ ! -s "$OUT/${name}.txt" ]; then
    echo "EMPTY ANCHOR: $name ($file $start-$end)" >&2
    exit 1
  fi
}

# Step 05's region, post-step-04 (the Arabic name arrays are gone)
extract constants-arrays shared/constants.ts 5 20

# Step 06's regions, post-steps-02-to-04 (no arabic field, no arabicName, no _arabicName)
extract useprayer-sentinel hooks/usePrayer.ts 87 101
extract prayerrow-type shared/types.ts 265 275
extract namesforDate shared/prayer.ts 305 322
extract unreadable-row shared/prayer.ts 377 385
extract multi-schedule-sig stores/notifications.ts 895 901
extract scheduled-record-type shared/notifications.ts 17 23

# Step 07's regions, post-step-04 (both builders lost the _arabicName parameter)
extract content-builders shared/notifications.ts 118 136
extract reminder-content shared/notifications.ts 171 185

# Step 09's regions, post-step-03 (single-line explanation; the English half remains)
extract explanation-arabic components/prayer/Explanation.tsx 71 72
extract overlaycontent-arabic components/overlay/overlayContent.ts 50 58

echo "REGENERATED 11 anchors from $(git rev-parse --short HEAD)"
