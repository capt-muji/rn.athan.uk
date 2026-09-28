# The plan's shape, before it is written

This is the working outline for `PLAN.md`. It exists so the plan is designed before it is drafted,
and so a session picking this up after a context loss knows what remains.

`PLAN.md` itself follows `ai/plans/TEMPLATE.md` exactly. This file is scaffolding and is deleted
when `PLAN.md` is complete.

## What this row is, after the research

Row 39 as queued was "the translation sweep: RTL, the real catalogs, and the language switcher".
The research moves work in both directions:

- **Out of 39, into 38:** the identifier split, the `t()` scaffolding, the string migration, the
  pseudolocale guard, the per-locale width cache and the bidi helper. `SPLIT.md` gives the reasons.
- **Into 39, newly discovered:** the two-setting model, the width budget guard, the per-script line
  heights, the locale-driven digits, and the notification re-arm path.

## Steps, provisional

Each is one branch, one commit, one version, per the standing rule. Ordered so `uat-2` stays green
and each step is independently shippable.

| Step | Title | Kind | Depends on |
| --- | --- | --- | --- |
| 1 | `expo-localization` at the pinned `58.0.1`, and the device `Intl` probe | specified | 38 complete |
| 2 | The two settings: atoms, storage keys, migration from `preference_show_arabic_names` | specified | 1 |
| 3 | First-run locale negotiation, `system` versus `user` mode | specified | 2 |
| 4 | The language sheet, built on the sound sheet's pattern | specified | 2 |
| 5 | The sourced glossary: 11 names, 5 explanations, per locale, with provenance | files | R6 |
| 6 | The width guard: the budget constant, the widths file, the failing test | specified | 5 |
| 7 | Machine-translated UI copy for the launch set, through R2's gates | files | 38.3, 5 |
| 8 | The language commit: re-arm, rename channels, re-push widgets, under the lock | specified | 2, 38.1 |
| 9 | RTL rendering: alignment, `direction: 'rtl'` on prose, per-script line heights | specified | 5 |
| 10 | Locale-driven Arabic-Indic digits | specified | 3 |
| 11 | What's New entry and the translation-report row | specified | all |

Step 5 and step 7 are `(files)` because their content is data produced outside the repo and carried
verbatim. Everything else is `(specified)`.

## The owner decisions the plan must carry into section 2.1

Taken and recorded in `OWNER-DECISIONS.md`: D1 through D14.

**Still open, and proposed rather than decided** (`PROPOSALS.md`):

| # | Question | Plan's position if the owner does not answer |
| --- | --- | --- |
| P1 | Two settings rather than one | Build two. It is the only model that preserves today's default |
| P2 | Does the first column follow the app language, or stay English? | Follow the app language. One-line switch if wrong |
| P3 | Notifications in the app language, one language only | Yes |
| P4 | The RTL alignment amendment | Report only. Build the owner's literal ruling until he rules |
| P5.1 | The icon | Material Symbols `translate` |
| P5.4 | Month names | Raise, do not build |
| P5.6 | Eight languages at launch | Yes |

**P4 is the one where the plan deliberately does NOT take its own recommendation**, because the
owner's ruling is explicit and he asked only to be told the alternatives.

## Section 5's invariant

The plan needs one sentence a test can check. Candidate:

> Changing the app language changes every string a user reads and no string the app stores, and
> every armed notification, widget entry and preference key still resolves to the same prayer.

That covers the identifier/label split, the re-arm, and the widget path in one line, and each
clause is testable.

## The device proof

Three checks, none of which can be done at a desk:

1. **`Intl` surface on the 3T and the XS.** One log line. Decides whether plural machinery is ever
   needed. This is step 1 and it gates nothing else, so it can run early and cheaply.
2. **Script rendering on the 3T.** Android 9, the floor device, for each launch locale's script.
   `SELF-REVIEW.md` section 4 records that the "fallback already works" claim is proven for Arabic
   only.
3. **Channel rename on the 3T.** Two documentary sources say a channel renames in place.
   `ai/AGENTS.md` records this repo being burned by documented-but-untrue Android behaviour, so it
   is verified rather than trusted.

All three run on a local production build, because `ai/AGENTS.md` records that alarm behaviour only
means anything on one.

## What the plan must NOT contain

- Any instruction to translate the English prayer name. `MEASURED.md` section 2 and the 67 audio
  files settle it.
- A remount-on-locale-change pattern. `ANIMATION-EVIDENCE.md` gives the reason.
- A `t()` call inside a worklet or a widget layout.
- Bundled fonts.
- Plural machinery.
- `i18next-parser`, which is deprecated and archived.
- An `expo install expo-localization` without a pinned version, which would fetch 57.0.2.

## Open, pending round 2

- R6's sourced catalog decides step 5 entirely, and its `shortText` field feeds
  `COLUMN-DESIGN.md`'s layer 1.
- R7 may sharpen the settings naming in step 2 and step 4.

Neither blocks the plan's structure.
