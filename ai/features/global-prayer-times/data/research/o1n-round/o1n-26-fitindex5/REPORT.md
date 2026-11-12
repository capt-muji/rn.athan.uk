# O1n-26 fitindex5 — REPORT

Wave O1n-26, round o1n, session three, 2026-11-12. Mission: FIT-INDEX-ROUND5, the
round-five re-cut over FIT-INDEX-ROUND4 (164 entries). Pure consolidation and
generation over banked work; nothing fetched from the web; no subagents deployed;
nothing written outside `$HOME/athan-gitree/census/o1n/o1n-26-fitindex5/`; nothing
under /tmp; the repository was read for the exclusion bullet only and never
written. The 4 cut and the 3B cut stand UNEDITED where they are.

## Inputs read, in order

1. `census/o1n/STANDING-ORDERS-WAVES.md` (binding in full).
2. The round-mechanics exclusion bullet dated 2026-11-11 in
   `ai/features/global-prayer-times/RESEARCH-ROUNDS.md` (applied by reading; the
   excluded place is never named in any file this wave wrote, and the generator
   resolves it at runtime from that bullet, never writing it down).
3. `census/o1n/FIT-RULES.md`.
4. `census/o1n/o1n-4-fitindex/FIT-INDEX-ROUND4.md` and `.json`, plus
   `o1n-4-fitindex/gen.py` (the generation discipline: deterministic, recounts
   from the entries themselves).
5. `census/o1n/CONSOLIDATION.md`, every block.
6. Every source workspace the dispatch named, before writing its fold
   (o1n-18-fazilet-grade, o1n-20-newterr, o1n-22-rucaucasus, o1n-23-mena,
   o1n-3-turktakvim data and fit files, o1n-17-turktakvim-close, o1n-28-caucasus),
   plus `o1n-25-europerecover/REPORT.md` for the scan fold below.

## Deliverables

- `scripts/gen.py` — deterministic generator; reads the round-4 JSON (read-only)
  and the banked grade table (read-only), emits the two index files.
- `FIT-INDEX-ROUND5.md` and `FIT-INDEX-ROUND5.json` — 173 entries, round-4 schema,
  same wording discipline; counts recounted from the entries themselves.
- `data/run-a.sha256` and `data/run-b.sha256` — the byte-identity proof.

## Byte-identity proof

Two generator runs, then two more, all four runs byte-identical on both files
(run A vs run B diff empty):

```
1b9c55ccb343c9da1373975bb829aa6927b76ac14e7d1e6cf7e5793bb3bbbd49  FIT-INDEX-ROUND5.md
f9b065ebd9c2e034b677353bd5a62d649ee27c1bb9ebf201ab6b751b56c9d163  FIT-INDEX-ROUND5.json
```

The generator carries no clock read: the only date is the cut date constant
2026-11-12. A carried-verbatim assertion proves every entry not named as amended
or new is byte-equal to its round-4 state (the six conflict-note patches differ
only by their appended line).

## Counts, round 4 vs round 5

| Measure | Round 4 | Round 5 |
|---|---|---|
| Entries | 164 | 173 |
| Countries and territories touched (distinct single-country entries) | 89 | 88 |
| Multi-country families and matrices (ZZ, not one country) | 17 | 18 |
| Grade provisional | 89 | 94 |
| Grade A | 35 | 39 |
| Grade candidate | 26 | 26 |
| Grade community | 11 | 11 |
| Grade measured | 3 | 3 |
| Entries carrying a conflict note | 92 | 107 |
| Entries carrying a flag | 14 | 14 |
| Span verdict untestable-single-year | 82 | 82 |
| Span verdict yes | 34 | 39 |
| Span verdict untestable-short-sample | 22 | 25 |
| Span verdict no | 9 | 9 |
| Span verdict untestable-single-template | 9 | 9 |
| Span verdict frozen-reprint | 6 | 7 |
| Span verdict frozen-recomputed | 2 | 2 |

The entry count reconciles as 164 - 1 (the excluded-territory drop, below) + 10
new entries. The country count falls by the same drop; Sweden, Portugal, France,
Azerbaijan, Russia and New Zealand were already touched, so the ten new entries
add no country. Every other figure is recounted from the companion JSON by the
round-4 count rules.

## Movement table (old grade -> new grade per entry)

| Entry | Was | Now | Movement |
|---|---|---|---|
| FAZILET-248-CITIES | not indexed (FAZILET-28-CITIES was an O1n-9 proposal, never entered in any cut) | A | new family entry, per-country counts carried inside; supersedes the proposal; FAZILET-AFRICA-33 stays a named sub-evidence base |
| NZ-FIANZ-20-CITIES | the held FIANZ negative (a conflict line on NZ-16-YEAR-SURFACES) | provisional | new authority entry; the negative superseded on both entries |
| NZ-16-YEAR-SURFACES | candidate, span untestable-single-year | candidate, span yes | amended: the masjidbox 2027 walk (4 genuine second editions, 8 frozen reprints no-lift, Masjid-E-Umar partial, 3 mawaqit none) |
| RU-KBR-NALCHIK-2025 | not indexed | provisional | new |
| RU-UFA-DUMRB-353 | not indexed | provisional | new |
| RU-MOSDUM-MOSCOW-31 | not indexed | provisional | new |
| RU-DUMRF-MOSCOW-245 | not indexed | candidate | new; grade per the wave's banked verdict (see settlements) |
| AZ-QMI-BAKU-730 | not indexed | A | new |
| SE-IMAMALI-65-CITIES | not indexed | provisional | new |
| PT-CIL-HSALAH-21-CITIES | not indexed | A | new |
| FR-EZANI-25-CITIES | not indexed | A | new |
| TT-TREE-110834 | candidate, no fit, lower-bound count | provisional, fitted, final count | amended: the FINAL numbers (108,676 tables / 39,666,128 rows / 112,854 settlements / 181 entries / 176 fitted), the crosschecks, the FALLBACK join recorded |
| IR-PISHKHANAK-44 | A (two Jalali years banked at the last cut that touched it) | A (four fitted Jalali years) | amended: the 1402 window, merged bank 61,776 rows |
| EU-DIYANET-16-ISHA-SPLIT | provisional, flag open | provisional, flag CLOSED | the F-DIYANET-SUMMER closure written onto the flag, artifact named |
| BO-SANTA-CRUZ-RESOLVED | candidate, span untestable-single-year | candidate, span frozen-reprint | amended: the year-2 diff measured zero on every column |
| AF-MAWAQIT-WEST-BOARDS, BO-LA-PAZ-RECLASSIFIED, NP-RAHMANIYA-BOARD, GW-BISSAU-ATTADAMUN | unchanged | conflict note added | the seven CDX boards closed (no archive copy; live gates 7/7 PASS cell-identical) |
| RU-DUMRF-61 | unchanged | conflict note added | the "no static tables" negative reversed by the archive entry |
| FR-GMS-STRASBOURG-SWEEP | unchanged | conflict note added | the hosting torn down (regime event recorded; held rows stay banked) |
| one round-4 base entry | carried | dropped | resolves to the excluded territory at runtime; the bullet treats it as never existing; its name never written; the round-4 file stands unedited |

## Reconciliation

Every folded number traces to a named artifact on disk: the Fazilet family
numbers to `o1n-18-fazilet-grade/REPORT.md` and `data/grade-table-final.json`
(per-country sums asserted 245/3/216, 210 layer rows); the FIANZ and masjidbox
numbers to `o1n-20-newterr/REPORT.md` and its data files; KBR and Bashkortostan
to `o1n-22-rucaucasus/REPORT.md` and `data/kbr_nalchik_2025.json` (365),
`data/dumrb_ufa_2026.json` (353), `data/dumrb_ufa_2025-06.json` (30); the flag
closure to `o1n-23-mena/data/dynet-summer-verdict.json`; Iran to
`o1n-23-mena/REPORT.md` and `data/ir-1402-rows.json` (17,424) and
`data/ir-merged-rows.json` (61,776); the tree to `o1n-3-turktakvim/data/coverage.json`
(108,676 / 39,666,128 / 112,854 / 181 / 180 / midway-islands),
`fit/ladder-summary.json` (176 countries fitted), `fit/crosscheck-athanpro.json`
(956 pairs, medians +0.5 / -5 / +7 / +7.5 / +6 / +7),
`fit/crosscheck-diyanet.json` (1,059 pairs, medians 0 / +1 / +5 / +6 / 0 / +11)
and `fit/fallback-join.json`, with the `o1n-17-turktakvim-close/REPORT.md` FINAL
addendum superseding its own interim sections; Azerbaijan and Moscow to
`o1n-28-caucasus/REPORT.md` and `data/qmi_baki_2025_2026.json` (730),
`data/mosdum_moscow_2025-12.json` (31), `data/dumrf_moscow_2026_rows.json` (245);
Sweden, Portugal and France to `o1n-25-europerecover/REPORT.md` and
`data/imamali-fits.json` (65), `data/hsalah-fits.json` (21),
`data/ezani-france-fits.json` (25). Nothing was re-derived beyond those artifacts
and no measurement was adjudicated.

One dispatch-vs-artifact settlement: the dispatch line said provisional for
RU-DUMRF-MOSCOW-245; the wave's own banked verdict in
`o1n-28-caucasus/REPORT.md` says candidate (solar fit proven, twilight solved
only on the dark-season span, the bright-season rule unresolved). The artifact
governs and the entry is candidate, noted in the index MD as well.

## Folds beyond the seven dispatched items (rule-based why)

- Sweden, Portugal, France and the Strasbourg regime event: the session-three
  O1n-25 block names Sweden banked and defers Portugal's "parse, fit, grade and
  tier" to the continuation; the same wave's banked REPORT carries the completed
  graded fits dated 2026-11-12, and the index folds banked graded state.
- Santa Cruz, the seven CDX boards, the dumrf negative reversal: banked
  measurements in the session-two O1n-20/24 block and the session-three O1n-28
  block touching existing entries, so the entries carry them.

## Folds declined (rule that excluded each)

- mihrab.ru: one attributed today-row with no printed date is not a dated dataset
  under the entry rules; an open door in the report, not an entry.
- the fm6oa.org / habous.gov.ma leg and the Syria imsakiyya extraction: banked in
  the O1n-23 continuation report but carried by no session-two or session-three
  CONSOLIDATION block, which is this cut's scan scope; next consolidation folds
  them.
- the Dakar UCAD five-year bank: named only as an inherited, live-gated bank; no
  consolidated block carries its recipe or fit, so no settled movement exists for
  the AF-MAWAQIT Dakar member.
- the Kuwait ruznama closure: the KW flag concerns the year axis, not cell
  extraction; no entry field moves.
- the honest negatives (Bhutan, Djibouti, Somalia, Mali HCIM, Ghana, Sierra
  Leone, Georgia, Armenia, the Russian republics): the index carries graded
  surfaces, not negatives; Georgia and Armenia keep no entry per the round-4
  conventions and no existing entry carries a note to amend.

## Gates

- Two generator runs byte-identical: PASS (four runs, sha256 above).
- Counts reconcile against CONSOLIDATION.md's blocks and every number traces to a
  named artifact: PASS (reconciliation section).
- The excluded territory never appears: PASS (runtime resolution, an absence
  check against the Fazilet layer table, and a folded-bytes guard on both output
  documents; the dropped base entry never named).
- The occupying entity's name never appears: PASS (never written anywhere).
- The repository never touched: PASS (read for the exclusion bullet only).
- Nothing under /tmp; timestamps UTC; no real clock in data: PASS.
- Recipes transcribed as the fits state them; engine adhan 4.4.6 noted where the
  sources note it: PASS.
