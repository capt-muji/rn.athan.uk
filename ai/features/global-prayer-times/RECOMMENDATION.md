# The recommendation: how v2.0 should get its prayer times

One answer, its reasoning, its costs, and what would change it. The evidence is in `FINDINGS.md` and the eight
reports; the judgements made without the owner are in `ASSUMPTIONS.md`. Nothing here has been built.

---

## The answer in one paragraph

**Make the SOURCE the app's central concept, not the method.** A source is a named authority plus the place it
covers, and it answers with times the app can attribute to someone. Ship three kinds of source behind one
interface: an authority's own published year, fetched once and cached exactly as the app already does for London;
the same authority's times reproduced offline by `adhan@4.4.6` plus that authority's measured parameters; and, for
the large parts of the world where no authority publishes anything, a plainly labelled computation. Auto-select
the source from the user's country, let them change it, name it on screen, and never claim it is their mosque.
**This is the only architecture found that is simultaneously offline, faithful to real national timetables, and
honest about what it does not know.**

**Waves 3 and 4 strengthened this and changed one thing.** The strengthening: **London, the app's own source and the
hardest case in the world, turns out to need no network at all** (a 732-byte interval table reproduces fifty
published years exactly), and `SOURCE-CATALOG.md` now holds 39 sources across 30 countries with every inter-report
conflict resolved. The change: **the app cannot work out where it is for free.** Timezone inference is a median 16
displayed minutes wrong, so a worldwide app needs either a location permission or a manual city and zone picker.
That is now the largest open owner decision, and the architecture stands under either answer.

---

## Why not the obvious alternatives

**Not "pick the one best global method".** There is no such thing, and the authorities say so. The Fiqh Council of
North America's own paper states Fajr and Isha "are not directly dependent on the position of the sun", and the
observational record spans 9 to 20 degrees. Measured, the world's conventions disagree by up to 87 minutes on Fajr
at 44 degrees latitude. Any single global choice is wrong for most of the world by more than the app's own
rounding.

**Not "use an API".** Every general-purpose prayer API computes with the same open-source libraries the app can
run locally. AlAdhan's own credits page says so. Measured, it matched a local `adhan` within 1 minute on 365 of
365 days at eight of nine cities. An API adds a network dependency, a privacy cost and an outage risk while adding
no authority. It is strictly worse than a local library, and it violates the owner's offline constraint for
nothing in return.

**Not "library presets alone".** This is the finding most likely to surprise, and it is why the computed source is
last rather than first. The canonical angle table traces to two open-source projects, one of which admits in
writing that "no contacts have been made to obtain the correct numbers as published by such organizations". Tested
against authorities' own tables: the MWL pair is not the MWL's, the "Gulf Region" constant is refuted at three of
its four members, the "Jafari" institute could not be shown to exist, and `NorthAmerica` is wrong for Canada by up
to 64 minutes. A library is an excellent calculator and a poor authority.

**Not "hand-written astronomy".** The owner ruled it out and he was right. It is also unnecessary: measured
against the US Naval Observatory, no candidate library disagreed by 2 minutes or more on any solar quantity.

---

## The architecture

### The source is the unit

Every time the app displays belongs to a source, and the source is stored with it. Concretely, the MMKV key
becomes `prayer_${sourceId}_${date}`. Today's key is `prayer_${date}` with no location in it
(`stores/database.ts:138`), which will silently serve one city's times under another city's name, because every
guard in the pipeline checks shape and none checks provenance. **This is the single largest code risk found and
it must be fixed before a second source exists, not after.**

A source declares: the authority's name, the place or zone it covers, its IANA timezone, which published row
carries which prayer concept, and how its times are obtained.

### Three kinds of source, in order of authority

| Kind | What it is | Fidelity | Where it applies |
| --- | --- | --- | --- |
| **1. Published** | the authority's own year, fetched once and cached | exact, by construction | the 16 authorities recovered in this research, covering the best-evidenced share of users |
| **2. Reproduced** | `adhan` plus that authority's measured parameters and offsets | within 2 minutes on 99.998% of 135,996 measured values; exact on 71% to 90% once rounding is matched | the same authorities, offline, and as the fallback when a fetch has never succeeded |
| **3. Computed** | `adhan` plus a published parameter set, labelled as a computation | unknown against any authority, because there is no authority | the 29.9% of the world's Muslims where nothing could be sourced |

Kind 2 is what makes the offline promise real. Kind 3 is honest rather than good, and it must say so on screen.

### Why the Imsak finding shapes the data model

A source must declare which published row carries which concept, because the same word means different things in
different countries. Malaysia and Indonesia print `Imsak` as a real extra row exactly 10 minutes before Subuh.
Turkey's table has no Fajr row at all: its first row is `İmsak` and that row IS Fajr. Fill an `imsak` field and a
`fajr` field naively and the app is 10 minutes wrong in one country or the other. The fix is cheap if done early
and expensive later: **the concept, the identifier and the label become three separate things, and only the label
varies.** Session 39 already requires this split for localisation, so it is one piece of work serving two needs.

---

## What to build, in order

R8's sequence, which I have reviewed and endorse. The ordering rule: anything with a silent failure mode comes
before anything that depends on it, and everything invisible comes before anything visible.

| # | Session | Visible? |
| --- | --- | --- |
| S1 | Split the prayer identifier from the prayer label (shared with row 38) | No |
| S2 | Make the source explicit, with exactly one source; move the MMKV key; pin every existing install to `london-prayer-times` | No |
| S3 | Make the timezone a property of the source; fix the two zone-blind offset caches at `shared/time.ts:67-68` | No |
| S4 | Build the USNO verification fixtures (already built in `data/validation/`, 37,340 comparisons, 0 failures) | No |
| S5 | Name the authority on screen, with the honest wording | Yes, small |
| S6 | Surface jamaah, which is already typed and never read | Yes |
| S6b | **London's own interval table, making London permanently offline** (R13). New in wave 4, and it belongs here because it removes the app's only network dependency and its only single-operator risk, for its existing users, before any new country is added | No, times are unchanged |
| S7 | Add ONE second source: Malaysia (JAKIM) | Yes |
| S7b | **The location layer**: whichever of a permission or a city-and-zone picker the owner chooses (R14). It has to precede the source switch, because a switch needs something to switch on | Yes |
| S8 | The source switch, with its cache wipe, alarm re-arm and delta warning | Yes |
| S9 | Per-prayer manual offsets, if the owner permits them | Yes |
| S10 | The computed source with `adhan@4.4.6`, last and deliberately so | Yes |

**Two additions from wave 4, and one warning.** S6b is the cheapest high-value step in the whole sequence: 10,290
bytes buys fifty years of London times, removes the API key, and changes nothing a user sees. S7b is unavoidable and
its shape is an owner decision. The warning is R13's: **the notification sweep cannot detect a moved time**, because
`findStaleScheduledNotificationIds` compares identifiers and the identifier carries no time, so any step that can
move times must re-arm explicitly rather than relying on the sweep.

**S1 to S4 are invisible to users and all four are worth doing regardless of what the owner decides about
sources.** S6 is the cheapest real improvement for the app's existing London users, because the jamaah data is
already arriving on the wire and being discarded.

---

## The conditions, every one of them measured

If `adhan` ships, these are not optional:

- **Set `highLatitudeRule` explicitly and never call `recommended()`.** The rule choice is the largest single
  lever in the research: measured spread between rules is 47.8 minutes at London and 112.7 at Tromso, and above
  Stockholm no day of the year has all rules agreeing. `recommended()` never fires below the equator.
- **Override Canada to 13/13**, FCNA's own published position, absent from every library.
- **Bound Asr above 60N independently.** adhan's approximation runs away to 2,279 minutes at Tromso where an exact
  solve is stable to 1 minute.
- **Decide the polar policy in the app.** `Invalid Date` on 69 to 116 days a year at Tromso is correct behaviour,
  and even `Unresolved` produces an out-of-order prayer card on 18 of 248 days. About 4 million people live above
  the Arctic Circle, so this is a small-population, high-effort problem and should be scoped accordingly.
- **Match each authority's rounding before comparing anything to it.** adhan's own rounding was the single biggest
  source of apparent disagreement with authorities in the whole study.

---

## What the app should say

A reproduction claim, not an accuracy claim, and nobody else in the market is making one. The app shows **what a
named authority published**, names that authority where the times are, and says plainly that authorities differ.
It never promises the user's mosque, because nine central London mosques disagree by 26 minutes on Fajr.

That is not a weaker claim than the competition's. IslamicFinder titles a page "Most Accurate Prayer Times" while
its own help page tells users to fix the times by hand; Muslim Pro's marketing says "most accurate" while its
disclaimer makes "no representations as to the accuracy". **A claim the app can actually keep is a differentiator.**

---

## The two things that could sink this

**Licensing was the third, and it is CLOSED.** The research had measured that of eleven authorities one permits
commercial use, two forbid reproduction and eight are silent, and it flagged that as the highest-value open item.
**The owner settled it on 2026-09-30: he corresponded with the authorities himself and has permission to use their
data.** No session contacts anyone about it, or about anything else, without the owner asking first. The two
remaining risks are both owner decisions rather than unknowns.

1. **The meaning of "completely offline".** If the owner means literally zero network, a correction table cannot
   stay current: measured, carrying one year's residual to the next reproduces only 55.1% of values exactly, which
   is worse than reusing the previous year's published times. Zero network means computed times only, and fidelity
   to national timetables is lost. A yearly fetch, which the app already does, preserves everything.
2. **The never-invent rule applied strictly.** It forbids showing the six-constant approximation, which is the
   cheap version. The compliant version, the exact residual, costs 282 bytes per city-year against 6, which is
   still trivial. This one is survivable; it just removes the cheapest option.

---

## What I would do first, if asked

**Build S1 to S4, then S6b.** All five are invisible to users, independently valuable, and required under every
outcome of the open decisions, so none waits on anything. S2 closes the largest silent risk in the codebase, the
location-free MMKV key, and it must land before a second source exists rather than after. S6b is the one that pays
back immediately: it makes the app's existing London users independent of a single manually-issued API key and a
single small operator, for 10,290 bytes, with no visible change at all.

**The one thing worth putting to the owner before anything else is built:** whether v2.0 asks for a location
permission or ships a city and zone picker. It does not block S1 to S4 or S6b, and everything after them assumes an
answer.
