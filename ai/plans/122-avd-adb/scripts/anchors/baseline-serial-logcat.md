SERIAL=${2:-$(adb devices | awk 'NR>1 && $2=="device"{print $1; exit}')}
ROOT=${0:A:h:h}
BASELINE="$ROOT/baselines/android-3t.json"
OUT=$(mktemp -d)
TRAP() { kill ${LOGCAT_PID:-0} 2>/dev/null || true }; trap TRAP EXIT

adb -s "$SERIAL" logcat -c 2>/dev/null || true
adb -s "$SERIAL" logcat -s ReactNativeJS -v threadtime > "$OUT/marks.log" 2>&1 &
