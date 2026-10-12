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
