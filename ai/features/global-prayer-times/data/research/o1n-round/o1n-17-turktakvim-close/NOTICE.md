# NOTICE — o1n-17 close-out

If this session ends before the close-out finishes, resume from
`$HOME/athan-gitree/census/o1n/o1n-3-turktakvim/`:

1. If no harvester runs: `python3 scripts/harvest2.py --walk <N>` where N is the
   journal's maximum fetch index plus one (read the last `fetch` line's `index` in
   `data/journal-harvest.jsonl`). One process, one bucket; never two.
2. Close-out sequence, in order: `python3 scripts/parse2.py` (marker-aware), skip
   `build-order.py` (tree unmoved), `node scripts/fit.mjs --all`,
   `node scripts/crosscheck.mjs`, `python3 scripts/coverage2.py`,
   `python3 scripts/fallback-join.py`.
3. Fill the PENDING slots in `o1n-17-turktakvim-close/REPORT.md`, copy the run's final
   artifacts per the deliverables list, delete this NOTICE.

State at writing: harvest alive (PID 40437), walk index ~42.3k of 112,854, ~4.70 req/s,
ETA ~22:17 UTC. The parse2 asterisk fix is already applied and the store re-parsed.
