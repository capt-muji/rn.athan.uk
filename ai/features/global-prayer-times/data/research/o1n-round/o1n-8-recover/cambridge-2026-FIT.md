# Cambridge Central Mosque 2026 annual poster — fit record

Surface: Cambridge Central Mosque, 309-313 Mill Road. One annual poster, 2 A3 pages, 12 month
panels, day rows carrying 6 begins and 5 jama'at columns. Raw: `captures/cambridge-annual.pdf`
(copied from the o1m-12 capture, sha unchanged). Rendered and read by per-row strips at scale 8,
365 rows OCR'd with day-token verification; `data/cambridge-2026-ocr-strips.json` carries every
strip text; `data/cambridge-2026.json` carries the normalized table with per-row flags.

Extraction: 365/365 rows read. 339 clean, 19 repaired by neighbour placement scoring, 16 cells
nulled by the deviant-cell net, 1 row wrong-row-excluded, 5 begins-unsorted excluded from fits,
6 day tokens unreadable (values kept). No cell was invented.

Fit (adhan 4.4.6 solar core, Rounding.None, Europe/London, point solved from the table, not named
by the publisher): lat 52.1600, lon 0.1165, maghrib margin +2.73 min.

| column | verdict |
|---|---|
| sunrise | exact: 100 pc within-1, mae 0.09, worst 1 |
| zuhr (dhuhr) | exact at transit + 4.0 min: 100 pc, mae 0.77 |
| asr begins | Hanafi: 94.9 pc, mae 0.64 (Shafi refuted) |
| maghrib begins | exact at +2.73: 100 pc, mae 0.08 |
| fajr begins | NOT a clean angle: 14.6 deg fits the winter core (Jan +0.5, Dec -1.2) but the residual carries a seasonal wobble of +5 (Feb, Oct) and the summer block May-Jul sits far off the angle (printed later; worst -72 min in June) |
| isha begins | NOT an angle: the printed interval runs a smooth seasonal curve 66 min (May) to 94 min (Dec), no constant reproduces it |

Grade: candidate (dated table, recipe not fully identified). Span verdict: untestable-single-year
(one published cycle, 2026). The record's open item "captured but unfitted" is closed: parsed,
measured, and graded honestly. Jama'at columns carried alongside (maghrib_j == begins; fajr_j +18
to +36 by month; isha_j ~ +86).
