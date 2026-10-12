# Ticket 59: Prayer names: shortest context-sufficient forms in every language

## Planning (2026-10-12)

Opened under the owner's autonomous instruction (clear the queue except rows 25
and 69; new findings become backlog rows; no questions). D81 and the D42
superseded shape are recorded in PLAN.md section 2. The sourced glossary was
found at `shared/i18n/sourced-names.json` (the queue row's
`research/prayer-names.json` no longer exists; the gates read the committed
copy), ms and hi sourced, th null.

Scratch-worktree proof (deleted): the three strings alone break the two
glossary-gate rows (ms, hi); i18nRuntime.test.ts:23 and the width-measurement
suite's getByText also pin the old th label (grill round one finding); the width
renames break exactly the two suites' imports and their measurement cases;
Biome clean on the changed sources. Anchors at `d6ca9ade`, all nine counting 1.
Gate: `PLAN OK`.

## Owner input (2026-10-12, in session)

The owner flagged so Midnight: the catalog reads `Habeennimo dhexe`, which
renders as "middle of the night" in her check — the exact sentence-in-a-column
defect this ticket targets, the same class as the ms Midnight D81 ruled on.
The glossary agrees it was never attested: `shared/i18n/sourced-names.json`
holds it at confidence `low`, source `null`, note "Ordinary Somali for
midnight is hora hose/habeen dhexe. Not attested in an Islamic-time table.
Needs a speaker." She proposes the Google Translate output `saqbadh`.

Supersedes D81's "every other name already-shortest" for this one string; the
plan's scope widens from three target strings to four at the resume. The
exact form stays open: a one-word machine output is not attestation (the
glossary exists because machine Somali was not trusted for names; `saq` is
the Somali dead-of-night word, so the compound behind Google's mash is
plausibly `Saqdhexe`/`saq dhexe`, unverified). The resuming planner sources
one candidate (a Somali prayer table or speaker attestation), records it as
the next D-number with her wording if she rules the spelling herself, and the
owner vetoes the final string table at audit per the D81-amended D42 process.
Her word on a spelling she has seen used settles it verbatim.

## Planning (2026-10-12, resume)

Resumed under the owner's instruction to plan the independent queue while she
is away, no questions. D83 taken: so Midnight reads `Saqda dhexe`, the phrase
behind her Google candidate, spelled in full, sourced from the en-so
dictionary's primary midnight pair (opentran) and carried in Somali religious
prose and news (Ramadan tahajjud contexts); no Islamic-time table prints any
midnight label, matching the glossary's "needs a speaker" note. The value
rides her audit veto beside the D81 three.

Two gaps the widening exposed, both closed in the plan: the anchors were
re-verified and the preflight re-run at `d7d95b2f` (tickets 63 and 67's docs
had landed since `d6ca9ade`; all nine original anchors plus the new
`so-midnight` anchor count 1), and the dist round-trip files carry the old
values today (`i18nBridge.test.ts` pins them only under
`I18N_BRIDGE=import I18N_LOCALE=<loc>`, which the default suite never runs —
the three-string proof passed without touching dist, a latent gap now closed
for all four locales: step 1 edits the four dist lines and proves each with
its own import run, R2.2).

Grill round one (two findings, both applied): the dist contract was
hand-edits of four prayer lines, but the griller ran step 1's own green-run
command at `d7d95b2f` and it failed — row 63's D76 reminder copy reached the
six catalogs and no dist file, so the round-trip fails on keys outside the
planned edits; step 1 now regenerates all six dist files through the bridge
export after the catalog edits (predicted diff: four prayer lines plus the
six files' two reminder keys each) and proves each with its own import run,
keeping R2.2 true as written. Second: step 2's seed-loop removal orphans the
`database` named import in `stores/ui.ts`, which fails Biome under
`--error-on-warnings`; contract 1 now narrows the import to `clearPrefix`.
Gate after both: `PLAN OK`.

### Step 1 — STOP (dist round-trip files are gitignored, the commit contract cannot land)

Preflight `PREFLIGHT OK` on uat at `61fb7675`; the four step-1 anchors
(`ms-lastthird`, `hi-midnight`, `th-lastthird`, `so-midnight`) each counted 1.
Branch `feat/59-short-names` cut from uat. Red: the D81/D83 pin added verbatim
inside `describe('the landed catalogs against the R2 gates')` failed exactly as
predicted (`Expected: "Sepertiga malam"`, `Received: "Sepertiga akhir malam"`,
46 passed). Change contracts 1 and 2 landed (four catalog values, two glossary
texts, the so Midnight sourced entry, the `opentran-so-dictionary` slug beside
`apple-so`), plus the two th suite pins; all six bridge exports exited 0 and
rewrote the on-disk dist files. The green run was NOT started: the stop below
was found first, and the 23:45 no-build window had passed.

The stop: the six `shared/i18n/dist/*.json` round-trip files are gitignored
local artifacts, not tracked anywhere in the repository's history, so step 1's
commit contract and review checklist cannot be executed as written.

- `.gitignore:4` is `dist`; `git check-ignore -v shared/i18n/dist/ms.json`
  resolves to it.
- `git ls-files shared/i18n/` lists 14 files, none under `dist/`;
  `git ls-files | grep -c dist` prints 0.
- `git log --all --oneline -- 'shared/i18n/dist/*'` prints nothing: never
  committed on any branch.
- `git show d7d95b2f:shared/i18n/dist/en.json` fails with "exists on disk, but
  not in 'd7d95b2f'", so there is no tracked old version to diff against.
- The contract-3 predicted diff `git diff d7d95b2f -- shared/i18n/dist/`
  (expected: touches exactly the six files) printed nothing.
- Consequences: "Add the fourteen files ... by name" is impossible for six of
  the fourteen (`git add` refuses an ignored path without `-f`, and force-adding
  would change repo policy the plan does not give); the review item
  `git diff d7d95b2f -- shared/i18n/dist/ | grep -c '^-  "'` cannot print 16
  because the files are absent from the base sha (even force-tracked, they
  would diff as additions, not changes).

The question for the lead: restate step 1 to (a) drop the six dist files from
the commit set and prove R2.2 by the six on-disk import runs alone (the bridge
regeneration stays as a working-tree step, evidence in the export logs), or
(b) decide the dist files become tracked (force-add, a repo-policy change the
plan must spell out). R2.2 is provable either way; only the commit list and
the diff-count review item are broken.

State on return: all eight tracked step-1 files reverted, branch
`feat/59-short-names` deleted (no commits), tree clean. The six on-disk dist
files hold the regenerated catalogs (the old bytes were never in git and cannot
be restored; they are ignored artifacts and any replan regenerates them).
Work saved to `$HOME/athan-gitree/sessions/59-exec/step1-unfinished.patch`
(141 lines), `step1-unfinished-status.txt`, `export-ms.log`. No version lock
was taken. Step 2 untouched.

session: ses_ecdaec13dffeSXcjEbzah7hzGt

## Planner ruling on the step-1 STOP (2026-10-12, the lead under the owner's no-questions instruction)

Option (a): the six dist files leave the commit set and R2.2 is proven by
the six on-disk import runs. The repo's own policy already ruled dist a
local artifact (`.gitignore:4`, `dist`; never tracked at any sha), the same
standing as `android/app/build.gradle`; force-tracking six generated JSONs
would be a policy change nobody asked for. Step 1's files list, contract 3,
review checklist and commit add list carry the repair; the regeneration
commands stand unchanged. The executor resumes from its saved work at
`~/athan-gitree/sessions/59-exec/`.
