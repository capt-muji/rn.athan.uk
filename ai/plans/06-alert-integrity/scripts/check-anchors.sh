#!/bin/bash
# Counts a step's anchors in the working tree. Run from /Users/muji/repos/rn.athan.uk as:
#   bash ai/plans/06-alert-integrity/scripts/check-anchors.sh <step>
# Prints one line per anchor, "<anchor> <source> <count>", then "ANCHORS OK" when every count is 1,
# or "ANCHORS NOT OK" and exits 1.
step="$1"
dir=ai/plans/06-alert-integrity/scripts
ok=1
while read -r s anchor source from; do
  [ "$s" = "$step" ] || continue
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$dir/anchors/$anchor.txt" "$source")
  echo "$anchor $source $count"
  [ "$count" = "1" ] || ok=0
done < "$dir/anchors/manifest.txt"
if [ "$ok" = "1" ]; then echo "ANCHORS OK"; else echo "ANCHORS NOT OK"; exit 1; fi
