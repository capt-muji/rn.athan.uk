#!/usr/bin/env bash
# Pre-flight for ticket 88. Run from the repository root of the lane worktree
# ($HOME/athan-gitree/lanes/88) after saving this copy to $TMPDIR.
# Checks the lane checkout, a clean tree, uat contained in HEAD, the version
# floor, the needs-first ticket, and every anchor count. Ends PREFLIGHT OK.
set -u

ROOT="$(pwd)"
FOLDER="$ROOT/ai/plans/88-latin-numerals"
fail=0

say() { printf '%s\n' "$1"; }
bad() { say "PREFLIGHT FAILED: $1"; fail=1; }

# 1. The lane checkout.
branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "lane/88" ] && [ "$branch" != "uat" ]; then
  bad "HEAD is on '$branch', expected lane/88 (or uat after the merge window)"
fi

# 2. A clean tree: only the queue and this plan folder may be dirty.
status="$(git status --porcelain)"
dirty="$(printf '%s' "$status" | grep -v '^?? ai/plans/88-latin-numerals/' | grep -v 'ai/plans/README.md' || true)"
if [ -n "$dirty" ]; then
  bad "unexpected dirty files: $dirty"
fi

# 3. uat is contained in HEAD (the lane carries everything uat carries).
if ! git merge-base --is-ancestor uat HEAD; then
  bad "HEAD does not contain uat; rebase or re-plan"
fi

# 4. The version floor: not lower than the Planned at version 2.0.740.
version="$(python3 -c "import json;print(json.load(open('$ROOT/package.json'))['version'])")"
python3 - "$version" <<'EOF' || bad "package.json version $version is lower than 2.0.740"
import sys
ok = tuple(int(p) for p in sys.argv[1].split('.')) >= (2, 0, 740)
sys.exit(0 if ok else 1)
EOF

# 5. Needs first: row 85 DONE.
grep -q '^| 85 |.*| DONE' "$ROOT/ai/plans/README.md" || bad "row 85 is not DONE"

# 6. Every anchor counts exactly 1 against its source at HEAD.
check_anchor() {
  anchor="$FOLDER/scripts/anchors/$1.md"
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$ROOT/$2")"
  if [ "$count" != "1" ]; then
    bad "anchor $1 counts $count in $2 (expected 1)"
  fi
}
check_anchor a01-locale-native-digits shared/i18n/locale.ts
check_anchor a02-time-gregorian shared/time.ts
check_anchor a03-time-hijri shared/time.ts
check_anchor a04-help-sites components/modals/Help.tsx
check_anchor a05-explanation-site components/prayer/Explanation.tsx
check_anchor a06-stepper-value components/sheets/parts/Stepper.tsx
check_anchor a07-en-reminder shared/i18n/en.ts
check_anchor a08-typography-comment shared/typography.ts
check_anchor a09-datetest-ar shared/__tests__/dateLocalized.test.ts
check_anchor a10-exptest-ar components/prayer/__tests__/Explanation.test.tsx
check_anchor a11-bridge-reminder shared/__tests__/i18nBridge.test.ts
check_anchor a12-notif-title shared/__tests__/notifications.test.ts
check_anchor a13-localetest-map shared/__tests__/locale.test.ts

if [ "$fail" -eq 0 ]; then
  say "PREFLIGHT OK"
  exit 0
fi
exit 1
