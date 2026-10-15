# LOG — ticket 83, the time-ago badge takes the lettered format

## Ticket 83

## Planning (2026-10-15)

Lane 83 of the multi-lead run (queue Order section, suspension of 2026-10-15).
Anchor: `d9a4408a` 2.0.734, local `uat` carrying `5a3fba84` (row 85's lettered
countdown, 2.0.733). The owner interview is waived: queue row 83's ruling is the
interview record.

Research done, all verified in the lane worktree:

- The old lettered composer read at `194ed701` (2.0.128): `2m`, `1h 30m`, `2h`
  at a whole hour (zero-minute drop), `now` under 60 s, letters from the
  catalogs and digits through the locale digit map (both localisations now
  dead: rows 82 and 85).
- `formatTimeAgo` today returns `H:MM` (row 82); its only reader is
  `hooks/usePrayerAgo.ts:35`.
- `splitSingleColon` has two readers: `components/prayer/Ago.tsx:55` (this
  ticket) and `components/prayer/Time.tsx:58` (the prayer row time, stays).
- The ruled typography's source: `components/countdown/Countdown.tsx` styles
  `gap: { fontSize: 8 }` and `unitLetter` at `Math.round(ty.countdownSize *
  0.55)`, landed by row 85.
- Affected test surfaces: `shared/__tests__/time.test.ts` (formatTimeAgo
  describe), `components/prayer/__tests__/Ago.test.tsx` (whole file),
  `__tests__/app/Screen.test.tsx` (three assertions),
  `hooks/__tests__/usePrayerAgo.test.ts` (mock strings; mocked, cannot go red).
- No e2e flow asserts the badge (grepped `e2e/flows/`).
- The lane runs the real pre-commit hook: `core.hooksPath` `.husky/_`
  (relative), `npx husky` re-created it, `ls .husky/_/h` prints it. Every lane
  commit runs the four gates by hook; no manual regime holds.
- tsc baseline in the lane: exit 0 (the shared node_modules patches hold).

Planner-adjudicated, recorded in PLAN.md 2.1 for the owner's veto: the letter
span's ink is the badge's own ruled weak-glyph strength, `opacity: 0.4`
(rows 79(3)/81's 60 percent reduction; row 85's letter ink is the same 40
percent figure in a fixed-ink context, unusable here because the badge's colour
animates).

Drafted: PLAN.md, steps/1-lettered-ago.md, handed/Ago.test.tsx.txt,
scripts/preflight-83.sh, scripts/break-1.sh, anchors a1 to a8 (all count 1 at
`d9a4408a`).

Resume from: the grill, then the gate, then the READY commit.
