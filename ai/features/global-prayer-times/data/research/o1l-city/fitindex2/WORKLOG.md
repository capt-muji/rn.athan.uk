# Worklog: O1l fit index round 2 (O1l-68)

## Deliverables

- `FIT-INDEX-ROUND2.md`: 154 entries, counts, grading rule, integrity note, the 56-movement
  reconciliation, region tables, flags, conflicts, in-flight and not-fitted sections.
- `FIT-INDEX-ROUND2.json`: the same entries, machine-readable, O1k schema (`schema
  athan-fit-index`, `schemaVersion 1.0.0`).
- `entries_a.py`, `entries_b.py`, `entries_c.py`, `build.py`: the transcription source and the
  renderer. Re-running `python3 build.py` regenerates both files from the same data.

## Sources read, in order

1. `o1l-city/BRIEF.md` and `o1l-city/FIT-RULES.md` (binding).
2. `o1k-wide/fitindex/FIT-INDEX.md` and `FIT-INDEX.json` (schema template, 59 entries).
3. `o1l-city/CONSOLIDATION.md`, all 57 blocks.
4. `o1l-city/corrections/CORRECTIONS-ROUND.md` (A 77 / B 34 / C 56 / D 32 / F 17).
5. `o1l-city/wtdiff2/WORLD-TABLE-DIFF-ROUND2.md` (the 56 movements, sections 1-10).
6. Post-cut reports on disk: `masjidi/REPORT.md` (read in full), plus the `il-ps`,
   `westafrica2`, `germany-districts`, `fallback2`, `capitals3` and `second-witnesses` content
   as the CONSOLIDATION blocks carry it.

## What was done

- One entry per fitted surface or surface family, not per country row. Recipes, spans and
  scores are transcribed from the block that measured them; no figure is re-derived and no
  denominator is invented. Where a block printed only a percentage, the percentage is the score.
- The grading rule is applied as written, including the frozen-generation precedent. Three
  classes the blocks wrote outside the six-class vocabulary are carried as written and counted
  separately: A-candidate (Thailand), measured (China), A eligible (Tanzania).
- Every entry carries its register or diff reference (`register` field in the JSON, `register`
  column absent from the MD by design because the C-mapping table covers the 56 movements).
- Flags F1-F15 that this round can place are attached to their entries; F14 is marked closed by
  O1l-59; F11 is marked answered in part by O1l-52.

## Decisions recorded

1. **Headline finds capped, not lifted.** Thailand stays A-candidate (the leap block cannot
   separate its years), China stays measured, New Zealand, Fiji, the Maldives and Germany stay
   frozen reprints, Australia stays candidate on one year. The index does not convert a headline
   into an A it cannot defend.
2. **Saudi Arabia is three entries, not one.** The 43-point sweep, the ten-city 1448/1449 set and
   the 1318H-1500H century are distinct surfaces with distinct spans; o1k counted its Saudi fits
   the same way.
3. **Germany is two entries.** The 24-city portal fit and the 1,241-id district layer are
   different axes over the same publisher.
4. **The United Kingdom is six entries**, because the round's finding is a mosaic: Scotland,
   London, the six one-month towns, Wales, Belfast and the second layer each carry their own
   surfaces.
5. **Dates not stated in a block are null.** The Saudi Hijri spans and Kazakhstan's 49-year
   endpoints are recorded as null with the block's own wording, never inferred from a calendar.

## Not in this index, and why

- The fitter-bug audit had not landed: `flags2/` held only `data/quetta-asr-rows.json` and
  `fit/quetta-asr.mjs`; `integrity2/` held `scan.json` and `_md5.txt`. The integrity note states
  the blast radius and names the two affected entries.
- `eastasia2`, `canada2`, `nz-finish`, `athanpro` and `final-sweep` hold data and no report at
  this cut. Their fits are the next cut's first entries.
- Switzerland (no dated rows), Iran's Tehran table (not claimed), North Korea, Monaco, Faroe,
  Turkmenistan, South Sudan, Liberia, Myanmar, Guyana, the Pacific FALLBACK group, Palikir,
  Ngerulmud and Tegucigalpa have no fit this round.

## Rules observed

No web access. No subagents. Nothing written under /tmp. Nothing in the repository touched: all
output is under `$HOME/athan-gitree/census/o1l-city/fitindex2/`.
