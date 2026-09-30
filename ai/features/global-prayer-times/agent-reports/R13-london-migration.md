# R13: protecting the users the app already has

**Agent:** R13, wave 4 of the global prayer times research. **Written:** 2026-09-30.
**Status: RESEARCH ONLY.** No app code changed, nothing built, nothing installed in the repository, no git command run.

**Scope.** Every other report in this programme is about countries the app does not yet serve. This one is about the
users it already has. It answers five things: what a London user would lose under each candidate computed source,
whether London can be reproduced exactly and cheaply, exactly what must happen to an existing install on upgrade,
which of three futures London should have, and what happens if the provider disappears.

**How claims are marked.**

- **measured** means this agent computed it here, or read it in this repository's own source. Every code claim
  carries a `file:line`; every number carries a script in `data/london-migration/`.
- **cited** means a named external source asserts it, with a URL and a fetch date in the sources table.
- **wave 1** or **R6** or **R8** means that report established it and this one repeats it without re-measuring.
- **UNVERIFIED** means it could not be established and is recorded as open.

**Tool path.** `codegraph_explore` is configured for the main checkout and returns "not indexed" for this worktree,
so every code fact was read directly from source here and cited by line. `adhan@4.4.6` ran in the scratch tree at
`/Users/muji/athan-global-scratch/r13/`, never in the repository. The London Prayer Times API was **not called**:
wave 1's captured year at `ai/features/moonsighting/data/london/lpt-2026.json` is the reference throughout, and the
owner's key was neither read nor needed. Web reads went through the `tinyfish` MCP, and fifty published `.xlsx`
files were fetched with `curl` from a public download page that requires no key. Nobody was contacted.

**Every script in `data/london-migration/` was run twice and produced byte-identical output.** Parts 1, 1b, 2, 2c
through 2i reproduced exactly on a second independent run.

---

## Findings in one page

1. **No computed configuration is close enough, and the negative is decisive.** A search of **29,781
   configurations** (every Fajr angle 8 to 20 in half-degree steps against every Isha angle and every Isha interval
   45 to 135 minutes, three high-latitude rules, three London coordinate points, three rounding rules, each given a
   per-field integer offset fitted to London's own digits) reached **1,733 of 2,190 values within 1 minute, 79.1%,
   with 9 minutes of worst error** (measured). On Fajr the best any configuration reached was **182 of 365 within 1
   minute, 49.9%**, and on Isha **164 of 365, 44.9%** (measured). R6's category-4 classification is confirmed by a
   far wider search than R6 ran.
2. **`MoonsightingCommittee` is the closest preset and still moves a London user's times on most days.** Fajr **41
   of 365 exact, 11.2%**, range -6 to +7; Isha **4 of 365 exact, 1.1%**, range -11 to +4 (measured, best
   coordinates and rounding). That reproduces wave 1's -7 to +6 and -4 to +11 independently, at finer resolution.
   `MuslimWorldLeague` is worse by an order of magnitude: its Fajr is **0 of 365 within 2 minutes under every
   high-latitude rule**, with 132 minutes of worst error under `MiddleOfTheNight` (measured).
3. **The Wifaqul Ulama parameters R1 measured do not reproduce London either.** Fajr 18, Isha 15 above 48 degrees,
   Zuhr Istiwa+4, Maghrib sunset+5: Fajr **0 or 6 of 365 exact** depending on the high-latitude rule, worst 132
   minutes; Isha at best **22 of 365 exact, 6.0%** (measured). Two British authorities, both sincere, and their
   published times are nowhere near each other.
4. **London's interval table is real, it is 732 bytes for a full leap-capable year, and it does not expire.** R6's
   finding is confirmed and extended across every year the repository holds: the Fajr interval is **identical on 365
   of 365 shared days for every consecutive era-B pair from 2015 to 2026**, and the Isha interval on 361 to 365
   (measured). Era A, 2012 to 2014, is a different timetable entirely: only **31 of 365** Fajr intervals match era B
   (measured).
5. **The four differing days are 06-16 through 06-19, and one more the programme had not found: 03-31 in 2020.**
   R6 named four; this report names five slots that ever move inside era B, and gives the value in every year
   (measured, `part2.txt` section 2.4).
6. **THE CRUX IS ANSWERED, AND THE ANSWER IS YES: London can be fully offline, permanently.** The intervals against
   a **computed** sun reproduce the published Fajr on **364 of 365 days and the Isha on 362 of 365 in 2026, with
   every miss exactly 1 minute** (measured, `51.5,-0.165`, nearest rounding). Across all nine era-B years: **5,885
   of 6,570 exact, 89.6%, worst error 2 minutes, and only 2 values of 6,570 outside 1 minute** (measured).
7. **And then the evidence got much stronger than that.** The timetable's own publisher, credited by name on East
   London Mosque's prayer-times page, **publishes fifty future years as downloadable `.xlsx` files, 2027 to 2076**
   (cited, `londonsalahtimes.com/downloads/`). All fifty were fetched and parsed: **18,263 days, 127,841 published
   values** (measured). Its **2027 interval table reproduces all fifty published years exactly: Fajr 18,250 of
   18,250 and Isha 18,250 of 18,250, worst error 0** (measured). The app's own 2026 table reaches Fajr 100% and
   Isha 98.9% on the same corpus, worst error 1 minute (measured).
8. **The publisher publishes its own equations, and they ARE the generator.** Its technical page prints every Meeus
   equation it uses and its own coordinates, Charing Cross 51.5073 N 0.12755 W (cited). Transcribed and run, those
   equations plus the 732-byte interval table reproduce **127,838 of 127,841 published values across the fifty
   future years exactly, 99.998%, with all 127,841 within 1 minute and nothing beyond** (measured). Four of the
   seven fields are **100.000% exact on 18,263 of 18,263 days**. This is no longer a reconstruction that
   approximates London. It is London.
9. **A provider outage is survivable, and the fallback is already public.** Fifty published years cost **10,290
   bytes brotli** as packed minutes, or **0.015% of the 67 MB release bundle** (measured). Ten years cost 6,320
   bytes. If `londonprayertimes.com` vanished tomorrow, a shipped copy of the publisher's own fifty years serves
   every existing London user until 2077 with no network, no key and no computation, and every digit is the
   authority's own.
10. **The provider has already changed the Asr margin, and it lands in 2027 whatever this app does.** Every ELM
    timetable from 2015 to 2026 fits an Asr margin of **+0.3 to +0.4 minutes**; every published year from 2027 to
    2076 fits **+2.0** (measured). The publisher's technical page documents "'Asr: 2 minutes later" (cited), so the
    new years follow the published rule and the old ones did not. Measured against the same calendar slots, the
    London user's Asr moves **+1 minute on 166 days, +2 on 195 and +3 on 4** between 2026 and 2027 (measured).
    **This is the provider's change, not the app's, and v2.0 must not be blamed for it.**
11. **The app's Asr comment is confirmed backwards, and the fix is a comment only.** `shared/types.ts:25` documents
    `asr` as Hanafi; measured, `asr` is Mithl 1, reproduced by `adhan`'s **Shafi** madhab at 149 of 365 exact
    against 0 of 365 for Hanafi (measured). The gap between the two published columns is **29 to 75 minutes**,
    stable across all 18,263 future days (measured). Correcting the comment changes no user-visible behaviour.
12. **The MMKV key is the largest silent risk and R8 is right about it, but the sharpest edge is elsewhere.** The
    `ScheduledNotification` record (`shared/notifications.ts:17-24`) carries `date` and `time` but **the sweep
    compares identifiers only** (`shared/notifications.ts:214-221`). An identifier is
    `athan_${scheduleType}_${name}_${date}` (`device/notifications.ts:50`), which has **no time in it**. So an
    alarm armed on the old source's 05:18 and an alarm wanted at the new source's 05:11 are the same identifier,
    the sweep sees nothing stale, and **a source change that moves times without re-arming leaves the phone
    silently firing the old instants**.
13. **The upgrade invariant is expressible and testable in one line.** For an install with cached `prayer_*` days,
    every `preference_*` key, every `prayer_max_english_width_*` key, and every stored `prayer_${date}` record must
    be **byte-identical** before and after upgrade, and the set of OS pending notification identifiers with their
    trigger instants must be **unchanged**. A capture-upgrade-capture test over a real MMKV file proves it; the
    test that would catch a regression is spelled out in section 4.6.
14. **Option 2 is right and R8's explicit pin is right.** London becomes one source among many, still serving the
    same published timetable, pinned explicitly for every existing install. Option 1 forfeits the abstraction the
    rest of the programme needs. Option 3 offers the user a choice between a faithful timetable and a demonstrably
    worse computation of it, which is a question the app should answer rather than ask. **I agree with R8 on the
    explicit pin, and finding 12 makes it load-bearing rather than merely prudent.**

---

## 1. What a London user would lose under every candidate source

**The reference.** `ai/features/moonsighting/data/london/lpt-2026.json`, the app's own current source, captured once
by wave 1 with the owner's key. 365 days, 2026-01-01 to 2026-12-31, no gaps, every value `HH:mm`. Six fields per day,
2,190 values. Confirmed against the ELM 2026 PDF: **2,555 of 2,555 cells identical** (measured, `part3.txt` 3.7).

**Method.** Every candidate was computed with `adhan@4.4.6` at `Rounding.None`, then rounded by each of nearest, up
and down, and the best rounding rule per candidate is reported. R6 established that adhan's internal rounding is
the single largest source of apparent disagreement with an authority, so leaving it on would have flattered nothing
and blamed the library. Script `part1.mjs`, output `part1.txt`.

### 1.1 Per prayer, per candidate

Delta is candidate minus published, whole minutes. All measured.

| Candidate | Prayer | Exact | Within 1 min | Within 2 min | Range | Worst | Mean | SD |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| `MoonsightingCommittee`, Shafi, 51.5072 -0.1276, nearest | Fajr | 41 (11.2%) | 108 (29.6%) | 166 (45.5%) | -6 to +7 | 7 | +0.78 | 3.30 |
| | Sunrise | 0 (0.0%) | 0 (0.0%) | 54 (14.8%) | +2 to +3 | 3 | +2.85 | 0.36 |
| | Dhuhr | 315 (86.3%) | **365 (100%)** | 365 (100%) | -1 to 0 | 1 | -0.14 | 0.34 |
| | Asr | 149 (40.8%) | 328 (89.9%) | **365 (100%)** | -2 to +1 | 2 | -0.41 | 0.85 |
| | Maghrib | 308 (84.4%) | **365 (100%)** | 365 (100%) | -1 to 0 | 1 | -0.16 | 0.36 |
| | **Isha** | **4 (1.1%)** | **36 (9.9%)** | 92 (25.2%) | **-11 to +4** | **11** | -4.08 | 3.22 |
| `MoonsightingCommittee`, Shafi, 51.5 -0.165, nearest | Fajr | 43 (11.8%) | 103 (28.2%) | 160 (43.8%) | -5 to +7 | 7 | +0.94 | 3.31 |
| | Sunrise | 0 (0.0%) | 0 (0.0%) | 1 (0.3%) | +2 to +3 | 3 | +3.00 | 0.05 |
| | Dhuhr | 363 (99.5%) | 365 (100%) | 365 (100%) | -1 to +1 | 1 | 0.00 | 0.07 |
| | Asr | 144 (39.5%) | 347 (95.1%) | 365 (100%) | -2 to +1 | 2 | -0.25 | 0.83 |
| | Maghrib | 362 (99.2%) | 365 (100%) | 365 (100%) | -1 to +1 | 1 | -0.00 | 0.09 |
| | **Isha** | **3 (0.8%)** | **47 (12.9%)** | 97 (26.6%) | **-11 to +4** | **11** | -3.89 | 3.21 |
| `MuslimWorldLeague`, Shafi, `MiddleOfTheNight`, nearest | **Fajr** | **0** | **0** | **0** | **-132 to -11** | **132** | -41.40 | 35.83 |
| | Sunrise | 0 | 0 | 54 (14.8%) | +2 to +3 | 3 | +2.85 | 0.36 |
| | Dhuhr | 0 | 0 | 0 | -5 to -4 | 5 | -4.14 | 0.34 |
| | Asr | 149 (40.8%) | 328 (89.9%) | 365 (100%) | -2 to +1 | 2 | -0.41 | 0.85 |
| | Maghrib | 0 | 0 | 0 | -4 to -3 | 4 | -3.16 | 0.36 |
| | **Isha** | **0** | **0** | **0** | **+9 to +164** | **164** | +51.19 | 47.30 |
| `MuslimWorldLeague`, Shafi, `SeventhOfTheNight`, nearest | Fajr | 6 (1.6%) | 17 (4.7%) | 26 (7.1%) | -24 to +61 | 61 | +6.36 | 26.34 |
| | Isha | 5 (1.4%) | 11 (3.0%) | 20 (5.5%) | -21 to +25 | 25 | +9.24 | 11.23 |
| `MuslimWorldLeague`, Shafi, `TwilightAngle`, nearest | Fajr | 0 | 0 | 0 | -57 to -9 | 57 | -23.66 | 11.95 |
| | Isha | 0 | 0 | 0 | +9 to +82 | 82 | +34.47 | 20.94 |
| Wifaqul Ulama 18/15, `MiddleOfTheNight`, up | **Fajr** | **0** | **0** | **0** | **-132 to -10** | **132** | -40.90 | 35.84 |
| | Sunrise | 0 | 0 | 0 | +3 to +4 | 4 | +3.33 | 0.47 |
| | Dhuhr | 126 (34.5%) | 365 (100%) | 365 (100%) | -1 to 0 | 1 | -0.65 | 0.48 |
| | Asr | 124 (34.0%) | 363 (99.5%) | 365 (100%) | -2 to +1 | 2 | +0.08 | 0.82 |
| | Maghrib | 0 | 0 | 252 (69.0%) | +2 to +3 | 3 | +2.31 | 0.46 |
| | **Isha** | **15 (4.1%)** | 38 (10.4%) | 77 (21.1%) | **-3 to +127** | **127** | +30.94 | 36.43 |
| Wifaqul Ulama 18/15, `SeventhOfTheNight`, up | Fajr | 6 (1.6%) | 17 (4.7%) | 27 (7.4%) | -23 to +61 | 61 | +6.89 | 26.37 |
| | **Isha** | **22 (6.0%)** | 52 (14.2%) | 92 (25.2%) | -21 to +19 | 21 | +3.12 | 8.73 |
| Wifaqul Ulama 18/15, `TwilightAngle`, up | Fajr | 0 | 0 | 0 | -57 to -8 | 57 | -23.18 | 11.97 |
| | Isha | 15 (4.1%) | 38 (10.4%) | 77 (21.1%) | -3 to +63 | 63 | +19.95 | 18.84 |

**The Wifaqul Ulama parameters are R1's own measured reading of the body's published FAQ**, applied faithfully:
Fajr 18, Isha 15 because London at 51.5 is above the 48-degree threshold the body's 11 November 2018 Preston ruling
sets, Zuhr at Istiwa + 4, Maghrib at astronomical sunset + 5, and both Asr factors. Its Dhuhr and Asr land where
London's do, to 1 and 2 minutes. Its Fajr and Isha do not come close. **Two British authorities, and the distance
between them is larger than the distance between London and the Moonsighting Committee.**

### 1.2 The Isha distribution, which is where the damage is

`MoonsightingCommittee` at 51.5 -0.165, Isha, all 365 days (measured, `part1.txt` section 3):

| Delta | -11 | -10 | -9 | -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | +1 | +2 | +3 | +4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Days | 2 | 6 | 6 | 20 | 38 | 59 | 62 | 29 | 21 | 43 | 34 | **3** | 10 | 7 | 20 | 5 |

**On 193 of 365 days the computed Isha is 5 or more minutes early, and on 318 of 365 it is more than a minute out**
(measured). A user who has been praying Isha at the London time for years would, on upgrading, find their Isha alarm
moved earlier by five to eleven minutes for more than half the year.
Section 4.3's trust finding from R8 is the exact shape of what follows: "my muslim pro app changed the fajr time
back 16 minutes from yesterday. my whole family was freaking out."

### 1.3 The best computed configuration that exists, searched

**Method.** 29,781 configurations, each given every advantage available:

- Family A, a pure angle pair: every Fajr angle from 8 to 20 in 0.5-degree steps against every Isha angle in the
  same range, 625 pairs.
- Family B, an angle Fajr with an interval Isha, which is what London's Isha structurally is: every Fajr angle 8 to
  20 against every Isha interval 45 to 135 minutes in 5-minute steps, 475 pairs.
- Family C, the Moonsighting Committee's own seasonal function, all three shafaq variants.
- Each crossed with three high-latitude rules, three coordinate points and three rounding rules.
- **And each field additionally given the single integer offset, searched over -180 to +180, that maximises its own
  fit against London's own published digits.** That is R6's Model A correction, fitted on the target.

So these numbers are an **upper bound on what any computed source could ever achieve at London**, not an estimate.
Script `part1b.mjs`, output `part1b.txt`.

**Best overall, maximising values within 1 minute:** `moonsighting shafaq=general`, `MiddleOfTheNight`, 51.5
-0.1275, round up.

| Field | Fitted offset | Exact | Within 1 min | Within 2 min | Worst |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fajr | 0 | 47 (12.9%) | 112 (30.7%) | 165 (45.2%) | 7 |
| Sunrise | -3 | 245 (67.1%) | **365 (100%)** | 365 (100%) | 1 |
| Dhuhr | 0 | 239 (65.5%) | **365 (100%)** | 365 (100%) | 1 |
| Asr | 0 | 125 (34.2%) | 363 (99.5%) | 365 (100%) | 2 |
| Maghrib | 0 | 253 (69.3%) | **365 (100%)** | 365 (100%) | 1 |
| Isha | +5 | 60 (16.4%) | 163 (44.7%) | 214 (58.6%) | **9** |
| **Total** | | **969 of 2,190 (44.2%)** | **1,733 of 2,190 (79.1%)** | | **9** |

**Per-field ceiling**, the best any single configuration achieved on that field alone. These cannot be had at once;
each is a different configuration (measured):

| Field | Best within 1 min | Exact | Worst | The configuration that achieved it |
| --- | ---: | ---: | ---: | --- |
| **Fajr** | **182 (49.9%)** | 49 | 8 | offset -40, Fajr 9 / Isha 8, `MiddleOfTheNight`, 51.5 -0.1275, up |
| Sunrise | 365 (100%) | 364 | 1 | offset -3, `MiddleOfTheNight`, 51.5 -0.165, nearest |
| Dhuhr | 365 (100%) | 363 | 1 | offset +5, same |
| Asr | 363 (99.5%) | 125 | 2 | offset 0, 51.5 -0.1275, up |
| Maghrib | 365 (100%) | 362 | 1 | offset +3, 51.5 -0.165, nearest |
| **Isha** | **164 (44.9%)** | 60 | 9 | offset +6, `moonsighting shafaq=general`, 51.5072 -0.1276, down |

Note what the ceilings say. The four astronomically determined fields reach **100% within 1 minute** with the
offsets -3, +5, 0 and +3, which are exactly the margins the publisher documents. **Fajr and Isha cannot pass 50%
within 1 minute under any configuration searched**, and the Fajr ceiling is reached by an absurd fit: a 9-degree
Fajr angle with a -40 minute offset, which is not a convention anyone holds.

### 1.4 The plain answer

**No computed configuration is close enough that a London user would not notice.**

The best available moves Isha by more than 1 minute on **202 of 365 days** and by 5 or more minutes on **193 of 365**
under the closest named preset, and no configuration reaches half the year within a minute on either Fajr or Isha. **R6's category-4 finding
is confirmed by a search two orders of magnitude wider than R6 ran**, and the reason is structural rather than a
tuning failure: London's Fajr and Isha are 1989 Blackburn observation intervals applied to a published sunrise and
Maghrib, with hand edits. There is no angle that is an interval, and no seasonal curve reaches a hand edit.

**This is a decision-settling negative.** The app must not compute London's Fajr and Isha, now or ever. The next
section shows that it does not have to.

### 1.5 The Asr column, settled

Wave 1 found the app's type comments reversed. Measured here on all 365 days of 2026 (`part1.txt` section 4):

| adhan madhab | Against published `asr` | Against published `asr_2` |
| --- | --- | --- |
| **Shafi** (factor 1) | **149 of 365 exact (40.8%)**, 89.9% within 1 min, range -2 to +1 | 0 of 365, range -76 to -30, mean -52.01 |
| **Hanafi** (factor 2) | 0 of 365, range +29 to +75, mean +51.02 | **168 of 365 exact (46.0%)**, 96.2% within 1 min, range -2 to 0 |

`asr` is **Mithl 1, the Shafi one-shadow time**. `asr_2` is **Mithl 2, the Hanafi two-shadow time**. The app
displays `asr` (`shared/prayer.ts:83`) and `shared/types.ts:25` calls it "Hanafi calculation". The comment is
backwards. The publisher's own live site labels the two columns "'Asr 1 (Shāfi'ī and others)" and "'Asr 2 (Hanafī)"
(cited), which closes it from the source's own words as well as from the digits.

---

## 2. The encoding that reproduces London exactly

### 2.1 What the interval table is

East London Mosque publishes the rules in its own words (cited, read in full):

> "Fajr ... The daybreak time is based on the work of Hizbul Ulama. The sunrise time is taken from His Majesty's
> Nautical Almanac Office (HMNAO), with 3 minutes taken off for safety to allow coverage of the whole M25 region."
> "Zuhr ... taken from HMNAO, with 5 minutes added" "'Asr ... Mithl 1 and Mithl 2 ... taken from HMNAO" "Maghrib
> ... taken from HMNAO, with 3 minutes added for safety" "'Ishā ... based on the work of Hizbul Ulama."

So the two Hizbul Ulama rows are intervals against the other rows, and the interval table is:

```
fajrInterval[slot] = (published sunrise + 3) - published Fajr
ishaInterval[slot] = published Isha - (published Maghrib - 3)
```

The `+3` and `-3` undo the published safety margins, so the intervals are measured against the true sun, which is
what Hizbul Ulama observed. Script `part2.mjs`, output `part2.txt`.

### 2.2 The table across every year the repository holds

`ai/features/moonsighting/data/london/` holds twelve ELM timetables. All measured:

| Year | Days | Fajr distinct values | Fajr range | Isha distinct values | Isha range |
| --- | ---: | ---: | --- | ---: | --- |
| 2012 | 366 | 28 | 96 to 123 | 38 | 69 to 106 |
| 2013 | 365 | 28 | 96 to 123 | 38 | 69 to 106 |
| 2014 | 365 | 28 | 96 to 123 | 38 | 69 to 106 |
| 2015 | 365 | **35** | **90 to 124** | **35** | **66 to 100** |
| 2017, 2018, 2019, 2021, 2022, 2025, 2026 | 365 each | 35 | 90 to 124 | 35 | 66 to 100 |
| 2020 | 366 | 35 | 90 to 124 | 35 | 66 to 100 |
| 2026, the app's own API capture | 365 | 35 | 90 to 124 | 35 | 66 to 100 |

The 2012 and 2020 rows are leap years; every other row is 365 days. The **era A to era B break at 2015 is visible in
this table alone**: the distinct-value count and both ranges change together, which a year of drift could not do.

**Year-over-year identity** (measured, `part2.txt` 2.3):

| Pair | Common days | Fajr identical | Isha identical | Isha days that differ |
| --- | ---: | ---: | ---: | --- |
| 2012 vs 2013 | 365 | 239 (65.5%) | 220 (60.3%) | 145 days |
| 2013 vs 2014 | 365 | **365 (100%)** | **365 (100%)** | none |
| **2014 vs 2015** | 365 | **31 (8.5%)** | **23 (6.3%)** | **342 days** |
| 2015 vs 2017 | 365 | **365 (100%)** | **365 (100%)** | none |
| 2017 vs 2018 | 365 | 365 (100%) | 365 (100%) | none |
| 2018 vs 2019 | 365 | 365 (100%) | 365 (100%) | none |
| 2019 vs 2020 | 365 | 365 (100%) | 363 (99.5%) | 03-31, 06-16 |
| 2020 vs 2021 | 365 | 365 (100%) | 363 (99.5%) | 03-31, 06-16 |
| 2021 vs 2022 | 365 | 365 (100%) | 365 (100%) | none |
| 2022 vs 2025 | 365 | 365 (100%) | 361 (98.9%) | 06-16, 06-17, 06-18, 06-19 |
| 2025 vs 2026 | 365 | **365 (100%)** | **365 (100%)** | none |

**The 2014-to-2015 break is era A becoming era B**, which wave 1 dated to between 20 December 2014 and 9 January
2015 from Wayback snapshots. It is not drift; it is a different timetable. Measured directly: the 2026 table on
2012 reproduces **33 of 365** Fajr intervals and **29 of 365** Isha (measured, `part2.txt` 2.5). Any shipped table
covers era B and says so.

### 2.3 Exactly which days differ inside era B, and why

R6 said four June days. **Measured here: five slots, and R6 missed 03-31 in 2020** (`part2.txt` 2.4). Across the
nine era-B years the repository holds:

| Slot | Fajr interval | Isha interval by year |
| --- | ---: | --- |
| **03-31** | 95, constant | 2015 **80**, 2017 80, 2018 80, 2019 80, **2020 79**, 2021 80, 2022 80, 2025 80, 2026 80 |
| **06-16** | 124, constant | 2015 **83**, 2017 83, 2018 83, 2019 83, **2020 84**, 2021 83, 2022 83, **2025 84, 2026 84** |
| **06-17** | 124, constant | 2015 83 ... 2022 83, **2025 84, 2026 84** |
| **06-18** | 124, constant | 2015 82 ... 2022 82, **2025 83, 2026 83** |
| **06-19** | 124, constant | 2015 82 ... 2022 82, **2025 83, 2026 83** |

**Five slots of 365, and the Fajr column never moves at all in eleven years.** Wave 1 documented 21 edited Isha
slots against the Miftahi book; those edits are constant across every era-B year, so they are part of the table
rather than a source of drift. The five slots above are the only places London's own value has changed since 2015.
The **why** is UNVERIFIED: wave 1 searched every ELM timetable and calendar PDF from 2012 to 2026, the ELM
explainer, Noor Ul Islam, the ICC, Hizbul Ulama's articles and moonsighting.com, and found no documented basis for
any edit. This report adds the observation that 2020's 03-31 and 06-16 both reverted in 2021, which looks like a
one-year correction rather than a policy change, but that reading is UNVERIFIED.

### 2.4 THE CRUX: do the intervals work against a computed sun?

This is the question the brief calls the crux, and the answer is **yes**.

**The computed sun.** `adhan@4.4.6` at `Rounding.None`, then rounded half-up. Only sunrise, transit and sunset are
read, so the Fajr and Isha angles of the method are irrelevant. **One trap, measured:** a named `CalculationMethod`
ships its own `methodAdjustments`, and `MuslimWorldLeague()` carries `dhuhr: 1` while `MoonsightingCommittee()`
carries `dhuhr: 5, maghrib: 3` (measured, `adhan` 4.4.6). Using a named method silently adds its margin on top of
the publisher's documented one, which cost this report an hour and a wrong Dhuhr table before it was found. A bare
`new adhan.CalculationParameters('Other', 18, 17)` carries none.

**Result on 2026, the app's own captured year** (measured, `part2.txt` 2.6):

| Coordinates | Rounding | Fajr exact | Fajr within 1 | Worst | Isha exact | Isha within 1 | Worst |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **51.5, -0.165** (Hizbul Ulama LONDON point) | nearest | **364/365** | **365** | **1** | **362/365** | **365** | **1** |
| 51.5072, -0.1276 (generic London) | nearest | 311/365 | 365 | 1 | 308/365 | 365 | 1 |
| 51.5, -0.1275 | nearest | 308/365 | 365 | 1 | 308/365 | 365 | 1 |
| 51.5, -0.1167 (51:30N 0:07W) | nearest | 294/365 | 365 | 1 | 295/365 | 365 | 1 |

At the best point the four misses are `2026-06-03 +1`, `2026-09-05 -1`, `2026-09-11 -1`, `2026-12-04 -1`.

**Across all nine era-B years** (measured, `part2b.txt` 2b.2, same point and rounding):

| Measure | Value |
| --- | --- |
| Days | 3,285 |
| Values | 6,570 |
| Fajr exact | 2,978 of 3,285 (90.65%) |
| Isha exact | 2,907 of 3,285 (88.49%) |
| **Combined exact** | **5,885 of 6,570 (89.57%)** |
| **Worst error anywhere** | **2 minutes** |
| **Values outside 1 minute** | **2 of 6,570** |

**Every miss is a rounding-boundary coin flip, and that is measured rather than asserted.** Of 6,572 computed sun
events, **117 lie within 0.01 minutes, 0.6 seconds, of a half-minute boundary** (measured, `part2b.txt` 2b.4). With
a per-era fitted coordinate point and per-year table, era B1 gives **46 misses of 4,382 values, of which 28 land
exactly on the half-minute tie and 44 within one second of it**; era B2 gives **23 of 2,190, ten exactly on the
tie, 21 within a second** (measured, `part2d.txt`). One miss in eleven years sits further out than 10 seconds:
`2020-03-31` sunset, at 19 seconds. **ELM says these times come from HMNAO, whose calculation is not public and
whose service returned HTTP 503 to wave 1, so the last second of agreement can only come from HMNAO's own values.**

**The answer, stated plainly. The intervals work against a computed sun. London can be fully offline.** The gap is
1 minute on about 10% of days, it is a half-minute rounding tie rather than a modelling error, and section 2.6
shows that against the publisher's own equations it very nearly vanishes.

### 2.5 The fifty published future years, which the programme had not found

**This is the strongest new evidence in the report.** East London Mosque's own prayer-times page carries the line
"Prayer times produced by London Salah Times" (cited). That publisher has a downloads page offering the **annual
timetable as an `.xlsx` for every year from 2027 to 2076** (cited, `londonsalahtimes.com/downloads/`). All fifty
were fetched with `curl`, no key, and parsed from the 24-hour sheet with a Node-built-ins-only zip reader
(`xlsx.mjs`) so the parse is auditable. **18,263 days, 127,841 published values** (measured). The workbook's own
header reads "times & dates valid when generated in July 2026" and its internal path is
`ELM/Prayer timetables and calendar/London Unified Prayer Timetable/Generated years/`.

**Does one interval table reproduce all fifty?** (measured, `part3.txt` 3.1 and 3.2)

| Table shipped | Corpus | Fajr exact | Isha exact | Worst |
| --- | --- | ---: | ---: | ---: |
| The app's own 2026 API capture | `.xlsx` 2027 to 2076 | **18,250/18,250 (100.000%)** | 18,050/18,250 (98.904%) | 1 |
| **The publisher's 2027 year** | `.xlsx` 2027 to 2076 | **18,250/18,250 (100.000%)** | **18,250/18,250 (100.000%)** | **0** |
| The publisher's 2027 year | ELM PDFs 2015 to 2026 | 3,285/3,285 (100.0%) | 3,263/3,285 (99.3%) | 1 |
| The app's own 2026 API capture | ELM PDFs 2015 to 2026 | 3,285/3,285 (100.0%) | 3,257/3,285 (99.1%) | 1 |
| Either table | ELM PDFs 2012 to 2014 (era A) | 95/1,095 (8.7%) | 75/1,095 (6.8%) | 26 |

The 2026 table's 200 Isha misses are **exactly four slots, each missing in all fifty years**: 06-17, 06-18, 06-19
and 11-29 (measured). Those are the 2025-and-2026 June edits reverting to the book's values, plus 11-29 reverting.
So the right table to ship is **2027's**, and it is exact for fifty years.

**29 February is settled and needs no interpolation.** Thirteen leap years appear in the corpus, and the 02-29 pair
is **Fajr 100, Isha 89 in all thirteen** (measured, `part3.txt` 3.3). One slot taken from any published leap year
closes it. Nothing is averaged or invented, which the never-substitute rule requires.

**The hand edits survive** (measured, `part3.txt` 3.6). At the slots wave 1 documented, the London value rather than
the book's is present in **50 of 50 future years** for 02-01, 04-29, 04-30 and the whole 05-01 to 05-12 run,
including the flat 74 that removes the book's printed Abyad-to-Ahmer dip. **Two reversions to the book's own value
occur, and they are exactly the four slots the 2026 table misses plus 11-29**: 06-17, 06-18 and 06-19 return to the
book's 83, 82 and 82, and 11-29 returns to the book's 100 from London's 99. So the generated years are London's own
timetable, carrying its own history, with two deliberate-looking corrections applied.

### 2.6 The publisher publishes its own equations, and they are the generator

The publisher's technical page prints **every Meeus equation it uses**, its own coordinates, and its own margins
(cited, `londonsalahtimes.com/technical`, read in full):

> "Latitude and longitude for Charing Cross: 51.5073°N, 0.12755°W." "Sunrise: 3 minutes earlier · 'Asr: 2 minutes
> later · Sunset: 3 minutes later" "Zuhr: 5 minutes later" "The times for Fajr and 'Ishā are based on the UK
> observations of Hizbul Ulama; they determined the times between Fajr and sunrise, and between sunset and 'Ishā."

That last sentence is the interval model, in the publisher's own words. Its equations were transcribed line by line
and run (`part3d.mjs`, `part3e.mjs`), as a measuring instrument only. **The residual is bounded in [-0.5, +0.5]
minutes with mean 0.0000 across all fifty future years on sunrise, Dhuhr, Maghrib and Asr** (measured,
`part3d.txt` 3d.3). A residual that is pure sub-minute rounding with zero mean is the signature of the same
calculation, not a close one.

**The complete offline reconstruction, all seven published fields, fifty published years, nothing fetched**
(measured, `part3e.txt` 3e.1). Inputs: the 366-slot interval table, 732 bytes, and the publisher's own equations.

| Field | n | Exact | Within 1 min | Worst | Beyond 1 min |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fajr | 18,263 | 18,262 (99.995%) | 18,263 (100.000%) | 1 | 0 |
| Sunrise | 18,263 | 18,262 (99.995%) | 18,263 (100.000%) | 1 | 0 |
| Dhuhr | 18,263 | 18,262 (99.995%) | 18,263 (100.000%) | 1 | 0 |
| **Asr (Mithl 1)** | 18,263 | **18,263 (100.000%)** | 18,263 (100.000%) | **0** | 0 |
| **Asr 2 (Mithl 2)** | 18,263 | **18,263 (100.000%)** | 18,263 (100.000%) | **0** | 0 |
| **Maghrib** | 18,263 | **18,263 (100.000%)** | 18,263 (100.000%) | **0** | 0 |
| **Isha** | 18,263 | **18,263 (100.000%)** | 18,263 (100.000%) | **0** | 0 |
| **All seven** | **127,841** | **127,838 (99.998%)** | **127,841 (100.000%)** | **1** | **0** |

Three values out of 127,841 are 1 minute out, all on the same day, all traceable to one half-minute tie. **Nothing
is beyond 1 minute. Four of the seven fields are exact on every one of 18,263 days.**

For the years the app's users have actually lived through, the 2027 table plus `adhan`'s sun and the documented
margins against the ELM PDFs 2015 to 2026 gives **15,353 of 16,430 sun-derived values exact, 93.44%, and 16,429 of
16,430 within 1 minute, with one value 2 minutes out** (measured, `part3c.txt` 3c.2, Charing Cross). The older years
score lower on exact matches than the future years for the reason the next section gives: the generator changed, and
the published years from 2027 follow the documented rules while the earlier ones did not.

**One point of care about the two exact rates.** Against `adhan`'s sun the future years reproduce at 63% exact and
100% within 1 minute (`part3c.txt` 3c.1); against the publisher's own transcribed equations they reproduce at 99.998%
exact. The difference is not accuracy, it is which solar routine is being compared: `adhan` and the publisher's Meeus
transcription agree to a fraction of a minute, and half of those fractions fall on opposite sides of a rounding
boundary. **Both are within 1 minute on every one of 18,263 days, and that is the number a minute-resolution app
lives on.**

**The verdict on the crux, without hedging. London can be fully offline and permanent.** A 732-byte interval table
plus the publisher's own published equations reproduce fifty years of the authority's own timetable with nothing
beyond 1 minute and four fields exact throughout. It does not expire in 2077 either, because the equations are
Meeus and the intervals are a 1989 observation chart; 2077 is only where the published cross-check runs out.

### 2.7 The provider has already changed its Asr margin

This fell out of the corpus and it matters to a London user more than anything else in this report.

The publisher documents "'Asr: 2 minutes later". **Measured, mean (published Asr minus computed Asr) per published
year** (`part3e.txt` 3e.2):

| Source | Mithl 1 margin | Mithl 2 margin |
| --- | ---: | ---: |
| ELM PDF 2015 | +0.314 | +0.404 |
| ELM PDF 2017 | +0.279 | +0.432 |
| ELM PDF 2018 | +0.279 | +0.449 |
| ELM PDF 2019 | +0.304 | +0.419 |
| ELM PDF 2020 | +0.294 | +0.446 |
| ELM PDF 2021 | +0.298 | +0.432 |
| ELM PDF 2022 | +0.411 | +0.588 |
| ELM PDF 2025 | +0.436 | +0.565 |
| ELM PDF 2026 | +0.417 | +0.616 |
| **app API 2026** | **+0.417** | **+0.616** |
| **`.xlsx` 2027** | **+1.983** | **+1.997** |
| `.xlsx` 2028 | +1.994 | +2.032 |
| `.xlsx` 2035 | +1.981 | +2.014 |
| `.xlsx` 2050 | +1.995 | +1.983 |
| `.xlsx` 2076 | +1.990 | +2.027 |

The published years to 2026 carry **no Asr margin**; the years from 2027 carry **exactly the +2 the publisher
documents**. Against the same calendar slots with the sun's own drift removed, the London user's Asr moves
**+1 minute on 166 days, +2 on 195 and +3 on 4** (measured, `part3e.txt` 3e.3). The app's own captured 2026 year
and the ELM 2026 PDF agree with each other and with the publisher's live site on 2026-09-24, so this is not a
parse artefact: all three give Asr 16:08 for that day, and the 2027 file gives 16:11 for the same slot (measured).

**Two consequences, both important.**

1. **A London user's Asr changes in January 2027 whatever this app does.** It is the provider correcting its own
   output to its own documented rule. If v2.0 ships near that boundary, the app will be blamed for a change it did
   not make, and the honest-claim wording R8 drafts should be ready to explain it.
2. **It is direct evidence that a shipped interval table needs a documented margin set alongside it**, because the
   margins are the part that moved and the intervals are the part that did not. Ship them as separate, named,
   dated values, not baked into one number.

### 2.8 Byte cost, and whether it expires

All measured (`part3e.txt` 3e.4, `part3c.txt` 3c.4).

| What | Raw | gzip | brotli |
| --- | ---: | ---: | ---: |
| **The interval table, 366 slots, two uint8 arrays** | **732** | **352** | **246** |
| The same, run-length encoded (88 Fajr runs, 87 Isha runs) | 350 | 277 | **208** |
| Ten published years, 2027 to 2036, uint16 minutes | 51,142 | | 6,320 |
| **All fifty published years, uint16 minutes** | **255,682** | 22,409 | **10,290** |
| All fifty published years as JSON | 2,666,849 | 347,210 | 44,222 |
| One year as the app fetches it today | 92,372 (2026 API) / 53,291 (2027 `.xlsx` JSON) | 7,234 | |

Fajr intervals span 90 to 124 minutes and Isha 66 to 100, so **both fit uint8 with room to spare and the table
needs no encoding cleverness at all**. Fifty published years cost **0.200% of the app's 4.9 MB JS bundle and
0.0146% of the 67 MB release bundle** (measured, using R6's bundle figures).

**Does it expire?** The interval table does not: it is a 1989 observation chart, identical on every day of every
era-B year except five slots, and the five are documented above. The equations do not: they are Meeus 1998. **What
expires is the cross-check**, in 2077, and the margins, which already moved once in 2027 and could move again.
Section 6.4 turns that into a concrete drift detector.

---

## 3. What R6 got right, and the one thing to correct

Stated because R6 is the report this one was asked to verify.

| R6's claim | Verdict |
| --- | --- |
| London is the only category-4 source of eleven | **Confirmed, and strengthened.** A 29,781-configuration search does no better than 79.1% within 1 minute |
| Isha residual against 18 degrees spans 157 minutes | Consistent. Measured here: `MuslimWorldLeague`/`MiddleOfTheNight` Isha spans +9 to +164, a 156-minute range |
| Twenty harmonic terms leave 18 minutes of error | Not re-measured. R6's own figure stands |
| The interval columns cost 204 bytes brotli | **Confirmed to within 4 bytes.** Measured 208 brotli run-length encoded, 246 as two plain uint8 arrays, on a 366-slot table where R6 used 365 |
| 100% identical across 2019, 2022, 2025 and 2026 except four June days | **Confirmed for those four years, and extended to nine.** But see the next row |
| The four days are 06-16, 06-17, 06-18, 06-19 | **Incomplete.** Across all nine era-B years there are **five** slots that move, and the fifth is **03-31, in 2020 only**. R6 sampled four years and 2020's 03-31 edit reverted in 2021, so a four-year sample could not see it |
| The right correction for London is an interval table, not a residual table | **Confirmed, and it is better than R6 could show.** R6 could only test the intervals against the authority's own published sun. Against a computed sun they reach 89.6% exact over nine years, and against the publisher's own published equations 99.998% over fifty years |

---

## 4. The upgrade specification

Every line number measured in this worktree, branch `research/global-prayer-times`, app version `1.29.159`
(`package.json:3`).

### 4.1 The MMKV cache, and the key with no location in it

**What exists today.**

| Function | Where | Key |
| --- | --- | --- |
| `saveAllPrayers` | `stores/database.ts:136-145` | writes `prayer_${prayer.date}` at `:138` |
| `getPrayerByDateString` | `stores/database.ts:152-160` | reads `prayer_${date}` at `:153` |
| `getPrayerByDate` | `stores/database.ts:167-170` | resolves the day through `TimeUtils.formatDateShort`, which reads the London clock |
| `isTodayGapInStoredYear` | `stores/sync.ts:67-74` | scans `prayer_${year}-` by prefix at `:73` |
| `readStoredYear` | `stores/sync.ts:392-397` | `getAllWithPrefix('prayer_${year}-')` at `:393` |

**The risk, restated precisely.** The key carries a date and nothing else. There is no source, no city, no zone.
Every guard in the pipeline checks shape: `validateApiResponse` (`api/client.ts:39-45`) requires a non-empty
`times`; `validateApiTimes` (`api/client.ts:78-111`) checks each field against `TIME_PATTERN` (`:51`);
`isSameRecord` (`stores/sync.ts:110-115`) compares field values. **None of them has any concept of provenance**, so
a record written for city A is indistinguishable from one written for city B, and the app would serve it without a
single warning. R8 calls this the largest silent risk in the codebase and that assessment is correct.

**What must happen on upgrade to v2.0.** Two options, and the second is better.

| Option | What it does | Cost | Verdict |
| --- | --- | --- | --- |
| **A. Move the key and wipe** | Key becomes `prayer_${sourceId}_${date}`, `CACHE_SCHEMA_VERSION` bumps to 2, `cacheSchemaChanged()` (`stores/version.ts:166-180`) fires, `clearUpgradeCache()` (`:208-223`) wipes by whitelist, the next sync refetches | **The user has no timetable at all until the fetch completes.** The comment at `stores/version.ts:128-131` names this exact cost: "update overnight, open on a train, see nothing" | Correct but costly |
| **B. Move the key and migrate in place** | On first v2.0 launch, for every `prayer_YYYY-MM-DD` key found, write `prayer_london-prayer-times_YYYY-MM-DD` with the **same JSON bytes** and remove the old key. No wipe, no refetch. Stamp `CACHE_SCHEMA_VERSION = 2` after | One pass over `database.getAllKeys()`, which the app already does in `clearAllExcept` (`stores/database.ts:106-129`) and `getAllWithPrefix` (`:74-83`) | **Recommended.** The record's shape does not change, only its key, so the data is still correct under the new name by construction |

**Option B's exact preconditions**, each of which the codebase already satisfies:

1. The stored record shape (`ISingleApiResponseTransformed`, `shared/types.ts:108-122`) is unchanged, so no reshape
   is needed. If the shape ever changes in the same release, option A applies and B does not.
2. `markYearAsFetched` (`stores/database.ts:176-180`) writes a single `fetched_years` key holding a year map, with
   no source in it. That key must become `fetched_years_${sourceId}` or gain a source level, and it must be
   migrated in the same pass, **or** dropped. Dropping it is safe: its own comment at `stores/sync.ts:355-357`
   states "a marker may only vouch for days that are actually stored", and losing it costs one refetch attempt in
   December rather than any user-visible gap.
3. `isTodayGapInStoredYear` (`stores/sync.ts:67-74`) and `readStoredYear` (`:392-397`) both scan by prefix, so both
   prefixes must move together. A half-migrated state where the write moved and a read did not would make the app
   refetch a year it already holds, on every launch.
4. `replacePrayerCache`'s whitelist (`stores/sync.ts:358-372`) keeps `prayer_max_english_width_`, which **shares
   the `prayer_` prefix**. Any wipe or scan that reaches for `prayer_` must keep excluding it, exactly as the
   current whitelist does. This is a live trap: `clearPrefix('prayer_')` (`stores/database.ts:89-99`) would take
   the measured widths with it and visibly reflow the list.

**The source assignment, which is R8's rule and I endorse it** (`stores/version.ts:230-291` is where it belongs,
beside `migrateIndexKeyedAlertPreferences` at `:289`):

| Install state on first v2.0 launch | Source assigned |
| --- | --- |
| Any `prayer_*` key exists, or `app_installed_version` is set, and no source preference | **`london-prayer-times`, written explicitly.** Never negotiated from locale, never from GPS |
| No `app_installed_version` and no cached days | Fresh install: negotiate |

Use `app_installed_version` rather than the presence of cached days as the upgrade signal, because
`wasAppUpgraded()` (`stores/version.ts:82-109`) already treats a missing stored version as a first install, and
because a user whose cache was wiped by a previous upgrade is still an existing user.

### 4.2 The armed notifications, and the sharpest edge in the report

**What is armed.** Up to `NOTIFICATION_REQUEST_BUDGET = 64` OS requests (`shared/constants.ts:75`), chosen by
`buildSchedulePlan` (`shared/notifications.ts:268-283`) in time order, each row taken whole. The budget is an iOS
platform ceiling, not a knob: the comment at `shared/constants.ts:67-74` records that iOS keeps the 64
soonest-firing requests and silently discards the rest.

**What the app records about each.** `ScheduledNotification` (`shared/notifications.ts:17-24`):

```
{ id, date, time, englishName, arabicName, alertType }
```

Stored at `scheduled_notifications_${scheduleType}_${prayerIndex}_${id}` (`stores/database.ts:193`) and
`scheduled_reminders_...` (`:258`).

**The identifiers** (`device/notifications.ts:49-50` and `:61-66`):

```
athan_${scheduleType}_${englishName.toLowerCase()}_${date}
reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}
```

**Here is the edge.** `findStaleScheduledNotificationIds` (`shared/notifications.ts:214-221`) is the whole of the
sweep's comparison:

```
const recordedIds = new Set(dbRecords.map((record) => record.id));
return osIdentifiers.filter((identifier) => !recordedIds.has(identifier));
```

**It compares identifiers and nothing else.** The record carries a `time` field and the sweep never reads it. The
identifier carries a date and not a time. So:

- An alarm armed on London's Fajr 05:18 has identifier `athan_standard_fajr_2027-01-15`.
- An alarm wanted at a new source's Fajr 05:11 has **the same identifier**.
- The sweep finds nothing stale, because the identifier is present in both sets.

**Consequence.** If v2.0 ever changes a London user's times without explicitly re-arming, the phone goes on firing
the old instants and **no mechanism in the app detects it.** Same-identifier scheduling does replace in place, which
is what `stores/version.ts:190-193` relies on, so a **reschedule** fixes it. The danger is a path that changes
times without rescheduling.

**What protects the upgrade today, and why it is enough.** `handleAppUpgrade` (`stores/version.ts:230-291`) calls
`forceNotificationReschedule()` (`:194-201`) on **every** detected upgrade, wiped cache or not (`:258-263`). That
resets `preference_last_notification_schedule_check` through the atom, so the next foreground runs a full
reschedule and its sweep. **So an upgrade that keeps London's times needs nothing extra: the reschedule re-arms
the same identifiers at the same instants, and `stores/version.ts:190-193`'s comment is exactly right that "a
reschedule that finds nothing to change leaves no gap."**

**What must be added for a source CHANGE**, which is a different event:

1. Cancel by identifier before re-arming, rather than relying on replace-in-place. Replace-in-place is correct when
   the instant is unchanged; it is the failure mode when the instant moved and the app did not notice.
2. **Alternatively and better: give the sweep the time.** `findStaleScheduledNotificationIds` could compare the
   record's `time` against the OS trigger instead of only the identifier, which would make every future time-moving
   change self-healing. **The trigger is already readable and the app already reads it**: `getTriggerDate(request.trigger)`
   at `device/backgroundTaskDebug.ts:61`, over the same `getAllScheduledNotificationsAsync` result the sweep uses.
   So this is a small change to one pure function with an existing test surface, using a helper that exists, and it
   closes a class of bug rather than one instance.
3. Do **not** follow the comment at `stores/sync.ts:364-371`. It says the wipe deliberately keeps
   `scheduled_notifications_` and `scheduled_reminders_` because "Alarm records describe what the OS has armed,
   which a new timetable does not change." That is true of a new timetable from the **same** source and false of a
   different source. R8 flags this and R8 is right.
4. Respect the sweep's no-records guard (`stores/notifications.ts:1521-1527`). It refuses to cancel anything when
   it has no records but the OS holds pending requests, because after an app update that is exactly the state
   Android's `MY_PACKAGE_REPLACED` recovery produces. **A source change must not wipe the records and then sweep**,
   or the guard will correctly refuse and the old alarms will survive.

**Budget cost of a re-arm, measured from the code rather than run.** `buildSchedulePlan` walks rows in time order
and stops at the first it cannot afford. Every identifier is deterministic from schedule, name, date and interval,
none of which carries a source, so a re-arm after a source change replaces in place with **no cancel pass and no
budget increase**, provided the identifiers do not change. **That is a third independent reason the prayer name
must not carry the source**, alongside session 39's localisation reason and R8's finding 3.

### 4.3 The widgets and their timelines

| What | Where | On upgrade |
| --- | --- | --- |
| iOS timeline push, per schedule, to seven widget kinds | `stores/widget.ts:167-229`, kinds listed at `:198-218` | Rebuilt from the cache on the next sync. `pushScheduleTimelines` always rebuilds the sequence (`:158-160`: "reading through a cache here could only serve something older than the change that triggered the push") |
| Timeline span | `TIMELINE_DAYS = 3` (`shared/widgetTimeline.ts:76`), sequence built over `TIMELINE_DAYS + 1` (`stores/widget.ts:116`) | A four-day span, so a stale timeline self-corrects within days even with no push |
| Android snapshot path | `stores/widget.ts:241-251`, one snapshot per kind plus `armWidgetRefreshChain()` | Same: pushed from the cache |
| Entry point on launch | `initializeAppState` (`stores/sync.ts:235-262`), deferred past first paint at `:251-258` | Every upgrade reaches it |
| Hardcoded copy | `widgets/PrayerWidget.tsx:318` and `:524`, both `Prayer times for London` | Must be resolved in the app and baked into timeline props. `ai/AGENTS.md` records that a widget layout can never call a translation library |

**The widget requirement on upgrade is one line: a push must happen, and it already does.** `refreshPrayerWidgets`
(`stores/widget.ts:237-256`) is called from `initializeAppState`, from `stores/notifications.ts:1650` and `:1661`,
and on settings changes (`:124-140`). **The one thing that must not happen is a timeline built from an empty cache**,
which `pushScheduleTimelines` already refuses to push (`stores/widget.ts:187-193`). Under migration option B the
cache is never empty, so the widgets never show the stale card. Under option A they would, for as long as the
refetch takes, which is a second argument for B.

### 4.4 Every `preference_*` key, which must survive untouched

Measured by grep over the whole source tree, excluding tests. Every one of these is kept by both wipes:
`UPGRADE_KEEP_PREFIXES` at `stores/version.ts:151` and `replacePrayerCache`'s whitelist at `stores/sync.ts:364`.

| Key | Built at | What it holds |
| --- | --- | --- |
| `preference_alert_${type}_${name}` | `stores/notifications.ts:207` | Per prayer per schedule alert type |
| `preference_reminder_alert_${type}_${name}${slotSuffix}` | `stores/notifications.ts` reminder atoms | Reminder on or off, two slots per prayer |
| `preference_reminder_interval_${type}_${name}${slotSuffix}` | same | Reminder interval per slot |
| `preference_notification_repair_${type}_${name}` | `stores/notifications.ts:335` | The mark saying a prayer's bell and alarms may disagree |
| `preference_last_notification_schedule_check` | `stores/version.ts:196`, `stores/sync.ts:85` | The 12-hour refresh gate |
| `preference_sound` | `stores/ui.ts` | Athan sound choice |
| `preference_countdownbar_shown`, `preference_countdownbar_color` | `stores/ui.ts` | Countdown bar |
| `preference_hijri_date` | `stores/ui.ts` | Hijri display toggle, also drives widget pushes (`stores/widget.ts:139`) |
| `preference_decorations_enabled` | `stores/ui.ts` | Ramadan decorations |
| `preference_show_arabic_names`, `preference_show_seconds`, `preference_show_time_passed` | `stores/ui.ts` | Display toggles |

**Two keys outside the `preference_` prefix that must also survive**, and both are already whitelisted:

- `prayer_max_english_width_standard` and `_extra` (`stores/ui.ts:104,107`), kept by
  `prayer_max_english_width_` at `stores/version.ts:155`. Its comment is correct that recomputing them visibly
  reflows the list.
- `whats_new_shown_version` (`stores/version.ts:116,147`). On upgrade it is deliberately **not** reseeded, because
  its difference from the installed version is what shows the modal (`:276-279`).

**The one preference-shaped hazard.** `migrateIndexKeyedAlertPreferences` (`stores/notifications.ts:525-583`) runs
on every launch and migrates legacy index-keyed keys to name-keyed ones, choosing the source `EXTRAS_ENGLISH` from
the **pre-overwrite** stored version (`stores/version.ts:286-289`). If v2.0 changes `EXTRAS_ENGLISH`, for example
by adding an `Imsak` row, that function's `usesPreMidnightExtras(storedVersion)` branch needs a third era, or an
upgrading user's Extras preferences land on the wrong rows. **For London alone nothing changes, because London
publishes no Imsak**, but the dependency is real and belongs in the same session.

### 4.5 The Asr question, and its fix

**The defect.** `shared/types.ts:25` documents `asr` as "Asr prayer time in HH:mm format (Hanafi calculation)" and
`:27` documents `asr_2` as "Alternative Asr time (Shafi calculation, not used in app)". **Both are backwards.**

**The evidence, measured three ways.**

1. Section 1.5: `adhan`'s Shafi (factor 1) Asr matches published `asr` on 149 of 365 days and its Hanafi (factor 2)
   never comes within 28 minutes of it.
2. The gap between the two published columns is **+29 to +75 minutes**, `asr_2` later, stable across all 18,263
   published future days and identical in the app's own 2026 capture (measured, `part3b.txt` 3b.4). Later means more
   shadow, which means factor 2, which is Hanafi.
3. The publisher's own live site prints "'Asr shown for both mithl 1 (Shāfi'ī and others) and mithl 2 (Hanafī)"
   with 'Asr 1 before 'Asr 2 (cited).

**The fix, and what it costs.**

| Change | Files | User-visible? |
| --- | --- | --- |
| Correct the two comments | `shared/types.ts:25` and `:27` | **No.** A comment is not behaviour |
| Leave the displayed value alone | `shared/prayer.ts:83` continues to copy `times.asr` | **No.** The app has always shown Mithl 1 and continues to |
| Optionally surface `asr_2` as a user choice, later | `IApiSingleTime.asr_2` is already fetched and discarded by `REQUIRED_TIMES` (`api/client.ts:48`) | Yes, if built. Out of scope for the upgrade |

**No user-visible behaviour changes.** This is the cheapest correct change in the whole programme and it should
ship regardless of what happens to sources, because a wrong comment about which madhhab a shipped prayer time
belongs to is the worst kind of stale comment: it is the one a future session will trust.

**What must NOT happen: nobody is switched.** An existing London user has been praying the app's `asr` for the
app's whole life. Wave 1 left "which Asr London users see" open as its question 8 and R8 recommended never
switching anyone silently. **I agree, and the measurement sharpens it: the two columns are 29 to 75 minutes apart,
so a silent switch is the single largest time change the app could make to an existing user.** Larger than any
source change measured in section 1.

### 4.6 The invariant, and the test that proves it

**The invariant, stated plainly.**

> For an install that has any cached prayer day and an `app_installed_version`, upgrading to v2.0 must leave:
>
> 1. every `preference_*` value **byte-identical**;
> 2. every `prayer_max_english_width_*` value **byte-identical**;
> 3. `whats_new_shown_version` **untouched**;
> 4. every cached day's stored JSON **byte-identical**, under a key that maps one-to-one onto the key it had;
> 5. the set of OS pending notification identifiers **unchanged**, and each one's trigger instant **unchanged**;
> 6. the source preference reading exactly **`london-prayer-times`**, written explicitly rather than inferred.
>
> The only permitted differences are the key prefix of the cached days, the `cache_schema_version` value, and
> `app_installed_version`.

**The test that would prove it.** Three parts, and the first is the one that catches real regressions.

1. **A golden-MMKV upgrade test.** Commit a fixture MMKV state captured from a real pre-v2.0 install: a year of
   `prayer_YYYY-MM-DD` records, a full set of `preference_*` values including every key in section 4.4, both width
   keys, `fetched_years`, `app_installed_version`, `cache_schema_version`, and a set of `scheduled_notifications_*`
   and `scheduled_reminders_*` records. Run `handleAppUpgrade()` against it. Assert: every key in points 1 to 4
   above is byte-identical; the cached-day key set is exactly the old set with the source prefix added and nothing
   missing or extra; the source preference reads `london-prayer-times`. **A snapshot over the whole post-upgrade
   key-value map is the strongest form**, because it fails on any key the migration touches by accident, which is
   the failure mode a targeted assertion misses.
2. **A times-identity test.** For the fixture's whole cached year, build both schedules' sequences before and after
   and assert every row's rendered time string is identical. This catches a migration that preserved the bytes but
   changed how they are read, which is what a timezone refactor in the same release would do.
3. **An alarm-identity test.** Assert that the identifiers `prayerNotificationIdentifier` and
   `reminderNotificationIdentifier` produce for the fixture's armed days are unchanged, and that each record's
   `time` field still equals the time the row now renders. **That last clause is the one finding 12 argues for**: it
   is the assertion that would have caught a time-moving change the identifier comparison cannot see.

**What no test can prove.** That the OS actually still holds the alarm. `expo-notifications` state lives outside the
app's storage, Android's battery managers can drop it, and sessions 25, 27 and 28 exist because of that. The
records are the app's best evidence and the sweep's no-records guard (`stores/notifications.ts:1521-1527`) is the
app's admission that the records can be wrong.

**And a device pass does not fully close it either**, which the codebase itself documents and this report must not
overstate. `stores/notifications.ts:1772-1778` records that on Android `getAllScheduledNotificationsAsync` answers
from `SharedPreferencesNotificationsStore`, which a force-stop does not clear, while the delegate that re-arms
`AlarmManager` from it runs only on `BOOT_COMPLETED`, `REBOOT` and `MY_PACKAGE_REPLACED`. **So it can report a full
list while zero alarms exist.** The honest ceiling is therefore: the golden-MMKV test proves the storage invariant,
the times-identity test proves the read path, the alarm-identity test proves the intent, and **only an observed
athan firing at the expected minute on a real upgraded device proves the alarm.** That is a QA step, and it is the
step this invariant genuinely rests on.

---

## 5. The London user's future: three options

### 5.1 Option 1: London stays a special case forever

The worldwide machinery grows around a hardcoded London path.

| | |
| --- | --- |
| **For** | No migration of the cache key at all. No risk to the existing base, because nothing about their path changes. Shippable in a day |
| **Against** | The location-free MMKV key survives, so the first second source introduces the silent cross-city read R8 and section 4.1 describe. `PRAYER_TIMEZONE` (`shared/constants.ts:258`) stays a global and the two zone-blind offset caches (`shared/time.ts:67-68`) stay a trap. Every later session pays for the special case, and London is the hardest case, so the abstraction never gets tested against it |
| **Verdict** | **Reject.** It trades a bounded one-time cost for an unbounded recurring one, and it leaves the largest silent risk in the codebase in place |

### 5.2 Option 2: London becomes one source among many, serving the same published timetable

The source abstraction lands, London is its first instance, and a London user's times are byte-identical.

| | |
| --- | --- |
| **For** | The abstraction is validated against the hardest source in the world before an easy one is added. The MMKV key gains a source and the silent risk closes. The timezone becomes a property of the source, which is the fix for `shared/time.ts:67-68`. Nothing a London user can see changes. Section 2's interval encoding becomes available to London as an offline fallback within the same abstraction, at 732 bytes |
| **Against** | It is a refactor of load-bearing storage, and section 4.1 is the whole of its risk. The migration must be right the first time, because a half-migrated cache is worse than either state |
| **Verdict** | **Recommended.** This is R8's S2 and the RECOMMENDATION's answer, and the measurements here support both |

### 5.3 Option 3: London users choose between their timetable and a computed one, with the difference shown

| | |
| --- | --- |
| **For** | Honest. Puts the choice with the user, which is where a religious choice arguably belongs |
| **Against** | **Section 1 measured what the choice is between, and it is not a real choice.** One option is the timetable 36 or more London organisations adopted; the other is a computation that differs from it by up to 11 minutes on Isha and matches it on 3 of 365 days. Offering it implies the two are comparable. R8's section 4.2 evidence is that users do not want this decision: "it's still too technical and I just want to know how to fix it." And every one of the five computing competitors hides the method list behind an "advanced" toggle |
| **Verdict** | **Reject as a primary offering.** The one thing worth keeping from it is the **delta warning** on a deliberate source change, which is R8's S8 and is right |

### 5.4 The recommendation, and whether I agree with R8

**Option 2, with an explicit pin, and yes I agree with R8.**

R8's finding 14 says an existing install with cached prayer days and no source setting is pinned to
`london-prayer-times` explicitly, never negotiated, mirroring session 39's ruling on language
(`ai/plans/39-localisation/ASSUMPTIONS.md` A1b). **I agree, and section 4.2 makes it load-bearing rather than
merely prudent.**

R8's argument is that a locale mis-negotiation shows wrong words while a source mis-negotiation shows a wrong
prayer time and arms an alarm on it. That is right, and finding 12 adds the part R8 did not have: **the app cannot
detect a wrong alarm of that kind.** The sweep compares identifiers, the identifier has no time in it, so an alarm
armed on the wrong source's instant is invisible to every mechanism the app has. A negotiated source that guesses
wrong therefore produces a silent, undetectable wrong alarm. An explicit pin cannot guess.

**Two refinements to R8's rule, both from this report's measurements.**

1. **Pin on `app_installed_version`, not on the presence of cached days.** A user whose cache was wiped by an
   earlier upgrade has no `prayer_*` keys and is still an existing user. `wasAppUpgraded()`
   (`stores/version.ts:82-109`) already uses the version key as its upgrade signal, so this is consistent with
   the code rather than a new idea.
2. **Ship the interval table with London from the start, as the offline fallback rather than as the source.** It
   costs 732 bytes, it is the only thing in the programme that makes London work with the network off, and
   section 6 shows it is also the continuity answer. It must be a fallback and not the source, because the source
   is the authority's own digits and the fallback reproduces them; the source detail view should be able to say
   which one the user is looking at.

---

## 6. What breaks if the London provider disappears

Nobody in the programme has looked at this, and it turns out to be the most reassuring section in the report.

### 6.1 The dependency chain, as wave 1 established it

Khalid Shaukat's model, then the Hizbul Ulama 1989 Blackburn observations, then the London unified timetable adopted
by "at least 36 organisations ... just before Ramadan 1432 (July 2011)", then East London Mosque's published
timetable, then `londonprayertimes.com` serving it over an API with a manually issued key.

**What the app actually depends on** (measured):

| Dependency | Where | Exposure |
| --- | --- | --- |
| One endpoint | `api/config.ts:5`, `https://www.londonprayertimes.com/api/times` | Single host, seven-line config |
| One manually issued key | `API_CONFIG.key` from `APP_CONFIG.apiKey` (`api/config.ts:4`) | No self-service issuance found. If revoked or lapsed, every fetch fails |
| TLS 1.3 only | `device/tls13.ts`, `modules/tls13/android/.../Tls13InitProvider.kt` | A whole native module exists because this one host accepts TLS 1.3 alone and Android 9 and older ship it disabled |
| A provider-specific query parameter | `24hours=true` (`api/client.ts:19-24`) | Without it, afternoon times return in 12-hour form and still pass `TIME_PATTERN`, so nothing downstream could catch it (the comment at `:14-18` says so) |

**What already protects the user.** The app caches a whole year (`stores/sync.ts:431-509`) and `needsDataUpdate`
(`stores/sync.ts:275-287`) does not refetch while today is stored. So **a total provider outage is invisible until
the cached year runs out**, which is up to twelve months. That is a genuinely good position and it is worth saying,
because it means the continuity question is about years, not days.

### 6.2 East London Mosque as an independent source: assessed

**It is not independent.** Its own prayer-times page carries the line "Prayer times produced by London Salah
Times" (cited, read 2026-09-30). The same body produces both. Wave 1 had already proved they are the same numbers:
the API year, the ELM PDF and the table in ELM's web page agree on **4,380 of 4,380 cells** for 2026, and this
report re-measured the seven shared fields at **2,555 of 2,555** (measured, `part3.txt` 3.7).

**So ELM is not a fallback for the provider. It is a second window onto the same provider.** That is worth knowing
precisely because the instinct is to treat it as a hedge, and it is not one.

**What ELM does offer:**

| Form | Shape | Verdict as a fallback |
| --- | --- | --- |
| Annual timetable PDF | One year, human-readable (cited, `eastlondonmosque.org.uk/prayer-times`) | Poor. A PDF needs parsing and the layout can change without notice |
| The table embedded in its prayer-times page | One year of HTML, all twelve months | Workable. Proved cell-for-cell identical to the API by wave 1 |
| **Both columns of Asr, `1 Mithl` and `2 Mithl`, and `Begins` plus `Jamā'ah` for every prayer** | Richer than the app currently reads | A reason to read it regardless of continuity |

### 6.3 The real fallback, and it is much better than a second window

**The publisher publishes fifty future years as machine-readable files, and no key is required** (cited,
`londonsalahtimes.com/downloads/`). All fifty were fetched and parsed here.

| Property | Measured |
| --- | --- |
| Years available | 2027 to 2076, fifty |
| Days | 18,263 |
| Published values | 127,841 |
| One file | about 70 KB `.xlsx` |
| All fifty as packed uint16 minutes | 255,682 raw, **10,290 brotli** |
| Ten years, 2027 to 2036 | 51,142 raw, **6,320 brotli** |
| Reproduced by the 2027 interval table against their own published sun | **100.000% on Fajr and Isha, worst error 0** |
| Reproduced by the interval table plus the publisher's own equations, no network | **127,838 of 127,841 exact, 100.000% within 1 minute** |

**So there are three independent survival paths, in increasing order of independence.**

| Path | What it needs | How long it survives | Fidelity |
| --- | --- | --- | --- |
| **The cached year** (today's behaviour) | Nothing new | Up to 12 months from the last successful fetch | Exact, the authority's own digits |
| **Ship N published years** | 6.3 KB for ten years, 10.3 KB for fifty | **To 2077** with the full set | **Exact, every digit the authority's own.** No computation, so no synthesis question arises at all |
| **Ship the interval table plus the equations** | **732 bytes**, plus solar arithmetic the app would have for other countries anyway | **Indefinitely.** Meeus does not expire and a 1989 observation chart does not either | 99.998% exact against fifty published years, 100% within 1 minute, nothing beyond |

**The blunt answer to the continuity question. The provider vanishing is survivable, and cheaply.** For **10,290
bytes**, 0.015% of the release bundle, the app can hold every London prayer time the authority has published
through 2076, with no network, no key and no computation, and every value is the authority's own digit. **That is
the strongest position in the entire programme**: no other authority measured in R6 publishes fifty future years
in a keyless machine-readable form.

### 6.4 The residual risks, stated honestly

1. **The download page could vanish too.** It is the same operator. This is not diversification; it is one
   operator being unusually generous with its output. The mitigation is that shipped bytes cannot be withdrawn:
   once the fifty years are in the binary they are in the binary.
2. **The provider can change its method, and it already has.** Section 2.7 measured the Asr margin moving from
   about +0.4 to +2.0 between the 2026 and 2027 timetables. **Shipped data cannot detect a change made after it
   was built.** R6's answer applies here and it is cheap: rebuild the interval table and the margins from a fresh
   fetch once a year and compare. **Concretely: if any of the 366 interval slots moves, or any of the four margins
   moves, or the Asr gap leaves 29 to 75 minutes, the provider changed something and the app should say so rather
   than quietly serve stale intervals.** That check costs one fetch and 732 bytes of comparison.
3. **The 2077 cliff, for the published-years path.** Fifty years is two generations and the app will not exist,
   but the code must fail honestly rather than silently: past the last shipped year the app should show `--:--`
   through the existing `UNAVAILABLE_TIME` path (`shared/constants.ts:268`), never extrapolate. The
   interval-plus-equations path has no cliff.
4. **`modules/tls13`'s fate is still undecided**, and R8 recorded the same gap. If London becomes offline-first
   and no second HTTP source needs it, it is dead code. If a yearly fetch stays, it stays. **Do not delete it on
   the strength of an offline plan that has not shipped**, because it exists for a measured reason.
5. **The hand edits have no documented basis**, which wave 1 established and this report confirms is still true
   across fifty more published years. If the publisher ever regenerated its years from the Miftahi book without
   the edits, up to 21 Isha slots would move by 1 to 14 minutes. **Measured, that has not happened: the edits are
   present in 50 of 50 future years for seven of the eight slots checked, and the eighth, 11-29, reverted to the
   book's value in all fifty** (measured, `part3.txt` 3.6). So the risk is real, demonstrated once, and worth one
   minute at 11-29.

---

## 7. UNVERIFIED and open

Recorded so nothing weak reads as established.

1. **Why the five era-B slots moved is UNVERIFIED**, including the 03-31 edit this report adds to R6's four.
   Wave 1 searched every ELM PDF from 2012 to 2026, the ELM explainer, Hizbul Ulama's articles and
   moonsighting.com and found nothing. This report searched no further, because the standing rule forbids
   contacting anyone.
2. **The 2027 Asr margin change has no announcement.** The publisher's technical page documents the +2 and the
   pre-2027 years do not carry it, so either the page is new or the generator was corrected. **Which, and when, is
   UNVERIFIED.** The Wayback Machine was not consulted and would settle it.
3. **HMNAO's own values were not obtained.** Its service returned HTTP 503 to wave 1 and its terms say "for
   personal use only". So the last 1-minute boundary days can be measured but not closed, and section 2.4's 10%
   residual is bounded rather than explained to the second.
4. **The 2027 to 2076 files were parsed, not validated against a second rendering of the same year.** The parser
   is Node built-ins only and its 2026-equivalent output was checked against the ELM PDF, the app's API capture and
   the publisher's live site for one date, all agreeing. **A second date, or the 12-hour sheet, was not
   cross-checked.**
5. **The published-years path was costed but its licence was not examined**, because licensing is CLOSED by the
   owner. This report records only that the files are publicly downloadable with no key.
6. **No upgrade was executed.** Section 4 is a specification read from source, not a measured upgrade. No MMKV
   fixture was built, no `handleAppUpgrade()` was run, and no device was driven. **The test in section 4.6 is a
   design, not a passing test.**
7. **The sweep's identifier-only comparison was read, not exercised.** `findStaleScheduledNotificationIds`
   (`shared/notifications.ts:214-221`) is nine lines and its behaviour is unambiguous, but finding 12's conclusion
   that a time-moving change is undetectable was **not demonstrated by running the app**. It is a code reading. It
   deserves a test before it is acted on.
8. **The 64-request re-arm cost was reasoned from the code, not measured.** Section 4.2's claim that a re-arm needs
   no cancel pass rests on identifier determinism, which is documented at `device/notifications.ts:44-48`. No
   device pass confirmed it.
9. **How many of the 216 test files a source-key migration touches was not counted.** Measured: 216 test files
   exist, and 11 lines across 6 files outside `ai/` reference `Europe/London` directly. R8 recorded the same gap
   and wave 1 recorded "62 tests still assert London's clock values and DST rule". None was re-measured.
10. **Whether the interval table should ship at all is an owner decision this report does not make.** It
    reproduces the authority's own digits, which R6 argues makes it lossless compression rather than synthesis,
    but wave 1's section 2.15 recorded the opposite reading: "Using it as a source of shown times would breach the
    standing rule against synthesising prayer times unless the owner rules otherwise." **The two waves disagree and
    the owner has not ruled.** This report's contribution is the measurement, and the measurement is 99.998%
    against fifty published years with nothing beyond 1 minute.
11. **`asr_2` was not tested as a display option**, only as a measurement. Whether a London user should be offered
    the Hanafi column is still wave 1's open question 8.
12. **The Istijaba, Suhoor and Duha derivations were not re-examined** for London specifically. `TIME_ADJUSTMENTS`
    (`shared/constants.ts:225-230`) gives -20, +20 and -60, which are the app's own conventions rather than the
    authority's, and R8's proposal E1 covers them. Nothing about London changes them.

---

## 8. Sources

### 8.1 This repository and this worktree (measured, read here)

| Path | What was read |
| --- | --- |
| `ai/features/moonsighting/data/london/lpt-2026.json` | The app's current source, 365 days, 13 fields. The reference for Part 1 |
| `ai/features/moonsighting/data/london/elm_timetable_{2012..2026}.json` | Twelve ELM published years. The corpus for Part 2 |
| `stores/database.ts` | `DATABASE_ID:32`, `getAllWithPrefix:74`, `clearPrefix:89`, `clearAllExcept:106`, `saveAllPrayers:136` and the key at `:138`, `getPrayerByDateString:152`, `getPrayerByDate:167`, `markYearAsFetched:176`, the notification and reminder key schemes `:193,212,258,304` |
| `stores/version.ts` | `wasAppUpgraded:82`, `WHATS_NEW_SHOWN_VERSION_KEY:116`, `CACHE_SCHEMA_VERSION:135` and its comment `:118-134`, `UPGRADE_KEEP_PREFIXES:144-156`, `cacheSchemaChanged:166`, `forceNotificationReschedule:194` and its comment `:182-193`, `clearUpgradeCache:208`, `handleAppUpgrade:230` and the two-question split at `:253-266`, the migration call at `:289` |
| `stores/sync.ts` | `isTodayGapInStoredYear:67`, `reopenNotificationGate:83`, `saveDownloadedDays:126`, `isSameRecord:110`, `initializeAppState:235`, `needsDataUpdate:275`, `replacePrayerCache:338` and its whitelist `:358-372` with the alarm-records comment at `:367-369`, `readStoredYear:392` |
| `stores/notifications.ts` | `createPrayerAlertAtom:203-208`, `canStillFire:124`, `createPrayerRepairMark:333-338`, `clearAllScheduledNotificationForPrayer:973`, `migrateIndexKeyedAlertPreferences:525-583`, `_sweepStaleScheduledNotifications:1499` and its no-records guard `:1521-1527`, `canonicalPrayerIndex:663` |
| `shared/notifications.ts` | `ScheduledNotification:17-24`, `findStaleScheduledNotificationIds:214-221`, `schedulePlanKey:252`, `buildSchedulePlan:268-283`, `collectCandidateRows:293`, the budget call at `:358` |
| `device/notifications.ts` | `prayerNotificationIdentifier:49-50` and its determinism comment `:43-48`, `reminderNotificationIdentifier:61-66` |
| `shared/constants.ts` | `PRAYERS_ENGLISH:9`, `EXTRAS_ENGLISH:26`, `NOTIFICATION_REQUEST_BUDGET:75` and its ceiling comment `:66-74`, `SCHEDULE_CANDIDATE_DAYS:89`, `TIME_ADJUSTMENTS:225`, `PRAYER_TIMEZONE:258`, `UNAVAILABLE_TIME:268` |
| `shared/time.ts` | `prayerClockFormatter:25`, the offset caches `dayOffsets` and `quarterHourOffsets` at `:67-68`, `prayerTimezoneOffset:75-94` |
| `shared/types.ts` | `IApiSingleTime:12-39` with the reversed Asr comments at `:25` and `:27`, `RequiredTimeName:74`, `ISingleApiResponseTransformed:108-122` |
| `shared/prayer.ts` | `transformApiData:70-95` and the Asr copy at `:83` |
| `api/config.ts` | The whole file, 7 lines |
| `api/client.ts` | `buildApiUrl:19-24` with the `24hours=true` comment `:14-18`, `validateApiResponse:39`, `REQUIRED_TIMES:48`, `TIME_PATTERN:51`, `validateApiTimes:78` |
| `stores/widget.ts` | `initWidgetSettingsSync:124`, `pushScheduleTimelines:167-229` with the always-rebuild comment `:158-160` and the empty-timeline refusal `:187-193`, `refreshPrayerWidgets:237-256`, `buildSequence:115` |
| `shared/widgetTimeline.ts` | `TIMELINE_DAYS:76` |
| `stores/ui.ts` | `englishWidthStandardAtom:104`, `englishWidthExtraAtom:107` |
| `components/day/Day.tsx` | `London, UK` at `:48` |
| `widgets/PrayerWidget.tsx` | `Prayer times for London` at `:318` and `:524` |
| `device/tls13.ts`, `modules/tls13/` | The TLS 1.3 rationale |
| `README.md` | `:157`, the public-facing source credit |
| `package.json` | Version `1.29.159` at `:3` |
| `ai/features/global-prayer-times/BRIEF.md`, `FINDINGS.md`, `RECOMMENDATION.md` | Read in full |
| `ai/features/global-prayer-times/agent-reports/R8-product-and-app-impact.md` | Read in full, all 1,119 lines |
| `ai/features/global-prayer-times/agent-reports/R6-correction-table-generality.md` | Sections 1, 2, 3.1, 3.2, 7, 8.1, 8.2, 8.3, 8.5 and the findings page |
| `ai/features/global-prayer-times/agent-reports/R1-authorities-and-conventions.md` | The Wifaqul Ulama row at `:122`, the high-latitude section, the angle tables |
| `ai/features/moonsighting/RESEARCH-FINDINGS.md` | Sections 2.14, 2.15 and 4 in full |

### 8.2 External (cited)

| URL | Fetched | Transport | What it supports |
| --- | --- | --- | --- |
| `https://londonsalahtimes.com/technical` | 2026-09-30 | tinyfish | **Read in full.** Charing Cross 51.5073 N 0.12755 W; every Meeus equation the generator uses, with page references to Meeus 2nd ed. 1998; the margins "Sunrise: 3 minutes earlier · 'Asr: 2 minutes later · Sunset: 3 minutes later" and "Zuhr: 5 minutes later"; "The times for Fajr and 'Ishā are based on the UK observations of Hizbul Ulama; they determined the times between Fajr and sunrise, and between sunset and 'Ishā"; the Umm al-Qura calendar note; the M25 coverage rationale and the 100-second east-west span; the NOAA accuracy caveat; the Asr shadow equations citing Mohamoud 2017 |
| `https://londonsalahtimes.com/downloads/` | 2026-09-30 | tinyfish | The fifty-year download list, 2027 to 2076, "Each workbook has two sheets: 12-hour format ... and 24-hour Excel time format", 69 KB per file |
| `https://londonsalahtimes.com/downloads/LUPT-{2027..2076}.xlsx` | 2026-09-30 | curl, no key | **Fifty files, all HTTP 200, 70,171 to 70,622 bytes each.** 18,263 days and 127,841 published values, parsed by `xlsx.mjs`. The corpus for Part 3 |
| `https://londonsalahtimes.com/` | 2026-09-30 | tinyfish | The live times for 2026-09-24, which match the app's captured API year and the ELM 2026 PDF exactly; "'Asr shown for both mithl 1 (Shāfi'ī and others) and mithl 2 (Hanafī)" |
| `https://www.eastlondonmosque.org.uk/prayer-times` | 2026-09-30 | tinyfish | **"Prayer times produced by London Salah Times"**, the line that settles section 6.2; the column headers `Begins`, `Jamā'ah`, `1 Mithl`, `2 Mithl`; the 2026 timetable and calendar PDF links |
| `https://www.eastlondonmosque.org.uk/prayer-times-and-calendar-explained` | 2026-09-30 | tinyfish | The rule statement quoted in section 2.1: Fajr and Isha from Hizbul Ulama, sun times from HMNAO with the -3, +5 and +3 margins, both Asr mithls |

### 8.3 Scripts and outputs (all under `ai/features/global-prayer-times/data/london-migration/`)

| File | What it produces |
| --- | --- |
| `lib.mjs` | Shared helpers: the LPT and ELM readers, exact London minutes to the second, the summariser |
| `xlsx.mjs` | A Node-built-ins-only `.xlsx` reader for the publisher's workbooks, so the parse is auditable |
| `part1.mjs` / `part1.txt` | Part 1: every named candidate against the 2026 published year, per field, with distributions |
| `part1b.mjs` / `part1b.txt` | Part 1: the 29,781-configuration search and the per-field ceilings |
| `part2.mjs` / `part2.txt` | Part 2: the interval table per year, year-over-year stability, the crux measurement, byte costs |
| `part2b.mjs` / `part2b.txt` | The coordinate grid, all nine era-B years, and every miss listed in full |
| `part2c.mjs` / `part2c.txt` | Per-era coordinate fits and the rounding-boundary proximity of every miss |
| `part2d.mjs` / `part2d.txt` | Tie-break rules compared, and the miss classification |
| `part2e.mjs` / `part2e.txt` | The full six-field reconstruction at the wave 1 point |
| `part2f.mjs` / `part2f.txt` | Asr by an apparent-altitude solve |
| `part2g.mjs` / `part2g.txt` | Reconstruction with the publisher's own documented parameters |
| `part2h.mjs` / `part2h.txt` | Reconstruction from the publisher's own published formulas |
| `part2i.mjs` / `part2i.txt` | The two Asr columns reconciled |
| `part2j.mjs` / `part2j.txt` | The 2027 year, and the first durability test |
| `part3.mjs` / `part3.txt` | Part 3: all fifty published years, table durability, 29 February, the hand edits |
| `part3b.mjs` / `part3b.txt` | The Dhuhr `methodAdjustments` trap, the four reverted slots year by year, which table to ship |
| `part3c.mjs` / `part3c.txt` | The definitive offline measurement and the three options costed |
| `part3d.mjs` / `part3d.txt` | The Asr 100% result verified on three corpora, and the rounder fitted |
| `part3e.mjs` / `part3e.txt` | The complete seven-field reconstruction, and the 2027 Asr margin change |
| `london-intervals-2027.json` | The 366-slot interval table itself, derived from the publisher's own 2027 and 2028 years. Research data; nothing in the app reads it |
| `lupt-2027.json` | The 2027 published year as parsed, for anyone checking the parser |
