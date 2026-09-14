# Moonsighting research, session 2: finish and review

**Status: QUEUED.** It follows session 1 (2026-09-14), which ran on branch `research/moonsighting`.
The findings are in `ai/features/moonsighting/RESEARCH-FINDINGS.md`; read it first, in full.
Research only. Nothing on that branch is merged or pushed without the owner's go-ahead.

## Where session 1 got to

- **London is solved to the minute where it can be.** Fajr and Isha follow the 1989 Blackburn
  chart; Isha carries 21 London-edited slots; sunrise is shown 3 minutes early; the sun times come
  from HMNAO (sections 2.14 and 2.15).
- **The moonsighting.com endpoint is characterised.** It matches adhan to ±1 minute up to 64°N; it
  changes the clock a day early in some timezones; at high latitude it emits `-----` (sections
  2.4, 2.6, 2.11 and 2.12).
- **The method's history is dated** from 1999 to 2024 (section 2.13).
- **The implementations are done** (section 2.16). The booklet's §11 publishes the coefficients;
  adhan is the closest implementation; the islamic-network family (AlAdhan method 15) omits the
  18° bound, the 1/7 rule and the +5/+3 offsets; several npm packages that claim the method don't
  implement it.
- **Every document the site carried is read** (section 2.17). Shaukat computed Hizbul Ulama's
  2007 UK directory; its tables apply no 1/7-of-the-night rule and carry city errors.
- **Every site page is read** (section 2.18): 1,186 of 1,186 live paths and 50 archived captures.
  No page publishes the formula or mentions London's timetable. From May 2012 to July 2016 the site
  offered a booklet by post, saying "These algorithms are included in the booklet". The site has been
  dormant since spring 2024.
- **Every archived version of the method pages is read** (157 captures), and section 2.13 is dated
  from them. Booklet §12's wording stood on how-we.html from November 2014 to May 2015.
- **Unfinished:** the small remainders listed in sections 3.1 to 3.4. Notes are in `ai/features/moonsighting/notes/`.

## Do, in order

1. **Step 1 is closed** (section 3.5). Go straight to the remainders.
2. **Remainders** (sections 3.1 to 3.4):
   - reproduce London's Asr independently;
   - measure the day-early clock change in Palestine;
   - look into the McMurdo polar-edge runs and the Sky Prayers apps;
   - run the Rust, C# and Dart ports only if a decision depends on their numbers.
3. **Review.** Run one independent Opus reviewer over the whole findings file. It should attack
   every claim, count and fixture, and re-derive the London counts from `data/london/`. Fix what it
   finds.
4. **Finish sections 3, 5 and 6,** then bring section 5's questions to the owner.

## Rules

- Read 100% of every source: no slices, no `head`, no summaries in place of reading. Diff-read
  near-duplicates.
- Run one Opus agent at a time, two at most. Session 1's four parallel agents hit the session limit
  twice and the weekly limit once. Agents must save notes after every step.
- Never copy, average or invent a prayer time. Report deltas in minutes.
- Never print, store or commit the London Prayer Times API key. If the API must be called, ask the
  owner for the key; the local `.env` holds only a placeholder. Commit through the key-prefix guard.
- No app code, no builds, no jest, no EAS. Never touch `uat` or `releases.json`.
- Commit findings as you go, with `--no-verify`, because the pre-commit hook runs the full jest
  suite.
