#!/usr/bin/env bash
# Pre-flight for ticket 137. Run from the lane worktree root after copying to $TMPDIR.
# Device absence warns and fails nothing here: only the device step that needs the phone
# stops on it. Everything else must pass for PREFLIGHT OK.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "PREFLIGHT FAIL: not a git worktree"; exit 1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "lane/137" ] || { echo "PREFLIGHT FAIL: on $branch, not lane/137"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "PREFLIGHT FAIL: tree not clean"; exit 1; }

base="$(git merge-base lane/137 uat)"
planned="cd171855"
git merge-base --is-ancestor "$planned" "$base" || { echo "PREFLIGHT FAIL: lane base $base does not descend from the planned sha $planned"; exit 1; }

ver="$(grep -o '"version": "[0-9.]*"' package.json | head -1 | cut -d'"' -f4)"
lowest="$(printf '%s\n2.0.1013\n' "$ver" | sort -V | head -1)"
[ "$lowest" = "2.0.1013" ] || { echo "PREFLIGHT FAIL: version $ver below 2.0.1013"; exit 1; }

[ -x node_modules/.bin/jest ] || { echo "PREFLIGHT FAIL: node_modules missing, run yarn install"; exit 1; }
python3 -c 'import fontTools' 2>/dev/null || { echo "PREFLIGHT FAIL: fontTools missing"; exit 1; }

plan="ai/plans/137-arabic-line-height"
for anchor in "$plan"/scripts/anchors/*; do
  src_name="$(basename "$anchor" | sed 's/\.txt$//' | cut -d- -f1)"
  case "$src_name" in
    typography) src="shared/typography.ts" ;;
    header) src="components/sheets/parts/Header.tsx" ;;
    settings) src="components/sheets/screens/Settings.tsx" ;;
    help) src="components/modals/Help.tsx" ;;
    volumenote) src="components/sheets/parts/VolumeNote.tsx" ;;
    appjson) src="app.json" ;;
    *) echo "PREFLIGHT FAIL: unknown anchor $anchor"; exit 1 ;;
  esac
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$src")"
  [ "$count" = "1" ] || { echo "PREFLIGHT FAIL: anchor $(basename "$anchor") counts $count in $src"; exit 1; }
done

adb_lines="$(adb devices 2>/dev/null | grep -c $'\tdevice$')"
if [ "$adb_lines" -ge 1 ]; then echo "3T: attached"; else echo "WARN no adb device attached: the step 2 dispatch stops until the 3T answers"; fi
if xcrun devicectl list devices 2>/dev/null | grep -qi "connected"; then echo "XS: attached"; else echo "WARN no devicectl phone connected: the step 3 dispatch stops until the XS answers"; fi

echo "PREFLIGHT OK"
