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

## The recapture (finding 8's evidence, and what it found)

The recapture ran on the fixed build and delivered the demanded faces: the
Arabic alert sheet's segmented control, a cropped countdown card, and the
Extras catchers before and after a tap, all read by the lead from the PNGs in
`$HOME/athan-gitree/sessions/68/`. It also proved the ar bar fills from the
right edge and the restore frames: the warm ar-to-en crossing stayed MIRRORED
with English strings (`16-en-restored-audit.png`), while a cold launch
restored LTR (`18-en-coldlaunch.png`).

| # | Finding | Source | Verdict | Fix |
| --- | --- | --- | --- | --- |
| 11 | The audit's own fix to finding 2 introduced a regression: `I18nManager.getConstants().isRTL` is stale within a process after a crossing, so the warm ar-to-en crossing stopped relaunching and the shell stayed mirrored | The recapture's device measurement | Confirmed by the two restore frames and the logcat (no reload task on the warm crossing; a reload on the cold launch) | The direction in force comes from the app's own record: the stored preference (blank means the device's launch direction, captured before any forceRTL); the stale getConstants read is gone. Suite 4/4, coverage 100% |
| 12 | The segmented pill's Arabic placement: the recapture's sheet frame shows the pill at the control's right edge rather than over the selected (leftmost) segment, so the fixed geometry's device face is not yet proven | The lead's read of `11-ar-segmented.png` against the en reference `17b-en-segmented-reference.png` | Open: the frame is ambiguous (a stale measure, a mid-snap capture and a real misplacement all fit it) | One device measurement: install the fixed build, open the sheet under ar, `uiautomator dump` the pill's bounds beside the selected option's name, plus the en twin; the lead reads the pair |

## Final state (2026-10-13, the run closing)

Findings 1 to 11 are fixed and merged (2.0.156, 2.0.158); the recapture's
evidence sits in LOG.md and `$HOME/athan-gitree/sessions/68/`. Finding 12
closes this audit OPEN, not passed:

- Measured on the 2.0.158 device build: under ar, the athan control's
  three-option SegmentedControl renders NO visible indicator (a full-frame
  purple scan in the control's band finds none) while `صوت` (Sound) carries
  `selected=true`; under en the same state draws the pill on `Sound`
  (bbox 684,880-973,978). The two-option Reminder control's pill IS visible
  under ar in the same frame. Neither `uiautomator dump` nor the maestro
  hierarchy exposes the indicator as an element in either language.
- Working diagnosis (fits both observations): under this RN 0.88.0-rc.3 the
  absolutely-positioned indicator's `start: 3` appears to anchor at the
  physical left edge even under RTL, so the corrected negative travel
  (-selectedIndex segments) moves the pill off-screen left; an index-0 pill
  (translateX 0) stays visible, which is exactly the Reminder control.
- The next session's audit continuation: verify the anchor's resolution
  (a one-off debug border or a bounds log), then either key the anchor to
  the measured container (`right`-equivalent inset under RTL, allowlisted if
  the gate needs it) or fold the whole offset into the single transform
  (containerWidth minus inset minus slot, no anchor edge at all). The suite
  must keep the en bytes identical and the device capture must show the pill
  on `صوت`.

The audit is NOT passed; `uat` at 2.0.159 holds the reviewed fixes and this
record, unpushed past 2.0.157 (2.0.151-2.0.153 were published early and are
covered by this audit's reviews; 2.0.155 through 2.0.159 wait for the pass).
