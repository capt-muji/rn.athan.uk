# Deep research: the Moonsighting Committee prayer-time method (Khalid Shaukat)

**Status: NOT STARTED. Queued by the owner on 2026-09-12, to run only after the code-audit
sessions are complete.**

## How to run this

**This needs its own session with a clean context.** The owner was explicit: clear context,
start fresh, and treat it as a research session rather than a coding one. It is expected to use
**multiple parallel agents** doing deep research, and to produce a white-paper-grade write-up.

This is a prerequisite for **v2.0, the global change**: the app stops being London-only and
serves the whole world. Users can still use it in London, but the calculation has to generalise.
The owner wants this understood completely *before* any v2.0 design work starts.

## Why it matters, in the owner's own framing

The API this app uses today is **a slightly modified version of Khalid Shaukat's base timings**.
London's unified prayer timetable — the one a large set of London mosques follow — is that same
modified derivation. So the method already sits underneath the product; going global means
owning the understanding of it rather than inheriting it.

Note the division of labour the owner set: **we will not do the astronomical calculation
ourselves.** The moonsighting method is the source. The research is about understanding it well
enough to depend on it correctly, and to pick or write the right client for it.

## Step 1, and it gates everything else: read the whole site

**If the site cannot be read, stop and do nothing else.** The owner called it critical and said
not to proceed to other steps on a failed read.

- <https://www.moonsighting.com> — every page of the site, not a sample
- <https://www.moonsighting.com/moon.html>
- <https://www.moonsighting.com/about-us.html> — the creator, Khalid Shaukat, and the committee

Enumerate the full page list first (crawl, sitemap, link-walk), then read every page top down.
**Download every PDF the site carries and read all of them in full** — the owner said "if it has
a PDF, download a PDF, read it, like a deep dive". Keep the PDFs in the session scratchpad.

## Step 2: the London derivation

- <http://www.hizbululama.org.uk/articles/english/Unified.pdf>

The unified prayer timetable for London: a general announcement listing the mosques that follow
it. It is the *slightly modified* version of the moonsighting base timings. Work out precisely
**what the modifications are** — which prayers, what offsets or rules, and why — because that
delta is what this app currently ships.

## Step 3: the implementations

Read the source, not the README:

- <https://github.com/PrayerTimeResearch/PrayerTimeAPI>
- <https://github.com/mawaqit/prayer-times-moonsighting>

Both are believed to implement this method. Establish what each actually computes, where they
agree, where they diverge, and whether either matches the London modification.

## Step 4: the packages

Find NPM packages implementing **this** method. The trap the owner named explicitly: there are
**other moonsighting committees**, and a package that says "moonsighting" may implement a
different body's rules entirely. Verify each candidate traces back to **Khalid Shaukat's**
committee and the moonsighting.com method specifically. Record provenance for each: author,
source of the algorithm, last publish, licence, and whether the numbers reproduce the site's.

**Lead supplied by the owner, unverified — treat it as a candidate, not an answer:**

- <https://www.npmjs.com/package/adhan>, which exposes `CalculationMethod.MoonsightingCommittee()`

The owner's words: *"I don't know if this is the exact one for the moonsighting. I have no idea.
That's why I also want you to validate it and verify and validate this package, et cetera, if it
matches exactly."* So the job is not to adopt it because the name matches. Establish whether
`adhan`'s `MoonsightingCommittee` implements Khalid Shaukat's method and to what fidelity: which
paper or page it derives from, whether its Fajr and Isha reproduce moonsighting.com's own
published tables for the same coordinates and dates, how it handles high latitude, and whether
any part of it is an approximation of the method rather than the method. Diff its output against
the site's tables for several cities and seasons, including at least one above 60N, and against
the London unified times from step 2. **Report the deltas in minutes, not as a verdict.**

Read its implementation with the `opensrc` CLI, which the owner confirmed is available for any
package — the source is the arbiter here, not the README or the docs.

## What the deliverable has to answer

- The algorithm itself: how Fajr and Isha are derived, the high-latitude behaviour, what
  "moonsighting" contributes beyond a solar-depression angle, and where the thesis is documented.
- Who maintains it, who uses it, and how the published timetables are generated.
- Exactly how London's unified times differ from the unmodified method.
- Which package, if any, is safe to depend on — and if none is, what implementing it would take.
- What all of this implies for a worldwide v2.0, including the findings this audit already
  recorded: 43 (the endpoint is London with no city parameter), 44 (Magrib has no
  midnight-crossing rule), 46 (London-pinned test oracles) and 47 (high latitude).

## Constraints that still apply

- The owner's standing ruling: **the API is the source of truth and the app edits nothing it
  returns.** This research is to understand the method, not to start calculating times locally.
- Research only. No production code changes in that session.
