#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../../../.." || exit 1
python3 - <<'EOF'
path = 'shared/i18n/en.ts'
text = open(path).read()
old = "'notification.reminder': '{name} in {n}',"
new = "'notification.reminder': '{name} in {n}m',"
if text.count(old) != 1:
    print(f"BREAK NOT APPLIED: {old!r} counts {text.count(old)}")
    raise SystemExit(1)
open(path, 'w').write(text.replace(old, new))
EOF
[ $? -ne 0 ] && exit 1
if npx jest shared/__tests__/i18nBridge.test.ts shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break-88-2.log 2>&1; then
  echo "BREAK NOT CAUGHT: the title tests passed with the m restored"
  git checkout -- shared/i18n/en.ts
  exit 1
fi
echo "break en-title: tests red as expected"
git checkout -- shared/i18n/en.ts
echo "ALL ASPECTED: 1"
