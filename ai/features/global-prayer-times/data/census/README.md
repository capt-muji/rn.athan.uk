# Census artifacts (T-668)

Produced by the worldwide mosque timetable census, 2026-11-10. The full evidence
lives in the wave comments on ticket T-668 and the raw captures in the census
archive outside the repository (`$HOME/athan-gitree/census/`, durable, not
public). This directory carries the load-bearing outputs only.

| File | What it is |
| --- | --- |
| `policy-layer.v2.4.json` | The policy layer: 69 country/source objects with recipes, margins, rounding, clock modes, grades under the owner's 2-3-year ruling (A 16, provisional 34, community 4, candidate 14, F 1). Schema 2.4.0. The close fold includes C40's Jordan and Qatar grade-A flips and C47's practice-map note. |
| `world-table-v2.md` / `.json` / `CHANGES.md` | The master world table: 166 rows (from T-667's 75), every row provenance-tagged, class distribution and movement record against the prior table. The base artifact for the T-42 plan. |
| `platform-SCHEMA.md` / `platform-VERDICT.md` | The mosque-platform ingest schema (mawaqit, masjidbox, masjidal, Amanahly, dpt, athanplus) with the universal verification suite and the tiered usability verdict. |
| `bake-RUNBOOK.md` | The operational bake runbook: 18 verified endpoints, parse rules, January re-bake windows, failure modes. |

Standing caveats carried in the objects themselves: the multi-year ruling's
frozen-generation precedent (a relabelled-identical table is one year of
evidence); the masjidal two-layer rule (athan generated, iqamah tenant-bounded);
per-edition constants (North Cyprus); platform timezone fields are untrustworthy
at ingest. Owner decisions outstanding: Morocco's one-line conditional, Fiji's
letter-of-ruling, Yemen's feed choice, the Fazilet London madhab ruling, and the
mawaqit bulk-enumeration call.
