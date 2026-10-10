#!/usr/bin/env bash
# Extracts the verbatim anchors session 38's steps edit against, from the clean
# tree at the Planned-at sha. One file per anchor under scripts/anchors/.
set -euo pipefail
cd "$(dirname "$0")/../../../.."

OUT=ai/plans/39-localisation/scripts/anchors
rm -rf "$OUT"
mkdir -p "$OUT"

extract() {
  local name=$1 file=$2 start=$3 end=$4
  sed -n "${start},${end}p" "$file" > "$OUT/${name}.txt"
  if [ ! -s "$OUT/${name}.txt" ]; then
    echo "EMPTY ANCHOR: $name ($file $start-$end)" >&2
    exit 1
  fi
}

# Step 02: the row's Arabic column
extract row-conditional components/prayer/Prayer.tsx 88 96
extract row-styles components/prayer/Prayer.tsx 106 117

# Step 03: the chrome surfaces
extract settings-toggle components/sheets/screens/Settings.tsx 128 132
extract explanation-arabic components/prayer/Explanation.tsx 76 81
extract toarabic shared/text.ts 15 27
extract overlaycontent-arabic components/overlay/overlayContent.ts 51 59

# Steps 04/05: the row shape, builders, plumbing
extract prayerrow-type shared/types.ts 265 301
extract createprayer shared/prayer.ts 296 308
extract namesforDate shared/prayer.ts 311 330
extract unreadable-row shared/prayer.ts 385 393
extract night-branch shared/prayer.ts 396 409
extract constants-arrays shared/constants.ts 5 33
extract atom-factory stores/notifications.ts 203 208
extract reminder-atoms stores/notifications.ts 253 260
extract migration-core stores/notifications.ts 552 583
extract survived-record stores/notifications.ts 871 881
extract multi-schedule-sig stores/notifications.ts 904 911
extract reschedule-head stores/notifications.ts 1585 1592
extract reschedule-generations stores/notifications.ts 1614 1619
extract alert-sheet-write components/prayer/Alert.tsx 152 161
extract useprayer-sentinel hooks/usePrayer.ts 87 102
extract countdown-seed stores/countdown.ts 43 47
extract countdown-name stores/countdown.ts 411 431
extract ago-text hooks/usePrayerAgo.ts 34 38
extract rowpress-istijaba components/prayer/rowPress.ts 31 35
extract sequence-listposition shared/sequence.ts 22 27

# Steps 01/05: the frozen bytes
extract scheduled-record-type shared/notifications.ts 17 24
extract content-builders shared/notifications.ts 119 138
extract reminder-content shared/notifications.ts 174 189
extract slug shared/notifications.ts 140 163
extract channel-reminder shared/notifications.ts 382 403
extract channel-configs shared/notifications.ts 405 417
extract extras-channel shared/notifications.ts 445 463
extract plan-key shared/notifications.ts 355 361
extract device-ids device/notifications.ts 44 66
extract db-record-add stores/database.ts 188 198
extract db-reminder-add stores/database.ts 253 263

# Step 11/12: widths and upgrade
extract width-atoms stores/ui.ts 103 107
extract shownames-atom stores/ui.ts 131 132
extract setwidth stores/ui.ts 211 231
extract version-keeplist stores/version.ts 139 156
extract version-captured stores/version.ts 241 249
extract version-upgrade stores/version.ts 253 292
extract sync-keeplist stores/sync.ts 357 371

# Step 13: widget contracts
extract widget-versions shared/widgetTypes.ts 9 21
extract widget-row-name shared/widgetTypes.ts 43 53
extract widget-next-name shared/widgetTypes.ts 79 84
extract widget-android-row shared/widgetTypes.ts 120 134
extract widget-guard widgets/PrayerWidget.tsx 81 91
extract widget-eyebrow widgets/PrayerWidget.tsx 376 380
extract widget-rowkey widgets/PrayerWidget.tsx 735 739
extract widget-units widgets/PrayerWidget.tsx 518 526
extract widget-dateparse widgets/PrayerWidget.tsx 301 311
extract timeline-names shared/widgetTimeline.ts 133 138
extract timeline-next shared/widgetTimeline.ts 186 195

echo "ANCHORS EXTRACTED: $(ls "$OUT" | wc -l | tr -d ' ')"
