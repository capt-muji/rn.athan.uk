# Session 39 planning: where this session is

Written so a later session, or this one after a context loss, can resume without re-deriving
anything. Updated as the work moves.

## What this session is

Planning only, for row 39 (D4b, the translation sweep). The owner's instruction:

🐋  "This is ONLY A RESEARCH TASK. Don't commit anything yet."

So: research, design, and a plan. No app code, and nothing merged to `uat-2`.

## Where the work lives, and why

**Branch `plan/39-localisation`, worktree `~/athan-device-sweep/worktrees/39-localisation`.**

Another session is executing row 37 (qibla) on `step/37-2-qibla-maths` in the main checkout. This
session must not touch that tree. It also must not write into the main repo's working directory,
because uncommitted files there would sit in the other session's tree where a `git clean -fd`
deletes them or a `git add -A` commits them into the qibla branch by accident.

**The worktree path is inside the nightly-sweep directory**, which a job clears around 00:00. The
protection is that everything is committed to the branch after each step, so the branch survives
even if the working tree is cleared. A mirror also sits at `~/athan-localisation-backup/`.

## Research status

Five round-1 agents launched. Three complete, two outstanding.

| Report | Subject | Status |
| --- | --- | --- |
| R1 | i18n library landscape, Intl on Hermes, catalog loading | **done**, `R1-FINDINGS.md` |
| R2 | Translation supply chain without a reviewer | **done**, `R2-FINDINGS.md` |
| R3 | RTL, bidi, fonts, scripts, column widths | **done**, `R3-FINDINGS.md` |
| R4 | Locale detection, picker UX, the language set | **done**, `R4-FINDINGS.md` |
| R5 | Production engineering, keys, migration, hostile runtimes | **done**, `R5-FINDINGS.md` |

Two round-2 agents launched, both sharpened against what round 1 returned.

| Report | Subject | Status |
| --- | --- | --- |
| R6 | The sourced prayer-name catalog, 11 names x 28 languages, with citations | **data done** (`prayer-names.json`), report pending |
| R7 | The two-setting model that resolves the owner's deadlock | **done**, `R7-FINDINGS.md` |

## What this session measured itself

Everything in `MEASURED.md`, `CONSTRAINTS.md`, `WIDTH-EVIDENCE.md`, `NOTIFICATION-EVIDENCE.md` and
`VERSIONS.md`, reproducible from `scripts/`.

The findings that changed the design:

1. **194 literals are only 113 pieces of copy.** The rest are identifiers, widget strings and doc
   examples. The row's stated surface overstated the work by 42%.
2. **The English prayer name is a load-bearing identifier** in 4 systems: 27 storage keys, 67 audio
   filenames, the notification ids, and the canonical display order. Translating it corrupts user
   data silently. This is the session's central risk.
3. **Roboto has 896 codepoints and no Arabic**, yet the app renders Arabic today, so per-glyph OS
   font fallback is already load-bearing in production. That makes "no bundled fonts" the proven
   path rather than the risky one.
4. **The extras column breaks.** Swahili is 2.83x English, Indonesian 2.57x, German 2.43x. On a
   360dp phone the Swahili name alone takes 71% of the row.
5. **The width-setting name differs by locale**: 3 different names set the standard column across
   15 locales. `getLongestPrayerNameIndex` reading the English array is wrong for this feature.
   Its character-count selection rule is safe though, tested across 6 scripts.
6. **Notification copy is frozen at schedule time** on both platforms, read from the
   `expo-notifications` Swift source. `titleLocalizationKey` is an inbound-push field, not a
   scheduling input.
7. **Widget payload has 20x headroom.** Worst case (Thai) is 6% of the 200KB guard.
8. **`expo-localization`'s `latest` is 57.0.2; SDK 58 is `58.0.1` behind the `next` tag.** Same trap
   row 37 hit with `expo-location`.

## Corrections the research forced on this session's own earlier conclusions

- An Android notification channel **can** be renamed in place. Only its behaviours are frozen. So a
  language change never mints new channel ids (R4).
- The notification re-arm needs **no cancel pass**, because the identifiers are deterministic and a
  re-schedule replaces in place (R4).
- "Left-align everything" is too literal. The box stays LTR; RTL **text** still needs right
  alignment and an RTL base direction, which the app's own Arabic column already does (R3).
- `i18next-parser` is deprecated and archived. `i18next-cli` is the tool (R2, confirmed on the
  registry).

## Owner decisions taken during this session

Recorded in full in `OWNER-DECISIONS.md`. The ones taken while it ran:

- D4, revised: primary and secondary name slots, not "English and Arabic".
- D12: notification copy follows the selected language.
- D13: the feature is announced in What's New.
- The two-language deadlock, raised 2026-09-29, recorded in `OPEN-DESIGN-QUESTION.md`. R7 is
  researching it. The owner asked for proposals at the end rather than a question mid-session.
- The bilingual-notification idea, raised and self-doubted by the owner, costed in the same file.
- Alternatives to the never-mirror rule are to be REPORTED, never implemented.

## What is left

1. Write `PLAN.md` itself, once the owner rules on `PROPOSALS.md` P1 and P2.
2. (done) `PROPOSALS.md`: the two-setting model, the notification answer, the RTL alternatives, and
   the language-set recommendation. All owner-facing, none decided unilaterally.
3. Write the plan itself: `PLAN.md` with steps, contracts, tests, acceptance criteria, break
   scripts, per `ai/plans/PLANNER-BRIEF.md` and `TEMPLATE.md`.
4. Split D4a (scaffolding) from D4b (the sweep) properly, since row 38 is the cheap half and row 39
   the expensive one.
5. `ASSUMPTIONS.md`: every assumption made while the owner slept, in one table, as he asked.

## The rule this session is working under

🐋  "Work autonomously and in a loop. Make assumptions and list them at the very end."

So no questions are asked. Every judgement call is made, recorded in `ASSUMPTIONS.md` with its
reasoning, and flagged where the owner would most likely disagree.
