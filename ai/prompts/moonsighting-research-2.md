# Moonsighting research, session 2: read, decide, then finish

Status: deferred by the owner, queue row 25. He has not read the findings or answered section
5's questions. Whether the research is conclusive, and whether v2.0 can use it, stays open.

This extends `ai/prompts/moonsighting-research.md`: its sources, deliverable and rules apply here.

## Where everything is

- Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Read it first, in full.
- Notes, data and page source: `ai/features/moonsighting/notes/`, `data/` and `artifact/`.
- The visual findings page is private and its link lives off-repo, in the owner's keep. Rebuild
  it with `artifact/build_artifact.py`. Chart data: `artifact/chart-data.json`, which the
  script reads from the `~/athan-research/` copy.
- Scratch (crawl, PDFs, raw responses, scripts) is in `~/athan-research/`, outside git. The repo
  holds everything needed to continue.

## Do, in order

1. Help the owner read it. Before any new research, give him a short, plain answer drawn from the
   findings: what is settled and what is not, and whether each part of the v2.0 plan can rest
   on it. The London API stays London's default. Moonsighting.com is a second option in London
   and the only source elsewhere. Mark anything unverified, then wait for the owner.
2. The remainders in findings sections 3.1 to 3.4, once the owner wants the research resumed:
   reproduce London's Asr independently, measure the day-early clock change in Palestine, look
   into the McMurdo polar-edge runs and the Sky Prayers apps, and run the Rust, C# and Dart
   ports only if a decision depends on their numbers. Read `ai/features/global-prayer-times/RESUME-FROM.md`
   (queue row 42) first. Some remainders may already be answered there.
3. Review. Run one independent reviewer over the whole findings file. It attacks every claim,
   count and fixture, re-derives the London counts from `data/london/` and the section 2.13
   dates from `notes/method-versions/`. Fix what it finds. Republish the findings page at the
   owner's private link.
4. Section 5's eleven questions stay open until the owner is ready. Bring them only when asked. Do not press.

## Session 1's short answers (step 1 starts from these)

1. How is London's unified timetable calculated, and who set it? The sun times come from HMNAO
   (sections 2.14 and 2.15): sunrise minus 3, noon plus 5, sunset plus 3, Asr at one and at two
   shadow lengths. Fajr and Isha are fixed minute intervals by calendar date, from the 1987-88
   Blackburn observations (Hizbul Ulama, Miftahi's Tables 5 and 6) with London's own edits.
   Adopted 1 August 2011 by the mosques named in Unified.pdf. Unanswered: who made the edits, why.
2. Is it safe for the worldwide option? No. The intervals were observed at one latitude
   (53.45N), in one hemisphere, and are meant for the UK.
3. What should the worldwide option use? Session 1 recommends calculating the method on the
   device (adhan's `MoonsightingCommittee`) rather than calling the endpoint. It needs owner
   rulings on polar days, and on whether a calculation counts as a source under the
   never-synthesise rule (section 5, questions 1 and 7).
4. Where do mosque clocks, mawaqit and other apps get their times, and do they add offsets? Not
   researched beyond section 2.16, where mawaqit's PHP copy implements the seasonal function
   only. Candidate research for this session.

## Rules beyond session 1's

- Agents: one at a time, two at most. Session 1's four parallel agents hit the session limit
  twice and the weekly limit once. Agents save notes after every step.
- Git: the rules on a research worktree and branch, on `--no-verify` (the pre-commit hook runs
  the full jest suite) and on pushing nothing predate the merge of `research/moonsighting`. The
  planning session asks the owner which still apply.

## Prompt to start the session

```
Read ai/prompts/README.md for the standing rules, then ai/prompts/moonsighting-research-2.md.
Read ai/features/moonsighting/RESEARCH-FINDINGS.md in full. Start at step 1: tell me plainly
what the research settles, what it does not, and whether the v2.0 plan can rest on it, then
wait for me. Research only. Follow the rules in moonsighting-research.md. Never invent a prayer
time. Never store or commit the API key. Merge and push nothing without my go-ahead.
```
