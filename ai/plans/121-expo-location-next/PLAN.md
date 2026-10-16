# Ticket 121: `expo-location/next`: the provider API evaluation, with heavy compass testing

| Field | Value |
| --- | --- |
| Brief | Queue row 121: measure the full API surface of `expo-location/next` at the installed version, what this app's location and heading usage maps onto, and the migration cost against the settled heading ground; answer whether `/next` carries a heading watcher; heavy compass testing rides any adoption; she rules before code |
| Planned at | `ef0b09b2` 2.0.898, 2026-10-16 |
| Planned by | lane 121 (agent-ruled frontier, standing hands-off order 2026-10-16) |
| Needs first | nothing |
| Parent | nothing |
| Group | none (docs-only; the queue row and the two tracked version files (package.json, app.json) serialize as lane weather) |
| Batch budget | 3 weight units |
| Session budget | 3 weight units (one lane session carries all three docs steps) |
| Steps count | 3 (each weight 1, docs) |
| Device | none this wave (device work waits on her ruling; the phones are named in FINDINGS section 5) |
| Owner decisions still needed | her ruling on question 1 (adopt `/next` or not) and question 2 (the compass moves or not); no repo change before it |

## 1. Goal

The owner read the SDK 58 release note for the new `expo-location/next` API - a location provider
abstraction with a simpler position API, position watchers, background location updates, a separate
location foreground service on Android, and new permission options such as temporary full accuracy
on iOS - called it really important for this app, and named one requirement: heavy compass testing.
Nobody has measured what `/next` actually carries at the installed version, and the changelog's
description covers position rather than heading, so whether `/next` carries a heading watcher -
the compass's stream - is open.

Today the compass rides the classic `watchHeadingAsync`, which this repo's own patch fixes (Android
sensor rates, no 2-degree emission gate; iOS `kCLHeadingFilterNone`), with upstream PR
`expo/expo#51291` open against that classic API. The settled heading ground (rows 40, 49, 52, 53)
constrains anything that moves: Android draws only Google's fused sensor behind a forced wave,
iOS only inside its reported accuracy cone, and no invented constant or tuned offset ever.

When DONE, the queue row carries: `/next`'s full API surface at the installed version, name by
name; the heading answer with its three independent checks; every classic call the app makes with
its `/next` equivalent, including the two that have none; the migration cost measured against the
locked qibla rules; the options with one recommendation and its two-argument record; the compass
test matrix any adoption must pass; and the experiments and unverified claims a live phase settles.
No file outside `ai/plans/`, the queue row and the two tracked version files changes before her
ruling.

The owner's rules that govern, quoted:

- `ai/AGENTS.md:93-95`: "- Qibla is locked. Never draw a heading the phone has not vouched for.
  Android draws only Google's fused sensor behind a forced wave, iPhone inside its reported
  accuracy cone. No invented constant, no tuned offset, no per-location calibration, ever."
- `ai/AGENTS.md:157-160`: "A screenshot reaches a screen. It never proves what is on one. A
  records claim needs a logcat line or a dump." and "`@expo/agent-cli`: `status` and `smoke --ios`
  only. Never `--eas`, `deploy`, `agents:setup` or `skills:sync`, and never `smoke --android` while
  a phone is connected."
- The row's own constraint: it is investigation first, and she rules before any code.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Recorded |
| --- | --- | --- | --- | --- |
| D121.1 | The row's facts are pinned to the installed `expo-location` 58.0.16 (`expo` 58.0.12, `react-native` 0.88.0), verified from `node_modules/expo-location/src` first, the published SDK 58 documentation page second, and the changelog, the registry and the upstream pull request third | agent-ruled | 2026-10-16 | here, FINDINGS sections 1 and 2; why: the ticket demands the installed version, and the source tree is the only artefact that states what the subpackage exports |
| D121.2 | This wave is device-free. The one load-bearing question - whether `/next` carries a heading watcher - is settled by source, native manifest and published docs, so no reading requires a phone; the compass readings her requirement names are recorded as the C1 to C5 matrix any live phase runs (FINDINGS section 5), waiting on her ruling | agent-ruled | 2026-10-16 | FINDINGS section 5; why: a scratch `/next` build would take the build lock while lane 111 rebuilds Android for the stable re-pin, and it would answer nothing the three source checks have not already answered |
| D121.3 | The iPhone XS is locked, so no XS proof is possible and none is attempted. What an XS reading would confirm is named in the matrix (C2 the stationary heading stream under `kCLHeadingFilterNone`, C3's iOS half the `course` mapping, C5 the reduced-accuracy grant) | agent-ruled | 2026-10-16 | FINDINGS section 5; why: the orchestrator's device state; a locked phone proves nothing and forcing one is not a lane's call |
| D121.4 | Question 1's recommendation is option B: adopt nothing; keep the location and heading path on the classic API and re-open the question when a need appears that only `/next` serves; argued twice in FINDINGS section 5 | agent-ruled | 2026-10-16 | here, FINDINGS section 5 |
| D121.5 | Question 2's recommendation is that the compass does not move: the local patch and upstream PR `expo/expo#51291` keep their ground, because `/next` carries no heading surface for either to re-file against | agent-ruled | 2026-10-16 | here, FINDINGS sections 2 and 5 |
| D121.6 | The deliverable folds into the queue row at DONE; no findings file survives, because nothing in shipped code or config will cite it. Precedent: rows 65, 66, 117, 118, 119, 123 | agent-ruled | 2026-10-16 | here, section 8 |
| D121.7 | `expo-location` 58.0.16 is the pinned anchor. If a sibling lane moves `yarn.lock` while this row runs, the lane rebases, reinstalls under the commit lock, and re-runs the section-8 re-verification pass before recording anything; the row's claims are rewritten if the pass diverges | agent-ruled | 2026-10-16 | here, FINDINGS section 8; why: lane 111 is re-pinning `expo` and `expo-widgets` now, and `expo` 58.0.13's bundled pins move `expo-location` to `~58.0.17` |
| D121.8 | Execution runs in the lane with no executor worker (all three steps are docs-weight verification and writing, with no red-green code loop and no code diff); the grill and both audit reviewers are dispatched as workers | agent-ruled | 2026-10-16 | LOG.md; why: the precedent set by row 122's lane, and a cold worker adds nothing to a docs step while the grill and the blind audit are exactly the worker jobs that add rigour |
| D121.9 | The published documentation is read through the documentation server's `fetch_url`, whose rendering is complete (1376 lines, the methods and types sections present); a first read through a different fetch tool returned 16 KB with those sections missing and would have produced a false "the docs never mention heading" claim | agent-ruled | 2026-10-16 | here, FINDINGS section 1.11; why: the count that the row's answer rests on must come from the rendering that holds the whole page |

### 2.2 The executor must not decide

- An installed `expo-location` other than 58.0.16: run the section-8 re-verification pass and
  rewrite the row's version-sensitive claims from the installed tree before any step lands. Do
  not cite 58.0.16 line numbers against a different version.
- A `src/next` tree that contains a heading watcher: STOP and report. The row's answer reverses,
  and the patch and the upstream PR re-file against `/next`.
- Any command that contacts a phone, starts a build, boots an emulator or installs a package:
  STOP. This wave is device-free and build-free by D121.2.
- Any repo change beyond `ai/plans/`, the queue row and the two tracked version files: STOP. The
  row forbids one before her ruling.

## 3. Pre-flight

`ai/plans/121-expo-location-next/scripts/preflight-121.sh`, run from the worktree root as
`bash ai/plans/121-expo-location-next/scripts/preflight-121.sh`. It checks: the worktree is on
`lane/121` with a clean tree; `origin/uat` is fetched and is an ancestor of HEAD; the planned-at sha
`ef0b09b2` is an ancestor of HEAD; `package.json`'s version is not lower than 2.0.898; the installed
`expo-location` is 58.0.16 and its `/next` tree is present; every source file the anchors cite
exists; and every anchor counts exactly 1 in its source while sitting in the 3-to-15 line band. It
ends `PREFLIGHT OK`.

Run it on `lane/121`, on a clean tree, after the READY commit lands and before the first step
branch is created. It fails by design on a `docs/121-*` branch, because it demands `lane/121`, and
on a dirty tree, because the plan folder is untracked until READY lands.

Anchors are rebuilt from the installed tree with
`bash ai/plans/121-expo-location-next/scripts/build-anchors.sh` (run from the worktree root) after
any reinstall; the script prints one line per anchor with its source, line count and count, and
exits non-zero unless every count is 1.

## 4. Background the executor needs

Files this row reads (none outside the plan folder changes):

- `package.json:55` - the `expo-location` pin.
- `node_modules/expo-location/package.json` - the `./next` export entry.
- `node_modules/expo-location/src/next/index.ts`, `Location.ts`, `js/*.ts` - the JavaScript surface.
- `node_modules/expo-location/src/next/types/*.ts` - the position, permission, provider, task and
  background session types.
- `node_modules/expo-location/src/next/native/types/*.ts` - the native method manifest.
- `node_modules/expo-location/android/src/main/java/expo/modules/location/next/**` - the Android
  module, the provider implementations and the foreground service.
- `node_modules/expo-location/ios/next/**` - the iOS module, the permission requester and the
  temporary-full-accuracy requester.
- `node_modules/expo-location/ios/Providers/DeviceHeadingStreamer.swift` and
  `android/src/main/java/expo/modules/location/LocationModule.kt` - the classic heading readers the
  patch edits (read-only; the patch is applied by `yarn install`).
- `node_modules/expo-location/plugin/src/withLocation.ts` - the config plugin's default props.
- `node_modules/expo-location/CHANGELOG.md` - the `/next` entries.
- `patches/expo-location+58.0.16.patch` - this repo's six hunks in three files.
- `scripts/verify-expo-location-patch.sh` - the guard that proves the patch is applied.
- `device/qibla.ts`, `hooks/useQibla.ts`, `modules/qiblaheading/index.ts`, `shared/qiblaSettle.ts`,
  `shared/qiblaWaveGate.ts` - the app's whole location and heading surface.
- `ai/AGENTS.md:93-95`, `ai/UPSTREAM-PRS.md:9-28` - the lock and the upstream record.
- `ai/plans/README.md` - row 121 and the status law.
- Main tree only, gitignored and absent from a lane worktree: `ios/Athan/Info.plist:79-83` and
  `android/app/src/main/AndroidManifest.xml` - the generated native config the permission and
  service findings cite. Read them in `$HOME/repos/rn.athan.uk`; never write there.

Anchors, all under `scripts/anchors/`, each counting exactly 1 in its source at the planned sha:

| Anchor | Source | What it fixes |
| --- | --- | --- |
| `next-index.md` | `src/next/index.ts` | The subpackage's top-level export list |
| `next-location.md` | `src/next/Location.ts` | The 15-method `Location` namespace exactly, with no heading name |
| `next-js-index.md` | `src/next/js/index.ts` | The JS layer's export list, opening through the permission getters |
| `next-position-heading.md` | `src/next/types/Position.types.ts` | The only heading in `/next`, documented as course over ground |
| `next-permissions-option.md` | `src/next/types/Permissions.types.ts` | The temporary-full-accuracy option |
| `next-native-manifest.md` | `src/next/native/types/NativeLocationModuleNextClass.types.ts` | The native manifest's permission and provider block, heading-free |
| `changelog-next.md` | `node_modules/expo-location/CHANGELOG.md` | The 58.0.13 `/next` entries |
| `qibla-watch.md` | `device/qibla.ts` | The classic heading watch and its comments |
| `qibla-read-position.md` | `device/qibla.ts` | The cached-fix and coarsest-fix position read |
| `qibla-sheet-branch.md` | `hooks/useQibla.ts` | The fused-sensor branch and the classic stream's branch together |
| `qiblaheading-index.md` | `modules/qiblaheading/index.ts` | The app's own native heading module |
| `patch-android-gate.md` | `patches/expo-location+58.0.16.patch` | The Android rate and gate hunks |
| `patch-ios-filter.md` | `patches/expo-location+58.0.16.patch` | The iOS `kCLHeadingFilterNone` hunk |
| `agents-qibla-lock.md` | `ai/AGENTS.md` | The qibla lock |
| `upstream-location-pr.md` | `ai/UPSTREAM-PRS.md` | The patch's upstream row and the filed PR paragraph |
| `settle-gate.md` | `shared/qiblaSettle.ts` | The reported-uncertainty gate |

Facts planning already measured (recorded in FINDINGS sections 1 to 4):

- `/next` is a second export entry inside the same package; both native modules compile into every
  build today, so an adoption changes JavaScript only.
- The JavaScript surface: 15 `Location` methods, 4 hooks, 3 classes, 1 task definer, 5 enums and 13
  types. No heading watcher among them.
- `grep -rn "heading\|Heading" src/next/js` prints nothing; the same grep over `src/next` prints 5
  hits, all the `Position` record's course-over-ground fields; over the `/next` native trees it
  prints 13, all the same record's mapping.
- The published `Location (next)` page documents the same surface and carries zero `compass` hits;
  heading appears four times, all in the `Position` table.
- Every `/next` changelog entry from 58.0.10 to 58.0.16 is position, permission, service or
  background; none names heading. 58.0.17 adds one Android background-task fix and no `/next`
  surface change.
- Upstream PR `expo/expo#51291` is open, unmerged, one bot comment, unchanged since 2026-10-09.
- The app's whole location surface is `device/qibla.ts` (six classic calls) plus the heading path in
  `hooks/useQibla.ts` and `modules/qiblaheading`; `reverseGeocodeAsync` and `watchHeadingAsync` have
  no `/next` equivalent.
- The main tree's built `Info.plist` already carries the temporary-full-accuracy purpose key the
  plugin writes by default; the Android manifest carries no foreground-service permission.

Why the obvious answer is wrong: "the SDK has a new location API, so migrate" fails on the
ticket's own subject. The new API has no heading surface at all, so the compass - the thing the
owner cares about, and the only part of this app's location use with any history behind it - cannot
move to it, and every capability the position and permission halves would add already exists in the
classic API the app already uses.

## 5. Design

The investigation is three steps over one findings file, one section group per question.

**Question 1, adoption.** Recommended: option B, adopt nothing now, keep the whole location and
heading path on the classic API, and re-open the question when a need appears that only `/next`
serves. Rejected: option A, adopt `/next` for the position and permission half while keeping the
classic import for the place name and the heading (its gains are classically reachable, and it
costs two APIs for one feature, a native rebuild, a fresh two-platform proof and a permission-flow
change); option C, adopt `/next` wholesale and drop the classic import (it deletes the compass and
the place label outright).

**Question 2, the compass.** Recommended: nothing moves. The patch's six hunks in three files and the upstream
PR stay filed against the classic `watchHeadingAsync`, because `/next` carries no heading surface.
The heavy compass testing her requirement names is recorded as the C1 to C5 matrix any live phase
runs, with C2 (the stationary XS stream), C3's iOS half (the `course` mapping) and C5 (the
reduced-accuracy grant) waiting on the XS being unlocked.

**Question 3, anything else.** Recommended: nothing. No file, no dependency, no permission and no
upstream artefact moves.

The recommendation argued twice lives in FINDINGS section 5, with the challenge, the surviving
answer and the flip-check on the strongest rival.

**Acceptance criteria:**

- [R1.1] WHEN the executor reads `node_modules/expo-location/src/next/index.ts`, `Location.ts` and `js/index.ts` THE SYSTEM SHALL record every exported method, hook, class, function and enum with its source line, and SHALL record that no exported name is a heading, compass or magnetometer API.
- [R1.2] WHEN the executor runs `grep -rn "heading\|Heading" node_modules/expo-location/src/next/js | wc -l` THE SYSTEM SHALL print `0`, and `grep -rn "heading\|Heading" node_modules/expo-location/src/next | wc -l` SHALL print `5`, all five inside `types/Position.types.ts`.
- [R1.3] WHEN the executor runs `grep -rn "heading\|Heading" node_modules/expo-location/android/src/main/java/expo/modules/location/next node_modules/expo-location/ios/next | wc -l` THE SYSTEM SHALL print `13`, every one inside the `Position` record's mapping, and SHALL record that neither `/next` native tree starts a heading stream.
- [R1.4] WHEN the executor reads `src/next/types/Position.types.ts:137-149` THE SYSTEM SHALL quote the field's own documentation that it is unrelated to the device's orientation, and SHALL quote the iOS `course` mapping and the Android `hasBearing()` mapping.
- [R1.5] WHEN the executor fetches `https://docs.expo.dev/versions/v58.0.0/sdk/location-next.md` through the documentation server and counts the lines matching `compass` THE SYSTEM SHALL print `0`, and SHALL print `4` for the lines matching `heading`, all four inside the `Position` table and its example.
- [R1.6] WHEN the executor reads `node_modules/expo-location/CHANGELOG.md` THE SYSTEM SHALL list every `/next` entry from 58.0.10 to the installed version with its pull-request number, and SHALL record that no entry names heading or compass.
- [R1.7] WHEN the executor reads `src/next/types/Permissions.types.ts:49-62` and `ios/next/Permissions/TemporaryFullAccuracyRequester.swift` THE SYSTEM SHALL quote the temporary-full-accuracy trigger, its purpose key and the config-plugin property that writes it, and SHALL record that the main tree's `ios/Athan/Info.plist:79-83` already carries the key.
- [R2.1] WHEN the executor runs `git grep -n "^import .*expo-location" -- '*.ts' '*.tsx'` THE SYSTEM SHALL print exactly two lines, `device/__tests__/qibla.test.ts:5` and `device/qibla.ts:1`, SHALL record that the wider `git grep -n "expo-location" -- '*.ts' '*.tsx'` prints 13 lines (the two imports, two comment mentions and nine suite and guard lines), and SHALL record that the whole production location surface is `device/qibla.ts`.
- [R2.2] WHEN the executor reads `device/qibla.ts` THE SYSTEM SHALL list every `Location.` call with its line, the `/next` equivalent for each, and SHALL name the two calls that have no `/next` equivalent.
- [R2.3] WHEN the executor reads `hooks/useQibla.ts:252-266` THE SYSTEM SHALL record which platform reads which heading source and which gate each sits behind, quoting the branch and its lines.
- [R3.1] WHEN the executor reads `patches/expo-location+58.0.16.patch` and `ai/UPSTREAM-PRS.md` THE SYSTEM SHALL name each hunk's file, the pull request number, the classic API it patches, and its measured review state.
- [R3.2] WHEN findings state the heading answer THE SYSTEM SHALL rest it on the three independent checks and SHALL state that neither the patch nor the pull request re-files against `/next`.
- [R4.1] WHEN findings present the adoption question THE SYSTEM SHALL carry three options with one marked recommended, one line of measured ground per rejected option, and the two-argument record for the recommendation.
- [R4.2] WHEN findings name a claim only a live run settles THE SYSTEM SHALL record it as a numbered experiment with its waiting condition, and WHEN a claim the installed source does not settle appears THE SYSTEM SHALL list it under the unverified heading with the experiment that settles it.
- [R4.3] WHEN the queue row is updated at DONE THE SYSTEM SHALL carry the surface's shape, the heading answer, the mapping, the recommendation, the compass matrix, the experiments and the unverified list.

## 6. Steps

Checklist (all three in this file, inline; the ledger in `LOG.md`):

- [ ] Step 1 `/next`'s API surface at the installed version (R1.1 to R1.7)
- [ ] Step 2 the app's usage mapped onto `/next`, and the heading answer (R2.1 to R2.3, R3.2)
- [ ] Step 3 the migration cost, the recommendation, the compass matrix and the ruling pack (R3.1, R4.1 to R4.3)

### Step 1 - `/next`'s API surface at the installed version

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7
Weight: 1
Anchor check: all sixteen anchors count 1 in their sources (the pre-flight covers them). Goal:
FINDINGS sections 1.1 to 1.12 hold the subpackage's whole surface, name by name, each claim
carrying its path and line or its command and output. Branch: `docs/121-1-next-surface` off
`lane/121`; before the first edit run `git fetch -q origin uat` and confirm the branch still bases
on `lane/121`'s tip. Files: `ai/plans/121-expo-location-next/FINDINGS.md` (sections 1.1 to 1.12,
refined in place from the READY-committed draft), `ai/plans/121-expo-location-next/LOG.md`,
`ai/plans/README.md` (status IN PROGRESS, step 1), plus the two tracked version files under the
version lock. Red tests: none, a docs step; the check is the criteria below. Change contract:
re-run every command the criteria name and confirm each printed value; re-read each quoted line at
the installed version; for the two generated native files, re-read them in `$HOME/repos/rn.athan.uk`
and record the path, because a lane worktree does not carry them. Green run: every criterion's
command prints what it predicts. Break script: none, a docs step with no code to break; the done
gate is the criteria. Version and commit: the next patch after `uat`'s `package.json` under the
version lock, message `<VERSION> - docs(plans): ticket 121 step 1, the /next surface at 58.0.16`.
Review: read the diff cold against the installed source. Merge: `--no-ff` into `uat` under the uat
lock, from the main tree. Done when: R1.1 to R1.7 hold and every line cite is re-checked.

### Step 2 - the app's usage mapped onto `/next`, and the heading answer

Requirements: R2.1, R2.2, R2.3, R3.2
Weight: 1
Anchor check: as step 1. Goal: FINDINGS section 3 carries every classic call with its line and its
`/next` equivalent, the two calls with none, and the heading path; section 2 states the answer on
the three independent checks and names what stays filed where. Branch: `docs/121-2-app-mapping` off
`lane/121`. Files: FINDINGS sections 2 and 3, `LOG.md`, `ai/plans/README.md` (step 2), plus the two
tracked version files under the lock. Change contract: run the `git grep` and reconcile its list
against the section line by line; re-read `device/qibla.ts` and `hooks/useQibla.ts` and confirm
each quoted line; re-read the patch and the upstream record and confirm each hunk's file and the
pull request's state. Green run: every classic call in the app appears in the mapping table with
its `/next` equivalent or the word none, and the heading answer cites all three checks. Review: as
step 1. Merge: as step 1. Done when: R2.1 to R2.3 and R3.2 hold. Version and commit as step 1,
message `<VERSION> - docs(plans): ticket 121 step 2, the app mapping and the heading answer`.

### Step 3 - the migration cost, the recommendation, the compass matrix and the ruling pack

Requirements: R3.1, R4.1, R4.2, R4.3
Weight: 1
Anchor check: as step 1. Goal: FINDINGS sections 4 to 8 carry the cost against the locked rules,
the three options with the recommendation and its two arguments, the C1 to C5 compass matrix, the
experiments and the unverified list, the re-verification pass, and the queue row's outcome text.
Branch: `docs/121-3-ruling-pack` off `lane/121`. Files: FINDINGS sections 4 to 8, `LOG.md`,
`ai/plans/README.md` (EXECUTED, the outcome text), plus the two tracked version files under the
lock. Change contract: for each rejected option write the measured fact that rejects it, from
sections 1 to 4; for the recommendation write the challenge, the surviving answer and the
flip-check; for each unverified claim name the experiment that settles it; for the row text name
the surface's shape, the heading answer, the mapping's two gaps, the recommendation, the matrix and
the lists. Green run: every option carries a citation to a measured line, and no claim stands
without one. Review: as step 1. Merge: as step 1. Done when: R3.1 and R4.1 to R4.3 hold. Version
and commit as step 1, message `<VERSION> - docs(plans): ticket 121 executed: the ruling pack`.
Finishing: set EXECUTED, the executed docs commit, merge `--no-ff`, no push.

## 7. Device proof

None this wave, by D121.2 and D121.3. The row's requirement is heavy compass testing, and the
matrix any live phase runs is recorded in FINDINGS section 5: C1 the classic stream's rate and the
missing 2-degree gate under an adopted build (3T), C2 the stationary heading stream (XS, waiting on
the owner unlocking it), C3 `Position.heading` while stationary (3T), C4 the wave gate and the
certainty gate unchanged on both readers (3T and XS), C5 a reduced-accuracy grant's effect on the
sheet (XS). A device reading is the only proof for a heading claim; no source inference replaces
one. When a live phase runs, it takes the device lock for the phone it uses and, if it builds, the
build lock.

## 8. Records

- `LOG.md`: every step entry opens `### Step <NN> — <state>` and ends `session: <id>`; planning
  sections use `## Planning (2026-10-16)` and `## Ticket 121`.
- The queue cell the lead applies on DONE (draft, refined by what execution measures):
  `DONE 2026-10-16, audited: the expo-location/next evaluation answers at the installed
  expo-location 58.0.16 (expo 58.0.12; the subpackage is a second export entry of the same package,
  and both native modules compile into every build today, so an adoption would change JavaScript
  only). THE LOAD-BEARING ANSWER: /next carries NO heading watcher. Three independent checks: the
  JS layer declares none (grep heading over src/next/js prints 0), the only heading in the source
  tree is Position.heading at types/Position.types.ts:138-149, documented as the direction the
  device is travelling and unrelated to its orientation (iOS maps CLLocation.course,
  Position.swift:37; Android maps Location.getBearing() behind hasBearing(),
  LocationRecords.kt:275; the whole native tree's 13 heading hits are that record's mapping), and
  the published Location (next) page documents the same 15 methods with zero compass hits and
  heading only in the Position table. Every /next changelog entry from 58.0.10 to 58.0.16 is
  position, permission, service or background; 58.0.17 adds one Android background-task fix and no
  surface change. Therefore the local patch does NOT re-file (its six hunks in three files live in the classic
  LocationModule.kt, ios/Providers/DeviceHeadingStreamer.swift and the package's config), and
  upstream PR expo/expo#51291 does NOT re-file (it patches the classic watchHeadingAsync; measured
  2026-10-16: open, unmerged, one bot comment, unchanged since 2026-10-09). What the API surface
  carries: 15 Location methods (getPosition, watchPosition, the four permission getters and
  requesters, the two notification ones, hasLocationServicesEnabled, enableLocationServices,
  setLocationProvider, getSelectedLocationProviderName, ensureBackgroundSessionStarted,
  stopBackgroundSession, getBackgroundSessionStatus), 4 hooks, 3 classes (PositionWatchHandle,
  LocationProvider, LocationUpdatesHandle), defineLocationTask, and the temporary-full-accuracy
  option whose plist purpose key ExpoLocationFullAccuracy this build's Info.plist already carries
  (written by the plugin's default). WHAT THE APP MAPS ONTO: the whole surface is device/qibla.ts -
  getForegroundPermissionsAsync:20, requestForegroundPermissionsAsync:24, getLastKnownPositionAsync:54
  and getCurrentPositionAsync(Accuracy.Lowest):55 (which collapse to getPosition with a cached age
  and the LOW_POWER profile, the same 3 km tolerance), reverseGeocodeAsync:69 and watchHeadingAsync:89
  (the last two have NO /next equivalent, so the classic import survives any adoption). The heading
  path stays modules/qiblaheading (FOP on Android behind the wave gate, the accuracy cone on iOS)
  with the classic stream behind it. MIGRATION COST: no dependency removed and no build weight saved
  (both native modules already compile), a partial migration by construction, a native rebuild plus
  a two-platform device proof for already-proven behaviour, and the one behavioural change - the
  permission prompt - on ask-first ground; the device-switch state it would add has a classic
  reader already (hasServicesEnabledAsync, Location.ts:344). RECOMMENDATION (her ruling): question
  1 option B, adopt nothing now and re-open when a need appears only /next serves; question 2,
  nothing moves. Heavy compass testing stays the bar for any adoption: the C1 to C5 matrix in
  FINDINGS section 5. Experiments E1 to E5 and unverified claims U1 to U6 also live there. No repo
  change before her word.`
- Docs commit messages: per step, `<VERSION> - docs(plans): ticket 121 ...` as section 6 gives them.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` when every unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| The installed `expo-location` is not 58.0.16 | Run the FINDINGS section-8 re-verification pass, rebuild the anchors, and rewrite the version-sensitive claims from the installed tree before any step lands |
| `src/next` contains a heading watcher | STOP and report: the row's answer reverses and the patch and the pull request re-file against `/next` |
| `bash scripts/build-anchors.sh` prints a count other than 1 | STOP: the excerpt no longer matches the installed source; re-extract it and re-verify before continuing |
| `bash ai/plans/121-expo-location-next/scripts/preflight-121.sh` prints `PREFLIGHT FAILED` | Fix the named check; never skip one |
| A step wants a phone, a build or a dependency install | STOP and report which step: D121.2 forbids all three this wave |
| The main tree's generated native files are missing or re-prebuild | Re-read them; if `Info.plist` no longer carries `NSLocationTemporaryUsageDescriptionDictionary`, FINDINGS section 1.6 records the plugin default as the reason and the measurement as main-tree-only |
| A merge conflict on `ai/plans/README.md` or the two tracked version files | Lane weather: abort, rebase onto `uat`, keep both lanes' rows and the higher version, retry once, then STOP if it still conflicts |
| The pre-commit hook's `Tests:` line is missing or coverage drops below 100 percent | Never commit; read the hook log first |
| A sibling lane lands a `yarn.lock` move mid-row | Rebase, reinstall under the commit lock, re-run the section-8 pass, then continue |

Anticipated review fixes, word for word: none expected beyond records wording; any finding lands in
`AUDIT.md` with its verdict.

Restore lists: every step's diff touches only `FINDINGS.md`, `LOG.md`, the queue row and the two
tracked version files, on its own branch; `git checkout lane/121 -- .` inside the worktree restores
the prior state, and an unmerged branch deletes with `git branch -D`.

## 11. Subagents

Planning: fact questions were measured directly by the lane (the installed source tree, the
published documentation, the registry and the upstream API are the primary sources);
`athan-plan-griller` grills this draft cold. Delivery: the lane executes all three docs steps itself
(D121.8), recorded in `LOG.md`; the audit dispatches one `athan-reviewer` blind (the diff plus
`ai/AGENTS.md`, re-running the greps and the fetches to reproduce every number) and one
`athan-reviewer` plan-conformance (this folder plus the diff). `vision` is not needed; no image
arises.

## 12. Report to the owner

Plain sentences: at the installed version `/next` is a position, permission, service and background
surface, and it carries no heading watcher at all - measured three ways, from the JavaScript export
list, the native method manifest and the published documentation. The compass therefore stays where
it is: the local patch's six hunks in three files and the upstream pull request stay filed against the classic
`watchHeadingAsync`, and neither re-files. The app's whole location surface is one 92-line file with
six classic calls; two of them, the geocoded place name and the heading stream, have no `/next`
equivalent, so an adoption would be partial by construction and would buy nothing the classic API
does not already offer, at the price of a native rebuild, a fresh two-platform proof and a
permission-prompt change. The recommendation is to adopt nothing now and revisit when a need
appears that only `/next` serves; the compass test matrix the ticket asks for is recorded ready to
run, with the XS legs waiting on the phone being unlocked. Then the progress table, then the
handoff block the lane's final return carries.
