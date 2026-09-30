# Global prayer times: what the research settles

**Read this first.** It is the synthesis of eight research reports, 7,238 lines, run in two waves on 2026-09-30.
Every claim here is carried by a report that measured it, and the report is named. Nothing in this file is a
decision: `RECOMMENDATION.md` holds the answer, and `ASSUMPTIONS.md` holds every judgement made without the owner.

| Report | Subject | Lines |
| --- | --- | --- |
| `agent-reports/R1-authorities-and-conventions.md` | every calculation authority worldwide and its real parameters | 707 |
| `agent-reports/R2-country-adoption-map.md` | what mosques and states actually use, about 20 countries at tier A | 530 |
| `agent-reports/R3-offline-libraries.md` | the offline library field, measured and recommended | 994 |
| `agent-reports/R4-apis-and-data-sources.md` | every API, every bulk dataset, and the correction-table discovery | 1,056 |
| `agent-reports/R5-country-map-completion.md` | the country map closed, the five tier-C giants resolved | 801 |
| `agent-reports/R6-correction-table-generality.md` | does the correction model generalise, tested on 11 authorities | 888 |
| `agent-reports/R7-library-validation.md` | the library attacked where it is weakest, plus a built fixture suite | 1,162 |
| `agent-reports/R8-product-and-app-impact.md` | what it means for this codebase and this product | 1,119 |
| `agent-reports/R9-remaining-countries.md` | Africa, the smaller European states, and what Scandinavia prints in summer | 563 |
| `agent-reports/R11-high-latitude.md` | every high-latitude rule, measured against the authorities that publish them | 832 |
| `agent-reports/R13-london-migration.md` | the existing London base, and London's fifty published years | 1,086 |
| `agent-reports/R14-location-and-device.md` | how the app knows where it is, offline | 1,446 |
| `SOURCE-CATALOG.md` | the consolidated catalog: 39 sources, 30 countries, every conflict resolved | 989 |

`SOURCE-CATALOG.md` is the operational document. It supersedes the individual reports wherever they disagree,
because it was written to reconcile them, and `data/catalog/sources.json` is its machine-readable form with a
generator that fails on drift.

Prior art, not repeated: `ai/features/moonsighting/`, the 2026-09-14 study of the Moonsighting Committee method.

**Licensing and permission are CLOSED** (owner, 2026-09-30): he corresponded with the authorities himself and has
permission to use their data. No session contacts anyone, about anything, without the owner asking first.

---

## The short answer to the owner's question

**Yes, the app can be fully offline. No, there is no single convention that fits the whole world, and no authority
on earth claims there is one.** The accuracy the owner asked for is available for four of the six daily times and
is not available for the other two, because the two are defined by a phenomenon that is not a fixed solar angle.
What the app can promise instead is faithful reproduction of a named authority's published times, which is both
honest and, measured against the competition, a differentiator.

**Waves 3 and 4 changed four things and it is worth knowing which, because the earlier sections were written before
them.** (1) **London is now solved and permanently offline**: its own publisher ships fifty future years, 2027 to
2076, and a 732-byte interval table reproduces all of them exactly, which is the opposite of the residual-expiry
problem that defeats every other authority. (2) **The permission-free option is dead**: placing a user at their
timezone's most populous city is a median 16 displayed minutes wrong, so the app cannot go worldwide without a
location signal. (3) **Authorities use high-latitude rules no library implements**, and two neighbouring
Scandinavian countries use incompatible ones. (4) **JAKIM never contradicted itself**: its cited 20 degrees is its
Imsak row, not its Fajr, which resolves the programme's most-cited anomaly and creates the rule that every extra
row must declare whether it comes from an angle or an offset.

Three findings carry the architecture.

1. **A calculation library is necessary and is not sufficient.** `adhan@4.4.6` is the right one and its astronomy
   is provably good, but its authority presets are only as good as the constants it inherited, and several of
   those are wrong or unverifiable.
2. **National authorities do not publish angles, they publish timetables, and the difference between a timetable
   and a computation is small, stable and measurable.** Six signed integers per city reproduce a national
   authority's entire published year to within two minutes, measured on eleven authorities and 135,996 values.
3. **The disagreement that matters is not between libraries, it is between authorities, and it is large.** Up to
   87 minutes on Fajr at 44 degrees latitude. Choosing the source is a bigger accuracy decision than anything in
   the code.

---

## 1. There is no single correct answer, and the authorities say so themselves

This is the finding the owner's "we need absolute accuracy" has to meet, and it is not a hedge. It is sourced.

**Four of the six times are astronomically determined** and every authority measured agrees on them to within its
own declared safety margin: sunrise, Dhuhr, Asr and Maghrib. **Fajr and Isha are not.** The Fiqh Council of North
America states it plainly in its own 2024 paper (R1, cited): the timings for Fajr and Isha "are not directly
dependent on the position of the sun but rather on the amount of light in the sky. That amount of light is not
scientifically predictable for each location on Earth."

The observational record backs that up. FCNA compiles studies putting the Fajr depression anywhere from **9 to 20
degrees**, with moonsighting.com's own decades of observation giving Fajr 14.8 to 17.5 and Isha 11.2 to 17.6 (R1,
cited). Every software library stores that quantity as a single constant.

**What the disagreement is worth, measured** (R1):

| City | Latitude | Fajr span, 21 Jun | Fajr span, 21 Dec |
| --- | --- | --- | --- |
| Jakarta | 6.2 S | 35 min | 36 min |
| Makkah | 21.4 N | 41 min | 36 min |
| Toronto | 43.7 N | **87 min** | 46 min |
| London | 51.5 N | **no answer above 15 degrees** | 54 min |
| Oslo | 59.9 N | **no answer at any angle** | 68 min |

Near the equator the whole world's disagreement is about 35 minutes. At 44 degrees it is an hour and a half. Above
about 49 degrees in summer the higher angles stop having a solution at all, which is why every authority operating
at high latitude publishes a separate non-angle rule.

**The owner's specific belief was half right.** Fajr and Isha are where authorities genuinely disagree. Asr differs
by a comparable or larger amount (measured 18 to 79 minutes between the two shadow rules) but that is a school
choice with two exactly defined answers, not an authority disagreement. Dhuhr, sunrise and Maghrib are fixed by
astronomy to within a published safety margin of 0 to 8 minutes. That last part matters: **an implementation with
correct angles and no margins is wrong against Turkey every single day, on the prayers that look safest.**

---

## 2. The angle constants the whole industry ships are largely unverified

This is the most uncomfortable finding in the research, and it is the reason the architecture cannot rest on
library presets.

**The canonical table traces to two projects, not to the authorities it names.** MWL 18/17, ISNA 15/15, Karachi
18/18, Tehran 17.7/14, Jafari 16/14 and Russia 16/15 all come from `praytimes.org` and the Arabeyes ITL project.
ITL's own documentation admits in writing that "no contacts have been made to obtain the correct (or up-to-date)
numbers as published by such organizations" (R1, cited). Every library copied from there.

**Where the constants were tested against an authority's own published table, several failed** (R1, R5, R7):

| Constant | What the library ships | What the authority's own table measures | Verdict |
| --- | --- | --- | --- |
| Muslim World League 18/17 | the world's most-used default | MWL's Fiqh Academy has ruled on prayer times four times, in 20 sessions of collected resolutions totalling 448,078 characters, with **zero occurrences of the word "degree"**. Its own software country-switches to Umm al-Qura's 90-minute Isha inside Saudi Arabia | **Not MWL's.** adhan is 18 to 21 minutes early on Isha at MWL's own headquarters |
| "Gulf Region" 19.5 / Isha 90 min | Bahrain, Oman, Qatar, UAE | Oman measures **18.0/18.2 as a real angle**; Qatar measures 17.8 with a real 90-minute Isha; the UAE measures **18.15/18.09 as an angle, not an interval** | **Refuted at three of its four members** |
| "Jafari" 16/14, Leva Institute Qum | every library | The institute **could not be shown to exist** in English, Persian or Arabic. The constant traces to one personal website, one author | **No institution behind it** |
| `NorthAmerica` 15/15 | USA and Canada together | FCNA publishes **13/13 for Canada** in its own words | **Wrong for Canada**, by 13 to 19 minutes daily and up to 64 at Edmonton |
| `Egyptian` 19.5/17.5 | Egypt | Inverted across the authority's own 78-city table, 22 cities: **19.51/17.49** | **Correct**, and now the best-verified preset in the library |
| JAKIM 20/18 | Malaysia | JAKIM's own journal says 20/18; JAKIM's own API measures **17.4 to 17.6** for Subuh | **RESOLVED by `SOURCE-CATALOG.md`: the authority never contradicted itself.** The cited 20 degrees lands on the **Imsak** row, measured at 19.93 to 20.08 across six zones over a full year each. JAKIM is 18 degrees plus a 2-minute `ihtiyati`, and its journal describes its Imsak. R4's "2 + 8 = 10" reading is the loser: the 8 minutes is the Imsak-to-Fajr distance |
| Kazakhstan, assigned MWL | every library | The muftiate publishes ISNA 15/15 with a **Hanafi Asr** in its own page source | 3 degrees and a whole madhhab wrong |

**Karachi 18/18 is permanently unverifiable.** No University of Islamic Sciences publication exists, and the
university is not a state body. The cost of that uncertainty is measured: choosing 18 over 15 moves Fajr by 14 to
15 minutes across Karachi, Lahore, Delhi and Dhaka (R7).

---

## 3. What countries actually use, and how much of the world we can honestly serve

R2 and R5 built the adoption map on a strict evidence discipline: tier A means the authority's own site was read,
down to NULL meaning nothing could be sourced and the report says so rather than guessing.

**The headline is sobering and it is the most important planning number in the research** (R5):

| Evidence state, within the top 25 Muslim populations | Muslims | Share of world Muslims |
| --- | ---: | ---: |
| **A: measured or read on the authority's own site** | 770,969,347 | **38.5%** |
| **NULL: nothing sourceable at all** | 597,378,244 | **29.9%** |
| C: asserted second-hand (Pakistan alone) | 233,000,000 | 11.7% |
| D: library constant only (Algeria, Russia) | 61,500,000 | 3.1% |

**Only about 40% of the world's Muslims live somewhere a convention is actually established, and no single
convention reaches 20% of them.** India, Pakistan, Nigeria, Iraq, Sudan, Afghanistan, Ethiopia, Uzbekistan, China,
Niger, Mali, Tanzania, Senegal and Syria have no national prayer-time authority this research could find. That is
not a gap in the searching; for several of them it is the fact.

**Authorities that were fully recovered and measured** (R1, R2, R5): Egypt, Iran, Bangladesh, Yemen, the UAE,
Saudi Arabia, Qatar, Oman, Morocco, Turkey, Malaysia, Singapore, Indonesia, Brunei, Azerbaijan, Kazakhstan.

**Three structural findings that no parameter table would have revealed:**

1. **The Imsak trap, and it cuts both ways.** Malaysia and Indonesia print `Imsak` as a real extra row exactly 10
   minutes before Subuh, measured on 30 of 30 days. Turkey's table has **no Fajr row at all**: its first row is
   `İmsak` and that row IS the Fajr time. A library's `Fajr` output lands on Malaysia's official Imsak. Fill an
   `imsak` field and a `fajr` field naively and the app is 10 minutes wrong in one country or the other.
2. **Madhhab folklore does not survive the printed tables.** Turkey is Hanafi in fiqh and prints the **standard
   one-shadow Asr**, measured 49 minutes from the Hanafi value at Istanbul. Saudi Arabia and Qatar likewise. The
   genuinely Hanafi-Asr territory is the Indian subcontinent and its diaspora institutions. Azerbaijan is the
   combination no library expresses: a **Shia Maghrib at sunset+14 to 15 and a Shia midnight, paired with a Hanafi
   two-shadow Asr**.
3. **Some timetables print BOTH Asr columns.** East London Mosque publishes `1 Mithl` and `2 Mithl` side by side.
   A single Asr field cannot represent the source.

**And the supply chain breaks the idea of matching a mosque, in the vendors' own words** (R2). Masjidbox tells
admins they may "overwrite the time of each prayer". Masjidal offers "mass upload your timings". Mawaqit states
mosques may "enter their own calendar of prayer times directly". Measured consequence: **nine central London
mosques on Mawaqit disagree by 26 minutes on Fajr and 48 on Asr** (R4). No computation bridges that, because it is
not a computation disagreement. **An accuracy claim can be scoped to an authority. It can never be scoped to a
mosque.**

---

## 4. The library question is settled, with conditions

`adhan@4.4.6`, MIT, is the recommendation (R3), and R7 attacked it and it survived.

**The accuracy question is not the deciding factor, and proving that was most of the work.** Against the US Naval
Observatory's own service, over 10 cities and 12 dates, **no library disagreed by 2 minutes or more** on sunrise,
transit or sunset. adhan matched exactly on 106 of 116 sunrises (R3). Three independently written engines all clear
the bar a minute-resolution app needs.

**What actually decides it:** MIT licence (the whole AlAdhan PHP lineage is GPL-3.0 and cannot ship in a closed
app binary); a six-language family sharing byte-identical fixtures; the only candidate whose polar behaviour is a
deliberate, documented design rather than an accident; and it ships the Moonsighting Committee method that wave 1
already audited. Performance is a non-issue: a full year for one city is 11.6 ms, and 4.6 KB minified and gzipped.

**The conditions, each measured** (R3, R7):

- **Set `highLatitudeRule` explicitly.** This is the single largest lever in the entire research. Measured spread
  BETWEEN rules at one library: **47.8 minutes mean at London, 69.9 at Oslo, 112.7 at Tromso**, and at Stockholm
  and above **no day of the year has all rules agreeing within a minute**. Follow the user's authority where it
  publishes a rule; default to `SeventhOfTheNight` otherwise.
- **Override Canada to 13/13.** FCNA's own published position, absent from every library.
- **Never call `recommended()`.** It never fires below the equator.
- **Keep `rounding` at `Nearest`** for display, and note R6's finding that adhan's rounding is itself the single
  biggest source of apparent disagreement with authorities.
- **Bound Asr above 60N independently.** R7 measured that adhan's Asr approximation produces a 2,279-minute
  runaway at Tromso where an exact solve is stable to 1 minute, which corrects R3's claim that this was inherent
  to the definition.
- **Decide the polar policy in the app.** adhan returns `Invalid Date` on 69 to 116 days a year at Tromso, which
  is correct behaviour, but R7 found that **even `Unresolved` produces an out-of-order prayer card on 18 of 248
  days**, so filling nulls does not fix it. R11 refined the population downward to **2.26 million above 66.5N**,
  72% of it in Russia, against about 230 million in the 48 to 55 band, a ratio of 102 to 1 that is how this work
  should be scoped.
- **`MiddleOfTheNight` is measured the worst rule at every authority tested, and it is adhan's default.** That is
  the strongest reason to set the rule explicitly, and it is a stronger one than R3 or R7 had.

**The verification problem the owner raised is solved, for the astronomy.** R7 built the suite: USNO fixtures
across 20 cities, **37,340 comparisons, 0 failures**, committed under `data/validation/`. The USNO's astronomical
twilight is -18 degrees, numerically the MWL and Karachi Fajr angle, so those rows verify the Fajr **solver**
against a government source. **The limit is permanent and worth stating: no oracle can verify a Fajr angle, an
Isha rule or an Asr factor, because those are juristic inputs, not astronomy.** Knowing where verification stops is
as valuable as the verification.

---

## 5. The correction table: the finding that makes offline-and-faithful possible

This is the research's strongest positive result, and it came from a question nobody had asked.

**National authorities publish timetables. A library computes times. The difference between them is small, stable
and cheap to encode.** Measured across **eleven authorities, 68 city-years and 135,996 published values**: six
signed integers per city put **127,234 of 127,236 non-London values within 2 minutes, 99.998%**. The only two
misses are typing errors in Brunei's own feed (R6).

Kuala Lumpur's six constants are Fajr +10, Sunrise -1, Dhuhr +3, Asr +2, Maghrib +2, Isha +2. That +10 is not
noise: JAKIM's own literature documents a 2-minute `ihtiyati`, and the Mufti of the Federal Territory published a
ruling on "tambahan 8 minit" for the Fajr adhan. Two plus eight is ten (R4).

**Classification of the eleven authorities measured** (R6):

| Category | Meaning | Who |
| --- | --- | --- |
| 1, exactly computable | a correctly configured library IS the authority's table | **Egypt**, all six constants zero |
| 2, computable plus constants | a small fixed per-field offset closes it | **ten of eleven**, including Malaysia, Indonesia, Singapore, Saudi Arabia, Turkey, UAE, Oman, Morocco, Brunei, Qatar |
| 3, computable plus a seasonal curve | the residual is a smooth function of the day | **none found** |
| 4, genuinely irregular | hand edits no computation reaches | **London only**, the app's own current source |

**Four sharp results inside that:**

- **adhan's rounding was the biggest single "correction", not any authority's policy.** Switching to
  `Rounding.None` and applying each authority's own rule moved Umm al-Qura from 42.8% to 85.4% exact, Indonesia
  from 62.5% to 90.3%, Singapore from 54.1% to 71.1%. Half the apparent residual is a library artefact.
- **What looks irregular is usually an unmodelled published rule.** Saudi Arabia's +30-minute Isha spike is
  exactly the 29 days of Ramadan 1448, where Umm al-Qura uses 120 minutes instead of 90. One conditional took its
  worst error from 28 minutes to 1.
- **The exact residual expires, and this is the decisive negative.** Carrying Singapore's 2025 residual onto a
  2026 baseline reproduces only 55.1% exactly with 3 minutes worst error, which is **worse than reusing 2025's
  published times verbatim**. A residual is the difference of two independently drifting quantities and inherits
  both drifts. The Maldives perpetual-year trick does not rescue it, because that trick stores times, not
  differences.
- **One city's table does not travel.** Kuala Lumpur's constants applied to Kota Bharu leave 6 minutes of error on
  16.7% of values. The residual is a per-city quantity. Turkey is the exception: one constant set covers all ten
  cities measured.

**Byte cost is emphatically not the constraint.** The exact per-day residual costs a median **282 bytes brotli per
city-year** against 1,825 for the naive times. Every city of every authority measured, 2,153 cities, is **528 KB**,
or 0.77% of the 67 MB release bundle. A twelve-city launch set is **3.2 KB**.

**The no-synthesis line, which the owner's standing rule makes decisive.** The exact residual is lossless
compression of the authority's own digits, so the user sees exactly what the authority printed: compliant. Six
constants leave up to 2 minutes of error, so the user sees a number the authority never printed: that is synthesis.
**The six-constant model must never reach the screen.** It is worth keeping as an offline integrity tripwire.

---

## 6. APIs: none is justified as a dependency, and one category is worth having

**Every general-purpose prayer API computes, and none is authoritative.** AlAdhan's own credits page says its code
"is based almost in its entirety on the libraries on this website", meaning PrayTimes.org (R4). Measured across 15
city-method years, AlAdhan matched a local `adhan` within 1 minute on 365 of 365 days at eight of nine cities. **An
API of that kind is strictly worse than a local library for this app**, because it adds a network dependency, a
privacy cost and an outage risk to a calculation the phone can already do.

**The sharpest evidence:** AlAdhan's method 17, labelled "JAKIM", was **0 of 365 days exact** against JAKIM's own
published year, and 9 to 12 minutes early on Fajr every day. An API carrying an authority's name is not serving
that authority's times.

**National authority feeds are the exception and the real find.** Five serve a whole official year in one keyless
request: JAKIM Malaysia, MUIS Singapore, Diyanet Turkey, Brunei KHEU and Saudi Umm al-Qura. The UAE serves the
whole country, 21,900 rows, **including the state's own iqama offsets**. These are the only sources with a genuine
claim on this app, because they are the thing a library cannot reproduce.

**The whole-year shape the owner hoped for works.** AlAdhan's year for London is 480,831 bytes raw and **26,715
bytes gzipped**, and the app already fetches a year from its current provider, so the architecture transfers.

**Licensing is the real exposure, and it is not a technicality.** Of eleven authorities measured, **one** is
licensed for commercial use (MUIS Singapore, under the Singapore Open Data Licence), **two** now carry explicit
prohibitions found in their own copyright pages, and **eight are silent. Silence is not permission.** Mawaqit, the
one product that serves what mosques actually pray by, states "Our API is currently private and not publicly
available" and "Any commercial use is strictly prohibited".

---

## 6b. London is solved, and it is the best-placed source in the catalog

This reverses the programme's own earlier reading, and it is the most useful single result in wave 4 (R13).

**The negative first, because it is decisive.** A search of **29,781 computed configurations**, every Fajr angle
from 8 to 20 in half-degree steps against every Isha angle and interval, three high-latitude rules, three London
coordinates, three rounding rules, each given a per-field offset fitted to London's own digits, reached only
**79.1% of values within a minute with 9 minutes of worst error**. On Fajr the best was 49.9% within a minute, on
Isha 44.9%. `MoonsightingCommittee` is the closest preset and still moves Isha on **361 of 365 days**. Two British
authorities, London Unified and Wifaqul Ulama, publish times nowhere near each other. **No computed source can
serve a London user without them noticing.**

**Then the positive, which is unusually strong.** London's published timetable is a table of Fajr and Isha
INTERVALS applied to sunrise and Maghrib, and that table is tiny and stable:

- **732 bytes** for a full leap-capable year, and the Fajr interval is identical on **365 of 365 shared days for
  every consecutive year pair from 2015 to 2026**.
- Against a **computed** sun it reproduces the published Fajr on 364 of 365 days and Isha on 362 of 365 in 2026,
  every miss exactly one minute. **So London does not need a fetch at all.**
- **The timetable's own publisher ships fifty future years, 2027 to 2076, as keyless downloads**, and publishes its
  equations. All fifty were fetched and parsed: 18,263 days, 127,841 values. **The 2027 interval table reproduces
  all fifty years exactly**, and the table plus the publisher's own equations reproduce 127,838 of 127,841 values
  exactly, with four of seven fields perfect on every day.
- Fifty years cost **10,290 bytes brotli**, 0.015% of the release bundle.

**Three findings inside that change decisions.** The provider **already changed its Asr margin**: every year to
2026 carries none and every year from 2027 carries a documented +2, so a London user's Asr moves 1 to 3 minutes in
January 2027 whatever this app does. R6 missed a moving day, `03-31` in 2020, so five slots move rather than four.
And **the notification sweep cannot see a moved time**: `findStaleScheduledNotificationIds` compares identifiers
only, and the identifier carries no time, so a source change that moves times without re-arming leaves the phone
firing old instants undetectably. That is what makes the explicit pin load-bearing rather than merely prudent.

---

## 6c. The app cannot know where it is without asking, and that is now measured

R14 answered the layer underneath the whole architecture, and the headline is a negative the owner will care about.

**A prayer time needs about 20 km of position accuracy**, falling to 13 km at London and 8 at Oslo. Fine GPS is 250
times more precision than the problem needs, so every sub-city method is indistinguishable in the output.

**The permission-free option fails.** Placing a user at their timezone's most populous city, measured across all
34,152 GeoNames places, gives a **median error of 16 displayed minutes**, a 90th percentile of 51, and only **28.1%
of the sampled world population within 2 minutes**. Only 3 of the 68 zones holding a Muslim-majority-country city
are within 2 minutes. **So the app needs a location signal to go worldwide.**

**Session 37's qibla precedent does not transfer, in either direction.** The two errors have different shapes:
8.6% of cities exceed 10 degrees of qibla error while **83.0% exceed 2 minutes of prayer error**. Qibla error is
catastrophic in a few places and negligible elsewhere; prayer error is moderate everywhere. Jeddah proves it, at
147.8 degrees of qibla error against the capital and **zero** prayer error against the most populous city, because
Jeddah is that city.

**The country is the better free signal.** 47 of 51 Muslim-majority countries have exactly one IANA zone, but ten
zones name several countries and hold 17.4% of that population, with all of Nigeria and Saudi Arabia among them.
`expo-localization`'s `regionCode` disambiguates every one and asks no permission.

**Two practical results.** Coordinate-to-zone is buildable offline for Malaysia at **96.5% from 63 KB** of
polygons, so R8's UNVERIFIED flag lifts, but **10 of 60 zones are unreachable by any coordinate**, so a picker is
required anyway and is 70 times cheaper. And **elevation should be read, for the reverse of R1's reason**: JAKIM
measurably applies a horizon-dip correction of 4.4 to 7.0 minutes on its high-ground zones, so NOT applying
elevation is what would make the app differ from the authority.

---

## 7. What this costs this codebase

R8 read the app's own source and found the London assumption is not one constant but four independent systems.

| System | Where | What breaks worldwide |
| --- | --- | --- |
| Timezone | `PRAYER_TIMEZONE`, `shared/constants.ts:258`, three readers in `shared/time.ts`, transitively every date | `prayerClockFormatter` (`shared/time.ts:25`) is built at module load with **two zone-blind offset caches** at `:67-68`. A second zone gives correct clock strings against wrong instants, which is a wrong alarm rather than a wrong display |
| Storage schema | `prayer_${date}`, `stores/database.ts:138,153` | **The largest single risk, and it is silent.** The key has no location, so a user who changes city and keeps the old cache reads city A's times under city B's name. Every guard in the pipeline checks shape, never provenance |
| Provider wire format | `api/client.ts`, `shared/types.ts` | field names, `TIME_PATTERN`, `REQUIRED_TIMES`, the `magrib`/`maghrib` spelling, and the whole per-day validation |
| Display copy | `components/day/Day.tsx`, `widgets/PrayerWidget.tsx`, `device/updates.ts` | cosmetic only |

**Two findings worth acting on regardless of v2.0:**

- **Jamaah is already typed and has never been read.** `IApiSingleTime` types five `*_jamat` fields
  (`shared/types.ts:18-38`), each commented "not used in app", and `REQUIRED_TIMES` drops them. The wire data is
  already arriving. It is the cheapest large feature available and the only one that improves the app for its
  **current** users.
- **The app's Asr comment is the reverse of its data.** `shared/types.ts:25` documents `asr` as Hanafi and `:27`
  documents `asr_2` as Shafi. Wave 1 established it is the other way round, and the app displays `asr`, the
  one-shadow Shafi time.

**The prayer name is a load-bearing identifier**, building 27 MMKV keys, 2 notification id formats, 11 audio slugs
and 67 mp3 filenames (session 39's measurement). The Imsak finding adds a second, independent reason to split the
concept from the identifier from the label: **only the label may vary.**

**Six of the app's eleven rows survive worldwide unchanged.** `Duha` collides with a real published row of the
same name and different value (JAKIM `Duha`, Brunei `Doha`, Kemenag's 4.5 degrees) rather than the app's
`Sunrise + 20`, which is worse than a missing row because it looks right. `Suhoor` collides conceptually with the
official `Imsak`. `Istijaba` is published almost nowhere.

---

## 8. What the competition does, and the claim available to this app

Every serious competitor **auto-selects the method with an override**, and none sells method choice as the primary
control: Muslim Pro's "App Recommended", Athan Pro's country auto-detection, Pillars' "Autopilot", Guidance's "no
setup required" (R8, all cited). Every one of them also ships **per-prayer manual minute offsets**, described in
their own help pages as the fix for "my mosque differs".

**The accuracy claims in this market are unsupportable and several are self-contradicting.** IslamicFinder titles
a page "Most Accurate Prayer Times" while the same company's help page tells users to correct the times by hand.
Muslim Pro's marketing says "the most accurate mobile app for prayer times" while its own disclaimer makes "no
representations as to the accuracy". Mawaqit's "100% Accurate" is the only defensible one, and only because it
republishes a mosque's own timetable rather than computing.

**So the honest claim is available and nobody is making it.** The app promises to show **what a named authority
published**, names that authority on the screen where the times are, and says plainly that authorities differ. It
never promises the user's mosque. R8 drafts the exact wording.

**A per-prayer user offset does not breach the never-invent rule**, and the distinction that resolves it is
provenance: a user-typed offset is the user's own choice, visibly marked, never overwriting the published time in
storage. That is different in kind from the app averaging or inventing a value.

---

## 9. The honest limits of this research

- **29.9% of the world's Muslims live where no convention could be sourced.** For several of those countries there
  appears to be no national authority at all.
- **Norway is not fully solved.** R9's frozen-clock reading reproduces the blank-cell counts exactly but scores
  42.3 minutes against the authority's own table on the days that bind, so something else is in its construction
  and R11 did not find it.
- **Sweden's stored coordinate for Kiruna is wrong in the authority's own data**, fitting 63.68N against a true
  67.86N, and the programme cannot tell a data error from a deliberate substitution from outside.
- **Three hemisphere sign bugs were found by measurement**, in Belgium's latitude-45 rule, Wifaqul Ulama's
  longest-day rule and adhan's `recommended()`. Any high-latitude rule taken from a northern authority must be
  tested below the equator before it is trusted.
- **Pakistan and Afghanistan are NULL**, and Pakistan is the second-largest Muslim population on earth.
- **Karachi 18/18 is permanently unverifiable**, and it is the constant most libraries apply to the entire
  subcontinent.
- **Eight of eleven authorities served data with no stated terms.** Nothing in this research establishes a right
  to redistribute their timetables.
- **The exact residual expires annually**, so a purely offline correction table is not durable without a refresh.
- **The polar circles have no good answer**, only choices, and even the honest choice produces an out-of-order
  prayer card on some days.
- **No oracle can ever verify Fajr, Isha or Asr.** That limit is permanent.
- **This research measured authorities, not mosques.** Nine London mosques disagree by 26 minutes on Fajr, and
  nothing here helps with that.
