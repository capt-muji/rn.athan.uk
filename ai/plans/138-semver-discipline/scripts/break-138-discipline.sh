#!/usr/bin/env bash
# Break script for step 1: the feat check must be load-bearing.
set -u
target=scripts/check-version-discipline.js
cp "$target" /tmp/138-discipline.bak
sed -i '' "s|const type = |const type = ''; const brokenType = |" "$target"
if cmp -s "$target" /tmp/138-discipline.bak; then
  echo "BREAK DISCIPLINE COULD NOT MUTATE (sed matched nothing - the pinned declaration is absent)"
  exit 1
fi
npx jest scripts/__tests__/checkVersionDiscipline.test.ts --watchman=false -t 'feat subject with a patch delta fails' >/tmp/138-break-out.txt 2>&1
if [ $? -ne 0 ]; then
  echo "BREAK DISCIPLINE RED"
else
  echo "BREAK DISCIPLINE FAILED TO REDDEN (blanked type still refused the patch - mutation not load-bearing)"
  cp /tmp/138-discipline.bak "$target"
  exit 1
fi
cp /tmp/138-discipline.bak "$target"
npx jest scripts/__tests__/checkVersionDiscipline.test.ts --watchman=false >>/tmp/138-break-out.txt 2>&1
if [ $? -eq 0 ]; then
  echo "BREAK DISCIPLINE GREEN"
else
  echo "BREAK DISCIPLINE GREEN FAILED"
  exit 1
fi
echo "BREAK OK"
echo "ALL AS EXPECTED: 1"
