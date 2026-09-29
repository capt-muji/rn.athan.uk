# How the work splits between row 38 and row 39

`ai/plans/README.md` already splits D4 in two on the owner's ruling: row 38 is "the i18n
scaffolding, no second language yet" and row 39 is "the translation sweep". The research changes
WHERE the line falls, and this file records the corrected split with its reasoning.

## The principle the split now follows

The original split was by VISIBILITY: row 38 ships nothing a user sees, row 39 ships the languages.

The research says the right axis is **reversibility**. R5 names the three most expensive decisions
to reverse, and all three are structural:

1. The identifier versus label split in `Prayer.english`.
2. The key convention.
3. The catalog file layout.

Every one of them gets harder the moment a catalog exists, and two of them become storage
migrations of real users' preferences. So row 38 takes everything structural, even where that makes
it larger than "scaffolding" suggests, and row 39 becomes the part that is genuinely additive.

The two axes mostly agree. Where they disagree, reversibility wins.

## Row 38: the structural half

Still invisible to users, still ships no second language.

| # | Work | Why it is here |
| --- | --- | --- |
| 38.1 | **Split identifier from label.** `PRAYER_IDS` as a closed union, `Prayer.english` typed to it, every storage key, notification id, audio slug and ordering site proven to use the identifier | R5: the prerequisite for everything, an afternoon now against a storage migration later. Every failure mode is silent |
| 38.2 | The `t()` function, the English catalog, structured keys, `as const` | Proven buildable at 100% coverage in `SPIKE-EVIDENCE.md` |
| 38.3 | Migrate the 113 display strings to `t()` calls, file by file in the measured order | The order is in `MEASURED.md`. `shared/help.ts` (27) first, since it is the largest and the most prose |
| 38.4 | The hardcoded-string guard: a Jest source-scan test in the existing pre-commit chain | R5: Biome has no `no-literal-string`. The repo already uses source-reading contract tests |
| 38.5 | The pseudolocale at 140% expansion, as a test | R2: this is the width guard, and it works **before any translation exists**, which is why it belongs here rather than in 39 |
| 38.6 | Per-locale width cache keys, with the `clearAllExcept` whitelist entries and their test | `CONFLICTS.md` 2. The key family must exist before a second locale can expose the bug |
| 38.7 | `getLongestPrayerNameIndex` reads the active catalog, not `PRAYERS_ENGLISH` | Measured: 3 different names set the standard column across 15 locales |
| 38.8 | Bidi isolate helper, and the rule that composed strings use it | Needed the moment any RTL string is composed with a number |

Row 38 ends with the app behaving exactly as it does today, in English, with every string coming
through `t()` and every structural decision made.

## Row 39: the additive half

| # | Work | Why it is here |
| --- | --- | --- |
| 39.1 | `expo-localization` at the pinned `58.0.1`, first-run locale negotiation, the `system` versus `user` mode | Nothing depends on it until a second language exists |
| 39.2 | The two settings (`App language`, `Prayer names`) with their migration from `preference_show_arabic_names` | Owner-facing, and P1 must be settled first |
| 39.3 | The language sheet, built on the sound sheet's pattern with its warming trick | Additive UI |
| 39.4 | The sourced glossary: 11 names plus 5 explanations, per locale, with provenance | R6 produces the data |
| 39.5 | Machine-translated UI copy for the launch set, through R2's pipeline and gates | Depends on 38.3 |
| 39.6 | The language commit: re-arm notifications, rename channels, re-push widgets, under `withSchedulingLock` | Depends on 38.1, since the identifiers must be stable first |
| 39.7 | RTL rendering: right alignment for RTL text, `direction: 'rtl'` on the two prose surfaces, per-script line heights | Only matters once an RTL locale ships |
| 39.8 | Locale-driven Arabic-Indic digits | Same |
| 39.9 | The What's New entry, and the "report a translation mistake" row | Owner decision D13 |

## What moved, and why

| Item | Was | Now | Reason |
| --- | --- | --- | --- |
| Identifier/label split | Not called out | **38.1, first** | R5: the most expensive thing to reverse and every failure is silent |
| Pseudolocale | Implied in 39 | **38.5** | R2: it is the width guard and needs no translations |
| Width cache keys | 39 | **38.6** | The bug is only reachable in 39, but the key family and whitelist must exist before then |
| `getLongestPrayerNameIndex` | Not identified | **38.7** | Measured this session; it is wrong today for any non-English locale |
| Device `Intl` probe | Not identified | **38, pre-flight** | R1's Hermes claim decides whether any plural machinery is ever needed |

## The dependency that is easy to miss

39.6 (the language commit) depends on 38.1 (the identifier split), not just in the ordinary sense
but structurally: the notification re-arm is only safe because identifiers are deterministic and
built from the untranslated name. If 38.1 is skipped or done loosely, the re-arm orphans armed
alarms instead of replacing them, and `R4-FINDINGS.md`'s "no cancel pass needed" conclusion stops
being true.

So 38.1 is not merely first. It is what makes the cheapest version of 39.6 possible.

## What row 38 must NOT do

- Ship a second language. That is the whole point of the split.
- Install a translation library. `R1-FINDINGS.md` recommends none, and the spike proved the
  alternative works at this repo's bar.
- Ship plural machinery. `PLURAL-EVIDENCE.md` measured the surface at zero.
- Touch the layout. No RTL work until an RTL locale exists.

## Sizing

Row 38 is roughly 12 to 18 commits by R5's estimate, most of them the file-by-file string
migration, each independently shippable. Row 39 is smaller in code and larger in data.

The honest summary: **row 38 is the careful one, not the quick one.** It was queued as the cheap
half and the research has made it the structurally important half. Row 39 is mostly catalogs,
settings UI and one commit pattern the repo already has.
