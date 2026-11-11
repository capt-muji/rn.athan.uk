# DOCS-DELTA: moonsighting.com's own documentation, 2026-09-14 to 2026-11-11

T-25 part 2, question 2. Part 1 (2026-09-14) read the site completely: 1,186
live paths, 59 documents, 157 method-page versions, every diff sequential. This
sweep answers only what changed since, and extracts every follower claim the
held corpus carries. Raw captures for this file:
`$HOME/athan-gitree/census/moonsighting2/captures/`.

## (a) The method pages, live today against the banked baseline

| Page | Banked baseline | Live 2026-11-11 | Delta |
| --- | --- | --- | --- |
| how-we.html | o1h raw capture 2026-11-10 (and part 1's read of the "Updated March 1, 2024" edition) | HTTP 200, 19,194 bytes | **byte-identical** to the o1h capture |
| faq_pt.html | o1h raw capture 2026-11-10 ("Updated August 25, 2020" edition) | HTTP 200, 35,678 bytes | one line differs: Cloudflare's rotating `data-cfemail` obfuscation nonce on the Dandia email; **zero text lines differ** (244/244 identical) |
| pray.php | part 1's read: the timetable front end | HTTP 200, 5,941 bytes | the credit line is unchanged: "Calculation method by moonsighting.com / Developed by Ahmed Bu-khamsin / Original code by PrayTimes.org" |

Nothing on the committee's own pages moved in two months. The two open
documentation questions part 1 left (nine written versions of the above-55
rule; Shafaq width 66-100 vs 66-105 minutes) are therefore unmoved too.

## (b) Wayback since 2026-09-14

The CDX index holds **zero new captures** of how-we.html, faq_pt.html or
pray.php since 2026-09-14. The domain-wide CDX delta (2026-09-14 to
2026-11-11, urlkey-collapsed) is entirely the crescent-visibility side of the
site: Hijri month pages (1443-1448), articles/chronology, ever-wonder, ads.txt,
and one 23 MB `1444HijriCalendar.pdf`. None carries prayer-time method content.

## (c) The generator endpoint, live

`moonsighting.ahmedbukhamsin.sa/time_json.php` answers HTTP 200 with 365 rows
for London 2026, the shape part 1 recorded. Spot day 2026-01-01: endpoint
fajr 06:25 / isha 17:39 - **exactly the naked adhan 4.4.6
MoonsightingCommittee preset** at the same coordinates to the minute. The
generator the site credits (Bu-khamsin, PrayTimes.org original) and the library
preset remain one method, re-verified.

## (d) Follower claims the corpus holds (verbatim sources)

Every place the held captures name a user of the committee's method:

| # | Claim | Source (held) | Class |
| --- | --- | --- | --- |
| 1 | "Moonsighting.com method for prayer times is used by the following resources: 1. github.com/PrayerTimeResearch/PrayerTimeAPI 2. github.com/islamic-network/prayer-times-moonsighting" | how-we.html (live today, unchanged; part 1 section 2.5) | code, not publishers - community |
| 2 | "Calculation method by moonsighting.com / Developed by Ahmed Bu-khamsin / Original code by PrayTimes.org" | pray.php (live today, unchanged; part 1 section 2.6) | the generator lineage, not a follower |
| 3 | "These times have been kindly computed by Brother Khalid Shaukat" - Hizbul Ulama UK's national timetables, 2006 and 2009 editions | part 1 section 2.8, Wayback raw captures of uk-prayercharts.pdf / uk-prayercharts1.pdf | lineage: the committee's astronomer computed a national body's tables |
| 4 | FCNA 2011 position: prayer times by the moonsighting functions with a 17.5/15 fallback for the USA | O1k-W18 (methods18), the council's own page, second witness beside the banked current 15/15 statement | stated, dated, superseded by the council's current 15/15 |
| 5 | Jamiat Ulama Norway (islamweb.no) publishes MC-curve timetables for 7 cities | O1k-F8 (fit8), proven by fit; re-proven by this lane's harness to the same digits | proven-table |
| 6 | The committee's own published timetable (pray.php / praytable.php / time_json.php) | part 1 section 2.6 (6,570 cells, 0 mismatches between page and endpoint) | the publisher itself |

One non-claim is recorded to close it: the o1h naked grid has Moonsighting as
Niger's best-scoring method (mean 1.03) - a coincidence of the 90-minute isha
interval with the curve's evening at Niamey's latitude, on a table whose own
recipe is interval-based. No Nigerien body claims the method; nothing to map.

## Verdict

The committee's documentation is static: no page, no document, no captured
edition moved in two months, the endpoint still serves the identical method,
and the site's own follower list remains two code repositories plus its own
generator credit. Every real-world adoption claim in the corpus is either the
Norwegian Jamiat (proven), FCNA's dated 2011 position (stated, superseded), or
the Hizbul Ulama lineage (the astronomer, not the method). The worldwide map
therefore rests on what other bodies' own pages say - FOLLOWERS.md - and on
what the banked tables prove, which BAND-45-55.md now supplies for every
surface at or above 45 N.
