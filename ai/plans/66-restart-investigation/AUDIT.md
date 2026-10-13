# Ticket 66 audit (2026-10-13)

Range: `origin/uat..uat` at `ead89e1e` (planning `cb88b511`, grill `10676812`, three
steps with merges 2.0.182 to 2.0.184, executed commit `a4ce2471`/merge `ead89e1e`).
Docs-only ticket: the non-plan diff on uat is the version files. Two reviewers
(plan-conformance, blind) run in parallel over FINDINGS.md and the step records.

## Verified clean

- R1.1, R1.2, R2.1, R3.1 all answered in FINDINGS.md with their required contents;
  the grill-corrected 10-hop trace landed; the inventory is a floor and lists ten rows;
  the transient's mechanism is confirmed against `ca077a32` and the code, and the blind
  reviewer independently grounded it in jotai's derived-atom cache (jotai 3.0.0
  internals).
- Versions 2.0.180 to 2.0.185, one ladder, hooks green on every commit (5500 tests,
  100% coverage, docs-only); no code file touched anywhere in the ticket.
- The recommendation (status quo) rests on cited sections; the ruling list carries what
  only the owner can take.

## Findings and verdicts (all confirmed, all fixed in this audit)

1. [should, both reviewers] FINDINGS.md countdown citations swapped: per-tick
   `writeDisplayCountdown` is `stores/countdown.ts:340` (inside `tick`, closing :341),
   the initial write is :351-353. Fixed at the inventory row and the transient
   subsection.
2. [should, blind] Preamble hop numbers stale: restart and dismiss named hops 7 and 8,
   the table and sections 3.3/4.1 carry 9 and 10. Fixed to 9 and 10.
3. [should, blind] The negative restart search skipped `android/`; its own term hits
   `MainActivity.kt:54` (`moveTaskToBack`, a back-press handler, not a restart path).
   Fixed: android/ joined to the sweep with the hit and verdict recorded; the
   conclusion stands.
4. [should, blind] Inventory intro announced eight rows against ten in the table.
   Fixed with the true split (five expected-class rows, the width atoms and module Map
   sharing the first; five further states).
5. [should, conformance] LOG.md step 01 entry lacked its `session:` line. Fixed with
   the executor's session id.
6. [nice, blind] `widgetTimeline.ts:339` is the `UNAVAILABLE_TIME` literal, not
   `localiseDigits`; the citation dropped. `prayerLabel` at :333 and :339 stands.
7. [nice, blind] `stores/storage.ts` range ended one line before the quoted
   `database.set` (:115); range corrected to 106-115.
8. [nice, blind] D34/D47/D84 to D87 resolve only inside the plan folder; the header's
   "queue record" reworded to row-66 plan record.
9. [nice, blind] "The `finally` never runs in the dying tree" is a runtime timing the
   source cannot carry; both instances restated as the source-carried invariant (the
   atom dies with the module graph; no reader across the reload).

## Verdict

PASS. Nine findings, all confirmed, all fixed in this audit's commit; the
recommendation and every ruling-list item stand unaffected.
