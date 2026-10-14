#!/usr/bin/env bash
# Pre-flight for ticket 76. Run from the worktree root ($HOME/athan-gitree/run-76).
# bash 3.2 compatible. Prints PREFLIGHT OK when every check passes.
set -u

fail=0
say() { printf '%s\n' "$1"; }

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
[ "$branch" = "ticket/76" ] || { say "FAIL: branch is '$branch', expected ticket/76"; fail=1; }

[ -z "$(git status --porcelain)" ] || { say "FAIL: tree is dirty"; git status --porcelain | head -5; fail=1; }

git merge-base --is-ancestor 1b0d5229 HEAD || { say "FAIL: HEAD does not descend from the planned anchor 1b0d5229"; fail=1; }

appver="$(node -e "console.log(require('./app.json').expo.version)" 2>/dev/null)"
pkgver="$(node -e "console.log(require('./package.json').version)" 2>/dev/null)"
[ "$appver" = "2.0.601" ] || { say "FAIL: app.json version is '$appver', expected 2.0.601"; fail=1; }
[ "$pkgver" = "2.0.601" ] || { say "FAIL: package.json version is '$pkgver', expected 2.0.601"; fail=1; }
[ "$appver" = "$pkgver" ] || { say "FAIL: app.json and package.json disagree"; fail=1; }

[ -e node_modules ] || { say "FAIL: node_modules absent; symlink it from the main checkout before any commit"; fail=1; }

root="$(git rev-parse --show-toplevel)"
anchor_dir="$root/ai/plans/76-ar-digits-qibla-copy/scripts/anchors"
check_anchor() {
  name="$1"
  file="$2"
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor_dir/$name" "$root/$file")"
  [ "$count" = "1" ] || { say "FAIL: anchor $name counts $count in $file (must be 1)"; fail=1; }
}

check_anchor qibla-subtitle.txt "components/sheets/screens/Qibla.tsx"
check_anchor qibla-wider-line-test.txt "components/sheets/screens/__tests__/Qibla.test.tsx"
check_anchor explanation-digits.txt "components/prayer/Explanation.tsx"
check_anchor explanation-ar-test.txt "components/prayer/__tests__/Explanation.test.tsx"
check_anchor locale-native-digits.txt "shared/i18n/locale.ts"
check_anchor ar-subtitles.txt "shared/i18n/ar.ts"

[ "$fail" -eq 0 ] && say "PREFLIGHT OK"
exit "$fail"
