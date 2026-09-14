# Moonsighting research, session 2: read, decide, then finish

**Status: PAUSED by the owner on 2026-09-14.** Session 1 ran all of 2026-09-14 on branch
`research/moonsighting` (worktree `~/athan-research-wt`, off `uat-2`; not merged, not pushed). The
owner stopped the research there to work on other parts of the app.

**The owner has not read the findings yet and has answered none of section 5's questions.** Whether
the research is conclusive, and whether v2.0 can actually use it, is still open. Research only.
Nothing on that branch is merged or pushed without the owner's go-ahead.

## Where everything is

- **This brief** exists only on branch `research/moonsighting` until that branch is merged. Its
  tracker row is row 9 of `ai/prompts/README.md` on the same branch. A copy sits outside git at
  `~/athan-research/NEXT-SESSION-PROMPT.md`.
- **Findings:** `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Read it first, in full.
- **Notes, data and the page source:** `ai/features/moonsighting/notes/`, `data/` and `artifact/`.
- **The visual findings page** (private):
  <https://claude.ai/code/artifact/496252ba-ba85-4d2f-a788-cd132211017d>.
  - Rebuild it with `artifact/build_artifact.py`.
  - Chart data: `artifact/chart-data.json`. The script reads the `~/athan-research/` copy.
- **Scratch material** (crawl, PDFs, raw responses, scripts) is in `~/athan-research/`, outside both
  checkouts and not in git. If it is gone, the branch holds everything needed to continue.

## Where session 1 got to

- **London is solved to the minute where it can be.**
  - Fajr and Isha follow the 1989 Blackburn chart.
  - Isha carries 21 London-edited slots.
  - Sunrise is shown 3 minutes early.
  - The sun times come from HMNAO (sections 2.14 and 2.15).
  - London is not the moonsighting.com method plus offsets. API minus that method: Fajr −7 to +6
    minutes, Isha −4 to +11.
- **The moonsighting.com endpoint is characterised** (sections 2.4, 2.6, 2.11, 2.12 and 2.16).
  - It matches adhan to ±1 minute up to 64°N.
  - It changes the clock a day early in seven time zones.
  - At high latitude it emits `-----`.
  - Its only working host is the generator developer's own server.
- **The formula has a primary source.** Shaukat's booklet (September 2015), §11, gives coefficients
  equal to adhan's (section 2.16).
- **Every document, every site page and every archived method-page version is read.**
  - 59 documents, 1,186 pages and 157 captures (sections 2.13, 2.17 and 2.18).
  - Section 2.13 dates each method change.
  - Booklet §12's wording stood on how-we.html from November 2014 to May 2015.
  - The site has been dormant since spring 2024.
- **Unfinished:** the small remainders listed in sections 3.1 to 3.4.

## Do, in order

1. **Help the owner read it.** Before any new research, give the owner a short, plain answer drawn
   from the findings:
   - what is settled and what is not;
   - where the research is conclusive and where it is not;
   - whether each part of the v2.0 plan can rest on it: the London API stays London's default, and
     moonsighting.com is a second option in London and the only source elsewhere.

   Mark anything unverified, then wait for the owner before going further.
2. **Remainders** (sections 3.1 to 3.4), once the owner wants the research resumed:
   - reproduce London's Asr independently;
   - measure the day-early clock change in Palestine;
   - look into the McMurdo polar-edge runs and the Sky Prayers apps;
   - run the Rust, C# and Dart ports only if a decision depends on their numbers.
3. **Review.** Run one independent Opus reviewer over the whole findings file. It should attack every
   claim, count and fixture, re-derive the London counts from `data/london/` and the section 2.13
   dates from `notes/method-versions/`. Fix what it finds, and republish the findings page at the
   same URL.
4. **Section 5's eleven questions** stay open until the owner is ready. Bring them only when asked,
   and don't press for answers.

## Rules

- **Stay out of the main checkout.** Another session may be working in
  `/Users/muji/repos/rn.athan.uk`. Work only in the worktree and commit only to
  `research/moonsighting`.
- **Read 100% of every source:** no slices, no `head`, no summaries in place of reading. Diff-read
  near-duplicates.
- **Agents.** Run one Opus agent at a time, two at most. Session 1's four parallel agents hit the
  session limit twice and the weekly limit once. Agents must save notes after every step.
- **Prayer times.** Never copy, average or invent one. Report deltas in minutes.
- **The API key.** Never print, store or commit the London Prayer Times API key. If the API must be
  called, ask the owner for the key; the local `.env` holds only a placeholder. Commit through the
  key-prefix guard.
- **No app work.** No app code, no builds, no jest, no EAS. Never touch `uat` or `releases.json`.
- **Commits.** Commit findings as you go, with `--no-verify`, because the pre-commit hook runs the
  full jest suite.

## Prompt to start the session

```
Read ai/prompts/README.md for the standing rules, then ai/prompts/moonsighting-research-2.md, both on branch research/moonsighting in the worktree ~/athan-research-wt (create it with `git -C /Users/muji/repos/rn.athan.uk worktree add ~/athan-research-wt research/moonsighting` if it is gone). Work only in that worktree; another session may be using the main checkout. Read RESEARCH-FINDINGS.md in full. Start with step 1: tell me plainly what the research settles, what it doesn't, and whether the v2.0 plan can rest on it, then wait for me. Research only: read every source in full, never invent a prayer time, never store or commit the API key, commit to research/moonsighting through the key-prefix guard with --no-verify, and don't merge or push.
```
