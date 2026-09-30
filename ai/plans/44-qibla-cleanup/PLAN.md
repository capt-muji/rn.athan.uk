# Plan: Session 44. Delete the qibla, all of it

| Field | Value |
| --- | --- |
| Brief | `ai/plans/44-qibla-cleanup/BRIEF.md` |
| Planned at | `4d734cfc` (version 1.29.166), 2026-09-30 |
| Planned by | Planning session on 2026-09-30 |
| Needs first | nothing (row 43 is CANCELLED) |
| Steps | 2, each one branch, one commit, one version |
| Device | none (see section 7) |
| Owner decisions still needed | None (all four were taken while planning; see section 2.1) |

## 1. Goal

Four sessions built a qibla screen and a device proof rejected every one of them, so the code is
removed rather than fixed. When this plan is DONE, no shipped directory holds a qibla artefact, the two
dependencies the feature added are uninstalled, the iOS location permission string is gone, and a test
keeps it that way. The owner would notice one thing only: the Qibla row has left Settings. Nothing else
about the app changes, and no feature ships.

The owner's rules that apply:

🐋  "What I need you to do is create a follow-up session... where we will completely, completely wipe,
clean up anything we've done regarding a compass, regarding maps, regarding absolutely everything...
The first one has to be a cleanup, a complete deep cleanup."

🐋  "I feel like we've introduced so much junk with this that needs to be cleaned up."

🐋  "You can forget about the previous research that we've done because I think we've come to the
conclusion that all the previous research is incorrect."

And the standing rule this row must not break, because the records are the only thing four rejected
sessions left behind: **no plan folder and no `LOG.md` is deleted.** Only their status rows change.

## 2. Decisions

### 2.1 Taken

The owner was unavailable and asked for assumptions rather than questions (2026-09-30: "Don't ask many
questions, make assumptions. I'm unavailable for questions"). All four of `BRIEF.md`'s open decisions
are therefore taken by the planning session, each with its reason, and each is reversible by session 45.

1. **The Settings row is DELETED, and session 45 re-adds it.** Decided by the planner, because the
   alternative ships a button that opens an empty sheet to anyone installing a build between the two
   sessions, and `BRIEF.md` itself calls deleting it "cleaner". The owner keeps the row as a CONCEPT
   (🐋  "I like having Qibla there, the Qibla option"), and a concept is honoured by session 45
   rebuilding it, not by leaving a dead control on screen. Recorded here and in `AUDIT.md`.
2. **`fflate` IS uninstalled, and so is `expo-location`.** Decided by the planner. `BRIEF.md` asks only
   about `fflate`; `expo-location` is the same question and is included because nothing reads location
   once `device/qibla.ts` is gone. Measured this session: no package in `node_modules` declares either
   as a dependency or a peer dependency, so nothing else breaks. `adhan` STAYS, as `BRIEF.md` requires:
   it computes the prayer times.
3. **`NSLocationWhenInUseUsageDescription` comes OUT of `app.json`.** Decided by the planner: a
   permission string the binary cannot use is a promise the app does not keep, and the App Store shows
   it to users. Session 45 puts it back when it needs location. Read from source this session, so the
   cost is known rather than guessed: `expo-location`'s config plugin
   (`node_modules/expo-location/plugin/build/withLocation.js`) calls `createPermissionsPlugin`, whose
   `applyPermissions` writes a DEFAULT string for the key whenever the plugin runs and the key is
   absent. The plugin is not in this app's `plugins` array and the package is being removed, so no
   default is written back. Android needs no change: the two `ACCESS_*_LOCATION` permissions come from
   `expo-location`'s own `android/src/main/AndroidManifest.xml` and leave with the package.
4. **The tile fixtures GO**, both `London.mvt.gz` and `Makkah.mvt.gz` (about 78 KB together, measured,
   not the 200 KB `BRIEF.md` estimates). Decided by the planner: only the deleted suites read them, and
   `BRIEF.md`'s judgement criterion forbids the word `mvt` in a shipped directory, which a kept fixture
   would violate by its filename alone.

Two further decisions this plan takes, which `BRIEF.md` does not list:

5. **The `COMPASS` icon, its SVG and the What's New item go too.** Decided by the planner. `Icon.COMPASS`
   and `assets/icons/svg/compass.svg` were added by session 37 for this feature and have no other
   consumer (verified with a repository-wide search), and the parked "Qibla compass" What's New item
   advertises a feature that no longer exists. `BRIEF.md` does not name them because its inventory is of
   qibla-named files; these are qibla artefacts under other names, and the brief's own judgement
   criterion (`grep` for `kaaba` returns nothing) fails without the What's New change.
6. **A new invariant suite, `shared/__tests__/qiblaRemoved.test.ts`, is the step's deliverable.** Decided
   by the planner. A deletion has no behaviour of its own to test, so without this the cleanup is
   unguarded and the next session reintroduces an artefact by copying a neighbour. This converts
   `BRIEF.md`'s manual `grep` judgement into a test the suite runs on every commit forever.

### 2.2 The executor must not decide

1. **Any anchor count other than 1.** STOP. Ask: "The anchor for `<file>` counts `<n>`, not 1. The plan
   is stale against `uat-2`. Should it be replanned?"
2. **A test fails that this plan does not expect.** STOP. Ask: "`<test name>` failed and the plan does
   not predict it. The failure line is `<line>`. What should it be?"
3. **A break prints `BREAK NOT APPLIED`.** STOP. Ask: "Break `<label>` did not apply, so it tests
   nothing. The plan's substitution does not match the file. Should it be replanned?"
4. **The suite totals differ from section 6's numbers by more than the step's own change.** STOP. Ask:
   "The suite reports `<n>` suites and `<m>` tests; the plan predicts `<a>` and `<b>`. What should it be?"
5. **`yarn remove` changes anything in `node_modules/expo-widgets/`.** STOP. Ask: "The install moved
   `expo-widgets` or its nested `@expo/ui`. `widgetRuntimeLoads.test.ts` reports `<result>`. What should
   it be?" This is `ai/AGENTS.md`'s nested-copy trap and it has fired on an unrelated `yarn add` before.
6. **A reviewer finding this plan's section 10 does not answer, and which does not meet all three
   conditions in `EXECUTOR-BRIEF.md` section 4, item 8.** STOP and give the finding in plain words.
7. **Anything touching a prayer time, a release file, `uat`, EAS, or a visual other than the Qibla row's
   removal**, which is the one visual change the owner's cleanup instruction authorises. STOP.
8. **Anything the plan does not say.** STOP. Ask: "The plan does not say `<X>`. What should it be?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-44.sh` and run `bash $TMPDIR/preflight-44.sh <k>`, where `<k>` is the first
step in section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/bin/bash
# Pre-flight for session 44. Usage: bash $TMPDIR/preflight-44.sh <step>
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
FOLDER=$REPO/ai/plans/44-qibla-cleanup
fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }

cd "$REPO" || fail "cannot enter $REPO"
[ "$(pwd -P)" = "$REPO" ] || fail "not in $REPO"
[ "$(git branch --show-current)" = "uat-2" ] || fail "not on uat-2"

# Only the plan's own files may be dirty.
DIRTY=$(git status --porcelain | grep -vE '^( M|M | M|\?\?) (ai/plans/README\.md|ai/plans/44-qibla-cleanup/(PLAN|LOG)\.md)$' || true)
[ -z "$DIRTY" ] || fail "tree holds more than the plan files:
$DIRTY"

git fetch -q origin uat-2 || fail "git fetch failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is behind origin/uat-2; fast-forward it first"

VERSION=$(node -p "require('$REPO/package.json').version")
echo "package.json version: $VERSION"

# Needs first: nothing. Row 43 is CANCELLED, which blocks nothing.
grep -q '^| 43 .*CANCELLED' ai/plans/README.md || fail "row 43 is not CANCELLED in ai/plans/README.md"

# Anchors for the step about to run.
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2")
  [ "$n" = "1" ] || fail "anchor $1 counts $n in $2, expected 1"
  echo "anchor ok: $1"
}

if [ "$STEP" -le 1 ]; then
  count "$FOLDER/scripts/anchors/1-ui-atom.txt"        stores/ui.ts
  count "$FOLDER/scripts/anchors/1-ui-helpers.txt"     stores/ui.ts
  count "$FOLDER/scripts/anchors/1-sheets-index.txt"   components/sheets/index.ts
  count "$FOLDER/scripts/anchors/1-screens-index.txt"  components/sheets/screens/index.ts
  count "$FOLDER/scripts/anchors/1-layout-import.txt"  app/_layout.tsx
  count "$FOLDER/scripts/anchors/1-layout-render.txt"  app/_layout.tsx
  count "$FOLDER/scripts/anchors/2-settings-import.txt" components/sheets/screens/Settings.tsx
  count "$FOLDER/scripts/anchors/2-settings-alert.txt"  components/sheets/screens/Settings.tsx
  count "$FOLDER/scripts/anchors/2-settings-handler.txt" components/sheets/screens/Settings.tsx
  count "$FOLDER/scripts/anchors/2-settings-row.txt"    components/sheets/screens/Settings.tsx
  count "$FOLDER/scripts/anchors/2-icon-enum.txt"       shared/types.ts
  count "$FOLDER/scripts/anchors/2-icon-import.txt"     assets/icons/svg/index.ts
  count "$FOLDER/scripts/anchors/2-icon-map.txt"        assets/icons/svg/index.ts
  count "$FOLDER/scripts/anchors/2-whatsnew-item.txt"   shared/whatsNew.ts
  count "$FOLDER/scripts/anchors/3-package-location.txt" package.json
  count "$FOLDER/scripts/anchors/3-package-fflate.txt"   package.json
  count "$FOLDER/scripts/anchors/3-jest-location.txt"    jest.config.js
  count "$FOLDER/scripts/anchors/3-appjson-permission.txt" app.json
fi

# Step 2 adds one file and edits none, so it has no anchors. Its own part 0 checks step 1 landed.
if [ "$STEP" -le 2 ]; then
  [ -f "$FOLDER/files/qiblaRemoved.test.ts.txt" ] || fail "the carried invariant suite is missing"
  echo "carried file ok: files/qiblaRemoved.test.ts.txt"
fi

# Tools.
python3 --version > /dev/null 2>&1 || fail "python3 missing"
node --version > /dev/null 2>&1 || fail "node missing"
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest missing (after 00:15 the nightly job may have cleared it)"

echo "PREFLIGHT OK"
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

Files DELETED entirely (each was written by sessions 37, 40, 41 or 43 for this feature and has no other
consumer; every one verified with `codegraph_explore` this session):

| File | What it does |
| --- | --- |
| `components/qibla/QiblaMap.tsx` + `__tests__/QiblaMap.test.tsx` | Draws the streets and the qibla ray as SVG |
| `components/qibla/mapProjection.ts` + `__tests__/mapProjection.test.ts` | Ground positions to canvas points |
| `components/sheets/screens/Qibla.tsx` + `__tests__/Qibla.test.tsx` | The Qibla sheet |
| `hooks/useQiblaMap.ts` + `hooks/__tests__/useQiblaMap.test.ts` | The screen's whole state |
| `shared/qibla.ts` + `__tests__/qibla.test.ts` | `KAABA`, `bearingTo`, `qiblaBearing`, `normaliseHeading`, `shortestDelta`, `Position` |
| `shared/qiblaStreet.ts` + `__tests__/qiblaStreet.test.ts` | Finds and ranks nearby streets |
| `shared/qiblaSentence.ts` + `__tests__/qiblaSentence.test.ts` | The turn-from-a-street sentence |
| `shared/tileGeometry.ts` + `__tests__/tileGeometry.test.ts` | Tile addresses and ground distance |
| `shared/vectorTile.ts` + `__tests__/vectorTile.test.ts` | MVT protobuf decoder |
| `shared/tileCache.ts` + `__tests__/tileCache.test.ts` | The 25 MB LRU tile cache |
| `shared/pmtiles.ts` + `__tests__/pmtiles.test.ts` + `__tests__/pmtilesLive.test.ts` | PMTiles v3 reader |
| `shared/__tests__/realTile.test.ts` | Reads the two committed fixtures |
| `shared/__tests__/fixtures/London.mvt.gz`, `Makkah.mvt.gz` | 78 KB of committed tile bytes |
| `device/qibla.ts` + `__tests__/qibla.test.ts` | The location permission and position boundary |
| `device/tiles.ts` + `__tests__/tiles.test.ts` | Fetches and gunzips tiles |
| `shared/__mocks__/expo-location.ts` | The location mock |
| `assets/icons/svg/compass.svg` | The compass glyph |

Files EDITED, each with its anchor saved in full under `scripts/anchors/`:

| File | The change |
| --- | --- |
| `stores/ui.ts` | Remove `qiblaSheetModalAtom`, `showQiblaSheet`, `setQiblaSheetModal` |
| `components/sheets/index.ts` | Drop `Qibla` from the re-export and delete the `BottomSheetQibla` line |
| `components/sheets/screens/index.ts` | Drop the `Qibla` re-export |
| `app/_layout.tsx` | Drop `BottomSheetQibla` from the import and from the render |
| `components/sheets/screens/Settings.tsx` | Remove the row, its handler, its `Alert` helper, the `@/device/qibla` import, `showQiblaSheet`, and the now-unused `Alert` import |
| `components/sheets/screens/__tests__/Settings.test.tsx` | Remove seven qibla tests and their scaffolding |
| `shared/types.ts` | Remove `COMPASS` from the `Icon` enum |
| `assets/icons/svg/index.ts` | Remove the `CompassIcon` import and its map entry |
| `shared/whatsNew.ts` | Remove the parked "Qibla compass" item |
| `jest.config.js` | Remove the `expo-location` module mapping |
| `app.json` | Remove `NSLocationWhenInUseUsageDescription` |
| `package.json` | Remove `expo-location` and `fflate` |
| `README.md` | The "Qibla direction finder" line under Upcoming Improvements stays (it is still upcoming, as row 45) |
| `e2e/device-atlas-oneplus3t.md` | Remove the Qibla row's tap coordinate, which now addresses nothing |

### How the pieces interact

Nothing here is asynchronous and nothing touches notifications, prayer times or the schedule, so there
is no concurrency table to write: the feature is a leaf. `app/_layout.tsx` mounts `BottomSheetQibla`
from launch, Settings presents it through `showQiblaSheet`, and the sheet reads a position exactly once
per presentation. Removing the mount point removes the only path in.

### Existing tests that cover this code

Every suite in the delete table above tests only deleted code. The one suite that tests SURVIVING code
and must be edited rather than deleted is
`components/sheets/screens/__tests__/Settings.test.tsx`: seven of its tests drive the qibla row
(`opens the qibla sheet when the permission is already granted`, `asks for the permission on the tap,
then opens the sheet once it is granted`, `opens nothing when the permission is refused`, `offers the
route to Settings when the refusal is permanent`, `offers Settings once asking again cannot work`,
`does not offer Settings while asking again could still work`, `asks again on the next tap after a
refusal`). Its other tests cover the athan row, the What's New and Help buttons, the display toggles
and the decorations season, and every one of those MUST still pass unchanged.

Two suites judge the tree itself and will move on their own:
- `shared/__tests__/unusedExports.test.ts` pins the five allow-listed unreachable exports. Measured in
  the spike: after the deletion it still reports exactly those five, so its allow list needs no change.
- `shared/__tests__/whatsNew.test.ts` pins the parked widgets item by name and asserts the archive holds
  between 1 and 20 items. Removing the qibla item leaves the archive valid and that suite unchanged.

### Why the obvious simple fix is wrong

The obvious cleanup is `git revert` of the qibla merges. It does not work here: the feature landed
across four sessions and dozens of merges from 1.29.96 to 1.29.158, interleaved with unrelated work
(the Help modal, the dependency sweeps, the day-roll guard), and `shared/types.ts`,
`assets/icons/svg/index.ts` and `stores/ui.ts` each carry non-qibla changes made in the same commits.
Reverting would undo those too. The deletion is done forwards, by file.

## 5. Design

**The invariant, as one sentence a test can check:** no file under `api/`, `app/`, `components/`,
`device/`, `hooks/`, `shared/`, `stores/` or `widgets/` mentions the qibla feature in its CONTENT or in
its FILENAME, except the one suite whose job is to forbid it.

The suite that checks it is `shared/__tests__/qiblaRemoved.test.ts`, and it is given verbatim in step 4
because every term in it matters. Three properties were proven in the scratch worktree:

- **It must not match itself.** The first draft failed on its own source, because a suite listing
  forbidden words contains them. The words are therefore built from fragments (`'qib' + 'la'`) and the
  file excludes itself by path.
- **Content and filename need different word lists.** `mvt` is safe to forbid in a FILENAME (it catches
  the two binary fixtures, which a content search of `.ts` files never reads) and unsafe to forbid in
  CONTENT, where it would match ordinary prose. The two lists are separate for that reason.
- **The search's own coverage must be pinned.** Break C in the spike widened the self-exclusion from one
  file to every test file and the suite still passed, which means the guard could be hollowed out
  silently. A second test now asserts the search reads every shipped source file but one.

**Alternatives rejected:**

| Alternative | Why not |
| --- | --- |
| `git revert` the qibla merges | Interleaved with unrelated work in the same commits (section 4) |
| A manual `grep` at audit time, as `BRIEF.md` proposes | Runs once, then never again. The next session has nothing stopping it |
| Keep the Settings row opening an empty sheet | Ships a dead button to any user installing between sessions |
| Keep `expo-location` installed for session 45 | An unused native module in the binary, and session 45's design may not need location at all |
| Forbid the words with a Biome rule | Biome lints syntax, not a word list across filenames, and could not see the binary fixtures |

**The design review, done by this planning session on 2026-09-30 by rereading the above cold:** the
attack that found something real was "what if the guard passes for the wrong reason", which produced
the self-match defect and the hollow-exclusion defect, both now fixed and both proven by a break. The
second attack, "what does this delete that something else needs", produced the `expo-location` and
`fflate` dependency check (nothing declares either) and the `adhan` exception (it computes prayer
times and stays). The third, "what breaks that no test covers", produced the `app.json` permission
question, answered by reading the config plugin's source rather than assuming.

## 6. Steps

- [ ] Step 1: The whole feature, in one cut (specified, with two carried files)
- [ ] Step 2: The invariant that keeps it gone (files)

Each step is one branch, one commit, one version, one review, one merge.

**Step 1 is one commit because it cannot be split, and that was measured rather than assumed.** The
planning session tried two smaller cuts in a scratch worktree and both left `uat-2` red:

| Attempted split | What failed |
| --- | --- |
| The screen, hook, map and store alone | `Settings.test.tsx` cannot resolve `../Qibla`: `Cannot find module`. Also `unusedExports.test.ts`, on `readPosition`, `tilesAround`, `qiblaBearing` |
| The above plus the Settings row, icon and What's New | Still `unusedExports.test.ts`, on the same three symbols: `Test Suites: 1 failed, 187 passed` |

`shared/__tests__/unusedExports.test.ts` reports an export the moment its last caller goes, so it is a
tripwire against half-deleted code, and it is right to be. The feature comes out whole, then step 2 adds
the guard once there is nothing left to find.

Suite totals, measured in the scratch worktree at `4d734cfc`:

| Point | Suites | Tests |
| --- | --- | --- |
| Before (baseline on `uat-2`) | 192 | 5011 |
| After step 1 | 177 | 4786 (4784 + 2 prebuild-gated, which only a worktree skips) |
| After step 2 | 178 | 4788 (4786 + 2) |

The full step specifications are in `steps/`:

- `steps/1-the-atomic-deletion.md`
- `steps/2-the-invariant.md`

**The files the plan carries**, under `files/`, each with a `.txt` suffix. That suffix is not decoration:
a `.tsx` file there is picked up by `tsconfig.json`'s `include` and fails `tsc` on its relative imports
(measured while planning: `Cannot find module '../parts'`), and Jest discovers any `*.test.ts` in the
repository, which is the session 6b convention this follows.

| Carried file | Copied to | In step |
| --- | --- | --- |
| `files/Settings.tsx.txt` | `components/sheets/screens/Settings.tsx` | 1 |
| `files/Settings.test.tsx.txt` | `components/sheets/screens/__tests__/Settings.test.tsx` | 1 |
| `files/qiblaRemoved.test.ts.txt` | `shared/__tests__/qiblaRemoved.test.ts` | 2 |

## 7. Device proof

**None, and this is deliberate rather than an omission.** This session ships no feature and changes no
behaviour a phone can show, except a row leaving Settings. Nothing about a prayer time, an alarm, a
notification, a widget or a background task is touched, so there is nothing a device reading could
prove that the suite does not.

No clock is changed, so no `dumpsys alarm` reading is needed and no armed alarm can fire. The phone is
not connected this session (`adb devices` listed none while planning) and is left exactly as it is, on
whatever build it already carries, with automatic time on.

**One thing is therefore NOT proven and must be recorded as such:** that a build still compiles and
launches after `expo-location` leaves the native tree. The suite cannot see this, because
`node_modules` and the prebuilt `android/` and `ios/` folders are outside it. Session 45 builds first
and will find it immediately if it is wrong; the risk is low because the package is removed rather than
added, and `expo-location`'s own manifest contributions leave with it. Step 3's own checks include
`widgetRuntimeLoads.test.ts`, which is the one test that reads the installed tree and the one this
repo's history says an install can break.

## 8. Records

### Findings text

Append to `ai/features/uat-2/AUDIT-FINDINGS.md`, at the end of the file, under this exact heading:

```markdown
## Session 44: the qibla deleted, all of it

Four sessions built a qibla screen and a device proof rejected every one: session 37's dial read 30
degrees wrong indoors, session 40's heading was 71 degrees out, session 41's sentence asked a person to
estimate 49 degrees by eye, and session 43's arrow pointed 90 degrees wrong and was then refused on the
approach rather than the bug. This session removed all of it and shipped no feature.

Gone: `components/qibla/`, the Qibla sheet, `hooks/useQiblaMap.ts`, `shared/qibla.ts`,
`shared/qiblaStreet.ts`, `shared/qiblaSentence.ts`, the whole tile pipeline (`shared/pmtiles.ts`,
`shared/vectorTile.ts`, `shared/tileCache.ts`, `shared/tileGeometry.ts`, `device/tiles.ts`), the 78 KB
of committed tile fixtures, `device/qibla.ts`, the `COMPASS` icon and its SVG, the parked What's New
item, the Settings row, and the `expo-location` and `fflate` dependencies. `adhan` stays: it computes
the prayer times.

Four owner decisions were taken by the planning session, because the owner was unavailable and asked
for assumptions: the Settings row is deleted and session 45 re-adds it, both dependencies are
uninstalled, `NSLocationWhenInUseUsageDescription` comes out of `app.json`, and the tile fixtures go.
Each is reversible by session 45.

THE DELIVERABLE IS A TEST, NOT A DELETION. A cleanup has no behaviour to prove, so the thing that makes
it stick is `shared/__tests__/qiblaRemoved.test.ts`: no shipped file mentions the feature in its content
or its filename, except that suite. Two defects in its own first draft were found by spiking it before
it was specified, and both are the same shape, a guard that passes for the wrong reason. It matched its
OWN source, because a suite listing forbidden words contains them, fixed by building the words from
fragments and excluding the file by path. And widening its self-exclusion from one file to every test
file left it passing while a planted artefact went unseen, fixed by a second test that pins the search
to every shipped file but one. A third finding shaped the word lists: `mvt` is safe to forbid in a
filename, where it catches the two BINARY fixtures a content search of `.ts` files can never read, and
unsafe in content, where it matches ordinary prose.

`git revert` was rejected as the method. The feature landed across dozens of merges from 1.29.96 to
1.29.158 interleaved with unrelated work, and `shared/types.ts`, `assets/icons/svg/index.ts` and
`stores/ui.ts` each carry non-qibla changes made in the same commits, so reverting would have undone
those too.

Read from source rather than assumed: `expo-location`'s config plugin writes a DEFAULT
`NSLocationWhenInUseUsageDescription` whenever it runs without one
(`@expo/config-plugins/build/ios/Permissions.js`, `applyPermissions`), so removing the key is only
durable because the plugin is not in this app's `plugins` array and the package is leaving. Android
needed no change: its two `ACCESS_*_LOCATION` permissions come from the package's own manifest and go
with it.

Suite before: 192 suites, 5011 tests. After: <SUITES_AFTER> suites, <TESTS_AFTER> tests, 100% on all
four measures. Breaks: <BREAKS_CAUGHT> of <BREAKS_TOTAL> caught.

NOT PROVEN, and named as such: that a build compiles and launches with `expo-location` gone from the
native tree. No phone was connected and this session changed no behaviour a device could show, so there
was nothing a device reading would add. Session 45 builds first and finds it immediately if it is wrong.

The measurements that survive the owner's ruling are in `ai/plans/44-qibla-cleanup/FACTS.md`, and that
page is the only thing session 45 may build on.
```

### Table rows

The executor sets the `ai/plans/README.md` row 44 status to EXECUTED, keeping the rest of the cell.

For the auditor to apply on PASS, `ai/plans/README.md` row 44's status cell becomes:

```
**DONE 2026-09-30 (<FIRST_VERSION> to <LAST_VERSION>), audited.** Four sessions of qibla work are off `uat-2` and no feature ships. Gone: `components/qibla/`, the Qibla sheet and its Settings row, `hooks/useQiblaMap.ts`, `shared/qibla.ts`, `shared/qiblaStreet.ts`, `shared/qiblaSentence.ts`, the whole tile pipeline, the 78 KB of committed fixtures, `device/qibla.ts`, the `COMPASS` icon, the parked What's New item, and the `expo-location` and `fflate` dependencies; `adhan` stays because it computes the prayer times. Every plan folder and `LOG.md` is untouched, as the brief requires. **All four owner decisions were taken by the planning session on the owner's instruction to assume rather than ask, and each is reversible by row 45:** the Settings row is deleted rather than left opening an empty sheet, both dependencies are uninstalled, `NSLocationWhenInUseUsageDescription` is out of `app.json`, and the fixtures go. **THE DELIVERABLE IS A TEST RATHER THAN A DELETION**, `shared/__tests__/qiblaRemoved.test.ts`, which forbids the feature's words in the content AND the filename of every shipped file but its own, because a cleanup with no guard is undone by the next session copying a neighbour. **Two defects in that suite's own first draft were found by spiking it before it was specified, and both are a guard passing for the wrong reason:** it matched its OWN source, since a suite listing forbidden words contains them, and widening its self-exclusion from one file to every test file left it green while a planted artefact went unseen; the fixes are word fragments plus a path exclusion, and a second test pinning the search to every shipped file but one. A third finding split the word lists: `mvt` is safe to forbid in a FILENAME, where it catches the two BINARY fixtures a content search of `.ts` files can never read, and unsafe in content, where it matches prose. **`git revert` was rejected as the method**, because the feature landed across dozens of merges from 1.29.96 to 1.29.158 interleaved with unrelated work and three surviving files carry non-qibla changes from the same commits. Read from source rather than assumed: `expo-location`'s config plugin writes a DEFAULT permission string whenever it runs without one, so removing the key is durable only because the plugin is absent from `plugins` and the package is leaving, and Android needed no change since its `ACCESS_*_LOCATION` permissions come from the package's own manifest. Suite <SUITES_AFTER> suites / <TESTS_AFTER> tests at 100% on all four measures, <BREAKS_CAUGHT> of <BREAKS_TOTAL> breaks caught. **NOT PROVEN and named as such: that a build compiles with `expo-location` gone from the native tree**, since no phone was connected and nothing a device can show changed; row 45 builds first and finds it at once.
```

No row in `ai/prompts/README.md` covers session 44, so that file is not changed.

### Docs commit

`<VERSION> - docs(plans): session 44 executed: the qibla is deleted and a test keeps it gone`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes
`uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| `tsc` reports an unused import after a deletion | A surviving file imported only the deleted thing | Remove that import. It is work still to do, not a finding |
| Biome reports `noUnusedImports` in an edited file | Same cause | Same action |
| `unusedExports.test.ts` fails with a NEW unreachable symbol | A deletion made a surviving export unreachable | STOP and ask. Never add it to the allow list |
| `Settings.test.tsx` fails on a test the plan did not name | A non-qibla test was damaged | STOP and ask. Restore the file and reread step 2 |
| `widgetRuntimeLoads.test.ts` fails after `yarn remove` | The nested `@expo/ui` copy is back (`ai/AGENTS.md`) | Run `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`, then rerun that suite. If it still fails, STOP |
| `yarn remove` changes `yarn.lock` far beyond the two packages | The install re-resolved the tree | STOP and ask, quoting the lock diff summary |
| Coverage below 100% | A deleted file's tests covered a surviving branch | STOP and ask. Never add an ignore comment |
| A break prints `BREAK NOT APPLIED` | The substitution does not match the file | STOP (section 2.2, item 3) |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

### Anticipated review fixes

Given word for word. These are the only fixes the executor may make to anything this plan fixed:

1. **An unused import left behind by a deletion.** Delete the import line. Where it is one name inside a
   brace clause, delete that name and its comma, leaving the rest of the clause as it was.
2. **A blank line doubled where a deleted block used to sit.** Leave exactly one blank line between the
   two surviving statements.
3. **A trailing comma left dangling in an array or object literal after a removed entry.** Leave the
   literal formatted as `npx biome check --write` formats it.

Anything else: `EXECUTOR-BRIEF.md` section 4, item 8.

### Stopping part-way

| Step | How to undo it | Delete if present |
| --- | --- | --- |
| 1 | `git checkout -- .` restores every deleted and edited file at once, which is safe here because part 3 lists the whole tree this step touches and nothing else may be dirty. Then, if `yarn remove` already ran, `git checkout -- package.json yarn.lock && yarn install --frozen-lockfile` | nothing |
| 2 | `git checkout -- app.json package.json` | `shared/__tests__/qiblaRemoved.test.ts`, and `shared/qiblaReborn.ts` or `shared/__tests__/sneak.test.ts` if a break left one behind |

## 11. Subagents in this plan

None. The session does its own planning, execution, review and audit (owner, 2026-09-26). No image is
read, so `vision` is not needed either.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`,
and gives:

- a few plain sentences: that four sessions of qibla code are off `uat-2`, that no feature shipped, the
  four decisions the planning session took on the owner's behalf and that each is reversible by session
  45, and the suite totals before and after;
- the progress table (format in `EXECUTOR-BRIEF.md`);
- that a build with `expo-location` gone is NOT proven, and session 45 finds it first;
- the four-line handoff from the `athan-next` skill, section 5.
