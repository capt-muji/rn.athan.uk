**Requirements:** R2.1, R5.1
Weight: 2

## Anchor check

Each anchor counts exactly 1 in its file: `overlay-catcher-inline.txt` and
`overlay-container-styles.txt` in `components/overlay/Overlay.tsx`,
`infobox-inline.txt` and `infobox-styles.txt` in
`components/overlay/OverlayInfoBox.tsx`, `veil-styles.txt` in
`components/overlay/VeilBackdrop.tsx`. A count other than 1 is STOP.

## Goal

The overlay family's parent-relative edges convert: 10 source lines change style keys.
The window-space lines stay physical by design and keep their permanent allowlist
entries: `Overlay.tsx:111` (`left: region.left`, pageX-fed) and
`VeilBackdrop.tsx:40` (computed window centering), plus everything in
`catcherGeometry.ts`, which this step does not touch.

## Branch

```
git checkout -b code/58a-3-overlay uat
```

## Files

- `components/overlay/Overlay.tsx` (anchors: overlay-catcher-inline, overlay-container-styles)
- `components/overlay/OverlayInfoBox.tsx` (anchors: infobox-inline, infobox-styles)
- `components/overlay/VeilBackdrop.tsx` (anchor: veil-styles)
- `scripts/directional-styles-allowlist.json`
- `app.json`, `package.json`, `android/app/build.gradle` (version only)

## Red test

Delete the step-3 entries (the step-2 filter command with `pending: step 3`, followed
by `npx biome format --write scripts/directional-styles-allowlist.json`), run the gate
suite. It fails the remainder test naming exactly 10 lines:
`components/overlay/Overlay.tsx:122`, `:123`,
`components/overlay/OverlayInfoBox.tsx:68`, `:69`, `:94`, `:95`,
`components/overlay/VeilBackdrop.tsx:62`, `:63`, `:69`, `:70`. A different count or
file list, or any `catcherGeometry.ts` line in the list, is STOP.

## Change contracts

Apply the conversion map to the stylesheet pairs (`left: 0, right: 0,` become
`start: 0, end: 0,`) in `Overlay.tsx` (container styles), `OverlayInfoBox.tsx` (both
inline ternary branches at 68-69 change `left: 0,` to `start: 0,`; the stylesheet pair
at 94-95 follows) and `VeilBackdrop.tsx` (container and gradient pairs). The inline
catcher application at `Overlay.tsx:111` and the glow line at `VeilBackdrop.tsx:40`
change by nothing. The allowlist keeps the same 46 remaining entries, no entry's
content changed, formatted by the step's biome format command.

## Green run

```
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
npx jest components/overlay --watchman=false --selectProjects=components
npx jest components/overlay --watchman=false --selectProjects=unit
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: gate 2 passed; the overlay suites (`Overlay.test.tsx`, `VeilBackdrop.test.tsx`
under components; `catcherGeometry.test.ts`, `overlayContent.test.ts`,
`overlayPlacement.test.ts` under unit) pass with zero edits; CLI prints
`DIRECTIONAL STYLES OK`.

## Break script

Run `bash ai/plans/58a-logical-edges/scripts/break-3.sh`. It turns the
`OverlayInfoBox.tsx` stylesheet's converted `end: 0,` back into `right: 0,`, expects
the gate to fail naming `components/overlay/OverlayInfoBox.tsx:95`, reverses the sed,
and expects both tests to pass. It ends `ALL ASPECTED: 1`.

## Version and commit

Version command under the lock. Expected `2.0.88`. Commit the files above plus plan
files and queue (`IN PROGRESS, step 3`):

```
<VERSION> - refactor(rtl): overlay family edges to logical keys (58a step 3)
```

## Review checklist

- The diff holds no hunk at `Overlay.tsx:111` or `VeilBackdrop.tsx:40`.
- `catcherGeometry.ts` is absent from the diff.
- No value changed; the allowlist holds 46 entries, none pending step 3.

## Merge

```
git checkout uat && git merge --no-ff code/58a-3-overlay -m "<VERSION> - merge code/58a-3-overlay: overlay edges logical"
```

## Done when

Box 3 ticked, `LOG.md` entry written, `uat` holds the merge.

## Restore list

The three source files, the allowlist, the version trio, plan files, queue.
