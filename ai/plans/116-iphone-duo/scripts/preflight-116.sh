#!/bin/bash
# Ticket 116 pre-flight. Run from the repository root. Ends PREFLIGHT OK or names the check
# that failed. The Xcode check fails on this machine by design: the Duo simulator ships with
# Xcode 27.1 only, and that install is the ticket's own blocker written as a command.
set -u

PLAN_DIR="ai/plans/116-iphone-duo"
ANCHORS="$PLAN_DIR/scripts/anchors"
FAILED=0

fail() {
  echo "FAIL: $1"
  FAILED=1
}

# --- checkout ---
[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || fail "not on uat"
[ -z "$(git status --porcelain)" ] || fail "tree is not clean"
git rev-parse --verify --quiet origin/uat >/dev/null || fail "origin/uat is not fetched"
if git rev-parse --verify --quiet origin/uat >/dev/null; then
  [ "$(git rev-list --count HEAD..origin/uat)" = "0" ] || fail "origin/uat is not merged into HEAD"
fi

# --- version not lower than Planned at (2.0.917) ---
VERSION="$(node -p "require('./package.json').version")"
node -e '
const [v, floor] = process.argv.slice(1);
const parse = (s) => s.split(".").map(Number);
const [a, b, c] = parse(v);
const [x, y, z] = parse(floor);
process.exit(a > x || (a === x && (b > y || (b === y && c >= z))) ? 0 : 1);
' "$VERSION" "2.0.917" || fail "version $VERSION is below the planned-at 2.0.917"

# --- Needs first: none ---

# --- anchors, counted with python, never grep ---
for entry in navigation-pager:app/Navigation.tsx size-content-max-width:shared/constants.ts; do
  anchor="$ANCHORS/${entry%%:*}.txt"
  source="${entry##*:}"
  [ -f "$anchor" ] || { fail "anchor missing: $anchor"; continue; }
  [ -f "$source" ] || { fail "anchor source missing: $source"; continue; }
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$count" = "1" ] || fail "anchor $anchor appears $count times in $source"
done

# --- the blocker, as a command ---
XCODE="$(xcodebuild -version 2>/dev/null | head -1)"
case "$XCODE" in
  "Xcode 27.1"*) echo "ok: $XCODE" ;;
  *) fail "Xcode 27.1 is required, found: ${XCODE:-none}" ;;
esac

xcodebuild -showsdks 2>/dev/null | grep -q "iphoneos27.1" || fail "no iphoneos27.1 SDK"
xcrun simctl list runtimes 2>/dev/null | grep -q "iOS 27.1" || fail "no iOS 27.1 simulator runtime"
xcrun simctl list devicetypes 2>/dev/null | grep -q "iPhone Duo" || fail "no iPhone Duo device type"

# --- dupe guard, because an Xcode install is a large download ---
FREE_MIB="$(df -m "$HOME" | awk 'NR==2 {print $4}')"
[ "${FREE_MIB:-0}" -gt 20480 ] || fail "less than 20 GiB free (${FREE_MIB:-0} MiB); the Xcode install needs room"

if [ "$FAILED" = "1" ]; then
  echo "PREFLIGHT FAILED"
  exit 1
fi
echo "PREFLIGHT OK"
