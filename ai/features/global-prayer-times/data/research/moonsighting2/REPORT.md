# Moonsighting research, part 2 - the executive answer

T-25, Lane A, 2026-11-11. Research only; no application code. Everything below
is carried in full by the three reports in this directory, every number
emitted by the committed scripts against the banked corpus or a live public
capture. The harness's two known-answer gates reproduced the banked record
digit for digit before any finding was written (Jamiat Oslo = fit8's published
fit; London's 4,383 published days = the o1h control, 2.95/4.37 to the
hundredth).

## 1. Who follows the Moonsighting Committee (FOLLOWERS.md)

One publisher (the committee itself), one ulama council in tables (Norway's
Jamiat Ulama, seven cities, fajr 0.3 minutes from the curve - whose live site
has now moved its prayer-times section to IRN's standardized times), one
national council in writing (FCNA 2011, captured live in the council's own
words via ICOP: "use functions of latitude and seasons... as determined by
Moonsighting.com", superseded by its own current 15/15 and 13/13 page), one
lineage (Hizbul Ulama UK's tables computed by the committee's astronomer), and
two English town mosques whose 2026 tables are the curve to worst one minute
(Aisha Masjid Reading 0.19/0.17, Golden Mosque Rochdale 0.33/0.37, both
365/365 days within two minutes). The app layer (PrayTimes code, Sky Prayers,
Pillars, PrayerCal, IslamicFinder's option) carries the name widely and is
never authority. Thirteen-language council-level searches found no other body
claiming the method, and the measured corpus agrees: outside the entries
above, every surface at or above 45 N sits 15-95 minutes off the curve.

## 2. The committee's own documentation (DOCS-DELTA.md)

Static. how-we.html is byte-identical to the banked baseline; faq_pt.html
differs by one Cloudflare email-nonce and zero text lines; pray.php's credit
line is unchanged; Wayback holds no new captures of any method page since the
2026-09-14 full read (the domain's new captures are all crescent-visibility
pages); the generator endpoint still answers 200 and matches the naked adhan
preset to the minute on the spot day. The two questions part 1 left open (nine
written versions of the above-55 rule; the Shafaq width) are unmoved. The
site's own follower list still names two code repositories and nothing else.

## 3. The 45-55 band, verified against every banked high-latitude surface (BAND-45-55.md)

87 surfaces, 26,714 dated rows, naked preset, no tuning. In the 45-55 band the
curve's fajr IS the English construction: wherever an English table anchors
fajr to sunrise (the LUPT family, 11 of 18 towns), naked MC lands within
0.1-3 minutes all year, and Reading and Rochdale sit on it to the minute - the
sub-45 seasonal blowup o1h measured against fixed-angle authorities does not
appear against these tables because they are the same family. The curve's
isha is nobody's in the band: the English interval-isha towns sit 5-13 minutes
under it, the continental authorities (Diyanet, VIN, EMB, IZW, Luxembourg,
Kazakhstan) 15-40 minutes off both prayers, January worst nearly everywhere.
Above 55 the committee's one follower is the Norwegian Jamiat; above 60 the
curve collides with the polar night: the preset silently prints nothing for
116 Tromsoe days and 30 Salekhard days because no library implements the
committee's own documented slide-down rule, while IRN and CDUM publish
substitutions. Iceland, never polar-dark, still rejects the curve by 36-47
minutes in favour of its own 14.2/14.0. A 45-55 deployment of naked MC
therefore needs the English tables' blessing on fajr, nothing on isha, and a
written undefined-day policy above the circle.

## Files

| File | What |
| --- | --- |
| FOLLOWERS.md | the worldwide map, classes and evidence |
| DOCS-DELTA.md | the committee's documentation delta and follower-claims extraction |
| BAND-45-55.md | the band verification, all 87 surfaces |
| surfaces.json | the surface registry (paths, coordinates, zones, schema notes) |
| lib.mjs, mc-score.mjs, run-all.mjs, table.mjs | the harness - `node run-all.mjs` regenerates `data/band-scores.json` deterministically |
| data/band-scores.json | every score, machine-readable |

Raw captures: `$HOME/athan-gitree/census/moonsighting2/captures/` (live
method pages, endpoint probe, both FCNA statements in English and Arabic,
islamweb.no's shifted prayer-times section).

## What this changes downstream

- The v2.5 policy pack's Norway objects stand; add the islamweb.no-to-IRN
  shift to the operations calendar's watch list (2027 edition, either line).
- Reading and Rochdale enter the record as the first community-tier
  proven-table MC publishers; the English form map's "LUPT-family-drift"
  class for them resolves to the curve.
- No worldwide rollout implication: the band verdict is a fajr-only yes in
  one country, an isha no everywhere, and a hard stop above the polar circle.
