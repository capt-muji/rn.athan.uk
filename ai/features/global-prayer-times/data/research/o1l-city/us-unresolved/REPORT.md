# O1l-37 us-unresolved — the unresolved half of the US sweep, re-searched

Agent O1l-37, 2026-11-11. Wave O1l, city-level round two. Workspace:
`$HOME/athan-gitree/census/o1l-city/us-unresolved/`.

Job: the 133 domains the O1k americas2 sweep could not resolve (`us2.tsv` 176 + `us3.tsv` 28 =
204 domains, 133 of them HTTP 000), re-searched with different phrasings and different domain
patterns. Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None` equivalent (second resolution, explicit round-to-minute). TZ `America/*` per metro.
No clock read: every date comes from a capture's own literal string.

## 1. Headline

- **The 133 guessed domains are dead, all of them, again.** 132 unique domains (one duplicate),
  every one HTTP 000 on re-probe with a browser UA at 8 s timeout. The guess was the fault, exactly
  as the record said. Not one of the 133 came back.
- **33 of the 64 metros in that list now carry a dated surface** (25 clean, 3 candidate-class,
  5 defective), and 2 of the already-held metros gain a new mosque. 25 metros stay unproven.
- **33,513 dated rows banked** across 41 surfaces: 30,688 Masjidal rows (28 ids × 3 years),
  1,460 mawaqit rows, 1,276 dpt rows, 42 masjidbox rows and 89 PDF rows.
- **The 15/15 default holds on the new sample: 26 of 37 surfaces with a 2026 reading (70 pc)
  sit at plain ISNA 15/15**, 31 of 37 (84 pc) in the 15-degree family, 5 (14 pc) in the
  18-degree family, 1 hand-edited.
- **Three-year stability**: 28 Masjidal surfaces carry 2024/2025/2026 on one recipe. Angle
  movement across the three years is ≤0.06 deg on every clean surface.

## 2. How the 133 were re-searched (the different phrasings)

Two passes per metro, in English (the record's own note that the US was searched in English only
still applies; no other language has a US mosque surface here):

| Pass | Query shape |
|---|---|
| 1 | `<city> <state> mosque prayer times` |
| 2 | `<city> <state> masjid monthly prayer schedule` |
| platform | `masjidal.com <city> prayer times`, `site:mawaqit.net <city>`, `masjidbox.com/prayer-times/<slug>` |

Engines: TinyFish for the search (Brave HTML was rate-limited to 429 and DDG-lite to a 202 empty
shell, both recorded as blocked). Every hit then went through one probe: the WordPress dpt year
endpoint, and on a miss the homepage, grepped for `masjid_id=`, `masjidbox.com/prayer-times/`,
`mawaqit.net/`, `mohid.co/` and `athanplus.com/`.

That is the whole change in method: **the record guessed domains from city names; this pass took
the domains from a search, then read the platform ids off the mosque's own homepage.** The
`<city>masjid.org` pattern is what failed, and it failed on 132 of 132.

## 3. What resolved, per metro (33 new + 6 held)

`id` = Masjidal platform id unless named otherwise. Rows are dated athan rows; iqamah is banked
separately for every Masjidal surface.

| Metro | Surface | Rows / years | Verdict |
|---|---|---|---|
| Allentown PA | lJAmvOdR Islamic Society of Allentown | 1,097 / 3 y | clean 15/15 |
| Bridgeport CT | 3wdqj2Kb BICC (+ masjidbox `bicc` 7 d) | 1,097 / 3 y | clean 15/15 |
| Chattanooga TN | mawaqit `w/isgc` | 365 / 1 y | clean 15/15 |
| Cleveland OH | 3OA8MOdp Uqbah; 1QL0NBdZ WCMA | 2,194 / 3 y each | clean 15/15 |
| Fort Wayne IN | RKxwpMdO UEF | 1,097 / 3 y | clean 15/15 |
| Indianapolis IN | YRKxllKO Al Salam (Fishers) | 1,097 / 3 y | clean 15/15, Hanafi |
| Jacksonville FL | bicjax.com dpt | 181 / 2025 H1 | 15-family (14.89/15.23) |
| Lansing MI | 0aAeyzAj ISGL | 1,097 / 3 y | **defective** (isha −18, rms 1.26) |
| Lexington KY | 3wdqX2Ab Masjid Bilal | 1,097 / 3 y | clean 15/15 |
| Little Rock AR | theiclr.org dpt | 365 / **2023** | **defective** (solar rms 5.5, stale install) |
| Milwaukee WI | nzKzJoKO ISM; nDAgZDL0 Al Huda | 2,194 / 3 y each | clean 15/15 (Al Huda Hanafi) |
| Newark NJ | 8KXm93LM NIA | 1,097 / 3 y | hand-entered class (14.66/15.34, worst 3) |
| Omaha NE | PAPyprdJ AMI; aAeoEzKj ICOM | 2,194 / 3 y each | hand-entered; **regime change 2026** |
| Pittsburgh PA | QKMnW1LB ICP; zKz8QzAO Attawheed | 2,194 / 3 y each | clean 15/15 |
| Richmond VA | BYAD8JAN West End; mawaqit `m/al-iman` | 1,462 / 3 y + 365 | clean 15/15, Hanafi |
| Sacramento CA | mawaqit `arden-arcade-…` | 365 / 1 y | clean 15/15 — the metro's first |
| Shreveport LA | BYADwlLN MCS | 1,097 / 3 y | clean 15/15, Hanafi |
| Toledo OH | MjKZ93dX ISNWO | 1,097 / 3 y | clean 15/15 |
| Tulsa OK | xdyq9ZdX IST | 1,097 / 3 y | clean 15/15 |
| Greensboro NC | OLnR9WLM Triad (High Point); apex dpt | 1,097 / 3 y + 365 | clean 15/15 Hanafi; apex defective |
| St. Louis MO | rdRvQDdG NWIC | 1,097 / 3 y | clean 15/15 |
| Orlando FL | p8KXaELM Islamic Center of Osceola | 1,097 / 3 y | 18-family (17.83/18.22), Hanafi |
| New York NY | 3OA8V3Kp MAS Staten Island | 1,097 / 3 y | clean 15/15 |
| Worcester MA | rGAEj9dn MACCLM (Lexington MA) | 1,097 / 3 y | clean 15/15 |
| Des Moines IA | ICDM Nov-2026 PDF | 30 | candidate, 18-family (17.54/16.03) |
| San Antonio TX | MCEEC Nov-2026 PDF | 29 | candidate, 15-family (14.74/14.97) |
| Wichita KS | ISW Nov-2026 PDF | 30 | candidate, 15-family (14.73/14.85) |
| Albuquerque NM | masjidbox `islamic-center-of-new-mexico-(abq)` | 7 | candidate |
| Buffalo NY | masjidbox `masjid-alsalam-buffalo` | 7 | candidate |
| Columbus OH | masjidbox `noorohio`, `omar-masjid` | 7 each | candidate |
| Cincinnati OH | masjidbox `islamic-association-of-cincinnati` | 7 | candidate |
| Mobile AL | masjid.mcisonline.net dpt | 365 / 2026 | **defective: Houston coordinates** |
| Las Vegas NV | mawaqit `w/masjid-tawheed` | 365 | **defective** (worst +79; record confirmed) |
| Atlanta GA (held) | QL0BZWdZ West Cobb | 1,097 / 3 y | clean 15/15 — new mosque |
| Charlotte NC (held) | xdyqvadX Pillars | 1,097 / 3 y | clean 15/15 — new mosque |
| Memphis, Nashville, Phoenix, Hartford (held) | no new surface; zKz3zRLO re-read | — | 18/17 Hanafi reconfirmed |

## 4. The 15/15 verdict across the new sample

37 surfaces hold a 2026 reading (the four defective and the 2025/2023 dpt feeds sit outside it).

| Family | Surfaces | Share |
|---|--:|--:|
| Plain ISNA 15/15 (both angles 15 ±0.3, every column within ±1) | **26** | **70 %** |
| 15-degree family (fajr 14.66-14.91 with a margin, or isha off 15) | 5 | 14 % |
| 18-degree family (fajr 17.5-18.5) | 5 | 14 % |
| Hand-entered / unclassifiable | 1 | 3 % |

The 18-degree block is Hanafi-leaning: Orlando (17.83/18.22 Hanafi), Phoenix UICA (17.76/16.97
Hanafi), Omaha ICOM from 2026 (18.47 + a fixed isha interval), Virginia Beach ICV (18.01 fajr,
isha from a separate source), Des Moines (17.54/16.03). The US 18-degree share in this sample
(14 pc) matches the record's 12.7 pc.

**Between-year stability.** 28 surfaces × 3 years, one recipe each. On the 24 clean surfaces the
largest angle movement across the three years is **0.10 deg**; the hand-entered and defective
surfaces scatter to 0.47 (Lansing isha, Triad isha 0.37, Newark isha 0.33) and the Omaha regime
change is 3.46. Seasonal fajr amplitude runs −64 min (Shreveport, 32.4 N) to −130 min (Milwaukee,
43.0 N), monotone in latitude as expected.

**One dated regime change, new.** Islamic Center of Omaha (`aAeoEzKj`) is plain 15/15 in 2024 and
2025 (fajr exact 91.5 / 86.8 pc, isha 86.6 / 84.1) and switches in 2026 to fajr 18.47 with a fixed
isha interval (median maghrib + 87). Split the span at 2026-01-01; do not fit across it.

## 5. Defects found (new to the record)

1. **The carried fitter silently dropped any year with one `isha < maghrib` day.** `isha` was
   declared `const` and then `isha += 1440` for the after-midnight wrap, so the assignment threw
   and the `catch` skipped the whole year. Newark's 2025 vanished this way. Fixed in
   `scripts/fit_masjidal.js` (`let isha`); every fit above is post-fix. **The same code sits in
   `us-states/fit_masjidal.js`**, so any us-states surface whose table prints an after-midnight
   isha may have lost a year silently.
2. **Mobile AL computes Houston.** `masjid.mcisonline.net` serves a full 2026 year that fits
   29.76/−95.35 at rms 0.50 min — Houston, 1,000 km west of the mosque. The install is a template
   left at the vendor's coordinates.
3. **Two dpt installs are HITs with no data**: `icbrsite.org` (Baton Rouge) serves 2025 as 365
   zeroed rows, `alzahrajax.org` (Jacksonville) serves 2019 as 365 zeroed rows. A dpt HTTP 200 is
   not a surface until the cells are non-zero.
4. **Little Rock's install is serving 2023** and its solar columns scatter at 5.47 min rms, which
   is a hand-edited table, not a computed one.
5. **Virginia Beach ICV prints fajr at 18.01 and an isha that no angle reproduces** (implied
   14.16, worst −23 min). The two twilight columns come from different sources.
6. **Las Vegas Tawheed re-confirmed hand-edited** (fajr worst +79, dhuhr +21, asr +22), matching
   the record's finding independently on the 2026 mawaqit calendar.

## 6. Honest negatives — 25 metros still unproven

Albany NY, Baltimore MD, Baton Rouge LA, Birmingham AL, Dearborn MI, Detroit MI, Flint MI,
Gainesville FL, Grand Rapids MI, Harrisburg PA, Kansas City MO, Knoxville TN, Louisville KY,
Montgomery AL, New Orleans LA, Norfolk VA, Oklahoma City OK, Portland OR, Providence RI,
Raleigh NC, Rochester NY, Salt Lake City UT, Tallahassee FL, Tucson AZ, Wilmington DE.

What was tried on each: both search passes above, the mosque's own domain probed for dpt and for
a platform id, and the platform directories. What was found and why it is not a surface:

- **Mohid is iqamah-only.** Most of these metros publish through `us.mohid.co` (isb.org, muhb.org,
  bisweb.org, iccleveland.org, isgkc.org, icnkc.org, mapitt.org, icrva.org, riinc.org, isdonline.org,
  massacramento.org, utislamiccenter.org, mcmphoenix.com, guidinglightcenter.org, louisvilleislamiccenter.org,
  amsdearborn.org, islamiccenterdm.com …). Its `masjid/widget/api/index/` path answers
  "Module not found" on every variant tried, and the visible widget is an iqamah board, not a dated
  athan table. Same verdict as the record's Birmingham note.
- **athanplus numeric ids are not Masjidal ids.** `17372` (Louisville MCC), `53387` (Baton Rouge)
  and `8Kxr2zAM` (Hartford) all return "No masjid with masjid_id = N exists". athanplus stays
  today-poll only.
- **Baltimore, Kansas City, Oklahoma City, Raleigh, Rochester, Tucson, Wilmington** answered with
  live mosque sites that expose no feed and no platform id: the negative is now about those named
  domains, not about a guessed list.
- **Dearborn, Detroit, Flint, Grand Rapids** are Michigan mosque sites on their own stacks
  (`icofa.com`, `icdonline.org`, `masdetroit.org`, `flintislamiccenter.com`, `grmasjid.org`) with
  no dpt and no platform id. The metro's coverage comes only from Masjidal ids found elsewhere.
- **Portland OR** has three mosque domains and no feed; `assaber.org` is the one with a prayer page.
- **Salt Lake City** answered five sites (`utahmuslims.com`, `utislamiccenter.org`, `southlakemasjid.com`)
  and none exposes a table.
- **Raleigh** has four sites (`raleighmasjid.org`, `alnooric.org`, `riinc.org`, `mycc-rdu.org`) and
  no table; the mawaqit hit the search returned is Elizabeth City NC, 200 km away.

The 25 are "not found under these terms". They are not proven absent.

## 7. Live-page gate (R5) per surface class

- **Masjidal**: the id was read off the mosque's own live homepage, and the API the widget calls is
  the API captured. Identity by construction, not a parallel publication. The monthly widget page
  renders client-side (`captures/gate_xdyqvadX_monthly.html`, 1,708 bytes, no cells), so no
  cell-level page gate exists for this class — the IANT contradiction class cannot arise here
  because there is no second publication to contradict.
- **mawaqit**: the captured page IS the live page; `confData` carries all 12 months inline. The
  trap suite was applied: today-row anchoring against the page's own declared date, solar gate on
  sunrise/maghrib, TZ-field distrust (Arden Arcade declares a California tz and California
  coordinates; al-iman declares `America/New_York` and Virginia coordinates), calendar-year
  resolution (the calendar is not year-stamped — read as 2026).
- **masjidbox**: the landing page embeds `window.REDUX_STATE` with the payload inline, keyless,
  7 days (today + 6). Candidate class by span, not by provenance.
- **dpt**: no independent page gate exists on any of the four installs; the record's icgt finding
  (broken feed rendered faithfully) stands as the caution.

## 8. What this does not settle

- 25 of 64 metros remain unproven, and the reason is now nameable: the US mosque web is on Mohid,
  athanplus and bespoke stacks, none of which publishes a dated athan table publicly.
- The four PDF month surfaces are one cycle each; a second month is needed before any of them
  becomes a fit.
- Masjidal ids are only findable where a mosque embeds the widget. Mosques that print a PDF and
  nothing else are invisible to this method, which is why the PDF harvest (4 found, 4 captured)
  is the next cheapest door.
- The `isha < maghrib` bug means any prior year dropped by the carried fitter should be re-run
  before its absence is read as "the install served nothing".

## 9. Paths

| path | content |
|---|---|
| `captures/` | 314 raw pages: dpt JSON, homepages, Masjidal ranges, mawaqit pages, masjidbox payloads, 4 PDFs |
| `data/` | canonical dated rows + iqamah layers, 203 files |
| `out/fit_*.json` | 41 fit objects, per-year scores |
| `out/tally.tsv` | the per-surface verdict table |
| `scripts/` | `probe_one.zsh`, `cap_masjidal_new.zsh`, `dpt_rows.mjs`, `masjidbox_rows.py`, `month_pdf_rows.py`, `solve_month.mjs`, `angles_short.mjs`, `fit_masjidal.js`, `tally.mjs`, `domains.tsv`, `real_domains.tsv`, `probe_real.tsv`, `probe_real2.tsv`, `reprobe_guessed.tsv` |
