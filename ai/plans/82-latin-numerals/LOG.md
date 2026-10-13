# LOG 82

## Planning (2026-10-13)

Planned by the lane/82 planner against `a4d0b8c6` (uat, 2.0.218). The owner's
discovery ruling sits in queue row 82 verbatim; every decision taken without her is
recorded in PLAN.md section 2.1 with its evidence.

## Ticket 82

- Code map: shared/time.ts (both dispatchers and the colon machinery), shared/i18n/
  digits.ts, shared/i18n/index.ts (t() interpolation), components/countdown/
  Countdown.tsx, components/prayer/Ago.tsx, stores/countdown.ts (display selector),
  hooks/usePrayer.ts, shared/typography.ts, shared/widgetTimeline.ts, Stepper.tsx,
  SoundItem.tsx, widgets/PrayerWidget.tsx (WIDGET_DIGITS), the pinning suites named
  in the steps.
- Scratch-worktree proof (deleted before 00:00): the two dispatchers flipped alone
  redden 25 tests (time 15, Countdown 5, Ago 3, selector 2); the map neutralised
  beyond that reddens the ar pins measured in step 2's red list, including the four
  widget-renderer pins after the widget map dies. tsc clean after each flip.
- 30 anchors generated from `a4d0b8c6`, each counted exactly 1.

### Grill round one (2026-10-13)

The griller verified the anchors, the suite totals, the deletion inventory and the
break substitutions against the code. Twelve findings, all applied: six must (three
wrong green values where the composer shows seconds by default, `formatTime(60)` is
`00:01:00` not `00:01`; the missed `formatPrayerTime` ar pin in the step-2 red list,
now six failed with the `05:44` flip; the break-step2 byte shape pinned in its
contract; the Ago badge's three-node query shape under en), five should (the complete
en pin list with its rule, the three negative assertions that die with the map, the
restore-list arithmetic, the seven widget call lines, the step-3 prebuild sequence
with the stale `ios/` derivation and the prod env staging), one nice (the preflight's
bash 3.2 empty-array guard). No second round: every finding was a numeric or shape
correction re-verified against the composer here, none structural; the griller's own
report confirms the structure sound. All twelve are applied, the nice included.


### Replan round one (2026-10-13, lead)

Step 1's Ago pin shape was unsatisfiable as the plan wrote it. The executor's STOP:
React Native Testing Library 14 matches a `Text`'s whole concatenated content, so with
the en gate dead the badge is one outer `Text` with children `["Dhuhr 0", <gap>, "03 ago"]`; `getByText('Dhuhr 0')` and `getByText('3 ago')` both return null, and the
duration's minutes half is `03 ago`, not `3 ago` (the plan's own red line already read
`Dhuhr 0:03 ago`). Repaired contract 5: query the outer node with the identity
normalizer (`getByText('Dhuhr 0\u2009:\u200903 ago', { normalizer: (s) => s })`) plus
the gap node, and the fade test asserts that outer node. No other step-1 item changed;
the executor's pre-flight and both anchor lists pass, and the tree is clean at
`3494857e`.
