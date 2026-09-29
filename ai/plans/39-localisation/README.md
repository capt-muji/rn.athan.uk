# Session 39: localisation research. Start here.

Research and planning for making the app multilingual. No app code was written and nothing was
merged, per the owner's instruction:

🐋  "This is ONLY A RESEARCH TASK. Don't commit anything yet."

## Read in this order

| # | File | What it gives you |
| --- | --- | --- |
| 1 | `ONE-OR-TWO-LANGUAGES.md` | **The deadlock answer, revised to one setting on your simplicity objection** |
| 2 | `PROPOSALS.md` | The other decisions, each with its reasoning and cost |
| 3 | `ASSUMPTIONS.md` | Every judgement made while you slept, in one table, with the five to read first |
| 4 | `MEASURED.md` | What this repository contains, measured rather than assumed |
| 5 | `SELF-REVIEW.md` | This session attacking its own conclusions. Four were weakened or corrected |
| 6 | `LAUNCH-SET.md` | Which six languages ship first, and the one ruling that unblocks four more |
| 7 | `SPLIT.md` | How the work divides between rows 38 and 39 |

Everything else is supporting evidence, listed at the bottom.

## The answer to the question you asked at midnight

You found a real design flaw:

🐋  "We essentially have two primary languages... you'll never actually be able to set English as
the notification. It seems wrong. We need a better approach."

**The cause: one setting was being asked to do two unrelated jobs.** The fix is two independent
settings:

| Setting | Controls |
| --- | --- |
| **App language** | Settings, sheets, modals, Help, notifications, widgets, and the prayer row's first name |
| **Prayer names** | The prayer row's second name only. Any language, or None |

Notifications follow the App language, always. The Prayer names setting never touches anything
outside the prayer list. That one rule dissolves the deadlock: an English speaker who likes Arabic
names on the list keeps English notifications, because the two are no longer connected.

R7 surveyed eight apps with the same structure (Netflix, Wikipedia, YouVersion, Muslim Pro and
others) and this is the shape all of them use, down to the labels.

## The five findings that matter most

1. **The English prayer name is a load-bearing identifier, not a label.** It builds 27 storage keys,
   2 notification id formats, 11 audio slugs and the display order. There are **67 audio files on
   disk** named from it, and Android's `res/raw` accepts `[a-z0-9_]` only, so those names can never
   be translated. Translating the name silently orphans every user's alert preferences. This is the
   session's central risk and it is why the structural work moves into row 38.

2. **The prayer-name column has a 123pt budget, and your instinct to worry was right, but it is
   solvable.** With literal translations, five of the eight launch languages overflow. With
   **properly sourced terse forms** (R6 sourced 28 languages from Diyanet, Kemenag, JAKIM, MUIS and
   others), **19 of 28 locales fit and seven of the eight launch languages fit**, the exception
   being French by 9pt.

   The surprise is which languages break: Arabic and Chinese are NARROWER than English. The problem
   is Latin-script languages that TRANSLATE the concept rather than transliterating it. German
   "Nachmittagsgebet" is 148pt where "Asr" is 30pt, and both are correct German.

   Sharpest evidence: a shipping app's own English "Last Third of the Night" is **178pt**, which
   would overflow your row too. Your existing Arabic `آخر ثلث` is 49pt. Whoever chose the app's
   current labels already solved this once.

3. **Notification copy is frozen at schedule time on both platforms.** Read from the
   `expo-notifications` Swift source. So a language change re-arms the whole plan, up to 64
   requests. The good news: no cancel pass is needed (identifiers are deterministic), Android
   channels rename in place, and this repo already has the exact pattern in `commitSoundSelection`.

4. **Bilingual notifications would halve your notification buffer.** Two requests per prayer against
   a fixed budget of 64 cuts coverage from 3 days to about 1.5, which is the same failure that cost
   a user their Magrib and Isha on a OnePlus 8T. You suspected this idea was messy; it is worse than
   messy.

5. **Hermes has no `Intl.PluralRules`, and Jest would hide it.** Node has full `Intl`, so plural
   code passes every test and renders wrong on a phone. It does not affect us, because all four
   count-bearing strings use abbreviated units (`in 5m`, `6h 8m`) which do not inflect in any
   language, so no plural machinery ships. A guard test detects the day that changes.

## On the RTL rule you asked about

Your ruling stands: the layout never mirrors. R3 confirmed that is the right call and for a harder
reason than cost, since under Fabric the layout direction is fixed at launch, so a mirroring app
would have to **restart on every language change**.

One refinement, reported rather than built, as you asked. Keeping the BOX left-to-right does not
require left-aligning the TEXT inside it. Your app already proves this: `Explanation.tsx` ships
`textAlign: 'right'` for its Arabic text today. A literal reading would require deleting that line
and making the shipped Arabic worse. Details in `PROPOSALS.md` P4.

## What is not done

- **`PLAN.md` itself.** The outline is in `PLAN-OUTLINE.md`: 11 steps, 3 device proofs, and the
  invariant. The plan is written once you have ruled on `PROPOSALS.md` P1 and P2, because those two
  change what the steps build.
Nothing. All seven research reports are in.

## Where this work lives

Branch `plan/39-localisation`, in a worktree, isolated from the qibla session running in the main
checkout. Nothing here touches `uat-2`. A mirror sits at `~/athan-localisation-backup/`.

## Supporting evidence

| File | Subject |
| --- | --- |
| `CONSTRAINTS.md` | The nine constraints that decide the design |
| `CONFLICTS.md` | Where the seven reports disagreed, and how each was resolved |
| `WIDTH-EVIDENCE.md` | The column measurements and the derived budget |
| `COLUMN-DESIGN.md` | The four-layer answer to the width problem |
| `NOTIFICATION-EVIDENCE.md` | Why copy cannot localise at delivery time |
| `PLURAL-EVIDENCE.md` | Why no plural machinery is needed |
| `ANIMATION-EVIDENCE.md` | Why a language change cannot tear the animations |
| `SPIKE-EVIDENCE.md` | The `t()` proven at 100% coverage, then deleted |
| `LOCALIZATION-API.md` | The `expo-localization` API read from the package |
| `VERSIONS.md` | Registry truth, including the `next`-tag trap |
| `OWNER-DECISIONS.md` | Your rulings, D1 through D14 |
| `OPEN-DESIGN-QUESTION.md` | The deadlock as you stated it |
| `CATALOG-EVIDENCE.md` | Two shipping apps' catalogs, measured |
| `research/prayer-names.json` | The sourced catalog: 28 locales, with provenance per term |
| `R1` to `R7` `-FINDINGS.md` | What each research report changed |
| `research/` | The seven full reports |
| `scripts/` | Every measurement, reproducible |
