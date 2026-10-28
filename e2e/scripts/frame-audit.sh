#!/bin/zsh
# frame-audit: dual FPS audit for one animation on the OnePlus 3T.
#
# Scripts MEASURE, vision INTERPRETS: this harness records the animation,
# extracts per-frame timestamps, builds a labeled contact sheet, and emits a
# ready-to-use vision prompt. Delegate the prompt to an image-capable
# subagent (the campaign used a GLM 5.3 Flash vision subagent, read-only).
#
# The default run is DUAL: one tap, two reads in one evidence dir. The
# screenrecord video is the ENCODER's word about the compositor (a frame is
# written only on real display changes, through the SD820's encoder), so a
# video dead zone alone proves nothing. The second read is SurfaceFlinger's
# own present timestamps for the app's layer: a dead zone in BOTH reads is
# compositor truth, one in video alone is encoder loss.
#
# Usage: frame-audit.sh <label> <tap-x> <tap-y> [seconds] [device-serial]
#   frame-audit.sh overlay-open 540 1012 3
#   PRE_TAP="540 1012" frame-audit.sh overlay-close 540 1100 3
#     PRE_TAP drives one transition first and waits out its entrance, so the
#     recorded tap is a real second interaction (overlay-close: open, settle,
#     then record the closing tap). PRE_TAP_WAIT (seconds) is that settle
#     wait, default 1 — the stock 3s captures re-opens when the mock's seeded
#     boundary is near, so the default is mock-safe (README Gotchas).
#   SF_OFFSET=<seconds>
#     Overrides the per-capture clock anchor when it read LOW (an anchor tap
#     that closes a sheet presents late). Offsets cannot decrease, so the
#     highest coherent reading across a session is the true one.
#
# Modes (FRAME_AUDIT):
#   dual (default)  -> video + SF read of the same tap, gap lists side by
#                      side and the separation verdict. Its cadence PASS line
#                      is NOT a floor verdict (and matches the sf floor's
#                      33ms band) — the recorder-free sf read's printed
#                      present-gap list is the verdict of record (D16)
#   video           -> video only (the pre-dual behaviour)
#   sf              -> SurfaceFlinger --latency cadence instead of video
#                      (no pixels) — D16's recorder-free FLOOR WITNESS, and
#                      still the only read while video capture is wedged.
#                      The tap is stamped and anchored on the SF clock, the
#                      layer resolved from --list, and the entrance window
#                      bounded [tap-50ms, tap+ENTRANCE_MS] (default 1000,
#                      which covers every audited interaction's
#                      tap-to-settled). THE PRINTED PRESENT-GAP LIST inside
#                      that window IS THE VERDICT OF RECORD, read against the
#                      33ms floor: every gap over 33ms in it is a floor
#                      failure, gaps over 100ms included — never
#                      "freeze or idle". The PASS line only summarizes the
#                      list.
# Known wedge: if screenrecord emits ~1 frame despite display changes, the
# virtual-display pipeline is wedged — a device REBOOT restores it (s6). The
# SF fallback still works in that state.

set -euo pipefail

LABEL=${1:?label}
TAPX=${2:?tap-x}
TAPY=${3:?tap-y}
SECONDS_LIMIT=${4:-3}
PRE_TAP_WAIT=${PRE_TAP_WAIT:-1}
SERIAL=${5:-$(adb devices | awk 'NR>1 && $2=="device"{print $1; exit}')}
PKG=${APP_ID:-com.example.athan}
MODE=${FRAME_AUDIT:-dual}
if [[ $MODE != dual && $MODE != video && $MODE != sf ]]; then
  echo "FRAME_AUDIT must be dual, video or sf (got '$MODE')"
  exit 1
fi
ROOT=${0:h:h}
OUT="$ROOT/evidence/$LABEL-$(date +%H%M%S)"
mkdir -p "$OUT"

adb -s "$SERIAL" shell am force-stop $PKG
adb -s "$SERIAL" shell am start -W -n $PKG/.MainActivity >/dev/null
echo "settling 12s (JS warmup + widget pushes land ~2.5s in)"; sleep 12

if [[ -n ${PRE_TAP:-} ]]; then
  adb -s "$SERIAL" shell input tap ${=PRE_TAP}
  echo "pre-tap at $PRE_TAP, waiting out the entrance (${PRE_TAP_WAIT}s)"
  sleep "$PRE_TAP_WAIT"
fi

# SurfaceFlinger's layer names rotate per process relaunch, so the layer is
# resolved from --list, never from a fixed name: the plain
# PKG/PKG.MainActivity#0 and the hash-prefixed variant are both live shapes,
# and sibling packages must not match.
resolve_sf_layer() {
  local pkg_re=${PKG//./\\.}
  adb -s "$SERIAL" shell dumpsys SurfaceFlinger --list | tr -d '\r' \
    | grep -E "(^|/)$pkg_re/$pkg_re\.MainActivity#0$" | tail -1
}

# Per-capture suspend offset (boottime - monotonic): every phone that has
# ever suspended carries one (this 3T: ~8047s) and every doze between
# captures grows it. Clear the ring, tap the prayer row (any transition presents),
# read uptime in the SAME shell, then dump: offset = uptime - first present
# after the clear (+-50ms vsync and read lag). An anchor tap that CLOSES a
# sheet presents late and reads the offset LOW (275-296ms on glass);
# offsets cannot decrease, so across captures the highest coherent reading
# is the true one — SF_OFFSET (seconds) overrides a polluted read without a
# re-capture, recorded in anchor_note.txt.
measure_sf_anchor() {
  if [[ -n ${SF_OFFSET:-} ]]; then
    echo "SF_OFFSET override: ${SF_OFFSET} (per-capture anchor not measured)" > "$OUT/anchor_note.txt"
    echo "$SF_OFFSET" > "$OUT/anchor_offset.txt"
    echo "anchor offset: ${SF_OFFSET}s (SF_OFFSET override)"
  else
    adb -s "$SERIAL" shell "dumpsys SurfaceFlinger --latency-clear '$LAYER'"
    adb -s "$SERIAL" shell "input tap 540 1012; cat /proc/uptime" > "$OUT/anchor_uptime.txt"
    sleep 1.2
    adb -s "$SERIAL" shell "dumpsys SurfaceFlinger --latency '$LAYER'" \
      > "$OUT/anchor_latency.txt" 2>&1
    AUP=$(head -1 "$OUT/anchor_uptime.txt" | awk '{print $1}')
    AFP=$(awk 'NF==3 && $3+0>0 && $3+0<4611686018427387904 {print $3; exit}' \
      "$OUT/anchor_latency.txt")
    if [[ -n "$AFP" && "$AFP" != "0" ]]; then
      python3 -c "print(f'{$AUP - $AFP/1e9:.3f}')" > "$OUT/anchor_offset.txt"
      echo "anchor offset: $(cat "$OUT/anchor_offset.txt")s (highest coherent reading wins across captures)"
    else
      echo "anchor FAILED: no present after the ring clear (anchor tap hit nothing that transitions?) — set SF_OFFSET from the session's highest coherent reading, or re-run"
    fi
  fi
}

if [[ $MODE == sf ]]; then
  # Tap and uptime read in ONE shell: the tap's CLOCK_BOOTTIME stamp must
  # ride the same read discipline as the anchor's, or the offset arithmetic
  # pulls the entrance window off the tap.
  adb -s "$SERIAL" shell "input tap $TAPX $TAPY; cat /proc/uptime" > "$OUT/tap_uptime.txt"
  # The dump lands after the entrance AND the universal late burst (~1.7-2.2s
  # after the tap, step 10's Defect C): the ring's last ~127 presents hold
  # entrance + burst + idle ticks at the 3T's cadence, while a dump before
  # the animation reads an idle layer and prints NO DATA.
  sleep 3
  LAYER=$(resolve_sf_layer)
  if [[ -z "$LAYER" ]]; then
    echo "no SF layer for $PKG in SurfaceFlinger --list (names rotate per relaunch)"
    echo "evidence: $OUT (no compositor read; this is not a pass)"
    exit 1
  fi
  adb -s "$SERIAL" shell "dumpsys SurfaceFlinger --latency '$LAYER'" \
    > "$OUT/latency.txt" 2>&1
  measure_sf_anchor
  # `|| verdict=$?` so `set -e` does not abort on a FAIL before it can be reported; the
  # status is re-raised deliberately below. Never name this `status`: zsh reserves it as a
  # read-only alias for `$?`, and assigning it kills the script before it measures anything.
  verdict=0
  python3 - "$OUT" << 'SFEOF' || verdict=$?
import os, sys

out = sys.argv[1]

# Third column = actual present timestamp (ns, CLOCK_MONOTONIC); the trailing
# sentinel row (INT64_MAX) and never-presented rows (0) fall to the bounds.
rows = [l.split() for l in open(f"{out}/latency.txt")]
presents = sorted(set(int(r[2]) for r in rows if len(r) == 3 and 0 < int(r[2]) < 2**62))

# The tap was stamped on CLOCK_BOOTTIME (/proc/uptime, suspend included);
# presents ride CLOCK_MONOTONIC. The per-capture anchor offset bridges the
# two clocks; without it the entrance window cannot be placed on the timeline.
try:
    tap_boot = float(open(f"{out}/tap_uptime.txt").read().split()[0])
    offset = float(open(f"{out}/anchor_offset.txt").read().split()[0])
except (OSError, IndexError, ValueError):
    print("SF 30fps FLOOR: NO DATA — no clock anchor (tap_uptime.txt or"
          " anchor_offset.txt; a failed per-capture anchor needs SF_OFFSET"
          " or a re-run); this is not a pass")
    sys.exit(1)

# The entrance window: from 50ms before the tap (the anchor's vsync and
# read-lag margin, as the dual branch) to ENTRANCE_MS after it. It must
# cover the audited entrance end to end — the marks bands put
# tap-to-settled at ~160ms (overlay) and ~660ms (sheets) — so the 1000ms
# default covers every audited interaction with margin.
ENTRANCE_MS = float(os.environ.get("ENTRANCE_MS", "1000"))
tap_mono = tap_boot - offset
rel = [(t / 1e9 - tap_mono) * 1000 for t in presents]
win = [m for m in rel if -50 <= m <= ENTRANCE_MS]
late = [m for m in rel if m > ENTRANCE_MS]

if len(win) < 2:
    print(f"SF 30fps FLOOR: NO DATA — {len(win)} presents inside the entrance"
          " window (dump before the animation? ring rolled past the"
          " entrance? nothing transitioned?); this is not a pass")
    sys.exit(1)

# THE VERDICT OF RECORD is the printed gap list below, read against the 33ms
# floor inside the stated window — never the PASS summary alone. A gap over
# 100ms between two presents INSIDE the window is a floor failure, not an
# unclassifiable freeze: idle leaves through the window's far edge, and the
# gap that crosses it ends outside and never prints as a failure.
gaps = [(win[i] - win[i - 1], win[i - 1]) for i in range(1, len(win))]
print(f"entrance window [tap-50ms, tap+{ENTRANCE_MS:.0f}ms]: {len(win)} presents,"
      f" tap -> first present {win[0]:.0f}ms")
print("present gaps inside the window:", [f"{g:.1f}ms@{a:+.0f}" for g, a in gaps])
failures = [(g, a) for g, a in gaps if g > 33]
print("FLOOR FAILURES (gaps over 33ms inside the window):",
      [f"{g:.0f}ms@+{a:.0f}" for g, a in failures] or "NONE")
if late:
    print("late presents beyond the window (info, not floor):",
          [f"+{m:.0f}ms" for m in late])
passed = not failures
print("30fps FLOOR:", "PASS" if passed else "FAIL",
      "(summary — the printed list above is the verdict of record)")
# Exit status, not just text: a measurement tool that prints FAIL while
# returning success is a confident pass having measured nothing.
sys.exit(0 if passed else 1)
SFEOF
  echo "evidence: $OUT"
  exit $verdict
fi

adb -s "$SERIAL" shell "rm -f /sdcard/frame_audit.mp4"
adb -s "$SERIAL" shell screenrecord --time-limit "$SECONDS_LIMIT" --bit-rate 16000000 /sdcard/frame_audit.mp4 &
REC=$!
sleep 0.5
adb -s "$SERIAL" shell "input tap $TAPX $TAPY"
if [[ $MODE == dual ]]; then
  # Tap anchor on CLOCK_BOOTTIME (/proc/uptime includes suspend), read
  # immediately after the tap. SF presents ride CLOCK_MONOTONIC, so this read
  # alone cannot open the SF window: the per-capture anchor measured below
  # supplies the suspend offset, and the pairing subtracts it.
  adb -s "$SERIAL" shell cat /proc/uptime > "$OUT/tap_uptime.txt"
fi
wait $REC 2>/dev/null || true
adb -s "$SERIAL" pull /sdcard/frame_audit.mp4 "$OUT/rec.mp4" >/dev/null
if [[ $MODE == dual ]]; then
  # The dump lands AFTER the recorded animation (tap, animation, then dump):
  # an idle layer presents nothing, so the ring's last ~127 presents still
  # cover the entrance the video recorded, while a dump before the tap reads
  # an idle layer and prints NO DATA.
  LAYER=$(resolve_sf_layer)
  if [[ -z "$LAYER" ]]; then
    echo "no SF layer for $PKG in SurfaceFlinger --list (names rotate per relaunch)"
    echo "evidence: $OUT (video evidence kept; separation FAILED — no compositor read)"
    exit 1
  fi
  adb -s "$SERIAL" shell "dumpsys SurfaceFlinger --latency '$LAYER'" \
    > "$OUT/latency.txt" 2>&1
  measure_sf_anchor
fi

ffprobe -select_streams v -show_entries frame=pts_time -of csv=p=0 "$OUT/rec.mp4" 2>/dev/null > "$OUT/pts.txt"
ffmpeg -y -loglevel error -i "$OUT/rec.mp4" -fps_mode passthrough "$OUT/f_%03d.png" 2>/dev/null || true
# -fps_mode passthrough is REQUIRED (output option): VFR screenrecord output
# gets CFR-duplicated otherwise and frame indices stop matching timestamps.
python3 - "$OUT" << 'EOF'
import glob, sys
from PIL import Image, ImageDraw
out = sys.argv[1]
pts = [float(l.strip().rstrip(',')) for l in open(f"{out}/pts.txt") if l.strip()]
files = sorted(glob.glob(f"{out}/f_*.png"))
print(f"frames: {len(files)} (pts {len(pts)})")
if len(files) >= 2:
    gaps = [pts[i]-pts[i-1] for i in range(1, len(pts))]
    print("gaps>33ms:", [f"{g*1000:.0f}ms@{pts[i]:.2f}" for i, g in enumerate(gaps, 1) if g > 0.034] or "NONE")
    cols = min(8, len(files)); rows = (len(files)+cols-1)//cols
    tw, th = 135, 240
    sheet = Image.new('RGB', (cols*tw, rows*(th+28)), (20,20,20))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB').resize((tw, th))
        x, y = (i%cols)*tw, (i//cols)*(th+28)
        sheet.paste(im, (x, y))
        d.text((x+4, y+th+6), f"#{i} t={pts[i]:.2f}s", fill=(255,255,0))
    sheet.save(f"{out}/contact_sheet.png")
    print(f"contact sheet: {out}/contact_sheet.png")
EOF

cat > "$OUT/vision-prompt.md" << EOF
# Vision audit: $LABEL
Read $(ls "$OUT"/contact_sheet.png 2>/dev/null || echo '(no sheet — read frames directly)') with your Read tool.
It is a labeled contact sheet of sequential frames from a prayer-times app
recording (dark navy UI). The interaction was a tap at ($TAPX,$TAPY)${PRE_TAP:+,
which followed a prior tap at ($PRE_TAP) whose transition is already settled}.
For each frame report its state and mid-animation progress; then answer:
(1) Which frames form the animation? (2) Does the animated element progress
monotonically through intermediate sizes/opacities/positions, or snap between
settled states? (3) Any ghosting, squash, or misplaced elements?
Report only what is actually visible; structure as Answer / Details /
Uncertainties.
EOF

if [[ $MODE == video ]]; then
  echo "evidence: $OUT (delegate $OUT/vision-prompt.md to a vision subagent)"
  exit 0
fi

# Separation: pair the encoder's and the compositor's word about one tap.
# Same `verdict` capture as the SF branch — never name it `status`: zsh
# reserves that as a read-only alias for `$?`, and assigning it kills the
# script before it reports.
verdict=0
python3 - "$OUT" << 'EOF' || verdict=$?
import sys

out = sys.argv[1]

# Video read (the encoder's word): pts are seconds from recording start, and
# the tap sits at 0.5s by construction (sleep 0.5 before input tap).
pts = [float(l.strip().rstrip(',')) for l in open(f"{out}/pts.txt") if l.strip()]
tap = [p for p in pts if p >= 0.45]

# SF read (the compositor's word): the third latency column is the actual
# present timestamp, nanoseconds on CLOCK_MONOTONIC. /proc/uptime rides
# CLOCK_BOOTTIME (suspend included), so the tap's monotonic time is the
# boottime read minus the per-capture suspend offset. The trailing sentinel
# row (INT64_MAX) and never-presented rows (0) fall to the bounds.
try:
    tap_boot = float(open(f"{out}/tap_uptime.txt").read().split()[0])
    offset = float(open(f"{out}/anchor_offset.txt").read().split()[0])
except (OSError, IndexError, ValueError):
    print("SEPARATION: NO DATA — no clock anchor (tap_uptime.txt or"
          " anchor_offset.txt; a failed per-capture anchor needs SF_OFFSET"
          " or a re-run); this is not a pass")
    sys.exit(1)
rows = [l.split() for l in open(f"{out}/latency.txt")]
presents = sorted(set(int(r[2]) for r in rows if len(r) == 3 and 0 < int(r[2]) < 2**62))
tap_mono = tap_boot - offset

# Every quantity below is MILLISECONDS, video tap-relative (0 = the tap). The
# SF window opens 50ms BEFORE the tap: the anchor carries +-50ms of vsync and
# read lag, so the entrance's first presents may sit slightly before it.
vms = [(p - 0.5) * 1000 for p in tap]
sms = [(t / 1e9 - tap_mono) * 1000 for t in presents if t / 1e9 >= tap_mono - 0.05]

def dead_zones(times):
    # A dead zone is a gap past the 34ms floor that dense frames still follow
    # (next gap <=68ms, two frames at the 30fps floor): a stall inside a
    # running animation. Idle gaps — a settled screen — are followed by more
    # idle and never count, so the ring's idle tail cannot fake a verdict.
    zones = []
    for i in range(1, len(times)):
        gap = times[i] - times[i - 1]
        if gap > 34 and i + 1 < len(times) and times[i + 1] - times[i] <= 68:
            zones.append((gap, times[i - 1]))
    return zones

gaps = [sms[i] - sms[i - 1] for i in range(1, len(sms))]
anim = [g for g in gaps if 0 < g <= 100]
long = [g for g in gaps if g > 100]
vdead = dead_zones(vms)
sdead = dead_zones(sms)

fmt = lambda zones: [f"{g:.0f}ms@+{a:.0f}" for g, a in zones] or "NONE"
print("SF window:", len(sms), "presents of", len(presents), "in ring")
print("video dead zones (encoder):", fmt(vdead))
print("SF dead zones (compositor):", fmt(sdead))
if vms and sms:
    print(f"first draw: video {vms[0]:.0f}ms after tap, SF {sms[0]:.0f}ms after tap (+-50ms anchor)")

if len(tap) < 2:
    print("SEPARATION: NO DATA — the video read is empty (capture wedge? REBOOT;"
          " FRAME_AUDIT=sf still works); this is not a pass")
    sys.exit(1)
if not anim:
    print("SF 30fps FLOOR: NO DATA — no cadence gaps in the window, this is not a pass")
    sys.exit(1)
passed = all(g <= 33 for g in anim)
print("SF 30fps FLOOR (cadence):", "PASS" if passed else "FAIL")
print("SF gaps>100ms (freeze or idle, needs frames to tell):", [f"{g:.0f}" for g in long] or "NONE")

# Pairing: both instruments measure the same presents, so a compositor dead
# zone matches its video twin closely; tolerance absorbs encoder timing.
used = [False] * len(sdead)
corroborated = 0
for g, _ in vdead:
    best = None
    for j, (sg, _) in enumerate(sdead):
        if used[j]:
            continue
        d = abs(sg - g)
        if d <= max(40, 0.25 * max(g, sg)) and (best is None or d < best[0]):
            best = (d, j)
    if best is not None:
        used[best[1]] = True
        corroborated += 1
enc_only = len(vdead) - corroborated

if not vdead and not sdead:
    verdict = "CLEAN — no dead zone on either read"
elif corroborated and enc_only == 0:
    verdict = f"COMPOSITOR TRUTH — all {len(vdead)} video dead zones have SF twins"
elif corroborated:
    verdict = f"MIXED — {corroborated} corroborated (compositor), {enc_only} encoder-only"
elif vdead:
    verdict = f"ENCODER LOSS — all {len(vdead)} video dead zones absent from SF"
else:
    verdict = "SF-ONLY dead zones — present stalls the video never showed; read with the contact sheet"
print("SEPARATION:", verdict)

# Exit status, not just text: corroborated dead zones and a failed cadence
# floor are real jank; encoder loss and clean reads are the floor holding.
sys.exit(1 if (not passed or corroborated) else 0)
EOF
echo "evidence: $OUT (delegate $OUT/vision-prompt.md to a vision subagent)"
exit $verdict
