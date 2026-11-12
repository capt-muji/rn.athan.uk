# O1n-5 — the flags tail and the housekeeping

Workspace: `$HOME/athan-gitree/census/o1n/o1n-5-flags/`. Wave o1n-5, round four (o1n), fleet
GLM-5.3-Flash. Public pages only, GET only, no login, no form, no challenge solved, no contact with
any body, nothing outside this workspace written, the repository untouched. Engine adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`; dates from literal
capture strings, no clock read into data; UTC timestamps; every image and PDF read by the local
macOS Vision binary (`$HOME/athan-gitree/census/tools/ocr`), never a model-vision pass. Inputs were
read-only: the banked o1m workspaces under `$HOME/athan-gitree/census/o1m/` and the citable layer at
`ai/features/global-prayer-times/data/research/o1m-round/`.

## Counts

| Measure | Value |
|---|---|
| Items taken | 7 (five flags, three housekeeping threads under item 6, this register) |
| CLOSED with a test | 4 (Iceland isha, Saudi −2 edge cells, the Alaska line, al-Manar drift) |
| CLOSED as dated negatives | 1 (Oman's three names: swept, not found, points stand) |
| Partially closed | 1 (Algeria: 14 of 16 withheld days recovered and recipe-gated; 2 stay withheld) |
| OPEN, candidates exhausted | 1 (Diyanet summer: structure named — per-band tables, imsak winter = 18 deg at the band; the isha form stays unnamed) |
| OPEN, dated negative | 1 (Dundee Wayback: 429 on both probes of the day, 14:22:45Z and 15:46:14Z) |

## The closures, one line each

1. **F-ICELAND-ISHA: two builders.** The association's page prints maghrib + 90 on 30/30 days and
   says so in words; the site's API computes 14.2/14.0 twilight (0/365 at +90, modal interval 122-128,
   stable 2025-2027, isha MAE 50.9 against the page on the same dates). The flag's January numbers
   were the API's annual mode, not a January print. Nothing moved between years; never pool them.
2. **The Saudi −2 cells are a publisher edge.** Only −2, only north of 29.6 N, only 15 dates,
   column-pure per point-day, zero −2 cells on 26 control dates, a national −1 background on the
   affected dates. The SA grid recipe and its A grade stand.
3. **The Alaska line closes into F-DIYANET-SUMMER.** The nine Diyanet-tree Alaska cities match
   neither US reading (MAE 32-50 min) and no angle anywhere; their winter rows imply 65-66 N and
   their summer rows 25-32 N — a mid-latitude summer print over a far-north table. No Alaska rule.
4. **Al-Manar's drift losses are paid back.** A page-aware re-parse with printed-date anchoring,
   noon gate, sunrise gate and a maghrib envelope adds **1,378 validated rows**; the bank moves
   1,381 → 2,759; the new rows' isha−maghrib fingerprint (median 54, p10 51, p90 63) equals the
   bank's exactly. The bank's own rows govern every overlap; disputed cells scored against the
   per-city recipes favour the bank, so the trusted core is untouched.
5. **Algeria's withheld 16 → 2.** The Rajab block (2026-12-25..2027-01-04) and the Ramadan trio
   (02-10, 02-11, 02-22) read back under the recipe gate, the printed-order audit and boundary
   continuity — 14 days recovered, nothing interpolated; the bank's 02-10 isha 586 was the printed
   19:46 with a lost leading digit, resolved by the scan. 01-05/01-06 stay withheld: their reads
   reproduce the banked 01-07/01-08 exactly, which is edge contamination, not print.
6. **Oman's three names remain open country.** Eight Arabic variant families against the ministry's
   own 18,214-row mosque survey and its gazetteer place none of them; the public Arabic search adds
   nothing. The solved points carry the areas; recorded, never guessed.
7. **Diyanet's summer block: structure named, form not.** Ten European cities' tree series show
   per-latitude-band shared twilight columns (identical to ±1 min within a band), imsak = 18 deg at
   the band latitude for the whole winter half, and an isha column that is one shared interval series
   per band matching no swept family — angles 9-18 step 0.25, night fractions step 1/400,
   midnight ± 75 min, at per-city and per-band reference latitudes 47-63 N. The flag's Lodz "fajr
   02:51" is the tree's imsak; its isha 22:27 belongs to a different Diyanet product than the tree.

## Files

- `GAPS-CLOSED-ROUND4.md` — the register: every item closed or open with its test.
- `scripts/` — 17 scripts, each named for its item (`iceland-isha.mjs`, `sa-edge-cells.js`,
  `sa-edge-control.js`, `alaska-isha.js`, `diyanet-summer.js`, `diyanet-band.js`,
  `dz48-cells4.py`, `dz48-bands.py`, `dz48-band-verdict.js`, `dz48-finalread.py`,
  `dz48-recovered.json` builder inline, `almanar-reparse.py`, `almanar-gate.js`,
  `almanar-union.js`, `dundee-wayback.sh`).
- `data/` — 23 result artifacts, every verdict's numbers on disk.
- `captures/` — the Wayback 429 block body and the probe log (gzipped); `pages/` — two evidence
  crops from the Algeria sheets (gzipped).

## Discipline notes

- The OCR of every Algeria cell and band ran through the local Vision binary; no model-vision pass.
- The Wayback thread ran one probe at a time and stopped on the first 429, twice (the second probe
  was a single spaced re-check 84 minutes later, stopped immediately on the 429).
- Google's robot challenge on the Arabic Oman query is recorded as a block; DuckDuckGo served it.
- No device- or person-specific value appears in any file; no position a phone or geocoder reported
  is written; the owner is never referred to by a gendered pronoun.
- Scratch renders and working images were deleted at the end; the workspace holds only banked
  artifacts and evidence crops, gzipped where archivable.

## NEXT

1. **F-DIYANET-SUMMER**: the band tables' source pages (Diyanet's per-country PDFs) and Turkish/
   Arabic statements of a summer rule; the isha interval series per band is now the fingerprint any
   proposed rule must reproduce (Berlin's band: 131→235 min, Dec→June).
2. **Dundee**: one polite probe after the flag lapses; if still 429, the driven-browser route.
3. **Algeria**: adopt or decline the 14 recovered days at the next register cut (the fit re-scores
   with them at 219 → 233 kept days; month 7 moves 16 → 27 of 29).
4. **Al-Manar**: re-score the per-city recipes on the 2,759-row union; the drift months now have
   enough days to lift several city-years out of untestable-short-sample.
5. **Alaska**: the o1m-51 turktakviz ALASKA capture remains unparsed (that wave's semicolon fix);
   it would give a second publisher for the same towns against the tree's synthetic summer block.
