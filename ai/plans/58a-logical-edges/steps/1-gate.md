**Requirements:** R1.1, R1.2, R4.1, R5.1
Weight: 2

## Anchor check

No source anchor: this step adds files, it changes none. Verify the handover files
exist in the plan folder before copying:

```
ls ai/plans/58a-logical-edges/scripts/handover/
```

Expected output lists exactly: `check-directional-styles.js`,
`directional-styles-allowlist.json`, `directionalStyleGate.test.ts`.

## Goal

The permanent gate lands with the full allowlist: 59 entries, 38 pending (one per file
and snippet a later step converts), 21 permanent. Against unchanged `uat` code the
suite passes, so this step leaves `uat` green while arming the tracker.

## Branch

```
git checkout -b code/58a-1-gate uat
```

## Files

Copied verbatim from the plan folder, no edit of any byte:

- `ai/plans/58a-logical-edges/scripts/handover/check-directional-styles.js` -> `scripts/check-directional-styles.js`
- `ai/plans/58a-logical-edges/scripts/handover/directional-styles-allowlist.json` -> `scripts/directional-styles-allowlist.json`
- `ai/plans/58a-logical-edges/scripts/handover/directionalStyleGate.test.ts` -> `shared/__tests__/directionalStyleGate.test.ts`

## Red tests

The suite is new and passes against unchanged code by design: its allowlisted state is
the committed state. Its power to fail is the red, proven by the break script below
in both directions, and recorded in `LOG.md` with the two failing outputs. A suite that
cannot fail guards nothing, so the break script is mandatory, not optional.

## Change contracts

The three files equal the plan's handover files byte for byte. The scanner exports
`ROOT`, `scanTree`, `applyAllowlist` and prints `DIRECTIONAL STYLES OK` on exit 0. The
suite holds the two tests named in the handover file and nothing else.

## Green run

```
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: `Tests: 2 passed, 2 total`; `DIRECTIONAL STYLES OK`; both lint commands
exit 0.

## Break script

Run `bash ai/plans/58a-logical-edges/scripts/break-1.sh` from the repository root. It
deletes one permanent allowlist entry and expects the suite to fail naming
`components/ui/RamadanDecorations.tsx`, then adds one entry whose snippet matches
nothing and expects the stale test to fail, then restores the allowlist byte for byte
and expects both tests to pass. It ends `ALL ASPECTED: 1`.

## Version and commit

Fetch `origin` under the version lock (`mkdir $HOME/athan-gitree/version.lock`, retry
in a short sleep loop while it exists, `rmdir` after the merge). Run:

```
node -p "const p=require('./package.json').version.split('.');p[2]++;p.join('.')"
```

Expected `2.0.86` when no concurrent ticket took a number; if the printed number
differs, use the printed number. Set it in `app.json`, `package.json` and
`android/app/build.gradle` (`versionName`), all three matching. Commit the three landed
files plus `app.json`, `package.json`, this plan folder's `PLAN.md` and `LOG.md`, and
`ai/plans/README.md` (ticket set to `IN PROGRESS, step 1`).
`android/app/build.gradle` carries the same version, is gitignored and never added;
`shared/__tests__/versionLockstep.test.ts` fails if it differs:

```
<VERSION> - feat(gate): directional-style gate suite, scanner and full allowlist (58a step 1)
```

## Review checklist

- The three files equal the handover files byte for byte: `diff` each pair.
- The scanner's banned patterns match PLAN.md section 4's nine patterns.
- The allowlist holds 59 entries: 38 `pending: step`, 21 permanent.
- No other file changed.

## Merge

```
git checkout uat && git merge --no-ff code/58a-1-gate -m "<VERSION> - merge code/58a-1-gate: directional-style gate lands"
```

## Done when

Checklist box 1 ticked, `LOG.md` entry written with both break outputs, `uat` holds
the merge, and `node scripts/check-directional-styles.js` prints
`DIRECTIONAL STYLES OK` on `uat`.

## Restore list

`scripts/check-directional-styles.js`, `scripts/directional-styles-allowlist.json`,
`shared/__tests__/directionalStyleGate.test.ts`, `app.json`, `package.json`,
`android/app/build.gradle` (version only), plan `PLAN.md` and `LOG.md`,
`ai/plans/README.md`.
