#!/usr/bin/env bash
# Break script for step 2: the strictness of the merge compare must be load-bearing.
set -u
target=scripts/check-version-discipline.js
cp "$target" /tmp/138-mergegate.bak
perl -0pi -e 's/incomingTotal > headTotal/incomingTotal >= headTotal/g; s/incoming\.major > head\.major/incoming.major >= head.major/g' "$target"
if cmp -s "$target" /tmp/138-mergegate.bak; then
  echo "BREAK MERGE COULD NOT MUTATE (perl matched nothing - the pinned names are absent)"
  cp /tmp/138-mergegate.bak "$target"
  exit 1
fi
npx jest scripts/__tests__/checkVersionDiscipline.test.ts --watchman=false -t 'equal incoming version fails' >/tmp/138-break-merge.txt 2>&1
if [ $? -ne 0 ]; then
  echo "BREAK MERGE RED"
else
  echo "BREAK MERGE FAILED TO REDDEN (>= still refused the equal merge - mutation not load-bearing)"
  cp /tmp/138-mergegate.bak "$target"
  exit 1
fi
cp /tmp/138-mergegate.bak "$target"
npx jest scripts/__tests__/checkVersionDiscipline.test.ts --watchman=false >>/tmp/138-break-merge.txt 2>&1
if [ $? -eq 0 ]; then
  echo "BREAK MERGE GREEN"
else
  echo "BREAK MERGE GREEN FAILED"
  exit 1
fi
echo "BREAK OK"
echo "ALL AS EXPECTED: 1"
