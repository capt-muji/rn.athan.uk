# Global prayer times for v2.0: the research brief

**Status: RESEARCH ONLY.** No app code, no tests, no builds, no dependency installs in the repository. Nothing here
is a change to the app. Started 2026-09-30 on branch `research/global-prayer-times` in the worktree
`/Users/muji/athan-global-wt`, off `uat-2` at `0410d749`.

**This is the second research wave.** The first was the Moonsighting Committee study of 2026-09-14
(`ai/features/moonsighting/`), which answered one question in depth: what Khalid Shaukat's method is, where it is
published, how the London unified timetable relates to it, and which implementations reproduce it. That wave is read
as prior art, not repeated. This wave asks the question the first one deliberately left open.

## The owner's question

The app ships London-only today, from one provider, `londonprayertimes.com`. Version 2.0 goes worldwide. The owner's
words, 2026-09-30:

- "This app needs to be completely offline, offline based. I would love it if there's no API involved at all."
- "I also don't want to build my own custom mathematics, custom measurements, custom algorithms because that will not
  be accurate at all and it's a huge job and we can't verify if it's correct or not."
- "There's a lot of differences between prayer times around the world, between different methodologies, different
  schools of thought."
- "What do people use in that country? What do mosques use in each country?"
- "Is there one that fits everything?"
- "If we can follow the same approach of fetching the whole year and caching it and only doing it once a year, that'll
  be great."
- "My thesis of research need, honestly, this is accuracy. We need absolute accuracy for this."

So the shape of the answer has three parts, and the research must serve all three:

1. **What is correct.** Which calculation conventions the world's Muslims actually pray by, per country, and what
   "accurate" can honestly mean when two correct authorities disagree by twenty minutes.
2. **Where it comes from.** A credible, maintained, verifiable source of those times that is not hand-written
   mathematics: a library, a published parameter set, an API, or some combination.
3. **What it costs.** Offline-first is the constraint, not a preference. An API is a last resort, and a yearly fetch
   is the only acceptable API shape if one is used at all.

## The standing rules, inherited from wave 1 and from `ai/AGENTS.md`

- **Never copy, average or invent a prayer time.** Report deltas in minutes against a named source.
- **Read sources in full.** No slices in place of reading, no summary standing in for a source.
- **Separate measured from claimed.** A number this research computed is marked as measured. A number a website
  asserts is marked as cited, with its URL and fetch date. Anything neither is marked UNVERIFIED.
- **Honest nulls.** Where a fact could not be sourced, the report says so rather than guessing.
- **No secrets.** No API key is printed, stored or committed. The London Prayer Times key is not used in this wave.
- **No app work.** No app code, no test runs, no builds, no EAS, no dependency installed into the repository.
- **House style** (`ai/AGENTS.md` section 8): no em dashes, no arrows in prose, no exclamation marks, no emoji, no
  filler. Tables for comparisons, backticks for identifiers, a one-page findings list at the top of every report.

## Scope: what this wave covers

Wave 1 covered one committee. This wave covers everything else:

- every prominent calculation authority and convention worldwide, with its published parameters and primary source;
- the country-by-country question: which body each country's mosques actually follow, and on what evidence;
- every credible calculation library in every ecosystem, judged on correctness, provenance, maintenance, licence and
  fitness for a React Native app that must work with the network off;
- every public prayer-time API, judged on terms, cost, a whole-year fetch, and whether depending on one is
  compatible with an offline-first app;
- the measured size of the disagreements: how far apart two defensible answers are for the same place and day, which
  is what decides whether the choice of convention matters to a user or not;
- the hard edges: high latitude, the polar circles, elevation, timezone data on the device, and the days when a rule
  produces no answer at all;
- what the answer means for this app's own code, which today assumes one city, one timezone and one provider.

## Out of scope

- Hijri calendar and moon sighting for dates. Wave 1's subject was the prayer-time method of the Moonsighting
  Committee, not the lunar calendar, and the calendar stays out of this wave too.
- Qibla direction. Rows 37, 40 and 41 own it.
- Writing any of it. This wave produces evidence and a recommendation, not a plan and not code.

## How the wave is run

The session is an orchestrator. Research agents run in parallel waves of at most four, each writing one report into
`agent-reports/`. The orchestrator reads every report, judges it, and shapes the next wave from what the last one
found. Wave 1 asks the four independent questions. Later waves close the gaps, measure what the decisions actually
hinge on, and attack the conclusions.

**No session ever contacts anyone** (owner, 2026-09-30). No email, no drafted letter, no contact form, no
gathering of contact addresses, for any reason, unless the owner explicitly asks for it in that session. The
licensing question this might once have served is CLOSED: the owner corresponded with the authorities himself and
has permission. A report may record that a fact is unobtainable; it never proposes reaching out to obtain it.

**A research agent never spawns a research agent** (owner, 2026-09-30). Only the orchestrator delegates, every
agent is pinned to the same model the owner named, and each does its own work sequentially. Nested delegation
spends an allowance nobody is watching and it already cost this programme a deliverable: wave 1's country agent
handed its regional tables to sub-agents, and the report shipped with `(cluster tables inserted below)` where 53
countries should have been. Wave 2 forbade it outright and every report arrived whole.

Reports are the record. `FINDINGS.md` is the synthesis the owner reads. `ASSUMPTIONS.md` lists every judgement made
without the owner, and `RECOMMENDATION.md` is the answer with its reasoning and its costs.

## Where things live

| What | Where |
| --- | --- |
| This brief | `ai/features/global-prayer-times/BRIEF.md` |
| Agent reports | `ai/features/global-prayer-times/agent-reports/` |
| Scripts and result data | `ai/features/global-prayer-times/data/` |
| The synthesis the owner reads | `ai/features/global-prayer-times/FINDINGS.md` |
| Judgements made unattended | `ai/features/global-prayer-times/ASSUMPTIONS.md` |
| The answer and its costs | `ai/features/global-prayer-times/RECOMMENDATION.md` |
| Prior wave, read as prior art | `ai/features/moonsighting/` |
