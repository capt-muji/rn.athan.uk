# Step 02: put the queue's tickets on one project

Requirements: R2.1, R2.2, R2.3, R2.4, R3.1, R5.1
Weight: 1

## Goal

One project holds the reader's tickets, copied through the product's REST API as throwaway
session work, with statuses and needs mapped onto the product's own fields.

## Branch

`board/144-itsaplan`, the same branch as step 01.

## Files

Read: `board/reader.mjs`, `board/config.json`, `board/state/board.json`.
Written outside the repository tree: `$TMPDIR/itsaplan-import.mjs`, `credentials.txt` and
`cookies.txt` under `$HOME/athan-gitree/sessions/144/`.
No file inside the repository changes in this step.

## Red test

None. The failing state is an empty project, proven by `GET /projects/athan-uk.QUEUE/issues`
answering an empty array before the copy.

## Change contract

`POST /teams` makes `Athan.uk` (slug `athan-uk`) in the instance workspace. `POST /projects`
makes `QUEUE`. The import script posts one issue per emitted ticket with the title
`#<order> <name>`, the description carrying the queue status, the status text and the needs.
the second pass posts one `blocked_by` relation per resolvable `needs` pair. The status mapping
is section 5 of `PLAN.md`.

## Green run

`GET /projects/athan-uk.QUEUE/issues?limit=500` returns 128 issues, 107 on `columnId` 4 and 21
on `columnId` 1, and `psql -tAc "select count(*) from issue_link"` answers 53. The web board renders
the five columns with those counts.

## Break script

`scripts/break-step2.sh`: delete the project through the API and record the board answering an
empty state.

## Version and commit

No version bump rides this step alone. The run's docs commit is 2.0.1093, `docs(plans)`.

## Review

Read the issue list once for a title missing the `#<order>` prefix, and read the project's
column list once for a column the mapping does not name.

## Merge

`git merge --no-ff board/144-itsaplan` after the owner's verdict.

## Done when

`R2.1` through `R2.4` hold, the browser read of `http://localhost:3001/athan-uk.QUEUE` shows the
tickets, and the owner holds the URL.
