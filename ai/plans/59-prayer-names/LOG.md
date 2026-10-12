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
