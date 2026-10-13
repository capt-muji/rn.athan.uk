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
