Requirements: R1.1, R1.2, R1.3
Weight: 2

Anchor check: `header-subtitle` counts 1 in `components/sheets/parts/Header.tsx`;
`qibla-subtitle` counts 1 in `components/sheets/screens/Qibla.tsx`; `sweep-qibla` and
`sweep-header-boxes` count 1 in `components/__tests__/typographySweep.test.tsx`.

Goal: the sheets' subtitle pull-ups revert to a small positive gap under ar on every sheet,
qibla included; en byte-identical.

Branch: `git checkout -b feat/108-subtitle-pulls uat`

Files: `components/sheets/parts/Header.tsx`, `components/sheets/screens/Qibla.tsx`,
`components/__tests__/typographySweep.test.tsx`.

Red tests, written and run first:

1. In `typographySweep.test.tsx`, the qibla describe: rename its ar case to "carries the 6
   point gap under ar, matching the shared header" and expect `marginTop` 6; the en case keeps
   its 4.
2. The header-boxes describe's ar case: expect `subtitle.marginTop` 6 (was -10); the title's
   `marginBottom` 0 and both `lineHeight` assertions stay. The en case gains
   `expect(title.marginBottom).toBe(SPACING.xxs);`, locking R1.3's named value.
3. Run `npx jest components/__tests__/typographySweep.test.tsx --watchman=false`. Expected
   red: the two rewritten ar cases fail with Received `-10` against Expected `6`. Record the
   exact failing lines in `LOG.md`. Any other case failing is a STOP.

Change contracts:

- `Header.tsx` subtitle style: `marginTop: compactArabic ? SPACING.py : SPACING.xs`. The title
  style keeps `marginBottom: compactArabic ? 0 : SPACING.xxs`. No other key moves.
- The `Header.tsx` comment above the styles is rewritten to name the 6 point gap under Rubik's
  own box and row 108; the 2.11em half-leading sentence dies with the pull it explained.
- `Qibla.tsx` subtitle style: `marginTop: compactArabic ? SPACING.py : SPACING.xs`; the
  comment at the `compactArabic` declaration names the match to the shared header, not the
  pull.
- No other line moves in either file; the en branches are byte-identical.

Green run: `npx jest components/__tests__/typographySweep.test.tsx --watchman=false` then
`yarn validate`. Expected: all suites green, coverage 100 on every measure, the hook's
`Tests:` line recorded in `LOG.md`.

Break script: `bash ai/plans/108-rubik-cascade/scripts/break-108.sh pulls` prints `BREAK OK`:
both margins revert to -10, the whole sweep file runs, and exactly the two rewritten ar cases
go red with everything else green; the files restore from the backup.

Version and commit: the version from the version command (next patch after `uat`'s
`package.json`); message `<VERSION> - feat(sheets): the ar subtitle pull-ups revert to a 6
point gap under Rubik (her row 108 ruling); the qibla subtitle matches`.

Merge: `git checkout uat && git merge --no-ff feat/108-subtitle-pulls -m "<VERSION> - merge
feat/108-subtitle-pulls: the sheets' subtitle gap"`.

Review checklist: read the diff cold. The only value changes are the two -10 to SPACING.py and
the two test expectations; both comments rewritten, none stale; no pixel beyond the ruling.

Done when: the sweep is green, the break script proves both pins, `uat` holds the merge, and
`LOG.md` carries `### Step 01 — done` ending with the session line.
