#!/bin/zsh
python3 classify.py "$@" | python3 -c '
import json,sys
d=json.load(sys.stdin)
c=d["core"]
print("%-18s days %3d core %3d | fajrDep %.2f sd %.2f | ishaDep %.2f sd %.2f | Jan %.1f Jul %.1f" % (
 d["tag"], d["days"], c["days"], c["fajr"]["mean"], c["fajr"]["sd"], c["isha"]["mean"], c["isha"]["sd"],
 d["amplitude"]["jan"] if d["amplitude"] else 0, d["amplitude"]["jul"] if d["amplitude"] else 0))
'
