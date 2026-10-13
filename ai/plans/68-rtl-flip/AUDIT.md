# Ticket 68 audit (2026-10-13)

Range reviewed: `e3761f15..b0af0138` (steps 1 to 4: `01542516`, `db50f9db`,
`a3d8d282`, the merges and docs commits). Two reviewers: plan-conformance and
blind, both reconstructing the diff from git after the dispatched packet path
resolved differently in their sandboxes. Conformance: every criterion holds
against the worktree except the two findings below; blind: the mirror premise
(the RN swap, the logical `start` resolution, transforms staying physical)
verified from the pinned `react-native 0.88.0-rc.3` sources.

| # | Finding | Source | Verdict | Fix |
| --- | --- | --- | --- | --- |
| 1 | The SegmentedControl pill double-mirrors: its anchor is the logical `start: 3`, so under RTL it already sits at the option row's physical start, and the complement target put the pill `n-1` slots past the selection | blind (must), conformance (must) | Confirmed by both, independently; the suite's RTL expectation mirrored the formula itself, so nothing could fail | Target is `(isRTL ? -selectedIndex : selectedIndex) * 100` at both sites; the two RTL cases assert the negated slot (`-200%`, `withTiming(-200)`) |
| 2 | `directionBefore` came from the locale, not the direction in force, so a system-RTL device with an LTR app locale kept the mirrored shell after an explicit LTR pick | blind (should) | Confirmed | `I18nManager.getConstants().isRTL` is the source; the react-native mock became stateful (forceRTL moves isRTL) and the suite sets the pre-crossing direction explicitly |
| 3 | The widget stamp's true path was untested: every assertion was false-path, so a hardcoded `rtl: false` would pass the suite | conformance (should) | Confirmed; mutation-proved after the fix (hardcoding false trips the new ar-block assertions) | The existing `setActiveLocale('ar')` block asserts entries, the stale entry and the snapshot all true |
| 4 | The no-op `{ translateX: 0 }` leading entry in the cloud's transform, with a test asserting the no-op | conformance (nice), blind (nice) | Confirmed | Entry deleted; the test asserts one entry at the live offset (750 in that geometry) |
| 5 | The redundant inner `styles.physical` on the moon and star wrappers (direction inherits from the root) | blind (nice) | Confirmed | Both inner applications deleted |
| 6 | The unguarded `Updates.reloadAsync()` where Error.tsx catches and logs | blind (nice) | Confirmed | try/catch with `logger.warn`, the file's call shape |
| 7 | `widgetContract.test.ts`'s describe still read `widget props v7 footers` | blind (nice) | Confirmed | Renamed to v8 |
| 8 | R3.2 and R4.1\'s second clauses lack device evidence (the pill and tip, and the Extras catchers) | conformance (should, should) | Confirmed; the pill\'s defect (finding 1) is what the substitution concealed | Device recapture of the fixed build: the Alert/Reminder pill and the countdown tip under ar, and the Extras catchers closing from their window regions; evidence transcribed in LOG.md |
| 9 | The plan-text drift (Goal\'s stale Host clause, the LOG\'s pre-grill P16 line, the step-04 heading) and the audit packet\'s range/name | conformance (nice x3, nice) | Confirmed | Plan text corrected; this file records the true range |
| 10 | Ship the `rtl` stamp with no consumer, or land the consumer | blind (nice) | **Rejected**: P15/P16 record the decision explicitly (the stamp is schema groundwork for the blocked Host; the deferred 67 resume keys off it), the cost is one optional field, two version constants and a protocol re-gold, and reverting would churn the same set again | None; the reason stands here |

No owner-owned finding among them (no visuals beyond the proven RTL face, no
notification scheduling); the widget stamp's consumer remains the recorded
blocker on the runtime.
