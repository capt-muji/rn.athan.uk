# Ticket 64: Volume-source copy: alert and sound sheets plus a help question

## Planning (2026-10-13)

Opened under the owner's clear-the-board instruction (full workflow, no
questions). The 2026-10-13 explore fact pack mapped the two sheets, the Help
modal and its platform-split machinery, the six catalogs, every gate a new
key passes, the prior copy tickets' one-commit shape, and row 27's measured
alarm-stream evidence.

The iOS path was verified against Apple's documentation before the copy was
drafted: a standard notification sound plays at the Ringer & Alerts volume,
and Silent mode does not play alerts or other sound effects
(support.apple.com, Silence iPhone). D64.4 and D64.5 record it.

Drafted: one code step (weight 2, no device step) carrying a five-key copy
set in six languages, the reworded help question with both platform answers,
and the two sheet insert points. Grill round one (fifteen findings: three
must, six should, six nice) applied: the help answers drop the `steps` member
(`[]` fails the length gate and renders an empty fix block), the criteria's
key names corrected to `volume.note.*`, the commit add list completed for the
changed-coverage hook, the gate descriptions corrected (the alert-word gate
reads en help entries alone; the translated-length gate is conjunctive), the
two sheet suites each gain both ternary branches for 100% branch coverage,
the Alert insert point pinned inside `AlertSheetBody`, the restore list
widened, row 27's claim narrowed to the ringer switch, the predicted red
failure quoted as the real TypeError, the preflight's upstream check
direction corrected, and the four citation ranges fixed.

Carried for later: `ai/plans/68-rtl-flip/scripts/preflight-68.sh:15` holds the
same inverted `origin/uat..uat` check (inherited); fix it before 68's step 2
dispatch, because step 1's unpushed merge would read as "origin/uat not
merged in".

Grill round two (seven findings: two must, three should, two nice), all
applied: the red-run expectation now says the catalog gates pass until the en
edit lands ahead of the translations (they were claimed red before the en
change existed); the break script's substitution was verified correct as
written (the round-two reader saw a stale form); R4.1 became a diff
criterion (no style entry added, no line outside the listed files plus the
Help copy) with the Goal aligned; the help answers keep the plain "ringer
volume" phrase by rule (D64.8: the en help gate bans the word "alert", so
the setting's full name lives in the sheet note alone) and the anticipated
review fix was repointed accordingly; the Somali `volume.note.ios` typo
("aaa") fixed to "ayaa"; the missing-key TypeError citation moved to
`shared/i18n/index.ts:42`; and the en-length gate's wording tightened to
"in en". The 68 preflight fix above was applied and pushed as 2.0.152 before
68's step 2 dispatch.

## Planning (2026-10-13)

Replan round one, from the executor's stop mid-step-1. The step's own
contracts left `getHelpTopics`'s null-answer drop (`shared/help.ts:144`)
with no test: the old quiet entry's `ios: null` was the catalog's only null
and the only exercise that branch had, so the pre-commit coverage gate
refused the commit at 99.98% statements / 99.95% branches, one statement and
one branch short. Verified from the code: `HELP_ENTRIES` is module-internal,
no test can inject a null entry, and deleting the guard lies outside the
step's contracts as written. Ruled D64.9: step 1 deletes the dead guard and
the `ios`/`android` `| null` union from `HelpEntryKeys`; the platform split
machinery and `HelpTopic` stand unchanged. Nothing was committed; `uat`
stayed clean at `9f27e2dd` (2.0.174), and the executor's verified work
survives as `~/athan-gitree/sessions/64/step1-unfinished.patch` (red, green
and break all proven). Execution resumes from the patch plus this amendment.

### Step 01 — done

Resumed on `feat/64-volume-copy` off uat (`8d417e81`, 2.0.175) from the
verified patch: preflight `PREFLIGHT OK` (all four anchors counting 1), the
patch applied 3-way with no conflict. The patch's 2.0.175 was already taken
by the replan commit, so the version re-taken at 2.0.176 in `app.json`,
`package.json` and the gradle `versionName` under the version lock (origin
at 2.0.174). Amendment D64.9 applied on top: the `if (!answer) return [];`
drop and the `ios`/`android` `| null` union deleted from `shared/help.ts`.
`yarn i18n:lock` re-run produced no diff (the patch's lock already current);
the six gitignored dist exports refreshed.

Green: unit 5 suites / 84 tests pass, components 4 suites / 78 tests pass,
`npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
`scripts/break-step1.sh`: `caught: the reworded question assertion fails`,
`ALL AS EXPECTED: 1`; porcelain after held only this step's files, the
version files and the plan files.

Review, cold against `git show`: the five keys carry the plan's bytes in all
six catalogs (en checked against the table, ar and ms spot-checked exact;
`PINNED_LITERALS`, the gates and the lock prove the rest), the three old
keys are gone everywhere, no `| null` residue in `help.ts`, both sheets
choose their key by `Platform.OS` in the existing `cardHint` style with no
style entry added and no other line moved. No lifecycle, thread or residue
finding. Clean read; one pre-review fix: the commit message's version prefix
read the previous executor's stale `$TMPDIR` message file (2.0.175) and was
amended to 2.0.176, hook re-passing both times.

Committed `7c01e5c6` (2.0.176, 18 files, +130/-47), merged `--no-ff` as
`10f6d9d9`; the lock released after the merge. Hook: Test Suites 208 passed
/ 208 total, `Tests: 5500 passed, 5500 total`, and the four coverage lines
at 100% (statements 5202/5202, branches 2243/2243, functions 1082/1082,
lines 4660/4660) — the gate that refused the first pass now passes.

This entry carries the shas the merge created. Landed by the follow-up
session, which re-verified the merged bytes cold: the green run re-run
(84/84 unit, 78/78 components, `tsc` and `biome` exit 0), the break script
re-run ending `ALL AS EXPECTED: 1`, and this ledger committed as the step-1
docs commit at 2.0.177.

session: ses_ecc8ac4a1ffefEkY1lCGr3M77p
