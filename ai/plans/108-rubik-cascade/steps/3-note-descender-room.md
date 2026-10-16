Requirements: R3.1, R3.2
Weight: 2

Anchor check: `note-text` counts 1 in `components/sheets/parts/VolumeNote.tsx`;
`script-line-height` counts 1 in `shared/typography.ts`; `volume-note-style` counts 1 in
`components/sheets/parts/__tests__/VolumeNote.test.tsx`.

Goal: the volume footnote's Arabic descenders render whole under Rubik, on the measured script
line box; en byte-identical.

Branch: `git checkout -b feat/108-note-box uat`

Files: `components/sheets/parts/VolumeNote.tsx`,
`components/sheets/parts/__tests__/VolumeNote.test.tsx`.

Red tests, written and run first:

1. In `VolumeNote.test.tsx`, add an ar-side case to the style describe, on the sweep's
   `isolateModulesAsync` pattern: set `process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';` above the
   imports as `typographySweep.test.tsx:17` does, then reset modules, set the locale ar inside
   the isolate, require the part and the testing library fresh inside it (the sweep's
   `noteFootMarginUnder` is the exact shape to copy), render it, read the copy with
   `screen.getByText(/الرنين/)`, flatten its style, and expect `lineHeight` 21; restore the
   locale en in a finally block. Case name: "takes the 21 point script line box under ar, so
   the measured descender ink renders".
2. The existing en case "centres every line in the sheet-subtitle ink at the detail size"
   gains `expect(text.lineHeight).toBeUndefined();` - it passes today and locks en.
3. Run `npx jest components/sheets/parts/__tests__/VolumeNote.test.tsx --watchman=false`.
   Expected red: the new ar case fails with Received undefined against Expected 21. Record the
   exact failing line in `LOG.md`. Any other case failing is a STOP.

Change contracts:

- `VolumeNote.tsx` text style gains one key after `fontSize`:
  `lineHeight: ty.scriptLineHeight?.(TEXT.sizeDetail),` with a one-line comment above it
  naming the why: Rubik's win ink descends past its own line box at this size, and the script
  box gives it room. The comment at the `compactArabic` declaration drops the word "pair"
  (its sibling half died with step 2): it names the note copy clearing the list above it.
- No other line moves; the en style carries no lineHeight key (the optional chain leaves it
  undefined, which RN treats as absent).

Green run: `npx jest components/sheets/parts/__tests__/VolumeNote.test.tsx --watchman=false`
then `yarn validate`. Expected: all green, coverage 100 on every measure, the hook's `Tests:`
line recorded in `LOG.md`.

Break script: `bash ai/plans/108-rubik-cascade/scripts/break-108.sh note` prints `BREAK OK`
(the lineHeight line deletes, the ar case goes red, the file restores).

Version and commit: the version from the version command; message `<VERSION> - feat(sheets):
the volume note takes the ar script line box, its measured Rubik descenders rendering whole
(her row 108 ruling)`.

Merge: `git checkout uat && git merge --no-ff feat/108-note-box -m "<VERSION> - merge
feat/108-note-box: the note's script line box"`.

Review checklist: read the diff cold. One style key, one comment, one new test, one guard
assertion; nothing else moves.

Done when: the suite is green, the break script proves the pin, `uat` holds the merge, and
`LOG.md` carries `### Step 03 — done` ending with the session line.
