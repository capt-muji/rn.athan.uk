# Fitter-bug audit (register A53, rule-form D9)

Agent O1l-66. Workspace `o1l-city/fitter-audit/`. Engine adhan 4.4.6 at
`census/adhan-build/node_modules/adhan`, `Rounding.None`, TZ pinned per surface, dates
from literal capture strings, second resolution then explicit round-to-minute, no clock
read. No web. No repository writes. No edits to any other workspace: every script here
is a copy.

## The bug

```js
const fajr = toMin(r.fajr), ..., mg = toMin(r.maghrib), isha = toMin(r.isha);
if (isha < mg) isha += 1440;          // TypeError: Assignment to constant variable.
```

`isha` is declared inside the `const` list, so the after-midnight branch throws. The
throw lands in the per-year `catch { continue; }`, so the whole year disappears from
`out/fit_<id>.json` with no message. Verified:

```
$ node -e "try { const x=1; x+=1440 } catch(e){ console.log(e.constructor.name+': '+e.message) }"
TypeError: Assignment to constant variable.
```

Two live files carry the bug. One is the production fitter for `us-states`, the other
the debug twin in `us-unresolved`:

| file | what it fits | form |
|---|---|---|
| `o1l-city/us-states/fit_masjidal.js` | 29 Masjidal tenants x 3 y + 10 rows-mode surfaces (mawaqit, dpt, athanplus) = 39 fits | **BUGGY**, lines 40/42 and 55/57 |
| `o1l-city/us-unresolved/scripts/fit_debug.mjs` | debug twin of the same fitter | **BUGGY**, lines 40/42 and 55/57 |
| `o1l-city/us-unresolved/scripts/fit_masjidal.js` | 39 fits, patched at 05:53Z before the 05:54Z bank | fixed (`let isha`, `LOADFAIL` logged) |

## Every 1440-near-isha site in the archive

Searched `o1k-wide/` and `o1l-city/`, all depths, excluding `node_modules` and
`captures`. Thirty-three fit scripts touch 1440 near isha (three index scripts mention it
in prose); only the two below take the unwritable-`const` form. The rest are safe for one
of four reasons, stated per script.

| script | fits | form | verdict |
|---|---|---|---|
| `o1l-city/us-states/fit_masjidal.js` | US mosque surfaces | `const` + `+= 1440` | **buggy** |
| `o1l-city/us-unresolved/scripts/fit_debug.mjs` | US unresolved (debug) | `const` + `+= 1440` | **buggy** |
| `o1l-city/us-unresolved/scripts/fit_masjidal.js` | US unresolved | `let` + `+= 1440` | safe |
| `o1l-city/masjidal-global/fit2.js` | masjidal 216-tenant pool | `let`, plus `d.isha % 1440` on the scored side | safe |
| `o1l-city/masjidal-global/masjidi_fit.js` | masjidal tenant angles | `let`; only the isha-maghrib gap is read | safe |
| `o1k-wide/usmap/measure2.js` | North America map census | `const` ternary (`isha0 < mg ? isha0+1440 : isha0`), property mutation at line 76 | safe |
| `o1k-wide/ukreconcile/recon.mjs` | UK reconcile | property mutation `r.isha += 1440` | safe |
| `o1l-city/O1l-31/{fit-se,fit-multi,fit-classify,dbg,dbg3,dbg4,dbg7}.mjs` | Nordic IF tables | property mutation `s.chart.isha += 1440` | safe |
| `o1l-city/o1l-22/work/fit_mq.mjs` | Macau | property mutation `rows[d].isha += 1440` | safe |
| `o1l-city/canada2/{fit,fcna}.js` | Canada | returns `v + 1440` | safe |
| `o1l-city/fallback-sweep/{fit,fit2}.js` | fallback fits | bidirectional diff wrap | safe |
| `o1l-city/o1l-21r/work/{fi4,fi5}.js` | Pakistan charts | modular interval arithmetic | safe |
| `o1k-wide/fit10/{burkina,id-highlands,probe-ktn}.mjs` | Burkina, Indonesian highlands, Kelantan | modular interval arithmetic | safe |
| `o1k-wide/deep1/scripts/fit-sa.js`, `deep3/scripts/fit-iceland.mjs`, `deep2/scripts/tj-deep.js` | Saudi, Iceland, Tajikistan | modular interval arithmetic | safe |
| `o1k-wide/verify2/sa.mjs`, `o1l-city/{mideast-cities,saudi-cities,wayback-back}` Saudi fitters | Saudi century | modular interval arithmetic | safe |
| `o1k-wide/fit9/job1_nl.py`, `job3_pt.py` | Netherlands, Portugal | Python, no `const` | safe |
| `c42-masjidal/gate.py` | masjidal gate | Python, no `const` | safe |
| `c47-practicemap/{measure,verify}.js` | practice map | `let isha` | safe |

## Where the data actually triggers the branch

An after-midnight isha is not hypothetical: the archive holds four surfaces that carry
it, and only a `let` declaration stopped the bug from eating them.

| surface | place | after-midnight isha days | fitter | outcome |
|---|---|---|---|---|
| `masjidal_M9L2byLZ` | Wirral Shahjalal, Birkenhead GB | 66 / 66 / 65 (2024-26) | `masjidal-global/fit2.js` | safe, 3 y scored |
| `masjidal_RKxqeRLO` | New Peckham, London GB | 40 / 40 (2024-25) | `masjidal-global/fit2.js` | safe, 3 y scored |
| `masjidal_pVdwyVLe` | Masjid At-Taqwa, Edmonton CA | 56 / 55 / 55 | `o1k-wide/usmap/measure2.js` | safe, 361/365 measured |
| `masjidal_8KXm93LM` 2025 | Newark NJ, NIA | 5 (Mar 31, Oct 12-15) | `us-unresolved/scripts/fit_masjidal.js` | **bit the bug** |

The Newark five are an upstream AM/PM rendering defect, not a real after-midnight
table: 2025-03-31 prints `asr 4:35AM, maghrib 7:21AM, isha 8:38AM` and 2025-10-12..15
print `isha 7:38AM .. 7:33AM`, where the surrounding days print the same digits in the
evening. `isha < mg` is true on all five, which is exactly the branch.

## Impact, measured

Both affected scripts were re-run in copies on their own data. `us-states` was run with
the buggy declaration and again with `let`; `us-unresolved` with `let` (the bank's own
form), with the buggy declaration, and with a repair pass.

**us-states, 39 fits.** The buggy declaration reproduces every banked `out/fit_*.json`
exactly: zero year drops, zero score changes, zero geometry changes. Cause: no surface
in `us-states/captures` or `us-states/data` has isha before maghrib (scanned 202
date-keyed files and 230 captures, 90 of them Masjidal). The branch is never taken. The
`let` copy differs only in the declaration, so it cannot differ where the branch is not
taken; spot-checked on 11 surfaces across four time zones and both loaders, 0 diffs.

**us-unresolved, 39 fits.** Under the buggy declaration `8KXm93LM` loses 2025:

```
buggy    years ['2024','2026']       2025 absent
fixed    years ['2024','2025','2026'] 2025 rows 365
banked   years ['2024','2025','2026'] 2025 rows 365
```

The bank escaped the drop because the production fitter was patched to `let` at 05:53Z
and re-run at 05:54Z. But `let` alone leaves the five malformed days in the scored set,
and they poison the year: isha becomes 1898 minutes on those days, the solar fit drags
to rms 26.657, and the columns report residuals of -721/+722 minutes.

### Classification

D9 year-drop reading, per the mission's three classes:

| class | fits | which |
|---|---|---|
| (a) changes the span claim | 1 | `8KXm93LM` (3 y / 1,097 rows would have banked as 2 y / 732 rows) |
| (b) changes the score only | 0 | a dropped year always changes the span |
| (c) no-op, no after-midnight isha | 77 | 39 `us-states` + 38 `us-unresolved` |

Post-patch score residue, which `let` does not fix:

| class | fits | which |
|---|---|---|
| score materially wrong in the bank | 1 | `8KXm93LM` 2025 (geo rms 26.657, isha worst +722) |
| score cosmetically wrong in the bank | 1 | `0aAeyzAj` 2024 (one AM/PM day, dhuhr worst -714) |
| unaffected | 76 | the rest |

## The fix and the corrected numbers

Fixed copies in `scripts/`:

- `fit_us-states_fixed.js`, `fit_us-unresolved_fixed.js`, `fit_debug_fixed.mjs`:
  `const` -> `let`, nothing else.
- `fit_us-unresolved_repaired.js`: `let`, plus the wrap moved after a two-pass repair.
  A printed time more than 600 minutes from its column's own yearly median whose PM
  reading lands within 120 minutes of that median is an AM/PM swap and takes +720.
  After repair, the isha lift runs, so the gap to maghrib stays positive.

Corrected bank in `out/corrected-us-unresolved/` (39 fits). Verified bank in
`out/verified-us-states/` (39 fits, identical to the original). Buggy bank in
`out/buggy-us-unresolved/` (39 fits, keeps the 8KXm93LM drop as evidence).

### Delta: `8KXm93LM` (Newark NJ, NIA), year 2025

| metric | banked | corrected |
|---|---|---|
| years / rows | 3 / 1,097 | 3 / 1,097 (unchanged) |
| geo lat, lon, k | 40.70, -74.404, 0 | 40.73, -74.154, 2 |
| geo rms | **26.657** | **0.849** |
| fajr exact / worst | 52 (14.2 pc) / +2 | 44 (12.1 pc) / +3 |
| sunrise | 55 / -3 | 264 / +2 |
| dhuhr | 69 / **-721** | 11 / +3 |
| asr | 71 / **-722** | 37 / +4 |
| maghrib | 29 / **-721** | 248 / -3 |
| isha | 35 / **+722** | 20 / +3 |
| fajr angle | 14.72 | 14.71 |
| isha angle | 15.02 | 15.35 |

The corrected 2025 now sits on the other two years: 2024 rms 0.829 / fajr 14.65 /
isha 15.35, 2026 rms 0.866 / fajr 14.66 / isha 15.34. Three stable years on one recipe,
14.65-14.71 fajr and 15.34-15.35 isha, which is the report's "14.66/15.34, worst 3"
and the verdict "hand-entered class". The report's Newark line was right; the bank file
was wrong.

### Delta: `0aAeyzAj` (Lansing ISGL), year 2024

| metric | banked | corrected |
|---|---|---|
| dhuhr exact | 26 | 26 (unchanged) |
| dhuhr worst | **-714** | **+6** |
| isha exact / worst | 34 / -22 | 34 / -22 (unchanged) |

One AM/PM day. The exact count and the verdict (`defective, isha -18, rms 1.26`) do not
move; only the reported worst residual was an artefact.

## Recommendation for the closing fit index

1. **`US-33-METROS`** (`fitindex2/entries_c.py:280`). Replace the flag text "every
   year-scored US fit is suspect until re-run" with: audited, 39 `us-states` fits
   reproduce exactly under both declarations, no year lost. Re-bank the Newark
   `8KXm93LM` 2025 block from `out/corrected-us-unresolved/`; span, verdict and grade
   do not move.
2. **`MASJIDAL-216-POOL`** (`entries_c.py:683`). Clear the flag. Its fitter uses `let`
   and wraps the scored side (`d.isha % 1440`); its two genuine after-midnight tenants
   carry no +1440 artefact (M9L2byLZ isha worst -18, RKxqeRLO -23 / +33 / +280, the 280 a
   real jama'ah-schedule defect already caveated). Add one caveat:
   `masjidal-global/out/fit_*.json` are a stale pre-`fit2.js` run carrying +1440 isha
   residuals (M9L2byLZ worst 1446, RKxqeRLO worst 1491); the bank is `out/f2_*.json`.
   The report already quotes the `f2` figures.
3. **`US-OMAHA-REGIME` and the dpt sample.** No re-bank. No after-midnight rows.
4. **`fitindex2/build.py:154-163`.** The integrity note says the audit "had NOT landed".
   Replace it with this document's findings and the two-entry affected list
   (`8KXm93LM`, `0aAeyzAj`) in place of the blanket "no year count is certified".
5. **`integrity2/gen.mjs:232`.** The claim that the after-midnight rows "are safe" is
   wrong on the score axis. Replace with: `let` keeps the year but not the score; the
   Newark 2025 block needs the repair pass, and the 0aAeyzAj dhuhr worst is an artefact.
6. **Standing rule for any later fitter.** Handle isha >= 1440 on both sides: lift on
   load, and wrap the residual in both directions when scoring. A one-sided
   `diff < -720` correction is not enough, because a lifted isha produces a positive
   +1440 residual.

## Block

None. Every step ran to completion inside the workspace.
