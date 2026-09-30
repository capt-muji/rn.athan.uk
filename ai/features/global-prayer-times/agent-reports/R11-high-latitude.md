# R11: the high-latitude question, settled

**Status: RESEARCH ONLY.** No app code, no builds, no dependency added to the repository. Research window
2026-09-30. Every number is marked **measured** (this report computed it), **cited** (with a URL and fetch date) or
**UNVERIFIED**.

**Harness.** R5's solar harness at `data/countries/solar-harness.mjs` was reused unchanged and
`validate-harness.mjs` was run first: it exits 0 and reproduces the Egyptian General Authority of Survey's own
published Cairo row for 2026-09-30 on all six times to the minute. Every rule in this report, including the five
that no library ships, is implemented on that one engine (`data/highlat/rules.mjs`), which removes the last
shared-engine caveat from R7's between-rule comparison. No new astronomy was written.

**No contact was made with any body.** Every fact is from a public page or from measurement. Where a fact could not
be obtained it is recorded as unobtainable.

**Building on prior work.** R7 Part 2 measured the between-rule spread at one library. R9 measured what Sweden,
Norway and Belgium actually publish and left one gap explicitly named: what Islamiska Förbundet i Sverige does
above the Arctic Circle. A cancelled earlier attempt at this task left seven Kiruna and Sweden scripts under
`data/highlat/`; they were run first and their central finding is carried forward, credited and completed.

---

## Findings in one page

1. **R9's gap is closed, and the answer is a mechanism nothing in the programme had: a DAY LENGTH CLAMP.** Islamiska
   Förbundet i Sverige forces the printed day length into **exactly [300, 1140] minutes**, that is 5 to 19 hours,
   symmetric about solar noon, and then applies its night fractions to the CLAMPED night. Measured: across **eleven
   published city-years not one day falls outside [300, 1140]**, and seven cities spanning four degrees of latitude
   print a 21 December day of exactly 300 minutes against true day lengths from 287 down to **87**. Five constants
   fitted on Malmö and Stockholm alone, where no mechanism binds, then applied unchanged 800 km north, reproduce
   **ten of eleven** Swedish cities to a median 0.8 to 4.4 minutes. This is not one-seventh, not middle of the night, not a
   frozen fraction, and not any `highLatitudeRule` a library ships. Measured.
2. **Kiruna is a one-city latitude error in the authority's own data, not a rule.** Ten of eleven IFiS cities fit
   their own latitude to within **0.18 degrees**. Kiruna alone fits **63.68 N against a true 67.86 N, a gap of 4.18
   degrees**, while its longitude fits to 0.03 degrees. Its printed table is within 2 minutes of Umeå's on every
   column, and Umeå is at 63.83 N on the same meridian. Gällivare (67.13 N), Pajala (67.21 N), Jokkmokk (66.61 N)
   and Haparanda (65.84 N) are all at or above the same band and all fit their own latitude, so a deliberate
   substitution above a threshold is ruled out. Run at 63.68 N, Kiruna's median Fajr error falls from 8.9 minutes to
   **2.0**, and the share of days within 2 minutes rises from 7.7% to 50.4%. Measured. **IFiS publishes a Kiruna
   sunrise a median 27 minutes from the true one.**
3. **The catalogue is fifteen rules in five families, and five of them exist in no library.** Sweden's clamp,
   Norway's frozen clock, Belgium's latitude-45 relative estimate, Diyanet's capped interval with its mirrored Imsak
   rule, and Wifaqul Ulama's 3-day Aqrabul-Ayyam with its 65-minute Haraj cap. Each is stated by a named body on its
   own public page, with a URL, in section "The rule catalogue".
4. **The decisive test: on the days a rule is actually doing the work, one rule is right and the rest are 30 to 150
   minutes wrong.** Scored against each authority's own published year on only the days its base angle has no
   solution, not diluted across the year: at Stockholm the Swedish clamp is **median 4.4 minutes** on Fajr and the
   next-best library rule is **29.0**; at Kiruna run at its implied latitude, 5.3 against 25.2; at Oslo
   `SeventhOfTheNight` is **median 2.9 minutes on Isha** with 43.1% inside 2 minutes and every other rule is 15 to
   134; at Brussels `TwilightAngle` is **median 3.7 minutes** with 27.7% inside 2. Measured. **No single rule wins
   at more than one of the four authority-city pairs.**
5. **The between-rule spread is larger than R7 measured, because R7 was missing the authority rules.** With all
   fourteen rules on one engine: **60.8 minutes mean at London against R7's 47.8, 102.8 at Stockholm against 68.3,
   152.4 at Tromsø against 112.7**, worst case 478 minutes at Longyearbyen. And the agreement count is worse than
   R7's: **zero days of the year at every one of the fourteen cities**, including Paris at 48.9 N, where R7 found 148
   agreeing days at London. Measured.
6. **Two rules in the catalogue carry a hemisphere sign bug of exactly the class R7 found in adhan's
   `recommended()`, and this report found them by measurement and fixed them.** Belgium's "latitude 45" read
   literally as +45 is **20 to 47 minutes wrong** below the equator; Wifaqul Ulama's "longest day of the year"
   searched over May to July, which is what its wording assumes, is **316 minutes wrong at 69.6 S**. Signing the
   latitude and searching the whole year drops both to the 11 to 12 minutes that is the residual of an integer date
   mirror. Measured. Any rule stated in northern-hemisphere words needs this check.
7. **`SeventhOfTheNight` survives as the default, and R7's stated reason is confirmed with a number R7 did not
   have.** Measured largest day-to-day jump in Fajr: `MiddleOfTheNight` **23 minutes at London and 34 at Oslo**
   against `SeventhOfTheNight`'s **2 at both**, and at the 99th percentile 10.4 against 2.1. R7 argued the cliff
   qualitatively; it is real and it is an order of magnitude. Two rules beat it on smoothness, Sweden's clamp and
   Diyanet's interval, and both are a named authority's fiqh position, which disqualifies them as a default for
   users whose authority has not taken that position.
8. **A rule cannot be adopted in part, and this is the sharpest design finding in the report.** The ordering test
   flagged Sweden's rule alone as producing an out-of-order prayer card, on **21 of 365 days at Reykjavík and 26 of
   the 335 judged days at the Arctic Circle**, where every other rule scored 0. Isolated: scored against the rule's
   **own** clamped sunrise and sunset it is **0 out of order at every city, on all 365 days**. The disorder appears
   only when an app takes Sweden's Fajr and Isha rule and keeps the true astronomical sunrise, which mixes two
   frames. On 24 May at 66.5 N that gives Fajr 01:05 before a true sunrise of 01:11 and a clamped sunrise of 02:07.
   Measured.
9. **The population sizing refutes R7's figure downward and the priority ordering is not close.** Built bottom-up
   from named statistical-office regions rather than secondary sources: **2.26 million people above 66.5 N**, not
   R7's cited 4 million, of which **Russia supplies 72%** and all five Nordic countries together only 0.57 million.
   Applying national Muslim shares: **20.19 million Muslims in the 48-to-60 band against 0.20 million above 66.5,
   a ratio of 102 to 1**. The 60-to-66.5 band, where no rule ever agrees, holds 0.82 million. Measured arithmetic
   on cited figures.
10. **No Mawaqit mosque anywhere above the Arctic Circle returned a usable timetable, in any country.** Queried at
    Kiruna, Tromsø, Murmansk, Fairbanks and Bodø. The Arctic is a correctness obligation with no measurable mosque
    practice to check against, which is a different situation from every other region in this programme. Measured.
11. **New tier-B measurements for four countries no earlier report reached.** Finland is **bimodal at 14.57 and
    15.86 degrees** across 10 mosques with Oulu at 65 N reading a consistent 15.86; Scotland splits **15.43 at
    Glasgow against 18.00 at Edinburgh** with 6 of 11 printing a Hanafi Asr and a Maghrib margin of 4 to 10 minutes;
    Denmark reads 14.77 to 15.02; Iceland's single mosque reads 14.66 with an Isha at 10.56. Russia's four northern
    cities returned **zero** mosques. Measured, one day, and the sample sizes are on the rows.
12. **Two authorities publish a rule that relieves a hardship this report can now measure.** An angle-only 18/17
    Isha falls after 23:00 on **67 days at Paris and 29 at Reykjavík**, and after midnight on **16 at Paris, 10 at
    Reykjavík and 18 at Ushuaia**. The worst case is not at the pole: it is at 48 to 51 N and 64 N, which is exactly
    where the population is. Measured.

---

## The rule catalogue

Fifteen rules, five families. The "published as" column is the load-bearing one: it separates a rule a body states
in writing from a rule this programme recovered by inverting a published table, and those are different kinds of
evidence.

### The portion family

| Rule | Publishing body and URL | Definition, precise enough to implement | Published as |
| --- | --- | --- | --- |
| `MiddleOfTheNight`, also Nisf al-Layl / Nisful-Layl | `praytimes.org/calculation`, read 2026-09-30. Also adhan `HighLatitudeRule.MiddleOfTheNight`. As a fiqh position, Wifaqul Ulama, `wifaqululama.co.uk/salahtimes/`, ruling of 2018-11-11 | Sunset to sunrise halved. Fajr no earlier than 1/2 of the night before sunrise, Isha no later than 1/2 after sunset. Undefined when there is no sunrise or no sunset | **RULE**, by both bodies. praytimes.org states the arithmetic, Wifaqul Ulama states the fiqh basis |
| `SeventhOfTheNight`, also Sab'u Lail | `praytimes.org/calculation`; adhan `SeventhOfTheNight`; Arabeyes ITL options 6 and 7, `github.com/arabeyes-org/ITL/blob/master/prayertime/doc/method-info.md`; Moonsighting Committee, `moonsighting.com/how-we.html` | The night in seven parts. Isha after the first seventh, Fajr at the start of the seventh. Same bound, at 1/7 | **RULE.** Moonsighting cites its fiqh chain: Ashraf Ali Thanwi, *Imdadul Fatawa* vol 2 p98, and Allamah Shami in *Durr al-Mukhtar*, cited |
| `TwilightAngle`, also Angle-Based | `praytimes.org/calculation`; adhan `TwilightAngle`; ITL option 15 | The bound at `fajrAngle / 60` and `ishaAngle / 60` of the night. At 18 degrees that is 0.30 of the night | **RULE**, as arithmetic. praytimes.org calls it "an intermediate solution, used by some recent prayer time calculators", which is an implementation convention rather than a fiqh position |
| **Sweden's day-length clamp** | Islamiska Förbundet i Sverige, `islamiskaforbundet.se/bonetider/`, a full year for 112 cities, read through `agent-browser` 2026-09-30 | Sunrise and sunset at **1.51 degrees** below the horizon. **Clamp the day length into [300, 1140] minutes, symmetric about solar noon.** Fajr at **17.98 degrees** floored at **0.2055** of the CLAMPED night before the clamped sunrise; Isha at **15.90 degrees** capped at **0.1815** after the clamped sunset. All five constants fitted on Malmö and Stockholm only | **RECOVERED BY MEASUREMENT.** IFiS publishes no rule text. R9 recovered the fraction; this report recovered the clamp |
| ITL's own verdict on this whole family | ITL `method-info.md`, read 2026-09-30 | "the multiple methods in this category have **no proof in traditional Shari'a (Fiqh) resources**. These methods were introduced by modern day Muslim scholars and scientists for practical reasons only" | **cited**, verbatim |

### The fixed-interval family

| Rule | Publishing body and URL | Definition | Published as |
| --- | --- | --- | --- |
| **Diyanet's capped interval** | Diyanet İşleri Başkanlığı, Din İşleri Yüksek Kurulu, decision of **2009-08-28**, full Turkish text at `ditib.de/detail2.php?id=424`, read in Turkish 2026-09-30 | Above **45 degrees**: Isha is Maghrib **+ 1 hour 20 minutes**, but never later than **one third of the shar'i night**. And a second rule no library implements: for Imsak, in the summer months **March to September**, take the Maghrib-to-Isha interval, **add 10 minutes**, and **subtract that from sunrise** | **RULE**, in full, in the authority's own words, with its hadith citations for the one-third cap (Müslim, Mesacid 176-177) |
| **Belgium's relative estimate at latitude 45** | Executief van de Moslims van België, `emb-net.be/sites/default/files/horaire_priere_emb_2026.pdf`, over its Conseil des Théologiens' name. Arabic on the page: `التقدير النسبي لخط عرض 45` | From the start of May to the end of July, estimate relative to **latitude 45**. Implemented as the offset from latitude 45's sunrise to its 18-degree Fajr, applied to the local sunrise. **The 45 must be signed to the observer's hemisphere**, see the sign-bug finding | **RULE**, stated in French, Dutch and Arabic on the same page as the times. R9 measured that the stated rule does **not** reproduce the printed table, and that gap stands |
| **Norway's frozen clock time** | Islamsk Råd Norge, `bonnetid.no`, driven with `agent-browser` 2026-09-30. Its project rationale at `irn.no/prosjekter/felles-bonnetid/` | Hold the last angle-derived **clock time** unchanged through the unsolvable stretch. Measured by R9: Fajr 03:37 for 34 consecutive days, 03:17 for 46, while IRN leaves its own `Morgengry 16°` cell blank on 136 days and `Kveldsgry 15°` on 162. Reproduced here: 136 and 162 exactly | **RECOVERED BY MEASUREMENT** for the arithmetic. IRN's page states the **principle** in Norwegian, "basert på nærmeste 'normalt sted' og 'normal dato'", cited |
| Umm al-Qura's 90-minute Isha | R1, cited | Isha at Maghrib + 90 minutes, 120 in Ramadan. Not a high-latitude rule, listed because it is the same mechanism and because Saudi software country-switches to it (R1) | RULE, outside this report's latitudes |

### The nearest-place and nearest-day family

| Rule | Publishing body and URL | Definition | Published as |
| --- | --- | --- | --- |
| Aqrab al-Bilad, walked | adhan `PolarCircleResolution.AqrabBalad` | Walk the latitude toward the equator in 0.5-degree steps until the angle solves, then transfer the **offset** from the donor's sunrise, not the raw clock | RULE, as code. adhan's own resolution |
| Aqrab al-Bilad at a fixed latitude | ITL options 1 to 3, `method-info.md`: "The recommended latitude by many schools of Fiqh is **48.5 degrees**". `prayertimes.dk/story.html`, read 2026-09-30: "**Muslim world league has moved nearest latitude to 45 degrees in March 1986**" | Compute at 48.5 (or 45), transfer the offset. `prayertimes.dk` attributes the principle to "the fellow jurists of the Shafii School" | **RULE**, and the 45 is attributed to a **1406 AH / 1986 CE MWL decision**. The MWL decision document itself was **not located**: UNVERIFIED as a primary source |
| Aqrabul-Ayyam, absolute last day | Wifaqul Ulama, `wifaqululama.co.uk/salahtimes/`, naming **HMNAO** as the body that does this | "the last day when 18 degrees time was available, is used until 18 degrees becomes available again" | **RULE**, and named as HMNAO's practice |
| **Aqrabul-Ayyam as a 3-day average** | Wifaqul Ulama, same page, read in full 2026-09-30 | "In the App, we use a different method for calculating Aqrabul-Ayyam and **not the absolute last day**." Its reason, in its own words: HMNAO's absolute last day "causes severe problems during leap years", demonstrated as "a difference of (10-15 minutes)", so after analysing "nearly **3,000 postcodes in Britain**" it adopted "a **3 day average** (near Aqrabul-Ayyam)" | **RULE**, with its own justification and the scholars' assent recorded |
| **Wifaqul Ulama's warning never to mix** | same page | "During perpetual twilight, you should **only use one of the two methods, not both**; and, you should **not switch between the two methods**" | **RULE**, verbatim. This is a constraint on the app, not just on the arithmetic |
| **Wifaqul Ulama's Haraj cap on Isha** | `wifaqululama.co.uk/highlat/`, the Preston meeting of **2018-11-11**, "for over 7 hours", read in full | Its `Fāqid al-Layl` clause: Isha "restricted to **65 minutes after the local Astronomical sunset on the longest day of the year**". Three further options are recorded as not agreed, including a **hard 23:00 lock** and `min(15 degrees, 1/7 of night)`, and the meeting's own conclusion that "**no agreed upon National solution can be proposed since this is a grey area**" | **RULE**, and explicitly a non-consensus. Its Isha angle is **15 degrees at or above 48 latitude**, 18 below, with 24 named ulama listed |

### The Moonsighting Committee's own construction

| Element | Source | What it says |
| --- | --- | --- |
| Equator to 55 degrees | `moonsighting.com/how-we.html`, read in full 2026-09-30 | The seasonal latitude-and-day function against 18 degrees, taking "for Fajr, the later of the two and for Isha the earlier of the two" |
| 55 to 60 degrees | same | "the rule of Sab'u Lail (1/7th of the night), is used because other methods give times that become hardship" |
| Above 60 degrees | same | "at latitudes more than 60degrees, **we slide down to 60 degrees** and calculate Fajr & Isha using the rule of Sab'u Lail in summer", justified by a **Dar al-Ifta fatwa of 08/08/2010** naming an 18-hour fasting limit, and by Oslo at "about 60degrees" being taken as the Aqrab al-Bilad anchor. Hammerfest at 70.65 N is named as the case the plain rule fails |
| The disagreement wave 1 found | wave 1, `ai/features/moonsighting/` | The published text and the shipped tables disagree. **This report implements the published TEXT**, so what is measured is the committee's stated rule. adhan applies its 1/7 inside the `MoonsightingCommittee` path only (R7 charge 2) |

### One further catalogue source, new to this programme

`prayertimes.dk` (`PrayerHigh`), a Norway-based group describing itself as "Muslims who live in the high latitude
areas (i.e. above 45° North) for more than 10 years", publishing tables for "more than 240 cities in Scandinavia,
Iceland, Europe, Russia, UK, US and Canada". Read in full 2026-09-30. It is **tier C**, not an authority, and it
matters for one reason: its `story.html` is the only page found anywhere in this programme that **enumerates the
whole field** with attributions. It supplies four rules no other source in this research named:

| Rule it records | What it says | Status |
| --- | --- | --- |
| **Its own rule: standard Makkah time in the extreme period** | "Normal period implements standard ruling of prayer times, while **standard Makkah time is implemented during extreme period**. **Linear transition** is applied between the normal and extreme periods". Its winter trigger is stated as a rule of thumb: "whenever the day (from sunrise to sunset) is **less than 4 hours**, then the day is considered as winter extreme period" | cited. A **linear transition** between rules is a mechanism no other source in this programme uses |
| Fasting under 18 hours, switch to Makkah or Madina | attributed to **Dar al-Ifta al-Misriyyah, August 2010**, the same fatwa the Moonsighting Committee cites | cited, secondary |
| Fasting under 20 hours | attributed to Sheikh Abdulaziz bin Almusleh, Saudi Arabia, 2007 | cited, secondary, **UNVERIFIED** as a primary document |
| Divide the night in 3, Isha at the end of the first third | recorded without attribution | cited, weak |
| The Süleymaniye Foundation's construction | "Night has no indicator while the day's indicator is not sun but its brightness (duha)", a Turkish centre claiming a solution for all latitudes; day length capped at "zawal time plus 90 degrees sun move". `prayertimes.dk` records "They have **no solution for the situation where days are very short**" | cited. Recorded because it is a genuinely different construction, and because it is incomplete by its own recorder's account |
| Hizb-ul-Ulama's observational tables | Blackburn naked-eye observation, Molvi Yakub Miftahi's report. `prayertimes.dk` records the criticism: "observers were inexperienced, methodological errors, Blackburn is among the most polluted areas, too few observations". FCNA's 2024 paper cites the same 1988 report as fluctuating 12 to 18 degrees | cited by two independent sources |

**And the honest summary of the field, in the words of the people who compiled it:** "The very existence of many
different solutions for Isha and Fajr is the real evidence of dissatisfaction regarding prayer times among
Muslims." (`prayertimes.dk/story.html`, cited.) Diyanet says the same in its own 2009 decision: "**şu ana kadar
henüz herhangi bir takdir yöntemi üzerinde birlik sağlanamamıştır**", no unity has yet been achieved on any
estimation method (cited).

### Countries newly sourced, and what was and was not found

| Country | What was searched | Result |
| --- | --- | --- |
| **Finland** | `rukousajat.fi` read; searched in Finnish for a national Islamic council publishing a method. 10 mosques measured across Helsinki, Turku, Tampere and Oulu | **No national authority located.** `rukousajat.fi` serves Helsinki with a PDF download and states no method. Mosque practice is **bimodal: 14.56 to 14.65 at Turku and Tampere, 15.86 at Oulu (65 N), 17.57 to 18.01 at Tampere and Helsinki**. Zero of 10 print a Hanafi Asr. Maghrib margin -1 to +3. Tier B, measured, one day |
| **Iceland** | `icci.is` and `grandmosque-iceland.is` read. 1 mosque measured | **No authority.** The ICCI states it serves "nearly 4,000 Muslims in Reykjavík", cited. The Grand Mosque's single row measures **Fajr 14.66, Isha 10.56, Asr 0.99, Maghrib at plain sunset**. An Isha at 10.56 degrees is the shallowest in this whole programme, which at 64 N is what a hardship rule looks like. Tier B, one mosque |
| **Denmark** | Searched in Danish for Islamisk Trossamfund and Dansk Islamisk Trossamfund publishing bedetider. 2 mosques measured | **No authority table located.** Mosque practice **14.77 to 15.02 on Fajr, 13.85 to 14.10 on Isha**. Aarhus returned no mosque. Tier B, two mosques |
| **Scotland** | 11 mosques measured across Glasgow and Edinburgh; Aberdeen and Dundee returned none | **Two conventions in one country, sharply split.** Glasgow reads **15.39 to 15.44 Fajr with 16.02 to 16.06 Isha**, which is Wifaqul Ulama's own published pairing of 18 for Fajr shifted plus **15 degrees for Isha**; Edinburgh reads **17.98 to 18.00 Fajr with 14.97 Isha**. **6 of 11 print a Hanafi Asr.** Maghrib margin **4 to 10 minutes**, consistent with Wifaqul Ulama's published "add 5 minutes to sunset". Tier B, measured |
| **Northern Russia** | Mawaqit queried at Saint Petersburg, Murmansk, Arkhangelsk and Syktyvkar. Searched in Russian for muftiate prayer-time methodology | **Zero mosques returned for all four cities.** No muftiate methodology document located in Russian. Russia stays at R5's tier D, and Russia holds **72% of the world's above-66.5 population** |
| **Canadian prairies** | Mawaqit queried at Edmonton, Calgary, Saskatoon and Winnipeg. Searched for a Canadian Council of Imams ruling | **Only 2 of 5 rows survived the jamaah sanity gate**, and they disagree completely: Edmonton 18.34/17.44, Calgary **9.96/9.96**. A 9.96-degree Fajr at 51 N is a hardship setting, not a convention. **No CCI ruling on high latitude located.** FCNA's own 2024 paper recommends **15 degrees** and R7 established FCNA publishes **13/13 for Canada**, which no library ships |
| **Alaska** | Mawaqit queried at Anchorage and Fairbanks | **Zero mosques returned.** R7 cited an Anchorage community of about 3,000 |
| **Above the Arctic Circle, every country** | Mawaqit queried at Kiruna, Tromsø, Murmansk, Fairbanks, Bodø | **Not one usable timetable anywhere.** The only measurable Arctic source in this entire programme is IFiS's own published table |

---

## Part 2: every rule against every other, on real geography

Base convention **MWL 18/17** throughout, so the rule is the only thing varying, which matches R7's design.
Full year 2026, fourteen cities, EU and US DST applied per city. Every value is reduced to **minutes from solar
noon** before any comparison, so timezone and DST drop out. All tables below are **measured**. Raw output at
`data/highlat/rules-matrix.txt`, machine-readable at `rules-matrix.json`.

### Where an angle stops having a solution

| City | Lat | Fajr 18 nulls | Isha 17 nulls | Polar day | Polar night |
| --- | ---: | ---: | ---: | ---: | ---: |
| Paris | 48.86 | 18 | 0 | 0 | 0 |
| London | 51.51 | 60 | 48 | 0 | 0 |
| Manchester | 53.48 | 78 | 69 | 0 | 0 |
| Copenhagen | 55.68 | 94 | 87 | 0 | 0 |
| Aberdeen | 57.15 | 104 | 98 | 0 | 0 |
| Stockholm | 59.33 | 118 | 112 | 0 | 0 |
| Oslo | 59.91 | 122 | 116 | 0 | 0 |
| Helsinki | 60.17 | 123 | 117 | 0 | 0 |
| Anchorage | 61.22 | 129 | 124 | 0 | 0 |
| Reykjavík | 64.15 | 146 | 140 | 0 | 0 |
| Arctic Circle | 66.50 | 159 | 153 | **30** | 0 |
| Tromsø | 69.65 | 175 | 169 | **69** | **49** |
| Longyearbyen | 78.22 | 219 | 213 | **128** | **111** |
| Ushuaia | -54.80 | 82 | 76 | 0 | 0 |

R7's counts of 60 at London, 122 at Oslo and 174 to 175 at Tromsø reproduce, which cross-validates the two
independent harnesses.

### Per rule, per city: what it produces, how much it moves, how often it has no answer

London, 51.51 N. Change is against the bare angle, in minutes, on days both answer.

| Rule | Fajr days changed | Fajr mean | Fajr max | Fajr no answer | Isha days changed | Isha mean | Isha max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `AngleOnly` | 0 | - | - | **60** | 0 | - | - |
| `MiddleOfTheNight` | 60 | n/a | n/a | 0 | 48 | n/a | n/a |
| `SeventhOfTheNight` | **219** | 48.2 | 151.9 | 0 | 199 | 50.2 | 153.6 |
| `TwilightAngle` | 92 | 31.1 | 75.7 | 0 | 88 | 35.3 | 87.5 |
| Sweden's clamp | 138 | 46.1 | 121.5 | 0 | 147 | 49.4 | 135.4 |
| Diyanet | **365** | 37.5 | 131.2 | 0 | **365** | 41.8 | 140.8 |
| Belgium lat 45 | **365** | 21.4 | 86.5 | 0 | **365** | 21.2 | 91.6 |
| Aqrab al-Bilad 48.5 | **365** | 11.8 | 60.6 | 0 | **365** | 11.8 | 65.9 |
| Aqrab al-Bilad walked | 60 | n/a | n/a | 0 | 60 | 20.4 | 37.3 |
| Aqrabul-Ayyam last day | 60 | n/a | n/a | 0 | 48 | n/a | n/a |
| Aqrabul-Ayyam 3-day | 60 | n/a | n/a | 0 | 48 | n/a | n/a |
| Norway frozen clock | 60 | n/a | n/a | 0 | 48 | n/a | n/a |
| Moonsighting, published text | 0 | - | - | **60** | 0 | - | - |
| Wifaqul Ulama Isha cap | 60 | n/a | n/a | 0 | **365** | 37.7 | 202.2 |

Stockholm, 59.33 N:

| Rule | Fajr days changed | Fajr mean | Fajr max | Fajr no answer | Isha days changed | Isha mean | Isha max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `AngleOnly` | 0 | - | - | **118** | 0 | - | - |
| `MiddleOfTheNight` | 118 | n/a | n/a | 0 | 112 | n/a | n/a |
| `SeventhOfTheNight` | **365** | 32.7 | 166.4 | 0 | 272 | 41.0 | 158.7 |
| `TwilightAngle` | 140 | 34.2 | 83.3 | 0 | 138 | 34.6 | 86.5 |
| Sweden's clamp | 183 | 45.9 | 133.3 | 0 | 193 | 46.2 | 138.8 |
| Diyanet | **365** | 62.6 | 151.9 | 0 | **365** | 64.4 | 152.0 |
| Belgium lat 45 | **365** | 50.5 | 130.0 | 0 | **365** | 48.0 | 125.8 |
| Aqrab al-Bilad 48.5 | **365** | 42.7 | 118.3 | 0 | **365** | 40.7 | 114.5 |
| Aqrabul-Ayyam 3-day | 118 | n/a | n/a | 0 | 112 | n/a | n/a |
| Moonsighting, published text | **365** | 32.7 | 166.4 | 0 | 272 | 41.0 | 158.7 |

Tromsø, 69.65 N. **This is where the families separate.**

| Rule | Fajr days changed | Fajr mean | Fajr max | Fajr no answer | Isha no answer |
| --- | ---: | ---: | ---: | ---: | ---: |
| `AngleOnly` | 0 | - | - | **175** | **169** |
| `MiddleOfTheNight` | 106 | n/a | n/a | **118** | **118** |
| `SeventhOfTheNight` | 247 | 89.9 | 198.8 | **118** | **118** |
| `TwilightAngle` | 128 | 37.5 | 95.6 | **118** | **118** |
| **Sweden's clamp** | 261 | 45.9 | 157.7 | **0** | **0** |
| Diyanet | 247 | 138.6 | 225.4 | **118** | **118** |
| Belgium lat 45 | 247 | 129.1 | 211.1 | **118** | **118** |
| Aqrab al-Bilad 48.5 | **365** | 102.2 | 203.3 | **0** | **0** |
| Aqrab al-Bilad walked | 175 | n/a | n/a | **0** | **0** |
| Aqrabul-Ayyam 3-day | 106 | n/a | n/a | **118** | **118** |
| **Norway frozen clock** | 175 | n/a | n/a | **0** | **0** |
| **Moonsighting, published text** | **365** | 82.0 | 195.8 | **0** | **0** |

**The structural reading, measured.** Every rule that is a **portion of the night** leaves **118 days with no
answer at Tromsø**, because a portion of the night is undefined when there is no night. That includes
`MiddleOfTheNight`, `SeventhOfTheNight`, `TwilightAngle`, Diyanet's cap, Belgium's lat-45 and both Aqrabul-Ayyam
variants, which fail because there is no sunrise to anchor the offset to. R7 measured the same 118 and reached the
same conclusion. **Only four rules answer on all 365 days at Tromsø, and every one of them substitutes a PLACE
rather than a portion**: Sweden's clamp, Aqrab al-Bilad at 48.5, Aqrab al-Bilad walked, and the Moonsighting
Committee's slide to 60. Norway's frozen clock also answers on all 365, by substituting a **time** with no
astronomical content at all.

### The spread between rules, which is the size of the decision

The per-day widest gap between any two rules that answer. **Measured**, 365 days, MWL 18/17, fourteen rules.

| City | Lat | Fajr spread mean | Fajr spread max | Isha spread mean | Isha spread max | Days all rules agree within 1 min | R7's Fajr mean, for comparison |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Paris | 48.86 | 46.9 | 169 | 57.1 | 184 | **0/365** | not measured |
| London | 51.51 | **60.8** | 172 | 71.5 | 220 | **0/365** | 47.8, and 148 agreeing days |
| Manchester | 53.48 | 70.0 | 175 | 79.8 | 227 | **0/365** | 53.6 |
| Copenhagen | 55.68 | 82.0 | 179 | 88.6 | 229 | **0/365** | 59.1 |
| Aberdeen | 57.15 | 90.2 | 184 | 93.8 | 217 | **0/365** | not measured |
| Stockholm | 59.33 | **102.8** | 196 | 104.8 | 227 | **0/365** | 68.3 |
| Oslo | 59.91 | 105.4 | 194 | 107.1 | 225 | **0/365** | 69.9 |
| Helsinki | 60.17 | 108.9 | 209 | 110.4 | 240 | **0/365** | 70.5 |
| Anchorage | 61.22 | 116.3 | 213 | 114.3 | 233 | **0/365** | 73.0 |
| Reykjavík | 64.15 | 140.2 | 258 | 138.2 | 262 | **0/365** | 79.1 |
| Arctic Circle | 66.50 | 152.4 | 341 | 151.5 | 347 | **0/365** | not measured |
| Tromsø | 69.65 | **152.4** | **369** | 152.8 | **379** | **0/365** | 112.7 |
| Longyearbyen | 78.22 | **182.2** | **478** | 190.8 | **475** | **0/365** | not measured |
| Ushuaia | -54.80 | 75.7 | 178 | 71.7 | 173 | **0/365** | 54.2, and 126 agreeing days |

**Two corrections to R7, both in the same direction.** R7's spread is **20 to 40% too small at every city**, because
R7 measured four rules and this measures fourteen, the five authority rules among them. And R7's agreement counts of
148 days at London and 126 at Ushuaia go to **zero**, because Diyanet's rule and Belgium's rule fire on **all 365
days** rather than only on the unsolvable ones. R7's finding that the rule choice is the largest lever in the
research is therefore understated, not overstated.

### Hemisphere symmetry, and two sign bugs found by measuring it

Ushuaia at 54.80 S first measured an Isha spread of **181 minutes mean against a Fajr spread of 78**, while
Copenhagen at the mirror latitude had the two within 7 minutes. A physical asymmetry of that size at 55 degrees is
impossible, so each rule was compared against its own mirror image across the equator, with the date shifted by
183 days. **Measured** (`data/highlat/measure-hemisphere.mjs`):

| Rule | Mirror error at 55.7, before | After signing | What was wrong |
| --- | ---: | ---: | --- |
| Belgium's latitude 45 | **46.6 min max** | **10.9** | The rule says "latitude 45". Read literally as +45, a southern observer is compared against a northern donor. The 45 must be **signed to the observer's hemisphere** |
| Wifaqul Ulama's Isha cap | **267.8 min max**, and **533.7 at 69.6 S** | **12.5** | The rule says "the longest day of the year". Implemented as a **May to July search**, which its wording assumes, it finds the SHORTEST day below the equator. The search must cover the whole year |
| `SeventhOfTheNight`, `MoonsightingText` | 7.6 to 9.5 | unchanged | Already symmetric. These are the two cleanest rules in the catalogue on this test |

The residual 8 to 12 minutes at every rule after the fix is the **183-day integer date mirror**, not a defect: the
solstices are not 182.5 days apart in a real calendar. After the fix Ushuaia's spread is 75.7 Fajr and 71.7 Isha,
which sits correctly between Copenhagen's 82.0 and Aberdeen's 90.2.

**This generalises beyond these two rules.** R7 found the same class of bug in adhan's `recommended()`, which tests
the signed latitude and therefore never fires below the equator. Three independent instances in one catalogue means
the rule is: **any high-latitude rule stated in northern-hemisphere words must be sign-checked before it ships.**

### How far each substitution has to reach

| City | Lat | Aqrabul-Ayyam 3-day, max donor days away | Aqrab al-Bilad walked, max degrees |
| --- | ---: | ---: | ---: |
| London | 51.51 | 31 | 3.0 |
| Copenhagen | 55.68 | 48 | 7.5 |
| Stockholm | 59.33 | 60 | 11.0 |
| Helsinki | 60.17 | 63 | 12.0 |
| Reykjavík | 64.15 | **74** | 16.0 |
| Tromsø | 69.65 | 55 | 21.5 |
| Longyearbyen | 78.22 | 48 | **30.0** |

R7 measured 55 donor days at Tromsø and this reproduces it exactly. **The largest reach is not at the pole, it is at
Reykjavík: 74 days, two and a half months.** Above the Arctic Circle the donor distance falls because the polar day
itself becomes unsolvable and the rule stops reaching for it. At Longyearbyen Aqrab al-Bilad walks 30 degrees, which
is **3,300 km**, a considerably larger fiction than the 12.5 degrees R7 measured with adhan's own resolution, and
the difference is that this implementation walks until an 18-degree Fajr solves rather than until the sun merely
rises.

---

## The authority-reproduction scores: the decisive test

Every rule scored against an authority's own published year, on **only the days that authority's own base angle has
no solution**, because those are the days the rule is doing the work. Scoring across the whole year dilutes every
rule with the days they all agree and makes the test look inconclusive; both views are printed in
`data/highlat/authority-fit.txt`. Errors in minutes, wrapped onto the nearest 24-hour cycle so Belgium's
after-midnight Isha is not counted as 1,426 minutes wrong. All **measured**.

### Sweden, Islamiska Förbundet i Sverige, Stockholm 59.33 N, 365 published days, 118 unsolvable Fajr days

| Rule | Fajr median | Fajr p90 | Fajr max | % within 5 | Isha median | Isha max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Sweden's clamp** | **4.4** | **5.8** | **6.2** | **59.3%** | **5.2** | **7.4** |
| Diyanet | 13.2 | 19.3 | 23.3 | 18.6% | 9.8 | 16.9 |
| `SeventhOfTheNight` | 29.0 | 36.1 | 38.6 | 0% | 20.0 | 26.4 |
| `TwilightAngle` | 32.0 | 42.0 | 45.7 | 0% | 25.9 | 36.7 |
| Belgium lat 45 | 51.5 | 80.8 | 83.1 | 5.9% | 43.4 | 63.4 |
| Aqrab al-Bilad 48.5 | 78.1 | 142.2 | 150.6 | 0% | 63.6 | 93.4 |
| Norway frozen clock | 83.7 | 115.7 | 124.7 | 0% | 88.2 | 135.2 |
| `MiddleOfTheNight` | 109.8 | 142.6 | 150.9 | 0% | 114.8 | 152.0 |
| Aqrab al-Bilad walked | 130.5 | 141.1 | 151.9 | 0% | 83.6 | 92.7 |
| Aqrabul-Ayyam 3-day | 141.3 | 154.5 | 164.0 | 0% | 135.8 | 155.6 |
| Aqrabul-Ayyam last day | 154.0 | 166.6 | 170.4 | 0% | 147.8 | 167.5 |

**No library rule comes within 25 minutes of the Swedish authority on the days it matters.** Diyanet's rule,
designed for a different country on a different fiqh basis, is the closest of the published alternatives at 13.2.

### Norway, Islamsk Råd Norge, Oslo 59.91 N, 365 days, 110 unsolvable Fajr days at its own 16.08 degrees

| Rule | Fajr median | Fajr max | % within 5 | Isha median | Isha max | % within 2 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **`SeventhOfTheNight`** | **16.3** | 62.5 | 5.5% | **2.9** | **11.2** | **43.1%** |
| **Moonsighting, published text** | **16.3** | 62.5 | 5.5% | **2.9** | **11.2** | **43.1%** |
| Sweden's clamp | 8.1 | 31.3 | **34.5%** | 15.1 | 24.8 | 0% |
| `TwilightAngle` | **26.4** | 48.5 | 5.5% | 40.8 | 51.2 | 0% |
| Diyanet | 28.2 | 43.7 | 7.3% | 33.9 | 36.0 | 2.0% |
| **Norway frozen clock** | 42.3 | 89.9 | 5.5% | 32.8 | 106.3 | 2.9% |
| Aqrabul-Ayyam last day | 81.8 | 161.8 | 1.8% | 91.9 | 175.1 | 0% |
| `MiddleOfTheNight` | 113.6 | 143.6 | 0% | 134.0 | 167.4 | 0% |

**Three things, and one is uncomfortable.** `SeventhOfTheNight` reproduces IRN's Isha better than any other rule,
at a median 2.9 minutes with 43.1% inside 2 minutes, which is a genuine result for the recommended default. Sweden's
clamp wins on Fajr at 8.1 minutes and 34.5% inside 5. **And Norway's own frozen-clock rule scores 42.3 minutes
against its own authority's table.** R9 identified the frozen clock from the printed runs of identical values, and
that measurement stands: Fajr 03:37 held for 34 days is in the data. What this score shows is that the frozen clock
is not the whole rule. IRN is doing something the frozen clock alone does not capture, and **this report did not
identify what.** Recorded as open.

### Belgium, Executief van de Moslims van België, Brussels 50.85 N, 348 days parsed, 47 unsolvable

| Rule | Fajr median | Fajr max | % within 2 | % within 5 | Isha median | Isha max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **`TwilightAngle`** | **3.7** | **9.6** | **27.7%** | **57.4%** | **12.6** | 27.9 |
| **Belgium's own stated lat-45 rule** | 11.7 | 14.4 | 4.3% | 12.8% | 25.6 | 28.4 |
| Sweden's clamp | 44.2 | 49.1 | 0% | 0% | 41.5 | 45.6 |
| Diyanet | 48.9 | 54.1 | 0% | 0% | 44.0 | 47.0 |
| `SeventhOfTheNight` | 73.5 | 77.3 | 0% | 0% | 59.1 | 62.9 |
| `MiddleOfTheNight` | 91.8 | 104.3 | 0% | 0% | 104.2 | 123.7 |
| Moonsighting, published text | no answer on any day | | | | no answer on any day | |

**R9's central Belgian finding is confirmed and sharpened.** R9 measured that the EMB's stated latitude-45 rule
does not reproduce its own printed table, and put the gap at a median 20.9 minutes. With the sign bug fixed and
scored only on the binding days, the gap is **11.7 minutes**, which is smaller than R9 measured but still not a
reproduction. And the rule that does fit best is **`TwilightAngle` at 3.7 minutes**, which is not the rule Belgium
states. So the EMB's printed table behaves like an angle-based portion rule while its own text names a
nearest-place rule. That gap is the finding, exactly as R9 said.

**Moonsighting's published text answers on zero days here**, because below 55 degrees it is the seasonal function
alone with no high-latitude rule, and at Brussels the 18-degree angle has no solution on 47 days. Between 48.6 and
55 degrees the committee's published text supplies **nothing**. R7 predicted this from the threshold arithmetic;
here it is measured against a real authority's table.

### Sweden, Kiruna, both latitudes

| Scoring | Fajr median | Fajr max | % within 2 | Isha median | Isha max | % within 2 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sweden's clamp at the true 67.86 N | 9.0 | 24.5 | 4.2% | 5.4 | 25.6 | 18.1% |
| **Sweden's clamp at the implied 63.68 N** | **5.3** | **10.8** | **9.1%** | **4.6** | **8.6** | **13.0%** |
| next-best rule at 63.68 N, `SeventhOfTheNight` | 25.2 | 40.0 | 2.8% | 19.7 | 26.7 | 3.8% |
| next-best rule at 67.86 N, `SeventhOfTheNight` | 19.9 | 85.9 | 5.2% | 13.5 | 81.0 | 7.6% |

---

## Part 3: Kiruna, and R9's gap closed

R9 measured that the Swedish frozen-fraction rule reproducing Stockholm and Malmö to 1 minute leaves **a median
23.5 and worst 89.3 minutes at Kiruna**, and named it the last unexplained authority behaviour in the programme.
It is now explained, in two parts, and the two are independent.

### Part one: the mechanism is a day-length clamp, and it applies to every northern Swedish city

The cancelled attempt's `sweden-latcap.mjs` found the measurement that cracks it. Re-run, extended to eleven cities
and reduced to a model-free form in `sweden-daylength.mjs`, which uses no astronomy at all: it reads the published
Magrib minus the published Shuruk and nothing else. **Measured:**

| City | Lat | Min printed day | Max printed day | Days at exactly 300 | Days at exactly 1140 | Days outside [300, 1140] |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Malmö | 55.60 | 436 min | 1065 min | 0 | 0 | **0** |
| Stockholm | 59.33 | 378 | 1131 | 0 | 0 | **0** |
| Sundsvall | 62.39 | 312 | **1140** | 0 | 5 | **0** |
| Östersund | 63.18 | 301 | **1140** | 0 | 4 | **0** |
| Umeå | 63.83 | **300** | **1140** | 23 | 5 | **0** |
| Luleå | 65.58 | **300** | **1140** | 47 | 4 | **0** |
| Haparanda | 65.84 | **300** | **1140** | 49 | 4 | **0** |
| Jokkmokk | 66.61 | **300** | **1140** | 56 | 4 | **0** |
| Gällivare | 67.13 | **300** | **1140** | 60 | 4 | **0** |
| Pajala | 67.21 | **300** | **1140** | 60 | 4 | **0** |
| Kiruna | 67.86 | **300** | **1140** | 27 | 5 | **0** |

**Not one day of any of eleven published years falls outside [300, 1140] minutes, and seven cities spanning four
degrees of latitude sit on both bounds exactly.** Against the true day lengths, which vary enormously across those
same cities, that is decisive. At 21 December the true day is 287 minutes at Umeå, 228 at Luleå, 150 at Gällivare,
144 at Pajala and **87 at Kiruna**, and all five print 300. At 21 June the true day is 1,290 minutes at Umeå and
there is no sunset at all at the four northern cities, and all five print 1,140.

A latitude substitution cannot produce that: it would give five different day lengths. And the "cap latitude" that
would explain it differs between the solstices, **63.34 in December against 59.36 in June**, which rules the
substitution out arithmetically. **300 and 1140 minutes are 5 and 19 hours, and they sum to 24.**

Five constants were then fitted on **Malmö and Stockholm only**, where the clamp never binds on any of 365 days, so
the fit cannot be contaminated by the thing it is meant to explain. Fitted values: horizon **1.51 degrees**, Fajr
**17.98**, Isha **15.90**, night fractions **0.2055** and **0.1815**. Applied unchanged to nine further cities,
**measured** (`data/highlat/sweden-final.mjs`):

| City | Lat | Clamp binds | Fajr median | Fajr max | Shuruk median | Magrib median | Isha median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Malmö | 55.60 | 0 | 1.5 | 15.1 | 0.8 | 0.8 | 1.5 |
| Stockholm | 59.33 | 0 | 1.4 | 18.7 | 1.4 | 1.5 | 1.3 |
| Sundsvall | 62.39 | 54 | 2.2 | 22.9 | 2.5 | 2.4 | 2.1 |
| Östersund | 63.18 | 65 | 2.1 | 22.3 | 2.7 | 2.5 | 1.9 |
| Umeå | 63.83 | 90 | 2.3 | 23.8 | 2.7 | 2.6 | 2.4 |
| Luleå | 65.58 | 126 | 3.9 | 22.5 | 3.1 | 2.8 | 2.5 |
| Haparanda | 65.84 | 131 | 2.7 | 25.2 | 3.3 | 2.8 | 2.1 |
| Jokkmokk | 66.61 | 141 | 2.8 | 27.3 | 3.9 | 2.9 | 2.2 |
| Gällivare | 67.13 | 149 | 5.8 | 24.5 | 4.4 | 3.1 | 2.8 |
| Pajala | 67.21 | 150 | 2.4 | 29.7 | 4.3 | 3.0 | 2.9 |
| **Kiruna** | **67.86** | **159** | **8.9** | 28.8 | **11.3** | **11.0** | **7.9** |

**Ten of eleven cities fall out of five constants fitted 800 km south. Kiruna does not.** Note that Jokkmokk,
Gällivare and Pajala are all at or above the Arctic Circle and all fit, so the mechanism is not "something else
happens above 66.5".

**What each layer is worth, ablated at Kiruna** (median absolute error, minutes, **measured**):

| Model | Shuruk | Magrib | Fajr | Isha | Days with no answer |
| --- | ---: | ---: | ---: | ---: | ---: |
| angle only, no clamp, no portion floor | 25.5 | 25.8 | 11.1 | 12.9 | **165** |
| plus the day-length clamp | **11.1** | **10.6** | 11.1 | 12.9 | 165 |
| angle plus portion floor, no clamp | 36.5 | 36.0 | 11.9 | 13.7 | 0 |
| all four layers | 11.4 | 11.3 | **8.9** | **7.9** | **0** |

The clamp is what fixes sunrise and sunset, which no portion rule touches. **The clamp is also what takes the
no-answer count to zero**, and it does so without substituting a place or a date: it substitutes a **day length**,
which is a smaller fiction than either.

### Part two: Kiruna is a latitude error in the authority's own data

Fitting a latitude per city under the same clamp model, **measured** (`data/highlat/sweden-eleven.mjs`):

| City | True lat | Best-fit lat | Gap | Verdict |
| --- | ---: | ---: | ---: | --- |
| Malmö | 55.60 | 55.53 | -0.08 | own latitude |
| Stockholm | 59.33 | 59.15 | -0.18 | own latitude |
| Sundsvall | 62.39 | 62.51 | +0.12 | own latitude |
| Östersund | 63.18 | 63.36 | +0.18 | own latitude |
| Umeå | 63.83 | 63.93 | +0.10 | own latitude |
| Luleå | 65.58 | 65.44 | -0.14 | own latitude |
| Haparanda | 65.84 | 65.82 | -0.02 | own latitude |
| Jokkmokk | 66.61 | 66.55 | -0.06 | own latitude |
| Gällivare | 67.13 | 66.95 | -0.18 | own latitude |
| Pajala | 67.21 | 67.37 | +0.16 | own latitude |
| **Kiruna** | **67.86** | **63.68** | **-4.18** | **SUBSTITUTED** |

Two hypotheses fit a 4-degree gap and they are distinguishable. **E1**, IFiS deliberately substitutes a place
(Aqrab al-Bilad, one hop to Umeå at 63.83 N). **E2**, IFiS's city database has Kiruna's latitude wrong. Three
measurements separate them:

| Test | Result | Which hypothesis |
| --- | --- | --- |
| Longitude recovered from the printed Dhuhr column, which carries longitude and no latitude | **Kiruna implies 20.20 E against a true 20.23 E, a gap of 0.03 degrees.** All seven cities recover their own longitude to 0.04 degrees | **E2.** A place substitution would move the longitude to the donor. Kiruna keeps its own |
| Kiruna's printed table against Umeå's, raw | Median **1 to 2 minutes** on every column, max 4. Only 1 of 365 days is byte-identical | **E2.** Not the same place, but the same latitude with a 0.15-minute longitude difference |
| Do the other Arctic cities show it? | Gällivare, Pajala, Jokkmokk and Haparanda, all at 65.8 to 67.2 N, **all fit their own latitude to 0.18 degrees** | **E2.** A policy above a threshold would catch all five |
| Does the printed sunrise match the true one? | **No. Median 27.2 minutes, p90 83, max 142** on the 293 days the sun does rise | **E2.** A deliberate rule would not be expected to move sunrise; a wrong latitude moves everything |

**The verdict: a wrong latitude in one city's record, most consistent with a transposed digit, 63.86 for 67.86.**
It cannot be proved to certainty from outside: the plugin computes server-side, and `cities.php`,
`data/cities.json` and `bonetider.php` all return the same 9,325-byte HTML page rather than a coordinate table, so
**the authority's own stored coordinate for Kiruna is unobtainable.** Recorded as such. But every measurement points
one way, and the practical consequence does not depend on which hypothesis is right.

**The practical consequence, and it is the one the app has to care about.** Run at 63.68 N, Kiruna's error falls
from 8.9 to **2.0** minutes on Fajr and from 11.3 to **3.6** on sunrise, and days within 2 minutes rise from 7.7% to
**50.4%**. So an app reproducing IFiS faithfully at Kiruna must reproduce **the authority's own error**, and an app
computing correctly at Kiruna's true latitude will differ from the authority's published table by a median 8.9
minutes on Fajr and 27 minutes on sunrise. **That is a genuine conflict between "faithful to the authority" and
"astronomically correct", and it is the first one this programme has found where the two are incompatible by
design.** It affects Kiruna's 22,402 people (SCB 2025-12-31, cited).

---

## Part 4: the design recommendation

### Which rules must the app implement to be faithful, ranked by users served

Ranked by the Muslim population each serves, using the band figures in Part 5 and R5's country map. Population
figures are **cited**; the ranking arithmetic is **measured**.

| Rank | Rule | Authorities it serves | Muslims served, order of magnitude | Does any library ship it? |
| ---: | --- | --- | ---: | --- |
| 1 | **`SeventhOfTheNight`** | Moonsighting Committee 55 to 60; Wifaqul Ulama as one of its two offered options; the London ulama option in its 2018 ruling; best measured fit to Norway's Isha | **the default's reach, so all of the 48-to-60 band that has no authority: about 20 million** | **Yes**, adhan and every library |
| 2 | **Diyanet's capped interval, plus its mirrored Imsak rule** | Turkey, and by supply chain Germany, the Netherlands' largest network, and the Turkish mosque clusters R9 measured inside France | **Turkey's 81.2 million is below 45 N, so the rule serves the Turkish diaspora in the 48-to-55 band: single-digit millions** | **No.** The interval exists nowhere; the Imsak mirror exists nowhere |
| 3 | **`TwilightAngle`** | Best measured fit to Belgium's own published table at 3.7 minutes | Belgium's roughly 0.84 million, plus wherever else an angle-based portion happens to fit | **Yes** |
| 4 | **Wifaqul Ulama's 3-day Aqrabul-Ayyam and its 65-minute Haraj cap** | Wifaqul Ulama, and through its app and timetables a large share of British Deobandi mosques | **a share of the UK's roughly 4.0 million**, not separable from the total | **No.** Every library that implements Aqrabul-Ayyam at all uses the absolute last day, which Wifaqul Ulama explicitly rejects |
| 5 | **Sweden's day-length clamp** | Islamiska Förbundet i Sverige, 112 cities | Sweden's roughly **0.86 million**, the only rule that serves them faithfully | **No**, and it is not expressible as any existing `highLatitudeRule` |
| 6 | **`MiddleOfTheNight` / Nisful-Layl** | Wifaqul Ulama's second offered option; adhan's own default | not separable. Ranked low because it is measured **the worst fit at every authority tested** (109.8 at Stockholm, 113.6 at Oslo, 91.8 at Brussels) yet it is the library default | **Yes**, and it is adhan's default, which is the problem |
| 7 | **Norway's frozen clock** | Islamsk Råd Norge | Norway's roughly **0.32 million**, and the rule as identified only reaches 42.3 minutes against IRN's own table | **No** |
| 8 | **Belgium's lat-45 relative estimate** | Its own text, which its own table does not follow | 0 faithfully. **Implementing the stated rule gives the user a worse match to Belgium's table than `TwilightAngle` does** | **No** |
| 9 | **Moonsighting's slide to 60** | Moonsighting Committee above 60 | the 60-to-66.5 band's roughly **0.82 million**, partially | Partially: adhan applies 1/7 inside the `MoonsightingCommittee` path only, and wave 1 found the text and tables disagree |

**The honest reading of that table: five of the nine rules the app needs to be faithful do not exist in any
library, and they serve about 2 million Muslims between them.** R7's recommendation, follow the authority where it
publishes a rule, is correct in principle and R9's discovery makes it expensive: following the authority means
**implementing the rule ourselves**, per authority, with no library support and no upstream to inherit fixes from.

### Is `SeventhOfTheNight` the right default? Yes, and here are the numbers

R7 recommended it on a continuity argument it did not quantify. **Measured** (`data/highlat/default.txt`),
largest day-to-day jump in Fajr, minutes:

| City | `MiddleOfTheNight` | `SeventhOfTheNight` | `TwilightAngle` | Sweden's clamp | Diyanet | Aqrabul-Ayyam 3-day | Moonsighting text |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| London 51.5 | **23** | **2** | 4 | 3 | 2 | 11 | 11 |
| Copenhagen 55.7 | 22 | **2** | 5 | 3 | 3 | 16 | 2 |
| Stockholm 59.3 | **29** | **2** | 6 | 4 | 3 | 18 | 2 |
| Oslo 59.9 | **34** | **2** | 6 | 4 | 3 | 16 | 2 |
| Reykjavík 64.1 | **37** | 3 | 6 | 4 | 4 | 18 | 3 |
| Tromsø 69.6 | 43 | 18 | 10 | **3** | 16 | 25 | **186** |
| Longyearbyen 78.2 | 53 | 31 | 18 | **7** | 44 | 33 | **259** |

At the 99th percentile, which is what a user actually experiences, London reads `MiddleOfTheNight` **10.4** against
`SeventhOfTheNight` **2.1**, and Oslo 15.2 against 2.3.

**Five conclusions, each from the measurement rather than from preference.**

1. **R7's continuity argument holds and is an order of magnitude.** `MiddleOfTheNight` jumps up to 34 minutes
   overnight at Oslo where `SeventhOfTheNight` jumps 2. For an app that shows a countdown and schedules an alarm,
   that is the difference between a rule the user can plan around and one that surprises them. And the sun itself
   moves 2 to 3 minutes a day at these latitudes, so `SeventhOfTheNight` is moving at the rate of the sky.
2. **The authority scores support it independently, which R7 could not check.** `SeventhOfTheNight` is the best rule
   in the catalogue against Norway's published Isha, **median 2.9 minutes with 43.1% inside 2 minutes**. No default
   has to be right for a specific authority, but one that happens to reproduce a real authority's table is better
   than one that reproduces none.
3. **`MiddleOfTheNight` is measured the worst rule at every authority tested and it is adhan's default.** 109.8
   minutes at Stockholm, 113.6 at Oslo, 91.8 at Brussels. **This is the single strongest argument in the report for
   never leaving `highLatitudeRule` at its default**, and it strengthens R3's and R7's existing condition from "set
   it explicitly" to "the default is measurably the worst available choice".
4. **Two rules beat `SeventhOfTheNight` on smoothness and both are disqualified as defaults.** Sweden's clamp is the
   smoothest rule in the catalogue at every city and is the best fit to its own authority; Diyanet's interval is
   second. Both are a **named authority's fiqh position**. Giving Sweden's rule to a user in Manchester is the same
   category of error as giving Diyanet's rule to a user who chose Wifaqul Ulama: R7 quoted Wifaqul Ulama's own
   warning against mixing methods, and this report read that warning in full. A default must be the rule with the
   **weakest** claim to be somebody's specific position, and among the portion rules that is the 1/7 with the widest
   fiqh attribution.
5. **`SeventhOfTheNight` is one of only two rules in the catalogue that is already hemisphere-symmetric.** Measured
   7.6 to 9.5 minutes against its own mirror before any fix, against 46.6 for Belgium's rule and 267.8 for Wifaqul
   Ulama's cap. A default that cannot be got wrong below the equator is worth something in an app going worldwide.

**The one place `SeventhOfTheNight` must not be the default is above the Arctic Circle**, where it is a portion of a
night that does not exist and leaves **118 days with no answer at Tromsø, 239 at Longyearbyen**. That is the polar
policy, below, and it is a separate decision.

### Setting, derived, or both? Both, and R9's evidence strengthens R7's case rather than weakening it

R7 argued for a visible setting on two grounds: the authorities admit the question is unresolved, and the measured
spread is large enough that a user cannot reach agreement with their mosque without one. **R9's finding that
neighbouring countries use incompatible rules strengthens both grounds, and this report adds two more.**

1. **The rule is not derivable from the country.** Sweden and Norway share a 1,600 km border, a latitude band and a
   language family, and their authorities use constructions that measure **83.7 minutes apart at Stockholm**. No
   geographic default can be right for both. A rule derived from the location is therefore wrong about half the time
   in Scandinavia, which is exactly where it matters most.
2. **The rule is not derivable from the authority either, in one measured case.** Belgium **states** a rule its own
   table does not follow, and the rule that fits its table is a different one. So even "derive the rule from the
   chosen authority" needs a human to have decided, per authority, whether to follow its words or its digits. That
   is a data decision, not a computation.
3. **The setting must not be per-prayer or per-field.** Wifaqul Ulama states in writing that a user should "only use
   one of the two methods, not both" and "should not switch between the two methods". A UI that lets a user pick
   `SeventhOfTheNight` for Fajr and Aqrabul-Ayyam for Isha lets them build a position their own scholars
   specifically forbade.
4. **Part 4's ordering test gives the shape of the setting.** Sweden's rule scores **0 days out of order on all 365
   days** against its own clamped sunrise, and **56 of 365 days out of order** at the Arctic Circle when scored
   against the true astronomical sunrise instead (`measure-ifis-order.mjs`, which judges all 365 days; the 26 in the
   Part 2 table is the same failure over that table's 335 judged days).
   The rule is a **whole frame**, not a Fajr adjustment. So the setting must select a named construction that owns
   every field it touches, including sunrise and Maghrib, and the app must never take one rule's Fajr and another
   frame's sunrise. **Measured, and this is the most actionable finding in Part 4.**

So: **derived from the source by default, visible and changeable, selected as a single named whole, never per
prayer.** The label the user sees should name the body, not the arithmetic: "Islamiska Förbundet i Sverige's summer
estimate" rather than "day-length clamp at 300 to 1140 minutes".

### What to show on a day the chosen rule genuinely has no answer

The app already renders `--:--` per prayer and its own source documents the concept: `shared/types.ts:105`, "`--:--`
is how absence is drawn, never" a placeholder that reaches arithmetic, and `shared/widgetTypes.ts:51` and `:130`
carry the same for the widget. The existing mechanism is the right one and needs no new concept. **Three findings
shape how it should be used.**

1. **`--:--` alone is not enough, and the measurement says why.** At Tromsø `SeventhOfTheNight` has no answer on
   118 consecutive-ish days. A prayer card showing `--:--` for a third of the year is not an honest null, it is an
   app that looks broken. R7's recommendation, name the substitution in words, is the right answer and this report
   adds the number that makes it urgent: **118 days, not a handful.**
2. **The choice between `--:--` and a named substitution should follow the rule's family, and the measurement gives
   the rule.** Measured at Tromsø: every portion rule has 118 no-answer days; every place-substituting rule has 0.
   So a user on a portion rule is telling the app "I follow a rule defined by the night", and on 118 days there is
   no night. `--:--` with a sentence is the honest output. A user on Sweden's clamp, Aqrab al-Bilad or Moonsighting's
   slide has chosen a rule that **does** answer, and the app should show its answer and name the substitution.
3. **Never fill a null from a different rule.** Measured: on the 118 Tromsø days where `SeventhOfTheNight` is
   undefined, Aqrab al-Bilad at 48.5 differs from Sweden's clamp by tens of minutes, and both differ from the walked
   variant. Silently substituting whichever rule happens to answer gives the user a time from a method they did not
   choose, on the days it matters most, which is the mixing Wifaqul Ulama forbids. If the app substitutes, it says
   which rule supplied the value.

**The hardship the wording has to respect, measured.** An angle-only 18/17 Isha falls after 23:00 on **67 days at
Paris, 29 at Reykjavík, 21 at Anchorage** and after midnight on **16 at Paris, 10 at Reykjavík, 18 at Ushuaia**.
And an 18-degree Fajr falls before 02:00 on **38 days at London and 29 at Paris and Stockholm**. So the app is not
choosing between a correct time and an estimate: it is choosing between an estimate and a time that the authorities
themselves describe as haraj. Diyanet grounds its rule in *istihsan* and *maslahat*; Wifaqul Ulama in *haraj*; the
Stockholm Mosque's FIFS council and Belgium's EMB both publish a standing permission to combine Maghrib and Isha
(R9, cited). **The honest wording therefore should not apologise for the estimate.** It should name it.

---

## Part 5: sizing the problem

R7 gave "about 4 million above the Arctic Circle" from secondary tourism and geography sites, and flagged it
UNVERIFIED as a census aggregate. This is built bottom-up from **39 named administrative regions** with their own
statistical-office figures, so every row is auditable. Full workings and every source note at
`data/highlat/population-bands.mjs` and `population-bands.txt`.

**The method and its limit, stated before the numbers.** No statistical office publishes population by latitude.
They publish it by administrative region. Each region is therefore placed in the band containing the latitude of
its **population centre**, usually its largest city. A region straddling a boundary is assigned whole to one band.
Regions whose centre falls outside their nominal band are **excluded and named** in the workings, which is why
Austria, Switzerland, southern Canada and northern China appear in the script and not in the totals. The Muslim
column applies a **national** share to a **regional** population, which is the weakest step in the whole
calculation: Muslim populations concentrate in large cities and the far-northern regions are not representative in
either direction. Population figures are **cited**; band totals are **measured arithmetic** on those citations.

| Band | Regions | Population | Muslims, national shares applied | Share of the four-band total |
| --- | ---: | ---: | ---: | ---: |
| **48 to 55 N** | 12 | 274.30 m | **17.70 m** | **83.5%** |
| **55 to 60 N** | 5 | 29.40 m | 2.49 m | 11.7% |
| **60 to 66.5 N** | 8 | 13.46 m | 0.82 m | 3.9% |
| **above 66.5 N** | 14 | **2.26 m** | **0.20 m** | **0.9%** |
| total | 39 | 319.42 m | 21.21 m | |

**The ratios that decide the engineering priority, measured:**

| Comparison | Ratio |
| --- | ---: |
| Muslims at 48 to 60 N against Muslims above 66.5 N | **102 to 1** |
| Muslims at 60 to 66.5 N against Muslims above 66.5 N | **4.2 to 1** |

**Three findings inside that, and one corrects R7.**

1. **R7's 4 million is too high by nearly half.** Built from named regions, the total population above 66.5 N is
   **2.26 million**. R7 was right to flag its own figure as UNVERIFIED and right that no national statistics office
   publishes a cross-border above-66.57 total. This report's figure is a different kind of estimate, not a better
   census: it is a sum of 14 named regions with their own official counts, and its error is in the boundary
   assignments rather than in the sources.
2. **The Arctic is overwhelmingly Russian and Russia is the country this programme knows least about.** Russia
   supplies **1.63 million of the 2.26, that is 72%**. All five Nordic countries together supply **0.57 million**.
   And Russia is where zero mosques returned a timetable, no muftiate methodology was located, and R5 left the
   country at tier D on a library constant. **So the band that is hardest to serve is also the band where the
   evidence is thinnest, and the two facts are the same fact.**
3. **The band worth the engineering is 48 to 60, and it is not close.** 20.19 million Muslims live where a
   high-latitude rule binds every summer and no polar day ever occurs. Measured in Part 2, those latitudes have
   between **0 and 0** days a year on which the rules agree and Fajr spreads of 47 to 105 minutes. The largest
   single population in the 55-to-60 band on earth is **Saint Petersburg and its oblast at 7.5 million** (Rosstat
   2025, cited), at 59.9 N, the same latitude as Oslo.

**So the scoping recommendation is explicit.** The **high-latitude rule** is a first-class product decision serving
about 20 million Muslims, and getting it wrong is wrong for all of them every summer. The **polar circle** is a
correctness obligation serving about 200,000, where a wrong answer is visibly wrong and an app claiming worldwide
coverage cannot show `Invalid Date`, but where no amount of engineering reaches a large audience. R7 reached the
same conclusion from a different figure and the conclusion is unchanged: **the polar circle is a correctness
obligation, not a product priority.** What this report adds is the ratio, 102 to 1, and the fact that the 60-to-66.5
band, at 4.2 times the polar population and with zero agreeing days, is the one sitting between them and is worth
more than its size suggests because Finland, Iceland and Alaska all live there whole.

---

## UNVERIFIED and open

| Item | Status |
| --- | --- |
| **IFiS's own stored coordinate for Kiruna** | **Unobtainable.** The WordPress plugin computes server-side; `cities.php`, `data/cities.json` and `bonetider.php` all return the same 9,325-byte HTML shell rather than a coordinate table. The 4.18-degree gap is measured with certainty; whether it is a data error or a deliberate substitution is inferred from four converging measurements and is not proved |
| **What Islamsk Råd Norge actually does** | **Open, and this report narrowed it without closing it.** R9's frozen-clock identification is confirmed in the data (136 and 162 blank angle cells reproduce exactly) but scores only **42.3 minutes median** against IRN's own table on the binding days. Something else is in IRN's construction. `api.bonnetid.no` refuses every keyless path, so only the rendered page is available |
| **Why Belgium's table does not follow Belgium's stated rule** | **Open.** R9 measured the gap at 20.9 minutes; with the sign fixed and scored on binding days only it is 11.7. `TwilightAngle` fits better at 3.7. No construction tested reproduces the EMB table to within a few minutes |
| **The MWL's 1406 AH / 1986 CE move of Aqrab al-Bilad from 48.5 to 45 degrees** | **UNVERIFIED as a primary source.** Recorded only by `prayertimes.dk`, tier C. R7 noted the MWL's collected Fiqh Academy resolutions contain **zero occurrences of the word "degree"**, which makes a primary document unlikely to exist in that corpus |
| The Sheikh Abdulaziz bin Almusleh 20-hour fasting fatwa, 2007 | **UNVERIFIED.** One tier-C source |
| **Russia's northern muftiates** | **NULL.** Zero Mawaqit mosques at Saint Petersburg, Murmansk, Arkhangelsk and Syktyvkar. No methodology document located in Russian. Russia holds 72% of the world's above-66.5 population and remains the largest evidence gap in this report |
| **Alaska** | **NULL for practice.** Zero mosques returned at Anchorage and Fairbanks. R7's cited community of about 3,000 at Anchorage is the only figure |
| **A Canadian high-latitude ruling** | **Not located.** No Canadian Council of Imams position on Fajr or Isha at high latitude found. Of 5 prairie mosque rows, 3 failed the jamaah sanity gate and the 2 survivors disagree completely, 18.34 against 9.96 |
| **Finland, Iceland, Denmark: no national authority** | Searched in Finnish, Icelandic and Danish. Mosque practice measured at tier B with 10, 1 and 2 mosques. **One day each**, so these figures separate a 12-degree convention from an 18-degree one and rule a Hanafi Asr in or out; they do not distinguish 17.5 from 18.0 and they are not evidence about the country |
| **Scotland's two conventions** | 11 mosques, one day. Glasgow's 15.4/16.0 cluster is consistent with Wifaqul Ulama's published pairing but the mosques were not asked and the attribution is inference |
| **The Moonsighting Committee's seasonal function** | **Not implemented here.** This report implements the committee's published high-latitude TEXT only. Wave 1 established that the published text and the shipped tables disagree, and that gap is wave 1's finding, unchanged |
| **The Süleymaniye Foundation construction** | Recorded from `prayertimes.dk` only, tier C. Its own recorder states it has "no solution for the situation where days are very short". Not measured |
| The population band figures | Every population figure is **cited** to a statistical office; the band totals are **measured arithmetic**. The **boundary assignments are approximations** and the **Muslim shares are national applied regionally**, which is the weakest step and is flagged on every row |
| Ushuaia's 8 to 12 minute residual mirror error | An artefact of the 183-day integer date mirror, not a rule defect. Stated so it is not read as one |
| Asr at high latitude | **Out of scope here and unchanged from R7**, which measured adhan's Asr approximation producing a 2,279-minute runaway at Tromsø where an exact solve is stable to 1 minute. No rule in this catalogue touches Asr, so no finding here fixes it |

---

## Sources

All fetched 2026-09-30. Path is the retrieval method: `tinyfish` is `tools.tinyfish.fetch_content` or
`tools.tinyfish.search`; `fetch` is a direct HTTP GET from the `execute` runtime; `agent-browser` is the CLI.

### Authorities and bodies read on their own pages

| URL | What it is | Path | What it supports |
| --- | --- | --- | --- |
| `https://www.islamiskaforbundet.se/bonetider/` | Islamiska Förbundet i Sverige, a full year for **112 Swedish cities**, a WordPress admin-ajax widget. Plain `curl` is blocked by a WAF returning "455 Security Incident Detected" | `agent-browser`, month by month | **A, Sweden, measured.** The clamp, and Kiruna |
| `https://www.ditib.de/detail2.php?id=424` | Diyanet Din İşleri Yüksek Kurulu, decision of **2009-08-28**, full Turkish text: the 45-degree threshold, the 1h20m interval, the one-third cap with its hadith citations, the **March to September Imsak mirror with its 10 minutes**, and "no unity has yet been achieved on any estimation method" | `tinyfish` | **RULE, cited verbatim in Turkish** |
| `https://www.wifaqululama.co.uk/highlat/` | Wifaqul Ulama, the Preston meeting of **2018-11-11** over 7 hours. Its Isha at 15 degrees with 24 named ulama, its four non-agreed Haraj options including the **65-minute cap** and the **23:00 lock**, its `Fāqid al-Layl` clause, and "no agreed upon National solution can be proposed since this is a grey area". Its southern-hemisphere section reads "**This was not discussed in the meeting**" | `tinyfish`, read in full | **RULE, cited** |
| `https://www.wifaqululama.co.uk/salahtimes/` | Wifaqul Ulama's full method FAQ: the **3-day average** Aqrabul-Ayyam with its "nearly 3,000 postcodes" justification and its leap-year reason, HMNAO named as using the absolute last day, the **never-mix warning**, 4 minutes on Zuhr, **5 minutes on sunset**, and both Asr factors | `tinyfish`, read in full | **RULE, cited** |
| `https://www.moonsighting.com/how-we.html` | Moonsighting Committee: the 55-degree Sab'u Lail threshold with its Thanwi and Shami citations, the **slide to 60**, the Dar al-Ifta fatwa of 08/08/2010, Hammerfest named, and "these formulas are good up to the 55degrees latitude" | `tinyfish`, read in full | **RULE, cited** |
| `http://praytimes.org/calculation` | praytimes.org: Middle of the Night, One-Seventh, and Angle-Based defined in its own words, plus the canonical angle table | `tinyfish` and `curl` | **RULE, cited** |
| `https://github.com/arabeyes-org/ITL/blob/master/prayertime/doc/method-info.md` | Arabeyes ITL: **sixteen extreme-latitude options, 0 to 15**, enumerated; the 48.5-degree Aqrab al-Bilad recommendation; the admission that the portion family has "**no proof in traditional Shari'a (Fiqh) resources**"; and the separate admission that "no contacts have been made to obtain the correct numbers as published by such organizations" | `tinyfish` on `raw.githubusercontent.com` | **cited verbatim**, both admissions |
| `https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/` | FCNA, Shaykh Mustafa Umar, 18 September 2024, read in full including all 11 footnotes. The observation range 9 to 20 degrees, the 1983 UK 12-to-16, the 1988 Hizbul Ulama 12-to-18, Riyadh 2004 at 15, moonsighting.com's 14.8-to-17.5, **its recommendation of 15 degrees as "the middle point between twelve and eighteen"**, and its statement that Fajr and Isha "are not directly dependent on the position of the sun" | `tinyfish`, read in full | **RULE for FCNA, cited.** Also corroborates R1 |
| `https://www.prayertimes.dk/` and `/story.html` | `PrayerHigh`, a Norway-based group above 45 N, 240+ cities. **The only page found that enumerates the whole field with attributions.** Its own rule (**Makkah times in the extreme period with a linear transition**, and a 4-hour-day winter trigger), the MWL 1986 move to 45, Dar al-Ifta's 18-hour fatwa, the 20-hour fatwa, divide-the-night-in-3, the Süleymaniye construction, and the Hizb-ul-Ulama criticism | `tinyfish` and `curl` for the link map | **C**, and the richest single catalogue source in this report |
| `https://icci.is/` | Islamic Cultural Center of Iceland, Skútuvogur 1H Reykjavík, stating it serves "nearly 4,000 Muslims in Reykjavík", founded 2009. Prints a live daily row and **no method** | `tinyfish` | **A** for the body, **NULL** for a method |
| `https://grandmosque-iceland.is/en/` | Grand Mosque of Iceland, Iceland Foundation, established 2010. A "Prayer Times" heading with no table in the served HTML | `tinyfish` | Recorded as not yielding a table |
| `https://www.rukousajat.fi/` | A Finnish prayer-time site serving Helsinki with a PDF download, naming **no authority and no method** | `tinyfish` | **NULL**, Finland |
| `https://ditsamfund.dk/` | Dansk Islamisk Trossamfund, "Islam i Danmark fra vugge til grav". No bedetider section located | `tinyfish` search | **NULL**, Denmark |
| `https://www.islamiskaforbundet.se/wp-content/plugins/bonetider/js/script.js` | The IFiS plugin's client script, read in full. Confirms the times are computed **server-side** through `admin-ajax` and that no coordinate table is served to the client | `agent-browser` in-page `fetch` | Supports the "coordinate unobtainable" record |

### Measurement inputs

| URL | What it is | Path | Supports |
| --- | --- | --- | --- |
| `https://mawaqit.net/api/2.0/mosque/search?lat=&lon=` | Mawaqit's keyless mosque search, R9's harness. Queried at **27 cities in 10 country groups** | `fetch` | **B, measured**, for Finland, Iceland, Denmark, Scotland, and the NULL results for Russia and Alaska |
| `data/countries/se-stockholm-2026.tsv`, `se-malmo-2026.tsv`, `se-kiruna-2026.tsv` | R9's captured IFiS years | reused | The clamp fit |
| `data/highlat/se-umea.tsv`, `se-lulea.tsv`, `se-gallivare.tsv`, `se-pajala.tsv` | Captured by the cancelled attempt, reused | reused | The clamp confirmation |
| `data/highlat/se-jokkmokk.tsv`, `se-haparanda.tsv`, `se-ostersund.tsv`, `se-sundsvall.tsv` | **New in this report**, four further IFiS years through R9's `grab-sweden.sh` | `agent-browser` | Eleven cities, and the Arctic control group that rules out a threshold policy |
| `data/countries/no-oslo-2026.tsv` | R9's captured IRN year, cell positions preserved so the blank angle columns survive | reused | Norway's score. **136 and 162 blank cells reproduce exactly** |
| `data/countries/be-emb-2026.tsv` | R9's parsed EMB year, 348 of 365 days | reused | Belgium's score |
| `https://www.citypopulation.de/en/sweden/admin/25__norrbotten/` | SCB via citypopulation: Kiruna **22,402**, Gällivare 17,135, Jokkmokk 4,695, Pajala 5,706, Haparanda 9,027, Luleå 80,304, all 2025-12-31 | `tinyfish` | **cited**, Part 5 |
| `https://www.citypopulation.de/en/russia/admin/severo_zapadnyj_federaln/47__murmansk_oblast/` | Rosstat via citypopulation: Murmansk Oblast **651,363** at 2025-01-01 | `tinyfish` | **cited**, Part 5 |
| `https://en.wikipedia.org/wiki/Arctic_Circle` | The largest Arctic Circle settlements with populations: Murmansk 295,374, Norilsk 178,018, Tromsø 75,638, Vorkuta 58,133, Bodø 52,357, Kiruna 22,841 | `tinyfish` | **cited**, secondary, Part 5 |
| `http://www.statsmapsnpix.com/2021/11/world-population-by-latitude.html` | World population by single degree of latitude from 2020 WorldPop, in QGIS. The top 10 degrees are all 22 to 36 N | `tinyfish` | **cited**, secondary. Read and **not used for the band totals**, because it publishes only the top 10 degrees numerically and the high-latitude figures are in images this report cannot read |
| `https://en.wikipedia.org/wiki/60th_parallel_north` | Oslo, Helsinki, Saint Petersburg, Uppsala, Bergen, Lerwick, Whitehorse all on 60 N; 18h07m of sun at the June solstice | `tinyfish` | **cited**, Part 5 |

### Paths that failed, recorded so they are not retried blindly

| Target | What happened |
| --- | --- |
| `islamiskaforbundet.se` over plain `curl` | Returns a **455 "Security Incident Detected"** WAF page of 733 bytes, with the text "Do not retry". `agent-browser` works, which is why R9's `grab-sweden.sh` uses it |
| `bonetider/cities.php`, `bonetider/data/cities.json`, `bonetider/bonetider.php` | All three return **HTTP 200 with the same 9,325-byte `text/html`**, which is the site's own 404 body. No coordinate table is reachable. `readme.txt` returns 455 |
| Mawaqit at Murmansk, Arkhangelsk, Syktyvkar, Saint Petersburg | **Zero mosques** for all four |
| Mawaqit at Anchorage, Fairbanks | **Zero mosques** |
| Mawaqit at Kiruna, Tromsø, Bodø, Aberdeen, Dundee, Aarhus, Vancouver | Zero usable rows. Vancouver returned one row that failed the jamaah sanity gate |
| A Muslim World League primary document for the 1986 latitude-45 decision | Searched in English and Arabic. Not located. Recorded UNVERIFIED |
| A Russian muftiate methodology document | Searched in Russian for ДУМ methodology on высокие широты. Search returned only third-party prayer-time aggregators |
| A Canadian Council of Imams high-latitude ruling | `canadiancouncilofimams.com` search returned no prayer-time methodology |

### Scripts written for this report

All under `data/highlat/`. R5's `solar-harness.mjs` and `validate-harness.mjs` were reused unchanged and no new
astronomy was written. The seven scripts from the cancelled attempt (`kiruna-*.mjs`, `sweden-angles.mjs`,
`sweden-latcap.mjs`, `sweden-nightfloor.mjs`, `sweden-residual.mjs`, `sweden-rule-final.mjs`) were run first and
are left in place; `sweden-latcap.mjs` supplied the measurement that cracked Part 3 and is credited above.

| File | What it does |
| --- | --- |
| `rules.mjs` | **Every rule in the catalogue on one engine**, including the five no library ships. Both hemisphere sign fixes are in here with the measurement that found them in the comment |
| `ifis-model.mjs` | The identified IFiS model as a reusable module: horizon, day-length clamp, angles, night fractions |
| `measure-rules.mjs` | Part 2: nulls, per-rule change, the full rule-against-rule matrix, the per-day spread, and the substitution reach. Writes `rules-matrix.txt` and `rules-matrix.json` |
| `measure-hemisphere.mjs` | Each rule against its own mirror across the equator. **Found both sign bugs** |
| `measure-authority-fit.mjs` | The decisive test: every rule against Sweden's, Norway's and Belgium's own published years, scored on the binding days. Writes `authority-fit.txt` and `authority-fit-summary.json` |
| `sweden-daylength.mjs` | **The model-free observation that identifies the mechanism.** No astronomy: the printed day length across eleven published years, and its two exact bounds |
| `sweden-model.mjs` | The four-layer model, each layer fitted on the southern cities and ablated at Kiruna |
| `sweden-kiruna-residual.mjs` | Where the boundary-day outliers sit, and the per-city latitude fit |
| `sweden-eleven.mjs` | Eleven IFiS cities, the Arctic control group, and the place-against-latitude tie-breaker |
| `sweden-final.mjs` | The delivered scores for all eleven cities, and Kiruna at both latitudes |
| `measure-highlat-mosques.mjs` | Finland, Iceland, Denmark, Scotland, northern Russia, the Canadian prairies, Alaska, northern Sweden and northern Norway through Mawaqit, with R9's jamaah sanity gate |
| `measure-default.mjs` | Part 4: the discontinuity test, the ordering test, the null counts and the hardship measurement. Writes `default.txt` |
| `measure-ifis-order.mjs` | Isolates the ordering failure to frame-mixing rather than to the rule |
| `population-bands.mjs` | Part 5, bottom-up from 39 named regions. Writes `population-bands.txt` |
| `rules-matrix.json`, `authority-fit-summary.json`, `sweden-final-summary.json`, `sweden-eleven-summary.json`, `sweden-latfit-summary.json`, `sweden-clamp-summary.json`, `sweden-model-summary.json`, `default-summary.json`, `highlat-mosques-summary.json` | Machine-readable results |
| `se-jokkmokk.tsv`, `se-haparanda.tsv`, `se-ostersund.tsv`, `se-sundsvall.tsv` | Four new captured IFiS years |
