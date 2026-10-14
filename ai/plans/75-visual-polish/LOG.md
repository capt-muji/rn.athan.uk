# Ticket 75 ledger

## Ticket 75

Visual polish: mosque SVG mirroring, no scrollbars anywhere, toggle outline to the
card edge. Branch `ticket/75`, worktree `$HOME/athan-gitree/run-75`, anchor
`1b0d5229` (2.0.402).

## Planning (2026-10-14)

The owner is not interviewable this run; her three rulings in the queue row are the
specification, and the run order (2026-10-14) authorises autonomous decisions.

Research findings, all verified against `1b0d5229`:

- The mosque mark is `components/ui/Masjid.tsx`, one `Image` drawing
  `masjid.png` or `masjid-ramadan.png`. `Day.tsx` mounts it on both schedule pages
  beside the date; `Error.tsx` is the other mount site (ticket 80 claims that file;
  the mirror lands inside `Masjid.tsx`, so it never changes).
- The toggle's off-state border is `COLORS.interactive.inactiveBorder` (`#3b3977`),
  one reader in the whole repo (`Toggle.tsx:83`). The cards' edge is
  `rgba(99, 102, 241, 0.15)` (`Settings.tsx` `styles.card:221`; the same literal on
  the Alert, Language, Sound and Reminder cards).
- The scrollables sweep: the three modal scroll views already hide their indicators
  with tests; the shared `Sheet.tsx` wrapper is the one surface missing it; no
  `FlatList` or `SectionList` in app source; the pager draws no indicator; the
  prayer list is a plain `View`; the Qibla sheet renders `BottomSheetView`.
- The library (`@gorhom/bottom-sheet` 5.2.14) forwards
  `showsVerticalScrollIndicator` to the wrapped scroll view
  (`createBottomSheetScrollableComponent.tsx:40,81`), default true.
- Her question answered: the sheet scrollbar predates the RTL work.
  `1a1b4a8c` (1.5.3, 2026-08-28) hid it in the `@expo/ui` sheet era; `59267ed6`
  the same day reverted sheets to the library verbatim from `9e6ba84`, which never
  hid it, and the hiding died there. Rows 58a and 68 never touched the indicator.

Decisions D75.1 to D75.6 sit in `PLAN.md` section 2.1 with their sources. The plan
passed the grill (findings and verdicts below) and `scripts/check-plan.sh` printed
`PLAN OK`.

## Planning (2026-10-14): grill findings

The griller verified the plan against the worktree: all six anchors count 1, the cited
lines and library claims check out, the D75.3 history verifies commit by commit, the
step-2 red-phase prediction holds (the components project renders the library's
published mock, whose `BottomSheetScrollView` injects no default), and every
acceptance criterion traces to a step. Five musts, five shoulds, three nices; every
one applied:

- The bolded `**Weight:**` lines never matched the gate's `^Weight:` grep: unbolded,
  and the gate now prints `PLAN OK`.
- `--selectProjects=app` named a project that does not exist (`jest.config.js` holds
  `unit` and `components`): every jest command re-pointed to `components`, the
  constants suite to `unit`.
- `node_modules` was missing in the worktree and the plan named no action: the lead
  symlinked the main checkout's in (the executor never installs), and section 3
  records the rule.
- The break scripts ran before their step's commit, so `git checkout --` would revert
  the uncommitted change: every break moved after its commit, restoring the committed
  file.
- Step 1's LTR claim sat inside the `ar` describe's `beforeEach` and would fail on a
  correct change: it moved to its own describe with an explicit `setActiveLocale('en')`.
- The sweep overstated Help's test (it pins the height, not the indicator): wording
  set right for the sweep and the test map.
- The pre-flight's ticket-80 guard missed `ColorPicker.tsx`, which that ticket's plan
  claims: added, and the count line now says eleven.
- "byte-identical to the pre-ticket face" was unreadable from an image: the English
  control read now names what to see.
- The foreground `expo run:ios` would die at the harness timeout: it runs in the
  background against a log, polled in 15-second cycles.
- The anchor checks named no working directory: every step now says the worktree root.
- The scroll screenshot now captures during the gesture, with the prop test named as
  the ruling's proof.
- The D59 wait wording aligned between PLAN and the step file; the transcription names
  the running version against the record commit's bump.

The gate printed `PLAN OK` after the fixes.

