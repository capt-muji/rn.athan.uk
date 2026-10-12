# Step 02: board scaffold and gate exemptions

Requirements: R7.1, R7.2
Weight: 2 (code)

## Anchor check

```bash
bash ai/plans/56-ticket-board/scripts/anchor-check.sh
```

Every anchor count must be 1. Any other count is STOP.

## Goal

`board/` exists with its committed config, and the three validate gates can never see board
code: the coverage gate gains the UNMEASURED entry, biome excludes the folder. This makes the
owner's "yarn validate gates nothing" ruling mechanically true.

## Branch

```bash
git checkout -b feat/56-02-board-scaffold uat
```

## Files

- `board/config.json` (new)
- `scripts/check-changed-coverage.js`
- `biome.json`

## Red check

```bash
yarn validate >/dev/null 2>&1; echo "validate exit: $?"
mkdir -p board
printf 'const x=1\n' > board/probe.mjs
git add board/probe.mjs
node scripts/check-changed-coverage.js --staged; echo "gate exit: $?"
npx biome check --error-on-warnings board/probe.mjs >/dev/null 2>&1; echo "biome exit: $?"
git restore --staged board/probe.mjs
rm board/probe.mjs
rmdir board 2>/dev/null || true
```

Expected today: validate exit 0 (it also refreshes `coverage/coverage-summary.json`, which the
gate refuses to run without), the gate exits 1 naming `board/probe.mjs: not measured`, biome
exits nonzero on the unformatted probe. Record all three. Then the probe and the empty
`board/` are gone. If the gate or biome exits 0 today, STOP: the exemption would be
unprovable.

## Change contract

`board/config.json`, exactly these bytes:

```json
{
  "port": 8788,
  "host": "127.0.0.1",
  "reconcileMs": 15000,
  "doneColumnCount": 5
}
```

In `scripts/check-changed-coverage.js`, inside the UNMEASURED list, directly after the
`ai/plans/` entry, add exactly:

```javascript
  {
    path: 'board/',
    reason:
      'local-only ticket board generator and server, never imported by the app; proven by running it against this repository, per the ruling that yarn validate gates nothing',
  },
```

In `biome.json`, in `files.includes`, as the last entry of the list, directly after the
`!**/ai/features/global-prayer-times/data` line, add exactly:

```json
      "!**/board",
```

Nothing else changes in either file.

## Green run

```bash
yarn validate >/dev/null 2>&1; echo "validate exit: $?"
git add board/config.json scripts/check-changed-coverage.js biome.json
printf 'const x=1\n' > board/probe.mjs
git add board/probe.mjs
node scripts/check-changed-coverage.js --staged; echo "gate exit: $?"
npx biome check . --error-on-warnings >/dev/null 2>&1; echo "biome exit: $?"
git restore --staged board/probe.mjs
rm board/probe.mjs
```

Expected: validate exit 0 (it also refreshes the coverage summary the gate reads), gate exit 0
(the probe sits under the UNMEASURED entry and the step's own edits are staged), biome exit 0
(the excluded folder cannot fail it even with the unformatted probe present). Record all
three. The three step files stay staged for the commit.

## Break script

Save as `$TMPDIR/break-56-02.sh`, run with `bash`:

```bash
#!/usr/bin/env bash
set -u
yarn validate >/dev/null 2>&1 || { echo 'validate failed'; exit 1; }
cp scripts/check-changed-coverage.js "$TMPDIR/cc-backup.js"
python3 - <<'EOF'
p='scripts/check-changed-coverage.js'
s=open(p).read()
s=s.replace("  {\n    path: 'board/',","  {\n    path: 'board-gone/',",1)
open(p,'w').write(s)
EOF
git add scripts/check-changed-coverage.js
printf 'const x=1\n' > board/probe.mjs
git add board/probe.mjs
node scripts/check-changed-coverage.js --staged >/dev/null 2>&1
code=$?
git restore --staged board/probe.mjs
rm board/probe.mjs
cp "$TMPDIR/cc-backup.js" scripts/check-changed-coverage.js
git add scripts/check-changed-coverage.js
if [ "$code" -eq 0 ]; then echo 'BREAK NOT APPLIED'; exit 1; fi
if [ "$code" -ne 1 ]; then echo "unexpected gate exit $code"; exit 1; fi
echo 'ALL AS EXPECTED: 1'
```

Expected last line: `ALL AS EXPECTED: 1`. `git status --porcelain` then lists only this plan
folder's files.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it in
the three files, `app.json` first. Add the three files by name plus this plan folder's changed
files. Commit message:

```
<VERSION> - feat(board): board/config.json scaffold, board code outside the validate gates (job 56 step 2)
```

## Review checklist

- The UNMEASURED entry's reason line is one string, no template literals, matching the file's
  neighbouring style.
- `biome.json` is still valid JSON (`python3 -m json.tool biome.json` exits 0).
- `config.json` is byte-identical to the contract.

## Merge

```bash
git checkout uat && git merge --no-ff feat/56-02-board-scaffold -m "Merge feat/56-02-board-scaffold into uat: job 56 step 2, board scaffold and gate exemptions"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 2 ticked, LOG.md entry appended, merged, probe file absent from the tree and the
commit.
