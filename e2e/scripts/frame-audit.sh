#!/bin/zsh
# frame-audit: FPS + visual-quality audit for one animation on the OnePlus 3T.
#
# Scripts MEASURE, vision INTERPRETS: this harness records the animation,
# extracts per-frame timestamps (compositor truth — screenrecord writes a
# frame only on real display changes), builds a labeled contact sheet, and
# emits a ready-to-use vision prompt. Delegate the prompt to an image-capable
# subagent (the campaign used a GLM 5.3 Flash vision subagent, read-only).
#
# Usage: frame-audit.sh <label> <tap-x> <tap-y> [seconds] [device-serial]
#   frame-audit.sh overlay-open 540 974 3
#
# Fallbacks (video capture is thermally fragile on the SD820):
#   FRAME_AUDIT=sf    -> SurfaceFlinger --latency compositor cadence instead
#                        of video (no pixels; gaps <=33ms = 30fps floor pass)
# Known wedge: if screenrecord emits ~1 frame despite display changes, the
# virtual-display pipeline is wedged — a device REBOOT restores it (s6). The
# SF fallback still works in that state.

set -euo pipefail

LABEL=${1:?label}
TAPX=${2:?tap-x}
TAPY=${3:?tap-y}
SECONDS_LIMIT=${4:-3}
SERIAL=${5:-8f7ada76}
ROOT=${0:h:h}
OUT="$ROOT/evidence/$LABEL-$(date +%H%M%S)"
mkdir -p "$OUT"

adb -s "$SERIAL" shell am force-stop com.mugtaba.athan
adb -s "$SERIAL" shell am start -W -n com.mugtaba.athan/.MainActivity >/dev/null
echo "settling 12s (JS warmup + widget pushes land ~2.5s in)"; sleep 12

if [[ ${FRAME_AUDIT:-video} == sf ]]; then
  adb -s "$SERIAL" shell "input tap $TAPX $TAPY"
  sleep 1
  adb -s "$SERIAL" shell "dumpsys SurfaceFlinger --latency 'com.mugtaba.athan/com.mugtaba.athan.MainActivity#0'" \
    > "$OUT/latency.txt" 2>&1
  # `|| verdict=$?` so `set -e` does not abort on a FAIL before it can be reported; the
  # status is re-raised deliberately below. Never name this `status`: zsh reserves it as a
  # read-only alias for `$?`, and assigning it kills the script before it measures anything.
  verdict=0
  python3 - "$OUT/latency.txt" << 'EOF' || verdict=$?
import sys
lines = [l.split() for l in open(sys.argv[1]) if len(l.split()) == 3]
pts = sorted(int(f[1]) for f in lines if int(f[1]) != 0)
# Every quantity below is MILLISECONDS. The thresholds were once written in
# seconds, which discarded every real frame gap before the verdict and left
# all() over an empty list, so this branch could only ever print PASS.
ms = [(t - pts[0]) / 1e6 for t in pts]
tail = [m for m in ms if m > ms[-1] - 2500]
gaps = [tail[i] - tail[i-1] for i in range(1, len(tail))]
anim = [g for g in gaps if 0 < g <= 100]
long = [g for g in gaps if g > 100]
print(f"frames(last-2.5s)={len(tail)} anim-cadence-gaps(ms):", [f"{g:.0f}" for g in anim])
# A gap over 100ms is either a real freeze or a stretch where nothing was drawn,
# and SF latency alone cannot tell those apart. It is excluded from the cadence
# verdict and printed, never silently dropped.
print("gaps>100ms (freeze or idle, needs frames to tell):", [f"{g:.0f}" for g in long] or "NONE")
if not anim:
    print("30fps FLOOR: NO DATA — no cadence gaps in the window, this is not a pass")
    sys.exit(1)
passed = all(g <= 34 for g in anim)
print("30fps FLOOR (cadence only):", "PASS" if passed else "FAIL")
# Exit status, not just text: every caller reads $?, and a measurement tool that
# prints FAIL while returning success is the same defect finding 28 was about —
# a confident pass having measured nothing — one layer further out.
sys.exit(0 if passed else 1)
EOF
  echo "evidence: $OUT"
  exit $verdict
fi

adb -s "$SERIAL" shell "rm -f /sdcard/frame_audit.mp4"
adb -s "$SERIAL" shell screenrecord --time-limit "$SECONDS_LIMIT" --bit-rate 16000000 /sdcard/frame_audit.mp4 &
REC=$!
sleep 0.5
adb -s "$SERIAL" shell "input tap $TAPX $TAPY"
wait $REC 2>/dev/null || true
adb -s "$SERIAL" pull /sdcard/frame_audit.mp4 "$OUT/rec.mp4" >/dev/null

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
recording (dark navy UI). The interaction was a tap at ($TAPX,$TAPY).
For each frame report its state and mid-animation progress; then answer:
(1) Which frames form the animation? (2) Does the animated element progress
monotonically through intermediate sizes/opacities/positions, or snap between
settled states? (3) Any ghosting, squash, or misplaced elements?
Report only what is actually visible; structure as Answer / Details /
Uncertainties.
EOF
echo "evidence: $OUT (delegate $OUT/vision-prompt.md to a vision subagent)"
