#!/bin/bash
# Session 6b anchor check. Run from /Users/muji/repos/rn.athan.uk:
#   bash ai/plans/06b-alert-all-or-nothing/scripts/anchor-check.sh <step number>
#
# It checks two things for the step named, and ends "ANCHORS OK" when both hold:
#   1. every anchor under scripts/anchors/ for that step appears EXACTLY ONCE in its file;
#   2. every file the step replaces has the sha256 the plan expects, and every file it creates does not exist yet.
# Anything else prints "ANCHORS NEEDS REPLAN" and exits 0, because the executor must read the lines above it.
set -u

PLAN=ai/plans/06b-alert-all-or-nothing
ANCHORS=$PLAN/scripts/anchors
MANIFEST=$PLAN/scripts/expected-sha256.txt
step="${1:-}"
bad=0

if [ -z "$step" ]; then
  echo "usage: anchor-check.sh <step number>"
  exit 1
fi

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}

check_anchor() {
  anchor="$ANCHORS/$1"
  source_file="$2"
  if [ ! -f "$anchor" ]; then
    echo "anchor $1 MISSING from the plan"
    bad=1
    return
  fi
  if [ ! -f "$source_file" ]; then
    echo "anchor $1 $source_file MISSING"
    bad=1
    return
  fi
  n=$(count_anchor "$anchor" "$source_file")
  echo "anchor $1 $source_file $n"
  [ "$n" = "1" ] || bad=1
}

case "$step" in
  1)
    check_anchor 1-1.txt shared/notifications.ts
    check_anchor 1-2a.txt device/notifications.ts
    check_anchor 1-2b.txt device/notifications.ts
    check_anchor 1-2c.txt device/notifications.ts
    check_anchor 1-2d.txt device/notifications.ts
    check_anchor 1-2e.txt device/notifications.ts
    check_anchor 1-2f.txt device/notifications.ts
    check_anchor 1-2g.txt device/notifications.ts
    check_anchor 1-3.txt stores/notifications.ts
    check_anchor 1-4.txt stores/notifications.ts
    check_anchor 1-5.txt stores/__tests__/notificationSchedulingLock.test.ts
    ;;
  2)
    check_anchor 2-1.txt stores/notifications.ts
    check_anchor 2-2.txt stores/notifications.ts
    check_anchor 2-3.txt device/notifications.ts
    check_anchor 2-4.txt stores/database.ts
    check_anchor 2-5.txt hooks/useNotification.ts
    ;;
  *)
    echo "no anchors are defined for step $step"
    bad=1
    ;;
esac

# The files each step replaces, by the sha256 they must still have
in_section=0
while IFS= read -r line; do
  case "$line" in
    "[step$step]") in_section=1; continue ;;
    "["*) in_section=0; continue ;;
    ""|"#"*) continue ;;
  esac
  [ "$in_section" = "1" ] || continue
  expected=${line%% *}
  path=${line##* }
  if [ "$expected" = "NEW" ]; then
    if [ -e "$path" ]; then
      echo "file $path EXISTS but the plan creates it"
      bad=1
    else
      echo "file $path absent, as the plan expects"
    fi
    continue
  fi
  if [ ! -f "$path" ]; then
    echo "file $path MISSING"
    bad=1
    continue
  fi
  got=$(shasum -a 256 "$path" | cut -d' ' -f1)
  if [ "$got" = "$expected" ]; then
    echo "file $path matches"
  else
    echo "file $path CHANGED since the plan was written"
    bad=1
  fi
done < "$MANIFEST"

if [ "$bad" = "0" ]; then
  echo "ANCHORS OK"
else
  echo "ANCHORS NEEDS REPLAN"
fi
