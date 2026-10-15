# Step 3: the letter gap dies

Requirements: R3.1
Weight: 2

Anchor check: `countdown-gap` and `countdown-gap-style` count exactly 1.

## Goal

Each countdown letter sits immediately after its digits; the gap span and its style are gone.

## Branch

`git checkout -b feat/countdown-letter-gap uat` (fetch `origin` first).

## Files

- `components/countdown/Countdown.tsx`
- `components/countdown/__tests__/Countdown.test.tsx`

## Red tests

Rewrite the gap-node case at `Countdown.test.tsx:176-188`: `renders no gap node between digits
and letters` - find every node with `children === ' '` and `fontSize === 8` and expect zero,
then assert each group's child sequence is the digits node immediately followed by the letter
node. Run: red today (two gap nodes per two-group display). Record the failing name and first
line. Any other test failing is a STOP.

## Change contracts

In `components/countdown/Countdown.tsx`:

- Delete the gap span line (`<Text style={styles.gap}> </Text>`) from the group render.
- Delete `styles.gap` (the dead style with no reader).
- Nothing else here: the letter style, the group margins (`marginHorizontal: 6`), the digits
  span and every other value untouched.

In `components/countdown/__tests__/Countdown.test.tsx`:

- Rewrite the suite's sixteen `getByText('N x')` assertions (lines 46, 47, 60, 61, 76, 87, 99,
  100, 111, 123, 134, 148, 158, 210, 211, 219) to `'Nx'`: RNTL joins nested text with no
  separator, and the gap span's space is the only separator today, so the joined text tightens
  with the span gone. The `rowLabel` pins (`'2h 29m'`) are untouched (their spaces are literal
  string content).

## Green run

1. `npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false` - the
   rewritten case green, the letter size/ink pins (151-174) and the ar LTR pin (52-67) green
   with their sixteen display strings re-written per the contract.
2. `yarn validate`.

## Break script

`bash <TMPDIR-copy>/scripts/break-106.sh gap` from the repository root. It re-inserts the gap
span line only, runs the rewritten case, expects it red (the predicate throws on the re-inserted
span, whose `styles.gap` no longer exists - the suite exits red either way), then restores from
the backup copy. Output ends `BREAK OK`.

## Version and commit

The next patch after `uat`'s `package.json` (bump `app.json` first). Commit message:
`<VERSION> - feat(countdown): each letter sits tight against its digits - the 2pt gap span deleted (her zero rule)`.

## Review checklist

- Two deletions in one file, one rewritten test. Nothing else.
- No letter or digit style value changed.

## Merge

`git checkout uat && git merge --no-ff feat/countdown-letter-gap -m "<VERSION> - merge feat/countdown-letter-gap: tight letters"`.
Never push.

## Done when

Red recorded, suites green, `yarn validate` green, merged, hook lines pasted, the step entry
ends with its `session:` line.
