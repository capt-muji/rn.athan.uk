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
