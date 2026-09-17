#!/bin/zsh
# Session 8 study driver. Runs every phase on the iPhone XS from this Mac:
# no tap, no gesture, no owner hand. Restartable: it reads the app's own
# cursor (the NOTIFY-STUDY RUN line each launch logs) and continues from
# wherever the study stands. Run from the repository root:
#   zsh ai/plans/08-ios-replace-previous-notification/scripts/study.sh
# Ends STUDY RUN DONE. Exit codes: 2 a wait timed out or a precondition is
# missing, 3 phase 2 found the phone locked (the owner unlocks once, then
# this script is re-run), 4 phase 4 reported UNPATCHED twice.
#
# Screenshots are corroboration only: without a gesture no Mac-side tool can
# show Notification Center, so the load-bearing evidence is the NOTIFY-STUDY
# log lines the app itself writes. Nobody but the audit session reads images.
set -uo pipefail

UDID=00008020-0015585C22D2002E
BUNDLE=com.mugtaba.athan.experiments
OUT=/Users/muji/athan-device-sweep/session8
SYSLOG=$OUT/study-syslog.txt
INSTALL_A=$OUT/variantA/AthanLab.app
INSTALL_B=$OUT/variantB/AthanLab.app

mkdir -p "$OUT"

# One wait = one bounded loop of 10-second sleeps. $1 pattern (regex), $2
# label, $3 byte offset the log portion starts at, $4 max passes (default 18).
wait_for() {
  local pattern=$1 label=$2 offset=$3 max=${4:-18}
  local i=0
  until tail -c +"$offset" "$SYSLOG" 2>/dev/null | grep -qE "$pattern"; do
    i=$((i+1))
    if [ $i -ge $max ]; then
      echo "WAIT TIMEOUT: $label (waited $((max*10))s for: $pattern)"
      echo "Last NOTIFY-STUDY lines:"
      grep 'NOTIFY-STUDY' "$SYSLOG" | tail -8
      exit 2
    fi
    sleep 10
  done
}

shot() {
  xcrun devicectl device capture screenshot --device "$UDID" --destination "$OUT/$1" >/dev/null 2>&1
  echo "SHOT $1"
}

launch() {
  xcrun devicectl device process launch --terminate-existing --device "$UDID" "$BUNDLE" >/dev/null
  sleep 5
}

install_variant() {
  xcrun devicectl device install app --device "$UDID" "$1" >/dev/null
  echo "INSTALLED $1"
}

kill_study_app() {
  local pid
  pid=$(pymobiledevice3 developer dvt process-id-for-bundle-id "$BUNDLE" --udid "$UDID" 2>/dev/null | tail -1 | tr -dc '0-9')
  if [ -n "$pid" ]; then
    pymobiledevice3 developer dvt kill "$pid" --udid "$UDID" >/dev/null 2>&1
    echo "KILLED pid=$pid"
  else
    echo "KILL FAILED: no pid for $BUNDLE"
    exit 2
  fi
}

# The syslog capture spans the whole run; rotate any earlier capture to a
# unique name so no restart ever overwrites evidence, and every wait below
# reads this run's lines only.
if [ -f "$SYSLOG" ]; then mv "$SYSLOG" "$SYSLOG.$(date +%Y%m%d-%H%M%S)"; fi
PYTHONUNBUFFERED=1 pymobiledevice3 syslog live > "$SYSLOG" 2> "$OUT/syslog-stderr.txt" &
SYSLOG_PID=$!
trap 'kill $SYSLOG_PID 2>/dev/null' EXIT

xcrun devicectl list devices 2>/dev/null | grep -m1 "$UDID" || { echo "DEVICE MISSING: $UDID"; exit 2; }
[ -d "$INSTALL_A" ] || { echo "MISSING BUILD: $INSTALL_A (run build-study.sh)"; exit 2; }
[ -d "$INSTALL_B" ] || { echo "MISSING BUILD: $INSTALL_B (run build-study.sh)"; exit 2; }

shot 00-baseline.png
install_variant "$INSTALL_A"
INSTALLED_B=0

while true; do
  OFFSET=$(($(stat -f%z "$SYSLOG" 2>/dev/null || echo 0) + 1))
  launch
  wait_for 'NOTIFY-STUDY RUN' 'the cursor line' "$OFFSET" 12
  RUN_LINE=$(tail -c +"$OFFSET" "$SYSLOG" | grep -m1 'NOTIFY-STUDY RUN')
  CURSOR=$(echo "$RUN_LINE" | sed -E 's/.*"cursor":([0-9]+).*/\1/')
  OFFSET=$(($(stat -f%z "$SYSLOG") + 1))
  echo "PHASE CURSOR=$CURSOR"

  case "$CURSOR" in
    0)
      wait_for 'NOTIFY-STUDY P1 DONE' 'phase 1' "$OFFSET" 15
      sleep 5; shot 01-after-p1.png
      ;;
    1)
      wait_for 'NOTIFY-STUDY P3A DONE' 'phase 3a' "$OFFSET" 12
      kill_study_app
      sleep 10; shot 02-app-dead.png
      sleep 15
      ;;
    2)
      wait_for 'NOTIFY-STUDY P3 DONE' 'phase 3b' "$OFFSET" 12
      sleep 5; shot 03-after-p3-clear.png
      # Phase 4 is next and needs variant B; install it now so the cursor-3
      # launch runs it directly. The case-3 branch below is restart safety.
      if [ "$INSTALLED_B" -eq 0 ]; then
        install_variant "$INSTALL_B"
        INSTALLED_B=1
      fi
      ;;
    3)
      # Phase 4 needs variant B (the pod that applies threadIdentifier). If
      # this launch is still running variant A, it logs P4 UNPATCHED and keeps
      # the cursor; install B and try again, once.
      if [ "$INSTALLED_B" -eq 0 ]; then
        install_variant "$INSTALL_B"
        INSTALLED_B=1
        launch
        wait_for 'NOTIFY-STUDY RUN' 'the cursor line after installing B' "$OFFSET" 12
        OFFSET=$(($(stat -f%z "$SYSLOG") + 1))
      fi
      wait_for 'NOTIFY-STUDY P4 (DONE|UNPATCHED)' 'phase 4' "$OFFSET" 18
      if tail -c +"$OFFSET" "$SYSLOG" | grep -q 'NOTIFY-STUDY P4 UNPATCHED'; then
        install_variant "$INSTALL_B"
        launch
        wait_for 'NOTIFY-STUDY RUN' 'the cursor line after reinstalling B' "$OFFSET" 12
        OFFSET=$(($(stat -f%z "$SYSLOG") + 1))
        wait_for 'NOTIFY-STUDY P4 (DONE|UNPATCHED)' 'phase 4, second try' "$OFFSET" 18
        if tail -c +"$OFFSET" "$SYSLOG" | grep -q 'NOTIFY-STUDY P4 UNPATCHED'; then
          echo 'PHASE 4 UNPATCHED TWICE: the pod patch did not reach the build.'
          exit 4
        fi
      fi
      sleep 5; shot 04-after-p4.png
      ;;
    4)
      wait_for 'NOTIFY-STUDY P2 (DONE|LOCKED)' 'phase 2' "$OFFSET" 18
      if tail -c +"$OFFSET" "$SYSLOG" | grep -q 'NOTIFY-STUDY P2 LOCKED'; then
        echo 'PHASE 2 LOCKED: the phone is locked. Ask the owner to unlock it once'
        echo '(nothing else is needed), then re-run this script.'
        exit 3
      fi
      sleep 5; shot 05-after-p2.png
      ;;
    *)
      wait_for 'NOTIFY-STUDY P5 CLEANED' 'cleanup' "$OFFSET" 12
      break
      ;;
  esac
done

kill $SYSLOG_PID 2>/dev/null
trap - EXIT
# Every capture this phone run produced, oldest first (study-syslog.txt sorts
# before its timestamped rotations), so a study that needed a restart yields
# one digest holding all of its phases.
cat "$OUT"/study-syslog.txt "$OUT"/study-syslog.txt.* 2>/dev/null | grep 'NOTIFY-STUDY' > "$OUT/study-digest.txt"

# Leave the phone as it was found: nothing of the study stays installed. The
# owner's own Athan (com.mugtaba.athan) is never touched by any step.
xcrun devicectl device uninstall app --device "$UDID" "$BUNDLE" >/dev/null
echo "UNINSTALLED $BUNDLE"
echo "STUDY RUN DONE"
