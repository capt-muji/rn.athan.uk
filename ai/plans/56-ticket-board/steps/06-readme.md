# Step 06: README and records

Requirements: R1.1 (the vocabulary half), D64
Weight: 1 (docs)

## Anchor check

```bash
bash ai/plans/56-ticket-board/scripts/anchor-check.sh
```

Every anchor count must be 1. Any other count is STOP.

## Goal

The repository README teaches deploy, access, reading and vocabulary, and the repository layout
names `board/`. The job's records land in this plan's LOG.md.

## Branch

```bash
git checkout -b docs/56-06-readme uat
```

## Files

- `README.md`
- this plan folder's `LOG.md` and `PLAN.md` checklist

## Red check

```bash
grep -Fc '## Ticket board' README.md
```

Expected today: 0. Record it.

## Change contract

In `README.md`, directly after the "How work happens here" section's last paragraph (anchor
A5) and before the `## Development` heading, add exactly this section:

```markdown
## Ticket board

The queue also renders as a local web board: read-only, live, one URL.

```bash
cd board && REPO_DIR_IN_DB=$(cd .. && pwd) docker compose up -d
```

Open `http://127.0.0.1:8788`. The board recomputes from committed state every 15 seconds and
pushes updates without a refresh. It reads the repository, git refs, the plan folders and two
machine-local caches (handoff documents and the agent session database); nothing is edited
through it, and it never leaves the machine. The board is derived and disposable: delete
`board/state/` and it rebuilds.

Reading it: a ticket is a queue job, a step is a plan step. Columns follow the queue statuses
(Backlog, Planning, Ready, In progress, Audit, Done, Blocked, Owner-led). The platform pill is
computed from each plan's own file list. The context chip is telemetry from the newest handoff
document, not a gate. `board/config.json` carries the port, host, refresh interval and Done
column size; `yarn validate` never sees this folder.
```

In the Repository layout code block, directly after the `e2e/` line (anchor A6), add exactly
one line:

```
board/       the local ticket board: reader, server, template, compose
```

Then apply this plan's section 8 records text into `LOG.md` with the measured values, and tick
checklist box 6 in PLAN.md.

## Green run

```bash
grep -Fc '## Ticket board' README.md
python3 -m json.tool board/config.json >/dev/null && echo 'config still valid'
```

Expected: 1, `config still valid`. The deploy command in the section is the one step 4 proved:
the executor copies its step 4 green-run output path into LOG.md as the evidence that the
documented command works.

## Break script

Save as `$TMPDIR/break-56-06.sh`, run with `bash`:

```bash
#!/usr/bin/env bash
set -u
cp README.md "$TMPDIR/readme-backup.md"
python3 - <<'EOF'
s = open('README.md').read()
open('README.md','w').write(s.replace('## Ticket board', '## Board of tickets', 1))
EOF
if grep -Fq '## Ticket board' README.md; then echo 'BREAK NOT APPLIED'; cp "$TMPDIR/readme-backup.md" README.md; exit 1; fi
cp "$TMPDIR/readme-backup.md" README.md
grep -Fq '## Ticket board' README.md || { echo 'restore failed'; exit 1; }
echo 'ALL AS EXPECTED: 1'
```

Expected last line: `ALL AS EXPECTED: 1`. `git status --porcelain` then lists only this plan
folder's files and `README.md` as modified by the step itself.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it in
the three files, `app.json` first. Add `README.md` and this plan folder's changed files by
name. Commit message:

```
<VERSION> - docs(board): job 56 step 6, deploy, access, reading the board, vocabulary
```

## Review checklist

- The section sits between "How work happens here" and "Development".
- The layout line matches the block's alignment (name, spaces, description).
- No machine-specific path appears in the README: `REPO_DIR_IN_DB=$(cd .. && pwd)` is dynamic,
  and nothing names a home directory.

## Merge

```bash
git checkout uat && git merge --no-ff docs/56-06-readme -m "Merge docs/56-06-readme into uat: job 56 step 6, README board section"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 6 ticked, records applied to LOG.md, merged. The executor then runs Finishing:
row set EXECUTED, the executed docs commit, merge, no push.
