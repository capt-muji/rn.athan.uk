#!/bin/zsh
# baseline-compare: run a Maestro flow while streaming ReactNativeJS perf marks,
# then diff the mark medians against e2e/baselines/<device>.json.
#
# Usage: baseline-compare.sh <flow.yaml> [device-serial]
# Requires: maestro on PATH, adb, a Release build with EXPO_PUBLIC_PERF_MONITOR=1.
#
# Marks are the primary in-app instrument (validated Phase 2 against external
# numbers). Frame-quality audits are a SEPARATE harness (frame-audit.sh).

set -euo pipefail

FLOW=${1:?usage: baseline-compare.sh <flow.yaml> [device-serial]}
SERIAL=${2:-$(adb devices | awk 'NR>1 && $2=="device"{print $1; exit}')}
ROOT=${0:A:h:h}
BASELINE="$ROOT/baselines/android-3t.json"
OUT=$(mktemp -d)
TRAP() { kill ${LOGCAT_PID:-0} 2>/dev/null || true }; trap TRAP EXIT

adb -s "$SERIAL" logcat -c 2>/dev/null || true
adb -s "$SERIAL" logcat -s ReactNativeJS -v threadtime > "$OUT/marks.log" 2>&1 &
LOGCAT_PID=$!

echo "== running $FLOW (marks streaming)"
# A flow that missed its taps measured a screen nobody drove. Medians from it read
# exactly like a real measurement, so stop rather than print a table.
if ! maestro --device "$SERIAL" test "$FLOW"; then
  kill $LOGCAT_PID 2>/dev/null || true
  echo "== FAILED: $FLOW did not complete — a partial flow measures nothing comparable"
  exit 1
fi

kill $LOGCAT_PID 2>/dev/null || true

echo "== marks collected:"
grep -o 'PERF_MEASURE {.*}' "$OUT/marks.log" | sed 's/.*"name":"\([^"]*\)".*"duration":\([0-9]*\).*/\1 \2/' > "$OUT/marks.txt" || true
if [[ ! -s $OUT/marks.txt ]]; then
  echo "== FAILED: no PERF_MEASURE lines in the capture"
  echo "   the build must be Release with EXPO_PUBLIC_PERF_MONITOR=1, and Metro's"
  echo "   cache plus the generated bundle cleared first — see e2e/README.md"
  exit 1
fi
python3 - "$BASELINE" "$OUT" << 'EOF'
import json, statistics, sys
baseline_path, out = sys.argv[1], sys.argv[2]
samples = {}
for line in open(f"{out}/marks.txt"):
    name, dur = line.split()
    samples.setdefault(name, []).append(float(dur))
try:
    baseline = json.load(open(baseline_path))
except FileNotFoundError:
    baseline = {}
print(f"{'mark':24} {'n':>3} {'median':>8} {'baseline':>9} {'delta':>8}")
result = {}
for name in sorted(samples):
    vals = samples[name]
    med = statistics.median(vals)
    base = baseline.get(name)
    delta = f"{med-base:+.0f}" if base is not None else "n/a"
    print(f"{name:24} {len(vals):>3} {med:>8.0f} {base if base is not None else 'n/a':>9} {delta:>8}")
    result[name] = {"median": med, "n": len(vals), "baseline": base}
json.dump(result, open(f"{out}/compare.json", "w"), indent=2)
print(f"\nwrote {out}/compare.json")
EOF
