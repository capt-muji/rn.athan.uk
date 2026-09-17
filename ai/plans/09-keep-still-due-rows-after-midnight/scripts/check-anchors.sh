#!/bin/bash
# Counts this plan's anchors for one step, against the working tree, from the repository root:
#   bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/check-anchors.sh <step>
# Every count must be 1. Anchor 2-2 anchors text step 1 inserts, so it counts 1 only once step 1
# is merged; it is not checked for step 1.
dir=ai/plans/09-keep-still-due-rows-after-midnight/scripts
k="$1"
[ -n "$k" ] || { echo "usage: check-anchors.sh <step 1|2>"; exit 2; }
all=1
while read -r step anchor source from; do
  if [ "$step" = "$k" ]; then
    count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$dir/anchors/$anchor.txt" "$source")
    echo "$anchor $source $count"
    if [ "$count" != "1" ]; then all=0; fi
  fi
done < "$dir/anchors/manifest.txt"
if [ "$all" = "1" ]; then echo "ANCHORS OK"; else echo "ANCHORS FAILED"; exit 1; fi
