#!/usr/bin/env bash
# Break script for step 3: the tightened live assertion must be the half that catches a suffix.
# RED here is inverted on purpose: a successful break means the loosened suite STOPS
# catching the suffix (exits 0), which is the mutation proving the live assertion load-bearing.
set -u
suite=shared/__tests__/versionLockstep.test.ts
cp "$suite" /tmp/138-lockstep.bak
cp app.json /tmp/138-appjson.bak
cp package.json /tmp/138-pkgjson.bak

# Loosen the tightened regex back to the old loose one: the mutation under test.
# quotemeta over q{} holds the literal verbatim: a bare $/ inside \Q..\E
# interpolates perl's record separator and the pattern can never match.
perl -0pi -e 'my $p = quotemeta q{/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/}; s{$p}{/\\d+\\.\\d+\\.\\d+/}' "$suite"
if cmp -s "$suite" /tmp/138-lockstep.bak; then
  echo "BREAK LOCKSTEP COULD NOT MUTATE (perl matched nothing)"
  exit 1
fi

# Suffixed version in the tree, lockstep-equal in both files.
node -e "
const fs = require('fs');
const j = JSON.parse(fs.readFileSync('app.json', 'utf8')); j.expo.version = '2.0.1058-rc1'; fs.writeFileSync('app.json', JSON.stringify(j, null, 2) + '\n');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8')); p.version = '2.0.1058-rc1'; fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

npx jest "$suite" --watchman=false >/tmp/138-break-lockstep.txt 2>&1
status=$?
if [ $status -eq 0 ]; then
  echo "BREAK LOCKSTEP RED (loosened assertion let the suffix through)"
else
  echo "BREAK LOCKSTEP FAILED TO REDDEN (suite exit $status - the loosened assertion still caught the suffix; mutation not load-bearing)"
  cp /tmp/138-lockstep.bak "$suite"; cp /tmp/138-appjson.bak app.json; cp /tmp/138-pkgjson.bak package.json
  exit 1
fi

# Restore EVERYTHING before the green re-run: the tightened suite must pass on the clean tree.
cp /tmp/138-lockstep.bak "$suite"
cp /tmp/138-appjson.bak app.json
cp /tmp/138-pkgjson.bak package.json
npx jest "$suite" --watchman=false >>/tmp/138-break-lockstep.txt 2>&1
if [ $? -eq 0 ]; then
  echo "BREAK LOCKSTEP GREEN"
else
  echo "BREAK LOCKSTEP GREEN FAILED"
  exit 1
fi
git checkout -- app.json package.json 2>/dev/null
echo "BREAK OK"
echo "ALL AS EXPECTED: 1"
