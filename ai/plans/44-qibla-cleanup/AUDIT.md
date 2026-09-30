# Audit: Session 44. Delete the qibla, all of it

| Field | Value |
| --- | --- |
| Audited | 2026-09-30 |
| Range | `78fe0a6a..608475dd` (versions 1.29.167 to 1.29.172) |
| Worktree | `~/athan-device-sweep/worktrees/audit-44` at `608475dd`, `node_modules` symlinked, removed at the end |
| Verdict | **PASS** |

## What was checked, and what proves it

### 1. The range holds only this session's work

`git log --oneline origin/uat-2..uat-2` lists ten commits: three planning commits (1.29.167 to
1.29.169), two step commits (1.29.170, 1.29.171), one executed docs commit (1.29.172), and their four
merges. Every version is in sequence with no gap and no repeat. Nothing else is in the range.

Each planning and audit commit in the range was reread, which is what `AUDITOR-BRIEF.md` section 4's
push rule requires.

### 2. The plan against the commits

| The plan asked for | The commit did it |
| --- | --- |
| 32 files deleted | `git show --diff-filter=D --name-only 15f735cf` counts exactly 32 |
| `components/qibla/` and `shared/__tests__/fixtures/` gone entirely | Both absent; `ls` reports no such directory |
| 14 files edited, no others | `git show --stat` lists 50 paths: 32 deletions, 14 edits, plus `app.json` and `package.json` |
| Two files copied byte for byte | `diff` against `files/Settings.tsx.txt` and `files/Settings.test.tsx.txt` prints nothing |
| The guard copied byte for byte | `diff` against `files/qiblaRemoved.test.ts.txt` prints nothing |
| `adhan` kept | `package.json:38` still declares `"adhan": "4.4.6"` |
| `expo-location` and `fflate` gone | Neither appears in `package.json`; `yarn.lock` lost 12 lines |
| Six named tests removed from `Settings.test.tsx`, ten kept | 10 `it(` blocks remain, and all ten are the non-qibla ones |
| `perfMark` still used in `stores/ui.ts` | Two calls remain, for the sound and settings sheets |
| Only the one `infoPlist` key removed | `ios.entitlements` unchanged, `NSUserNotificationsUsageDescription` unchanged |

Every deletion is a pure removal: the diff of each surviving edited file shows only the qibla lines
going, with no collateral change to a neighbouring statement.

### 3. The tests still guard

Both break scripts were rerun from the audit worktree's root, after confirming neither holds an
absolute repository path (`grep -n /Users/muji/repos/rn.athan.uk` on each prints nothing):

- Step 1: `caught 4 of 4`, `ALL AS EXPECTED: 1`.
- Step 2: `caught 5 of 5`, `ALL AS EXPECTED: 1`.

**The red check was rerun independently, and it found something worth recording.** The plan's claim is
that the guard catches what nothing else does, and a first attempt appeared to refute it: planting
`shared/qiblaSneak.ts` with an EXPORT fails `unusedExports.test.ts` whether the guard is present or not,
because an unreachable export is exactly what that suite reports. So for an exported artefact the guard
is a second line of defence rather than the only one.

The case that separates them was then constructed: a NON-exported artefact (a comment in
`stores/ui.ts`) plus a restored binary fixture (`shared/__tests__/fixtures/London.mvt.gz`), neither of
which creates an export for `unusedExports.test.ts` to see. Measured:

| Tree | Guard removed | Guard present |
| --- | --- | --- |
| Comment plus binary fixture planted | `4354 passed`, suite GREEN | `FAIL shared/__tests__/qiblaRemoved.test.ts` |

So the guard is the only thing in the repository that catches a comment or a committed binary, which is
precisely the reintroduction route a session copying a neighbour would take. The plan's claim holds, and
is now stated more precisely than the plan stated it.

### 4. The whole suite

`npx jest --watchman=false --coverage` in the audit worktree:

```
Statements   : 100% ( 4401/4401 )
Branches     : 100% ( 1977/1977 )
Functions    : 100% ( 912/912 )
Lines        : 100% ( 3961/3961 )
Test Suites: 178 passed, 178 total
Tests:       2 skipped, 4786 passed, 4788 total
```

`npx tsc --noEmit` exits 0. `npx biome check . --error-on-warnings` exits 0 over 359 files. The two
skips are `audioMatrix.test.ts`'s prebuild-gated assertions, which no worktree can run; the main
checkout reports `4788 passed, 4788 total` with no skips, and that is the number in the records.

### 5. The brief's own judgement criteria

`BRIEF.md` sets four. All four hold:

- `grep -rniE 'qibla|kaaba|pmtiles|mvt|tilecache|greatcircle'` across the eight shipped directories
  returns nothing but the guard itself, which is the one file allowed to name them.
- `python3 scripts/find-unused-exports.py` reports exactly the five pre-existing allow-listed entries:
  `ErrorBoundary` and the four `MAX_WHATS_NEW_*` limits. No entry was added to the allow list.
- `yarn validate` passes at 100% on all four measures, and the suite count fell by the qibla suites
  (192 to 178, with one added).
- No plan folder and no `LOG.md` was deleted. `ai/plans/37-qibla-compass/`,
  `ai/plans/40-heading-rearchitecture/`, `ai/plans/41-qibla-map/` and `ai/plans/43-qibla-haptic/` are
  all intact, which the brief requires because they record the four wrong diagnoses.

### 6. Device evidence

None, and the plan says so in section 7 with its reasoning: this session changes no behaviour a phone
can show beyond a row leaving Settings, and no clock was touched, so no alarm could fire. `adb devices`
listed no device throughout. Nothing in the records claims a device reading, so there is no unbacked
claim to check.

The one thing NOT proven is named in the records rather than glossed: that a build compiles and launches
with `expo-location` gone from the native tree. Session 45 builds first and finds it immediately.

### 7. The owner's rules

| Rule | Check |
| --- | --- |
| No visual change beyond the authorised one | No `COLORS`, `SPACING`, `SIZE`, `RADIUS` or `fontSize` value changed in any surviving file; the only style lines in the diff are deletions from removed files. The Sound card holds one row where it held two, which is the cleanup the owner asked for |
| No substituted prayer time | No file under `mocks/`, and none of `shared/time.ts`, `shared/prayer.ts`, `stores/notifications.ts`, `stores/sync.ts` or `stores/schedule.ts` is in the diff |
| No hand-edited release file | No `releases.json` in the diff |
| `uat` and EAS untouched | No `eas.json` change; `uat` has no commit from this session |
| No API key | No high-entropy key assignment anywhere in the range |
| No ignore comment | No `istanbul ignore`, `c8 ignore` or `v8 ignore` added |
| No skipped hook | Every commit ran the pre-commit hook; each log carries the `Tests:` line and four `100%` lines |
| Versions in lockstep | `app.json` and `package.json` both read 1.29.172 |

### 8. The records

The `AUDIT-FINDINGS.md` text was checked claim by claim against the repository. Three numbers were
verified rather than taken on trust: 32 files deleted (`--diff-filter=D` counts 32), 3939 lines deleted
(`--shortstat` reports `38 insertions(+), 3939 deletions(-)`), and the five allow-listed exports. The
nested-copy incident is recorded with the versions that caused it, both of which were read from the
installed tree rather than assumed.

## Findings

**Three, all recorded during execution and all already fixed by the session that found them. None is a
defect in what shipped.**

1. **The guard could not see a restored binary fixture.** Found by rereading the plan cold before the
   executor ran it: the suite collected only `.ts` and `.tsx` files, so the `mvt` entry in its filename
   list had nothing to match, while the plan's own prose claimed it caught the two `.mvt.gz` fixtures.
   Fixed in 1.29.168 by walking every file for the filename check and keeping the content check to
   source. The audit re-proved it: restoring `London.mvt.gz` is CAUGHT.
2. **Step 1's fifth break survived and moved to step 2.** Putting the qibla item back into
   `shared/whatsNew.ts` does not fail `whatsNew.test.ts`, because an item stamped for a release that is
   not the installed one is a valid archive entry. The break belongs with the guard that does catch it.
   Both step files now say so, so the next reader does not re-derive it.
3. **The plan's predicted test count was two low.** It said 4784 from a scratch worktree, where
   `audioMatrix.test.ts` skips two prebuild-gated assertions; the main checkout runs them and reports
   4786. Corrected in both step files and `PLAN.md`, with the reason recorded.

**One further finding, from the audit itself, which sharpened a claim rather than corrected code:** the
plan said the guard catches what nothing else does. For an EXPORTED artefact that is not quite true,
since `unusedExports.test.ts` catches it too. The guard is the only catcher for a non-exported artefact
or a committed binary, which is the real reintroduction route. Section 3 above records the measurement
both ways. No code changed, because the guard is doing exactly what it should; the plan's wording was
imprecise, not its design.

## Verdict: PASS

Nothing needed fixing. The session did what the plan specified and nothing else, the two carried files
are byte for byte identical to the plan's, both break scripts still catch every break from a clean
worktree, the suite is green at 100% on all four measures, every one of the brief's four judgement
criteria holds, and no owner rule is bent.

Row 44 is set to DONE and `uat-2` is pushed.
