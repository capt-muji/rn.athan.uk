# O1m close state (graceful stop, 2026-11-11 ~14:2xZ)

Round state: STOPPED on the owner's order, not at a deadline. Everything banked is on disk
under `$HOME/athan-gitree/census/o1m/`; the citable layer rides the close commit at
`ai/features/global-prayer-times/data/research/o1m-round/`.

Landed and consolidated: O1m-1..O1m-15, R1-R8, O1m-22..O1m-53 (the CONSOLIDATION carries the
blocks; the QUEUE carries the status per row). The round's registers: FIT-INDEX-ROUND3B (162
entries, 89 countries, A 33), CORRECTIONS-ROUND3 (82/31/75/39/22), DECISIONS-ADDENDUM-ROUND3
(16 items), WORLD-TABLE-DIFF-ROUND3 (703 lines, arithmetic 179 = 174 + 5, AS-FAR-AS note),
ROUND-SUMMARY (13,340,267 raw / 10,073,002 dedup rows, 21,877 data files), INTEGRITY-ROUND3
(partial: 78 error-body captures; the per-workspace verdict table never wrote), GAPS-CLOSED-ROUND3
(7 flags closed), COORDS-LEDGER-V2 (23,893 records), WATCHES.md/watches.json, ENGINE-CONSENSUS
(232 countries), SECOND-WITNESSES (25 of 30 singles), LUPT block (18,263 days).

Open at the stop (named, not lost): the index rebuild and the per-workspace integrity table;
wtdiff3's section-4 cross-read and its 48-object amend list; the summary's class after-state and
a re-cut; fit-index entries for O1m-29/31/51 (reports PENDING or incremental); o1m-51's
turktakvim re-enumeration (the semicolon filter fix), fits, ladder and FALLBACK join; the
30-unit myquran live gate; Alaska line 3 of 14 flags; the December watch probe list (11 of 16
taken); Oman's 9 doubtful names; the 16 withheld Algeria days; the KDH07/Quetta corrections to
be folded into the next register; and the citable rsync of normalized rows (archive-only this
close: data/ is 2.1 GB, reports+fits ride git at 67 MB).
