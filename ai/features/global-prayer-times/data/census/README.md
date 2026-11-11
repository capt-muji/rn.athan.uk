# Census artifacts (T-668)

Produced by the worldwide mosque timetable census, 2026-11-10. The full evidence
lives in the wave comments on ticket T-668 and the raw captures in the census
archive outside the repository (`$HOME/athan-gitree/census/`, durable, not
public). This directory carries the load-bearing outputs only.

| File | What it is |
| --- | --- |
| `policy-layer.v2.5.json` | The policy layer: 87 country/source objects with recipes, margins, rounding, clock modes, grades under the owner's 2-3-year ruling (A 19, provisional 35, community 15, candidate 18, F 0). Schema 2.5.0. The v2.5 fold applies the o1k-wide pack under the 2026-11-11 rulings (T-675 #7092); the D3 Niger consequence is the one delta against the pack's projection. |
| `world-table-v3.md` / `.json` / `CHANGES.md` | The master world table: 174 rows (v2's 166 plus eight added; nine FALLBACK stubs rewritten as data rows with their ids renamed), every row provenance-tagged, class distribution and movement record against the prior table. The base artifact for the T-42 plan. |
| `platform-SCHEMA.md` / `platform-VERDICT.md` | The mosque-platform ingest schema (mawaqit, masjidbox, masjidal, Amanahly, dpt, athanplus) with the universal verification suite and the tiered usability verdict. |
| `bake-RUNBOOK.md` | The operational bake runbook: 18 verified endpoints, parse rules, January re-bake windows, failure modes. |

Standing caveats carried in the objects themselves: the multi-year ruling's
frozen-generation precedent (a relabelled-identical table is one year of
evidence; Niger joined the class at v2.5 under the D3 consequence); the masjidal
two-layer rule (athan generated, iqamah tenant-bounded); per-edition constants
(North Cyprus); platform timezone fields are untrustworthy at ingest. Ruled at
v2.5 (T-675 #7092): Morocco's conditional resolved (D5), Fiji's edition ruled the
widget (D1), Yemen ruled two rows at fit time (D2), the Kemenag six-regency 21/19
set ruled a named exception (D8), the fallback bands ruled (A1) with the
promise-wording rider (A2). Still open: the Fazilet London madhab ruling (R6) and
the mawaqit bulk-enumeration call (R7).
