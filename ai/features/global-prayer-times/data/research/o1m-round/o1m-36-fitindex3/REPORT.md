# O1m-36 fit index round 3 — report

Registry agent for round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-36-fitindex3/`.
Read every returned wave's REPORT.md and fit artifacts under `$HOME/athan-gitree/census/o1m/`
(o1m-1..o1m-35 and the R1..R8 continuations) plus the round's CONSOLIDATION blocks. Wrote
`FIT-INDEX-ROUND3.md` and `FIT-INDEX-ROUND3.json` in the O1k schema, mirroring
`o1l-city/fitindex2/FIT-INDEX-ROUND2.md`. Transcription only: nothing re-derived, nothing
adjudicated. No web access, no subagents, nothing under `/tmp`, the repository untouched.

## Counts

| Measure | Value |
|---|---|
| Entries | 154 |
| Countries and territories named | 87 |
| Multi-country families and matrices (ZZ, not one country) | 15 |
| Grade A | 31 |
| Grade provisional | 85 |
| Grade candidate | 25 |
| Grade community | 11 |
| Grade measured | 2 |
| Entries carrying a conflict note | 82 |
| Entries carrying a flag | 11 |

Span verdicts: yes 33, no 7, frozen-reprint 5, untestable-single-year 80,
untestable-short-sample 21, untestable-single-template 8. No entry carries frozen-recomputed
this round; the Algeria class it names is carried by DZ-MINISTRY-1447-1448 in round two, and the
closest round-three object (Kazakhstan's re-derivation) is graded yes because the engine was
re-run as the second witness.

## Reconciliation

The reconciliation table in the index carries 59 rows, one per movement this round touches, each
mapped to its entry or named as having none. The movements fall into five classes:

- **FALLBACK lifts.** Iran (measured twice), Turkmenistan, Georgia, Afghanistan, Mongolia,
  North Korea, Romania, Samoa, Vanuatu, PNG and nine Pacific states.
- **Misread corrections.** Syria's isha is an interval, not a pair; France's 18-to-12 sweep is
  one publisher; Sri Lanka's two editions are one generation; the workbook layer is the PDF's
  own generation reprinted; Santa Cruz's "unreproducible" columns were a parser offset.
- **Span extensions.** Saudi 109 to 225 points, Egypt 3 editions and 563 posters, Czechia 4 to
  1,146 city-years, CDUM 171 city-years, Kazakhstan 301 city-years, Chile 295 sheets, Canada six
  years, Jordan six years of authority rows, Qatar three years.
- **Certificates.** The A53/D9 fitter flags cleared by re-run (US 39 fits twice, masjidal 54
  tenant-years), Newark re-banked.
- **Nothing moved.** Thailand's 77 workbooks are hash-identical to the held generation; the
  Maghreb, Switzerland and 40 further O1k/O1l entries carry no round-three artifact.

## Flags carried

Fifteen rows in the index, none adjudicated: US/China 18/16 (Diyanet alone), Iran's 4.5-degree
maghrib depression (no family carries it), Saudi Ramadan +120 (masjidi alone), the tawkit isha
split (292 of 571 cities at maghrib + 90), the Chaguanas timezone defect (still live), the thirty
HTML-error PDFs (a capture-integrity item with no fit), the mawaqit `?year` relabel (25 of 25,
and sharpened in R5 to rewrite the date column while the values stay identical), the Diyanet
city-postback 150-row default, the Kuwait no-axis finding, KDH07 unresolved, the fitter
certificate, Diyanet's high-latitude block, the three masjidi summer mechanisms, Iceland's isha
move, and tawkit's eleven-month forward window.

## Conflicts

Forty rows, carried never resolved. The round's load-bearing ones: the two Iranian
conventions, the two Indonesian national lines 8 minutes apart on subuh at 209 units, the two
Iraqi lines, the two Qatari lines, the two Jordanian regional families, the two Ugandan lines, the
two Canadian provincial lines, the Malaysia 2027 premise overturned, and India's 17-degree isha
as a mosque-tier line with no publisher table behind it.

## In flight

Six waves have not returned and contribute no entry: o1m-28-pakistan (raw chart fit on disk, no
report), o1m-29-kaznational (report with six PENDING sections, gazetteer parsed), o1m-30-maghreb
(293 MB, empty fit directory), o1m-31-indonesia (771 files, fits on disk, no report),
o1m-32-caappeal (capture-only) and o1m-35-lupt (scripts and captures, no report). o1m-33-index and
o1m-34-wtdiff3 are empty directories. o1m-27-gulf and o1m-29 return reports without CONSOLIDATION
blocks; for o1m-27 the report governs and its entries are in the index.

## Method notes for the next cut

- The index is generated from `entries_*.py` by `build.py` and `build_md.py`, so a returned wave
  is one entry table plus one reconciliation row, never a hand edit of the MD.
- A wave that returns after this cut needs its own reconciliation rows and its own in-flight row
  removed; the in-flight table names what each has on disk so the continuation starts from there.
- Two grade conventions are load-bearing and were applied literally: a reprint never lifts
  provisional (Sri Lanka, Fiji, the workbook layer, Malaysia's mirror), and a second edition that
  shares the computation is not a second fitted year (Perak 2027, Malaysia 2027).

## NEXT

1. **o1m-28-pakistan**: return the report so the chart fits (Rawalpindi 310/365, Faisalabad
   309/365, Sialkot 101/365 all-six) can be entered or explicitly rejected against the OCR
   block's 14-px finding.
2. **o1m-29-kaznational**: complete the 5,694-settlement pull; it would make Kazakhstan the
   largest single-country fit in the programme and may lift several entries.
3. **o1m-30-maghreb**: return the Tunisia and Algeria sweeps; the Maghreb is the round's one
   whole region with no new fit.
4. **o1m-31-indonesia**: return the report so the banked drift, leap and 2028 artifacts acquire
   a stated recipe.
5. **o1m-32-caappeal and o1m-35-lupt**: return or be folded into the next round's territory list.
6. **The close**: the index is ready to ride the close commit; it needs no further derivation,
   only the reconciliation rows the remaining waves add.
