# Step 01: pin the LOG.md ledger contract

Requirements: R8.1
Weight: 1 (docs)

## Anchor check

```bash
bash ai/plans/56-ticket-board/scripts/anchor-check.sh
```

Every anchor count must be 1. Any other count is STOP.

## Goal

The reader (step 3) parses `### Step <NN> — ` headings and `session: ses_…` lines from
`LOG.md`. Today those shapes are habit, not contract. This step pins them in the two files that
define what an executor writes, so the board reads a contract.

## Branch

```bash
git checkout -b docs/56-01-log-contract uat
```

## Files

- `ai/plans/TEMPLATE.md`
- `.opencode/agents/athan-executor.md`

## Red check

```bash
grep -Fc '### Step <NN> — ' ai/plans/TEMPLATE.md .opencode/agents/athan-executor.md
```

Both print 0 today (no file carries the contract shape). Record both zeros. Anything else is
STOP.

## Change contract

In `ai/plans/TEMPLATE.md`, in the "Sections, in order" bullet list, directly after the bullet
8 line ending `lead applies on DONE, the docs commit message.` and before the
`- **9. Push.**` bullet, add exactly one bullet:

```markdown
- **LOG.md ledger contract** (job 56): every step entry in `LOG.md` opens with the heading
  `### Step <NN> — <state>` and ends with a line `session: <ses_id>`. Planning sections use
  `## Planning (<date>)` and `## Job <N>`.
```

In `.opencode/agents/athan-executor.md`, in the Ledger section, append to the end of the
paragraph that names what each entry records (the paragraph ending "respawns you from that
note.") exactly one sentence:

```markdown
Every step entry opens with the heading `### Step <NN> — <state>` and ends with the
`session: <ses_id>` line; the ticket board parses both.
```

Nothing else in either file changes.

## Green run

```bash
grep -Fc '### Step <NN> — ' ai/plans/TEMPLATE.md .opencode/agents/athan-executor.md
```

Both print 1. `bash scripts/check-plan.sh ai/plans/56-ticket-board` still prints `PLAN OK` on
this plan (it must not regress on the edited TEMPLATE).

## Break script

Save as `$TMPDIR/break-56-01.sh`, run with `bash`:

```bash
#!/usr/bin/env bash
set -u
cp .opencode/agents/athan-executor.md "$TMPDIR/exec-backup.md"
sed -i '' 's/Every step entry opens with the heading/Every step entry begins with the heading/' .opencode/agents/athan-executor.md
if grep -Fqc 'opens with the heading' .opencode/agents/athan-executor.md; then
  echo 'BREAK NOT APPLIED'; cp "$TMPDIR/exec-backup.md" .opencode/agents/athan-executor.md; exit 1
fi
cp "$TMPDIR/exec-backup.md" .opencode/agents/athan-executor.md
grep -Fqc 'opens with the heading' .opencode/agents/athan-executor.md
echo 'ALL AS EXPECTED: 1'
```

Expected last line: `ALL AS EXPECTED: 1`. `git status --porcelain` then lists only this plan
folder's files.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it in
`app.json`, `package.json`, `android/app/build.gradle` (`versionName`), `app.json` first. Add
the two files by name plus this plan folder's changed files. Commit message:

```
<VERSION> - docs(workflow): pin the LOG.md ledger contract the ticket board parses (job 56 step 1)
```

## Review checklist

- The heading shape in both files is byte-identical (`### Step <NN> — ` with an em dash).
- No other sentence in either file changed.
- This plan's own LOG.md entries already follow the shape (they do; the Planning section in
  section 8 of PLAN.md uses `## Planning (2026-10-12)`).

## Merge

```bash
git checkout uat && git merge --no-ff docs/56-01-log-contract -m "Merge docs/56-01-log-contract into uat: job 56 step 1, LOG contract pinned"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 1 ticked in this plan's PLAN.md, LOG.md entry appended per the now-pinned
contract (heading `### Step 01 — <state> (date, executor session)`, final line
`session: <ses_id>`), merged.
