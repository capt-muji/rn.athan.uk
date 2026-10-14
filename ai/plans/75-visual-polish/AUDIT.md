# Ticket 75 audit

| | |
| --- | --- |
| Range reviewed | `1b0d5229..fc593b9e` (the branch's own commits against its base), `ai/plans` and the two version files excluded from the code diff |
| Code diff | `$TMPDIR/audit-75.diff`, 6 files |
| Plan-conformance reviewer | `ses_ec5ef05a1ffeHcoossoLm0LHCo`, findings `$TMPDIR/findings-plan-75.md` |
| Blind reviewer | `ses_ec5ef059fffesRbbAw7ScdLgVq`, findings `$TMPDIR/findings-blind-75.md` |
| Code fixes | `8abfe75b` (2.0.456) |
| Verdict | PASS |

The reviewers cleared the three rulings' mechanisms: the mirror keys on the locale's own
direction with no bridge-readable value in play (`Masjid.tsx:29,36,49`), the indicator prop
is consumed and turned into an animated prop by `@gorhom/bottom-sheet` 5.2.14 at the pinned
source (`createBottomSheetScrollableComponent.tsx:40,81`), and `COLORS.interactive.inactiveBorder`
has exactly one reader (`Toggle.tsx:83`), so the on-state, the travel and the thumb position
are untouched. In all six touched paths `origin/uat`'s version equals the branch's base
version (`git diff --quiet 1b0d5229:<path> origin/uat:<path>`), so the merge carries no
conflict.

## Findings and verdicts

| # | Reviewer | Finding | Verdict |
| --- | --- | --- | --- |
| P1 | plan-conformance | `Toggle.test.tsx:92` asserts the on-state border against `COLORS.interactive.activeBorder`, the constant the component reads, so it cannot fail for any value of that key; the plan's R3.2 names the literal `#672bcf` | CONFIRMED, fixed at 2.0.456 |
| P2 | plan-conformance | `547d36e6` (the step-03 ledger commit) carries no version bump, against D75.5's "every commit bumps" | CONFIRMED as a deviation, accepted and recorded: the ledger commit shares 2.0.454 with `aee3ec7a` by an explicit decision (`LOG.md:193-196`); rewriting it would rehash the commits `LOG.md` cites for a docs-only change that ships no byte |
| P3 | plan-conformance | `Masjid.test.tsx:80` (the Ramadan variant) asserted only the transform, identical to the standard-variant case above it, so R1.3 was unproven | CONFIRMED, fixed at 2.0.456 |
| P4 | plan-conformance | The net `app.json` diff rewrites escapes and reformats arrays, past D75.5's "bump" | CONFIRMED as recorded: `jq -S` proves the file semantically identical to `1b0d5229` modulo the version, and `LOG.md:104-109` records the biome canonicalisation; accepted, no change |
| P5 | plan-conformance | `PLAN.md:225-227` leaves steps 1 to 3 unticked while `LOG.md` marks them done; the step-file tails name the pre-repair ladder | CONFIRMED, checklist fixed in this commit; the tails (`steps/3-toggle-outline.md:124`, `steps/4-simulator-proof.md:104`) are the repair commit `ba69a5d7`'s own record of the shifted ladder and stand |
| P6 | plan-conformance | The step-4 positional read ("the mark on the left, its face turned inwards") was not met on the simulator, and the plan's iPhone XS fallback was ruled out | CONFIRMED as already recorded (`LOG.md:308-331`): the position is not this ticket's ground and is the owner's own recorded observation, the mirror verdict is a genuine crop read, the scrollbar verdict a genuine two-frame read. No change |
| P7 | plan-conformance | The step-4 record commit message differs from the plan's prescribed text | CONFIRMED, recorded here: the prescribed message names a proof the simulator could not give, so the adjudicated wording replaced it |
| P8 | plan-conformance | `PLAN.md:109` says the three modal scrollers hide their indicator "with tests pinning each", contradicting `PLAN.md:178-180` (only WhatsNew and Update pin the prop; Help pins its height) | CONFIRMED, fixed in this commit |
| B1 | blind | `Masjid.tsx:28` cites queue rows 73 and 78 in the comment | REJECTED: the identical citation style ships at `Toggle.tsx:28-31` and `SegmentedControl.tsx:124-127` for the same rule, and `PLAN.md:295-299` keeps the row 73 link deliberately; consistency with the two shipped twins wins |
| B2 | blind | Duplicate of P1 | Fixed at 2.0.456 (P1) |
| B3 | blind | `Sheet.test.tsx:108` walks `.props` off a possibly-empty array, throwing instead of failing on the value | CONFIRMED, fixed at 2.0.456 (optional chaining, the `Update.test.tsx:44` idiom) |
| B4 | blind | `Masjid.tsx:48` `icon: {}` is an empty style entry | REJECTED: the key is read at `Masjid.tsx:36` in the `Image` style array, so it is live and only its value is empty; it predates this ticket and sits outside the three rulings |
| A1 | lead (repository reconciliation) | `LOG.md:136-137` records step 02's commit as `035fe4df`, but the branch carries `5b566475` (the amend that folded the ledger into the step commit; `git reflog`) | CONFIRMED, fixed in this commit: the sha and the two gate-run references repointed to `5b566475` |

Red-first proofs for the two strengthened claims (both reverted after):

- P1: `activeBorder` set to `#000000` turned `keeps its on state border unchanged` red
  (`- Expected borderColor: "#672bcf"`, `+ Received borderColor: "#000000"`); the pre-fix
  assertion passed under the same mutation.
- P3: the variant forced to `standard` turned the Ramadan case red on the new source
  assertion (`Expected source masjid-ramadan.png`, `Received .../masjid.png`).

## The step-4 referral to ticket 80's lane

The referral does not stand. Ticket 80 landed (merge `5efa8f94`, 2.0.700; its DONE cell on
`uat` states the layout direction now reads the app locale at the React tree's root and the
picker modal's host), the root key landing at `f4363882` (2.0.405), with the Qibla wave's own
re-key at `88caba8d` (2.0.407). That root `direction` key is exactly the ground the step-4
stop could not observe on the branch's 2.0.402 base: the tree now lays out the selected
language's direction on every launch state, so under `ar` the mark sits on the left and the
landed mirror turns its face inwards. Nothing in ticket 75 needs a change for it.

## Gate

`yarn validate` on the code-fix head: tsc clean, biome clean, 211 suites, 5577 passed,
1 skipped, coverage 100 percent on statements, branches, functions and lines.
