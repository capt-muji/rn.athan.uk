# Step 3 — the circled i glyph and the plain ar note copy

Requirements: R3.1, R3.2, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/05-info-svg.md assets/icons/svg/info.svg`
prints `1`, and the same for `scripts/anchors/06-ar-note-copy.md` against
`shared/i18n/ar.ts`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

The information glyph becomes a proper circled i: one asset, a circle and the letter
i, both `currentColor`, inside the existing square viewBox, so every `Icon.INFO`
caller (the note on both sheets, the Settings What's New row) draws it. The ar iOS
note copy becomes plain localized text: no guillemets, no forward slash, row 64's
wording the base.

## Branch

`git checkout -b code/100-note-glyph lane/100`

## Files

- `assets/icons/svg/info.svg` (replaced)
- `shared/i18n/ar.ts` (changed, one value)
- `shared/__tests__/i18n.test.ts` (changed, new cases only)

## Red tests

In `shared/__tests__/i18n.test.ts`, add a describe `the ar volume note copy`:

```ts
it('carries no guillemet and no forward slash, keeping the row 64 shape', () => {
  const copy = ar['volume.note.ios'];
  expect(copy).not.toContain('\u00AB');
  expect(copy).not.toContain('\u00BB');
  expect(copy).not.toContain('/');
  expect(copy).toContain('الرنين والتنبيهات');
  expect(copy).toContain('تكتمه');
});
```

Importing `ar` the way the file's existing locale imports do (follow its import
block; if the file imports only `en`, add the `ar` import from `@/shared/i18n/ar`).

And a describe `the information glyph asset` in the same file (it reads the asset
bytes, so it lives with the catalog guards):

```ts
it('draws a circle around the i, in currentColor, inside the square viewBox', () => {
  const svg = readFileSync(join(__dirname, '..', '..', 'assets', 'icons', 'svg', 'info.svg'), 'utf8');
  expect(svg).toMatch(/<circle[^>]*stroke="currentColor"/);
  expect(svg).toMatch(/fill="currentColor"/);
  expect(svg).toMatch(/viewBox="5\.7605 5\.76 12\.48 12\.48"/);
});
```

Add the `readFileSync` and `join` imports from `node:fs` and `node:path` if the file
lacks them. Both tests fail against the planned sha. Record the failing names and
lines in `LOG.md`.

## Change contracts

`assets/icons/svg/info.svg`, the whole file:

```svg
<svg width="256" height="256" viewBox="5.7605 5.76 12.48 12.48" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="5.9" stroke="currentColor" stroke-width="1.4"/>
<path d="M12 10.4a.9.9 0 0 0-.9.9v3.2a.9.9 0 0 0 1.8 0v-3.2a.9.9 0 0 0-.9-.9m0-2.1a.95.95 0 1 0 .95.95A.95.95 0 0 0 12 8.3" fill="currentColor"/>
</svg>
```

`shared/i18n/ar.ts`: the `volume.note.ios` value becomes
`'يعمل بصوت الرنين والتنبيهات. الوضع الصامت وأوضاع التركيز تكتمه.'` (D97). No
other value changes. The `volume.note.android` value, every other locale's note and
the whole en catalog stay byte-identical (the lock stays green without re-taking:
the lock hashes the English source, which this step does not touch).

## Green run

`npx jest shared/__tests__/i18n.test.ts components/sheets/parts/__tests__/VolumeNote.test.tsx --watchman=false`
exits 0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
The VolumeNote suite stays green untouched: its `svg:info` testID reads the file
name, which does not change.

## Break script

`bash scripts/breaks/break-03.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp shared/i18n/ar.ts "$TMPDIR/break03-ar.ts"
python3 - <<'EOF'
from pathlib import Path
p = Path('shared/i18n/ar.ts')
s = p.read_text()
old = "'volume.note.ios': 'يعمل بصوت الرنين والتنبيهات. الوضع الصامت وأوضاع التركيز تكتمه.',"
new = "'volume.note.ios': 'يعمل بصوت «الرنين والتنبيهات». مفتاح الرنين/الصامت وأوضاع التركيز تكتمه.',"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest shared/__tests__/i18n.test.ts --watchman=false -t 'ar volume note' >"$TMPDIR/break03.log" 2>&1
status=$?
mv "$TMPDIR/break03-ar.ts" shared/i18n/ar.ts
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the guillemet assertion. The script restores the file
and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - feat(note): a circled i information glyph and plain ar iOS copy (D97)`

## Review checklist

- The SVG's circle and i are both `currentColor`; nothing hardcodes a colour.
- The viewBox is unchanged, so the glyph's box at every caller is unchanged.
- The ar diff is exactly one value.
- No lock file changed.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-note-glyph -m "<VERSION> - merge code/100-note-glyph: the note's circled i and plain ar copy"`

## Restore list

`git checkout -- assets/icons/svg/info.svg shared/i18n/ar.ts shared/__tests__/i18n.test.ts` and delete `scripts/breaks/break-03.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
