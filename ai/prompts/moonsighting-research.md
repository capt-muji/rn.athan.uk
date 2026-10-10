# Moonsighting research, sob 1: sources, deliverable, shared rules

Status: finished 2026-09-14. Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Sob 2
extends this brief. The rules below bind it too.

v2.0 takes the app beyond London. Today's API is a slightly modified version of Khalid Shaukat's
base timings, the derivation behind London's unified timetable. The research calculates nothing
itself: it understands the method, and picks or writes the right client, before any v2.0 design
starts.

## Sources, in order

1. Every page of <https://www.moonsighting.com>, including `moon.html` and `about-us.html`.
   Enumerate the page list first (crawl, sitemap, link-walk), then read every page. Download every
   PDF the site carries, read each one in full and keep them in the session scratchpad. If the
   site cannot be read, stop and do nothing else.
2. <http://www.hizbululama.org.uk/articles/english/Unified.pdf>, London's unified timetable.
   Work out the exact modifications of the base timings: which prayers, what offsets or rules,
   and why. That delta is what the app ships.
3. The implementations, read at the source, not the README:
   - PrayerTimeAPI <https://github.com/PrayerTimeResearch/PrayerTimeAPI>. Endpoint
     `https://www.moonsighting.com/time_json.php`, with
     `https://moonsighting.ahmedbukhamsin.sa/time_json.php` the fallback its code calls. It
     takes `year`, `tz`, `lat`, `lon`, `method` (0 Hanafi general, 1 Hanafi Shafag Abyad,
     2 Shafi Shafag Ahmar, 3 Shia Jafari), `both` (the README says 0 or 1, the code sends
     `false` or `true` and shows the second Asr only for methods 0 to 2) and `time` (0 for
     24-hour, 1 for 12-hour). Establish whether the endpoint still answers, which parameters
     reproduce the site's published tables, how it behaves at high latitude, and whether it
     can serve a worldwide v2.0 directly (finding 43: London only, no city parameter).
   - mawaqit <https://github.com/mawaqit/prayer-times-moonsighting>. Establish what it and the
     endpoint compute, where they agree or diverge, and whether either matches the London
     modification.
4. NPM packages implementing this method. Other moonsighting committees exist: a "moonsighting"
   package may follow a different body entirely. Verify each candidate traces back to Khalid
   Shaukat's committee and moonsighting.com. Record provenance: author, algorithm source, last
   publish, licence, and whether its numbers reproduce the site's. The owner's lead, unverified:
   the `adhan` package's `CalculationMethod.MoonsightingCommittee()`. Treat it as a candidate,
   not an answer. Establish which paper or page it derives from, whether its Fajr and Isha
   reproduce the site's tables for the same coordinates and dates, how it handles high latitude,
   and what is approximation rather than method. Diff its output against the site's tables for
   several cities and seasons, including one above 60N, and against the London unified times.
   Read implementations with the `opensrc` CLI: the source is the arbiter, not the docs.

## Deliverable

- How Fajr and Isha are derived, the high-latitude behaviour, what "moonsighting" contributes
  beyond a solar-depression angle, and where the thesis is documented.
- Who maintains the method, who uses it, and how the published timetables are generated.
- The exact delta between London's unified times and the unmodified method.
- Which package is safe to depend on, and if none is, what implementing it would take.
- What this implies for a worldwide v2.0: findings 43 (London-only endpoint, no city parameter),
  44 (Magrib has no midnight-crossing rule), 46 (London-pinned test oracles), 47 (high latitude).

## Rules for both sessions

- Own session, clean context. Research, not coding.
- Read 100% of every source: no slices, no `head`, no summary in place of reading. Diff-read
  near-duplicates.
- Never copy, average or invent a prayer time. Report deltas in minutes, not verdicts.
- The API is the source of truth. The app edits nothing it returns.
- Research only: no production code, no builds, no jest, no EAS. Never touch `uat` or
  `releases.json`.
- Never print, store or commit the London Prayer Times API key. The local `.env` holds only a
  placeholder. Ask the owner for the key if the API must be called. Commit through the
  key-prefix guard.
