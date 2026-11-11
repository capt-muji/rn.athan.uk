# O1m-42 corrections register, round three

Workspace `$HOME/athan-gitree/census/o1m/o1m-42-corrections/`. Local data only, no web access, no
subagents, nothing under /tmp, the repository not touched (the record files were read in place).

## Deliverable

`CORRECTIONS-ROUND3.md`, in the round-two shape: table A corrections, B new rows, C grade and span
movements, D rule-forms, and a flagged list. One line per item, record reading beside round
measurement, block cited, no adjudication. Rows counted from the file itself into `data/counts.tsv`:

| Table | Rows |
|---|---|
| A corrections | 82 |
| B new rows | 31 |
| C grade and span movements | 75 |
| D rule-forms | 39 |
| Flags | 22 |

Register total 295 lines. Round two carried A 77, B 34, C 56, D 32 and 17 flags.

## Sources read

- `o1m/CONSOLIDATION.md`, 41 blocks at the cut-off (the O1m-35 LUPT block landed during this wave
  and is included).
- `o1m/o1m-36-fitindex3/FIT-INDEX-ROUND3.md` (564 lines) and its reconciliation, for table C.
- Wave REPORTs already on disk where the block has not landed: o1m-29, o1m-31, o1m-32, o1m-35,
  o1m-39. Only o1m-35 contributes rows (A80 to A82, D34), because its report is complete; the
  others are named in the header as in flight.
- `world-table-v3.md` and `policy-layer.v2.5.json` in the repo, read-only, for every record reading.

## What the round overturned

The load-bearing reversals, in one pass: France's seasonal sweep is nineteen frozen pairs and one
publisher's summer block; Syria's isha is an interval, not a pair; Tunisia's Kairouan branch is an
angle normalisation to exactly 18.00/18.00, not a horizon-dip window; Morocco's pre-rebuild Wayback
leg does not exist, so its A rests on 2026 alone; Malaysia's 2027 subuh move is two publishers'
own takwim, not a national shift; Pakistan's federal 13:00/13:15 dhuhr clock matches 0 of 365 days
in all 26 charts, and the charts themselves were readable all along; Bolivia's Santa Cruz defect
was a parser offset and La Paz is a cloned tenant; Egypt's Ramadan split settles against the
announcing body; Qatar's "closed" portal answers a genuine date parameter across four years;
Bahrain's isha is a stated 74-minute floor; the LUPT asr allowance is +2 from 2027 only, while the
2026 print carries zero.

## Open at this cut

Eight waves sit unreturned and contribute nothing: o1m-29, o1m-31, o1m-32, o1m-33, o1m-34,
o1m-37, o1m-38, o1m-39, o1m-40, o1m-41. Rows: o1m-40 oman and o1m-41 bahrain are empty directories.
Their work is untouched by this register.

## NEXT

1. Re-cut table C against the closing FIT-INDEX-ROUND3 if the index is rebuilt after o1m-30 and
   o1m-35 landed; this register uses the index as built at 13:0x and the blocks for the rest.
2. o1m-34 wtdiff3 owns the record movements themselves. This register records them; it does not
   edit `world-table-v3.md`.
3. Three flags need an owner-level decision at the close, not an agent ruling: the Morocco A's
   lost span leg (F16), the Bahrain regime date (F19), and the US/China 18/16 (F1).
4. o1m-37 decisions should carry the LUPT 2026/2027 seam, since the baked artifact already holds
   both generations and a 2026 re-bake cannot be sourced.
