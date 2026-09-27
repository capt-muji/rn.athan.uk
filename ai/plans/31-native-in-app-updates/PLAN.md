# Plan: Session 31. Android updates natively through Play, iOS keeps the modal, and `releases.json` is deleted

| Field | Value |
| --- | --- |
| Brief | The owner's instructions of 2026-09-27, quoted in section 1; `ai/plans/31-native-in-app-updates/RESEARCH.md` |
| Planned at | `5c3f2f00` (version 1.29.22), 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | 30 |
| Steps | 4, each one branch, one commit, one version |
| Device | OnePlus 3T `8f7ada76` and the booted iPhone XS simulator, both on a mock build. Play In-App Updates CANNOT be exercised on either (section 7 says why, and what is proven instead) |
| Owner decisions still needed | None. Every one was taken in conversation on 2026-09-27; section 2.1 records them |

## 1. Goal

Session 30 made both stores answer for themselves, but Android still did it by scraping an undocumented key out of a
1.1 MB HTML page, and `releases.json` still existed. When this plan is DONE, Android asks Play itself through the
sanctioned API and updates inside the app with one consent tap, iOS keeps the modal it needs because Apple offers no
in-app mechanism at all, the scrape is gone, and `releases.json` is deleted from the repository. The owner notices by
releasing to Play and seeing users update without ever leaving the app, and by never touching that file again.

The owner's instructions that govern this session:

🐋  "Native always wins versus custom implementation."

🐋  "I don't ever want to touch released on Jason ever again. I never ever want touch it again, so actually I'm looking
to get rid of that."

🐋  "Android gets a native. iOS gets a little cool."

🐋  "You said Android needs 1 consistent tap. Fine, I can accept that."

🐋  "if we have any debt code that both platforms don't need anymore, we can drop that, but. If the, if 1 of the
platforms uses it, then I guess we can just, um, make a platform dependent."

🐋  "we want 100% test coverage, even if we can't test it on a device yet. We do want 100% test coverage."

🐋  "We want this to be as simple as possible."

The standing rules that also bind it:

- Visuals are settled (`EXECUTOR-BRIEF.md` section 2). The one visual change in this session, Google's overlay
  replacing `ModalUpdate` on Android, is the owner's explicit ruling above and is not the executor's to extend.
  `components/modals/Update.tsx` itself is NOT edited by any step.
- 🐋  Never build on EAS and never push anything to it (`ai/AGENTS.md`).
- Comments explain why, never what, and are extremely compact (`ai/AGENTS.md` section 15).

## 2. Decisions

### 2.1 Taken

1. **Android adopts `expo-in-app-updates@0.12.0`; iOS keeps our own reader.** Owner, 2026-09-27. The platforms are not
   symmetric: Play has a real in-app update API, and Apple has none, which the package's own README states twice
   (`RESEARCH.md` section 3).
2. **Session 30's rejection of this package is withdrawn, and one of its grounds was simply wrong.** Planner,
   2026-09-27: the "unverifiable" objection judged a production mechanism by what a side-loaded test phone can
   exercise, and the claim that its iOS half queries the wrong storefront was false, because `AppStoreCountry` is
   documented for exactly that case (`RESEARCH.md` section 2). Recorded so the next reader does not re-litigate it.
3. **The Android flow is FLEXIBLE, never immediate.** Owner, 2026-09-27, wanting a background download with no
   blocking. Immediate blocks the app until the user updates, which is wrong for a prayer-times app. `updatePriority()`
   in Play Console can escalate later with no app change, and 0.12.0 already reads it.
4. **The library's automatic `completeUpdate()` is kept, and no progress UI is built.** Planner, 2026-09-27: Google's
   documentation says Play does NOT auto-restart for a flexible update, and this package already calls
   `completeUpdate()` on `InstallStatus.DOWNLOADED`, which is precisely the owner's "without them clicking anything"
   (`RESEARCH.md` section 5). Building a progress bar would add custom code the owner asked to avoid.
5. **`checkForUpdates()` keeps its name, its signature and its single call site.** Planner, 2026-09-27: on Android it
   starts the native flow and answers `false`, so no modal is shown; on iOS it answers as it does today. That keeps
   `app/index.tsx` a one-line change and the 24-hour throttle shared by both platforms, which is what the owner meant
   by 🐋  "no need to change how often it triggers".
6. **`stores/version.ts` is NOT touched, on either platform.** Planner, 2026-09-27, answering the owner's question
   directly: the stored-version flow answers "was the app upgraded since last launch" and drives the cache wipe, the
   forced notification reschedule and the What's New gate. Disabling it on Android would reintroduce ISSUES #34
   (`RESEARCH.md` section 8).
7. **`releases.json` is deleted in its own commit.** Owner, 2026-09-27. Safe because every version in it is `1.0.0`,
   so `isNewerVersion(installed, '1.0.0')` is `false` for every version this app has shipped, which means the file
   prompts nobody even for an app still reading it (`RESEARCH.md` section 7).
8. **`country=gb` and `&gl=GB` stay for now.** Planner, 2026-09-27: measured across five storefronts and five `gl`
   regions, both stores serve one global version, so these pins are unnecessary rather than wrong. The Play URL goes
   with the scrape in step 1; the iTunes `country` is left for the 2.0 global session, because changing it is a
   behaviour change this session does not need.
9. **The package is tested through a virtual Jest mock, and reaches 100% without a device.** Planner, 2026-09-27, proven
   in the scratch worktree (section 5, "What the scratch worktree proved").

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens.

1. **Any anchor count other than 1.** Question: "Anchor `<file>` counts `<n>` in `<source>`, not 1. Set the row to
   NEEDS REPLAN?"
2. **A test fails that this plan does not name.** Question: "`<test name>` failed and the plan does not predict it.
   The failure line is `<line>`. What should happen?"
3. **A test the plan says must fail passes instead.** Question: "`<test name>` was expected to fail before the change
   and it passed, so it guards nothing yet. Stop here?"
4. **A break prints `BREAK NOT APPLIED: <label>`.** Question: "Break `<label>` substituted nothing, so the code I
   wrote does not carry the text the plan targets. What should the break target instead?"
5. **`yarn add expo-in-app-updates@0.12.0` resolves a version other than 0.12.0, or changes any other dependency's
   version in `yarn.lock` beyond adding this one.** Question: "Installing the package changed `<what>`. Proceed?"
6. **Coverage is below 100% on any measure after step 1.** Question: "`device/updates.ts` reports `<n>%` on `<measure>`
   and the uncovered line is `<line>`. The plan's test list was meant to cover it. What should happen?"
7. **A review finding that section 10 does not give word for word, and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** Question: "My review of `<sha>` found `<finding>`. Apply it?"
8. **Anything touching `stores/version.ts`, `shared/versionUtils.ts`, `components/modals/Update.tsx`, `uat` or EAS.**
   Question: "This step appears to require a change to `<X>`, which the plan forbids. Stop?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-31.sh` and run `bash $TMPDIR/preflight-31.sh <k>`.

```bash
#!/usr/bin/env bash
set -u
REPO=/Users/muji/repos/rn.athan.uk
STEP="${1:?usage: preflight-31.sh <step number>}"
FOLDER=ai/plans/31-native-in-app-updates
fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

cd "$REPO" || fail "checkout $REPO is missing"
[ "$(pwd)" = "$REPO" ] || fail "wrong checkout: $(pwd)"
[ "$(git branch --show-current)" = "uat-2" ] || fail "not on uat-2: $(git branch --show-current)"

DIRTY=$(git status --porcelain -- . ":(exclude)ai/plans/README.md" ":(exclude)$FOLDER" ":(exclude)ai/AGENTS.md" || true)
[ -z "$DIRTY" ] || fail "tree holds files beyond the plan files:
$DIRTY"

git fetch -q origin uat-2 || fail "git fetch origin uat-2"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is not a descendant of origin/uat-2"

VERSION=$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')
echo "package.json version: $VERSION"
python3 - "$VERSION" <<'PY' || fail "version is lower than the planned-at 1.29.22"
import sys
def parts(v): return [int(x) for x in v.split('.')]
sys.exit(0 if parts(sys.argv[1]) >= parts('1.29.22') else 1)
PY

grep -q "30-store-version-automatic/PLAN.md\` | DONE" ai/plans/README.md || fail "row 30 is not DONE"

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check_anchor() {
  local n
  n=$(count_anchor "$1" "$2")
  echo "anchor $1 in $2: $n"
  [ "$n" = "1" ] || fail "anchor $1 counts $n in $2, not 1 (NEEDS REPLAN)"
}

if [ "$STEP" -le 1 ]; then
  check_anchor "$FOLDER/scripts/anchors/1-1.txt" device/updates.ts
fi
# Step 2's anchors are on app/index.tsx, which step 1 does not change.
if [ "$STEP" -le 2 ]; then
  check_anchor "$FOLDER/scripts/anchors/2-1.txt" app/index.tsx
  check_anchor "$FOLDER/scripts/anchors/2-2.txt" app/index.tsx
fi
if [ "$STEP" -le 4 ]; then
  [ -f releases.json ] || fail "releases.json is already gone; step 4 has nothing to delete"
fi

command -v node >/dev/null || fail "node is missing"
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest is missing (nightly clean?)"

STATE=$(adb -s 8f7ada76 get-state 2>&1)
[ "$STATE" = "device" ] || fail "OnePlus 3T is not attached: $STATE"
echo "3T: $STATE"

echo "PREFLIGHT OK"
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does | This plan |
| --- | --- | --- |
| `device/updates.ts` | The whole update check and the store link | Step 1 rewrites it; step 3 adds its test |
| `app/index.tsx` | Calls `checkForUpdates()` in the 1500 ms settling timeout, and renders `ModalUpdate` | Step 2 changes the Update button's action only |
| `components/modals/Update.tsx` | The prompt | **Never edited.** It becomes iOS-only by where it renders, not by changing it |
| `stores/version.ts` | `app_installed_version`, the upgrade detection | **Never edited** (decision 6) |
| `shared/versionUtils.ts` | `compareVersions`, `isNewerVersion` | **Never edited.** iOS keeps using it |
| `shared/constants.ts` | `TIME_CONSTANTS`, including the two session-30 constants | Unchanged: both stay, iOS-only in effect |
| `package.json` | Dependencies | Step 1 adds `expo-in-app-updates` |
| `releases.json` | The dead file | Step 4 deletes it |
| `README.md`, `ai/AGENTS.md`, `ai/ISSUES.md` | Docs naming the file | Step 4 updates them |

Anchors, saved in full under `scripts/anchors/`:

- `1-1.txt`: `device/updates.ts` lines 1 to 25 at "Planned at", imports through `DOTTED_NUMBERS`. Step 1 replaces it.
- `2-1.txt`: the `handleUpdate` function in `app/index.tsx`. Step 2 changes its body.
- `2-2.txt`: the `ModalUpdate` JSX block with its gating comment. Step 2 reads it to confirm the gate is unchanged.

### How the pieces interact

| When | What runs | After this plan |
| --- | --- | --- |
| Cold launch, 1500 ms in | `app/index.tsx` calls `checkForUpdates()`, not awaited | unchanged |
| Inside `checkForUpdates`, both platforms | the 24-hour throttle, before anything else | unchanged |
| Then, on Android | **`startNativeUpdate()`**: asks Play, and if Play says yes, starts the flexible flow. Answers `false` always | new |
| Then, on iOS | iTunes Lookup, `isNewerVersion`, answers true or false | unchanged |
| On resolve | `setPopupUpdateEnabled(hasUpdate)` | unchanged, and on Android `hasUpdate` is always `false`, so no modal |
| User taps Update (iOS only) | `handleUpdate` opens the App Store | step 2 makes this iOS-only |

**Why `checkForUpdates()` answers `false` on Android even when an update exists.** Its boolean means "show our
modal", and on Android our modal must never show, because Play's overlay is already on screen. Collapsing the two
meanings into one boolean is what keeps the call site and the throttle identical on both platforms.

### Existing tests

`device/__tests__/updates.test.ts`, 33 tests. Step 1 deletes the Play-scrape tests, because the scrape is gone, and
adds the native-flow tests. The four `readPlayListingVersion` tests go with the function. The iOS tests, the throttle
tests, the stamp tests and the timeout tests all stay, because iOS keeps that path.

`__tests__/app/index.test.tsx` mocks `@/device/updates` wholesale, so its seven prompt tests keep passing unchanged;
step 2 adds one test there for the platform-split button.

### Why the obvious simple fix is wrong

**Calling `checkAndStartUpdate()` from `app/index.tsx` directly** looks simpler and breaks the throttle: it would ask
Play on every cold launch, and issue #3 in the package's tracker is a user asking exactly that. Routing it through
`checkForUpdates()` keeps one throttle for both platforms.

**A lazy `require()` of the native module inside a try/catch** is the pattern `modules/widgetrefresh/index.ts` uses,
and it cannot reach 100% coverage: the catch is unreachable once the package is installed. Measured in the scratch
worktree at 84.21% statements, 75% branches, with the catch line uncovered. A static import plus a virtual Jest mock
reaches 100% (section 5).

## 5. Design

**The invariant, in one sentence a test can check:** on Android `checkForUpdates()` asks Play and never resolves
`true`, so `ModalUpdate` never renders there; on iOS it asks the App Store and resolves `true` exactly when the store
version is newer.

### The approach

One reader, split by platform at exactly one place:

```
checkForUpdates()
  throttle (24h, both platforms, unchanged)
  Android -> startNativeUpdate() -> Play decides, Play's overlay, flexible flow -> always returns false
  iOS     -> iTunes Lookup -> isNewerVersion -> true or false -> our modal
```

`startNativeUpdate()` is its own exported function so it can be tested against a virtual mock and broken by a break
script without a device.

### Alternatives rejected

| Alternative | Why not |
| --- | --- |
| Keep the Play HTML scrape | An undocumented Google-controlled key, absent entirely for WhatsApp, Spotify and YouTube. Native is the sanctioned API |
| Immediate update flow | Blocks the app until the user updates; wrong for a prayer-times app (decision 3) |
| Build a download-progress UI | The package already auto-installs on `DOWNLOADED`; a progress bar is custom code the owner asked to avoid |
| Use the package's iOS half too | Apple has no in-app mechanism, so it only replaces our modal with its own App Store sheet, and its version compare was once a string compare (issue #16). Our `compareVersions` is numeric and already tested |
| Lazy `require()` of the native module | Cannot reach 100% coverage; measured at 84.21% |
| Drop the stored-version flow on Android | Reintroduces ISSUES #34 (decision 6) |
| Delete `TIME_CONSTANTS.UPDATE_RETRY_MS` and `UPDATE_FETCH_TIMEOUT_MS` | iOS still uses both |

### Concurrency trace

`checkForUpdates` has one caller and is never awaited, so the only interleaving is a second launch inside the window,
which the throttle refuses before any work. What changes per path:

| Path | Before | After |
| --- | --- | --- |
| Android, window open, update exists | scrape, compare, modal | Play asked, Play's overlay, background download, auto-install. No modal |
| Android, window open, no update | scrape, compare, no modal | Play asked, answers no, nothing shown |
| Android, Play rejects (Binder died, low disk) | n/a | caught, logged, nothing shown |
| Android, side-loaded build | scrape answered a version | Play answers `UPDATE_NOT_AVAILABLE`, nothing shown |
| iOS, any | unchanged | unchanged |

### The stamp, on Android

Android still stamps `popup_update_last_check`, because the throttle is shared. A Play rejection takes the failure
stamp from session 30, so a phone that could not reach Play retries in an hour rather than a day. That reuses the
session-30 mechanism exactly and adds no new rule.

### What the scratch worktree proved

Built in `~/athan-device-sweep/worktrees/plan-31` at `uat-2`, then deleted:

| Proof | Result |
| --- | --- |
| `expo-in-app-updates@0.12.0` installs into this tree | `yarn add` exit 0, patches reapplied (`expo-background-task`, `expo-widgets` both ✔), `Done in 51.08s` |
| Autolinking resolves it | `npx expo-modules-autolinking search` lists `expo-in-app-updates` at `0.12.0` |
| A static import compiles without the package | `npx tsc --noEmit` exit 0 |
| The lazy-require pattern CANNOT reach 100% | 84.21% statements, 75% branches, the catch line uncovered |
| A static import plus a virtual mock DOES reach 100% | **100% statements, branches, functions and lines**, 4 tests |
| It still reaches 100% once the real package is installed | re-run with `node_modules/expo-in-app-updates` present: 100% on all four |
| The iOS branch is reachable in tests | only through a `beforeAll` block that `jest.resetModules()` then `jest.doMock`s `react-native`, `@/shared/logger` and the package together. A bare `jest.isolateModules` fails, because the module-level `IS_ANDROID` is already evaluated |

### Design review

Reviewed by this planning session on 2026-09-27, reading the design cold and attacking it. Four findings, all applied:

1. **The first draft returned the package's own boolean from `checkForUpdates` on Android**, which would have rendered
   our modal on top of Google's overlay. Fixed: Android always answers `false`, and a break pins it.
2. **The iOS-branch test is the fragile one**, because a module-level `Platform.OS` constant is evaluated once. The
   plan gives the exact `beforeAll` shape that works, since two competent implementers would otherwise write the
   failing `isolateModules` version.
3. **Deleting `releases.json` in the same commit as the code change would be wrong**: the standing rule wants the
   removal shipped first, and a separate commit is also revertible on its own. It is step 4.
4. **A Play rejection must not be silent to the developer but must be silent to the user.** `logger.warn` plus
   `false`, never an alert, matching how `getStoreVersion` already treats a failed fetch.

## 6. Steps

- [x] Step 1: DONE in `31b5f511`
- [x] Step 2: DONE in `dd052bf2`
- [x] Step 3: DONE in `139b7b98`
- [x] Step 4: DONE in `365b9e4c`

---

### Step 1: Android asks Play; the scrape and the Play store links are deleted

0. **Anchor check.** Expect `1`:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/31-native-in-app-updates/scripts/anchors/1-1.txt device/updates.ts
   ```

1. **Goal.** On Android the update check asks Play and starts the native flexible flow; the HTML scrape and both Play
   store URLs are gone.

2. **Branch.** `git checkout -b feat/31-native-android-updates uat-2`

3. **Files.**
   - `package.json`, `yarn.lock` (the dependency)
   - `device/updates.ts` (changed)
   - `device/__tests__/updates.test.ts` (changed)
   - `app.json` (version bump only)
   - `ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`

   Nothing else. `stores/version.ts`, `shared/versionUtils.ts` and `components/modals/Update.tsx` are forbidden.

4. **Tests first (red).** Suite `device/__tests__/updates.test.ts`, existing.

   **Install the dependency first**, because the suite imports it:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   yarn add expo-in-app-updates@0.12.0
   ```

   Expected: exit 0, and `node_modules/expo-in-app-updates/package.json` reads `"version": "0.12.0"`. If it resolves
   anything else, STOP (section 2.2, item 5).

   **Then immediately verify the install did not re-nest `@expo/ui`**, because this session's own planning hit exactly
   that and it blanks every widget:

   ```bash
   npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: `3 passed`. If it fails with `(0 , n.memo) is not a function`, run
   `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile` and rerun it. That is a known
   remedy from `ai/AGENTS.md`, not a finding.

   **Deleted**, because the scrape is gone: the four `readPlayListingVersion` tests, `reads the version from the Play
   listing on Android`, `reads the Play listing on Android whatever the environment`, `returns false when the Play
   listing carries no version`, `returns false when the Play listing version is not a dotted number`, `opens Play
   Store URL on Android`, `falls back to the Play web page when no Play client handles the intent`, and `logs error
   when Linking.openURL throws on Android`.

   **Unchanged**: every iOS test, the throttle tests, the stamp tests and the timeout tests.

   The Android describe is rewritten around the native flow. The mock the plan gives verbatim, because its shape is
   what makes 100% reachable:

   ```ts
   jest.mock(
     'expo-in-app-updates',
     () => ({
       checkForUpdate: () => mockCheckForUpdate(),
       startUpdate: (isImmediate?: boolean) => mockStartUpdate(isImmediate),
     }),
     { virtual: true }
   );
   ```

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `asks Play and starts the update when one is available` | Android uses the native API, not a fetch | `mockCheckForUpdate` resolves `{ updateAvailable: true }`, `mockStartUpdate` resolves `true` | `mockStartUpdate` called once with no argument; `mockFetch` NOT called; result `false` |
   | `never shows our modal on Android, even when Play has an update` | the invariant: Google's overlay and our modal can never stack | same as above | `checkForUpdates()` resolves **`false`** |
   | `does nothing when Play reports no update` | no prompt when up to date | `mockCheckForUpdate` resolves `{ updateAvailable: false }` | `mockStartUpdate` not called; result `false` |
   | `shows nothing when Play rejects the check` | a Play failure is invisible to the user (issue #19's Binder/low-disk cases) | `mockCheckForUpdate` rejects with `new Error('AppUpdateService : Binder has died')` | result `false`; `mockLoggerWarn` called with `'Failed to start native update:'` and that error; no throw |
   | `stamps a Play failure an hour back so the day is not lost` | the session-30 retry rule still applies on Android | `mockCheckForUpdate` rejects; clock pinned at `PINNED_NOW` | `mockSetPopupUpdateLastCheck` called with `PINNED_NOW - ONE_DAY_MS + RETRY_MS` |
   | `stamps a successful Play check with now` | a check that reached Play costs the full day | `mockCheckForUpdate` resolves `{ updateAvailable: false }`; clock pinned | `mockSetPopupUpdateLastCheck` called with `PINNED_NOW` |
   | `never asks Play on iOS` (in the iOS describe) | the platform split holds the other way | default iOS platform, iTunes fixture | `mockCheckForUpdate` not called |

   Command:

   ```bash
   npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit
   ```

   Expected BEFORE the change: the new Android tests fail, because `checkForUpdates` still fetches. The first failure
   line is an `expect(jest.fn()).toHaveBeenCalledTimes(expected)` mismatch on `mockStartUpdate` showing
   `Received number of calls: 0`. If they pass, STOP.

5. **Change.** A `(specified)` step.

   **`device/updates.ts`.** Delete `PLAY_LISTING_URL`, `PLAY_VERSION_KEY`, `DOTTED_NUMBERS`, `readPlayListingVersion`,
   `PLAY_STORE_URL` and `PLAY_STORE_WEB_URL`. Keep `ITUNES_LOOKUP_URL` and `APP_STORE_URL` exactly as they are.

   Add the import, at the top of the external group:

   ```ts
   import * as InAppUpdates from 'expo-in-app-updates';
   ```

   Add one exported function:

   - **Name and signature:** `export const startNativeUpdate = async (): Promise<void>`
   - **What it does:** asks Play whether an update is available, and when it is, starts the flexible flow.
   - **What it answers:** nothing. Play owns the UI from here, so there is no boolean for the app to act on.
   - **What it must never do:** never throw, never pass an argument to `startUpdate` (which selects flexible by
     default, and lets Play Console's `updatePriority()` escalate later), never run on iOS, and never show the user
     anything of ours.
   - **Log line, exact text:** `logger.warn('Failed to start native update:', error);`

   **Change `getStoreVersion`** to keep its signature, `(): Promise<string | null | false>`, and its iOS body exactly
   as it is. Its Android body is deleted: on Android it is never called.

   **Change `checkForUpdates`** to keep its signature, `(): Promise<boolean>`, its throttle and both stamps, and to
   branch once:

   - on Android: `await startNativeUpdate()`, stamp `now`, and return `false`;
   - on iOS: exactly today's body;
   - a throw from either path still takes the failure stamp and returns `false`.

   `startNativeUpdate` swallowing its own errors means the Android path stamps `now`, not the failure stamp, unless
   the stamp itself throws. The test `stamps a Play failure an hour back so the day is not lost` therefore requires
   the Android branch to take the failure stamp when Play rejects, so `startNativeUpdate` must answer whether it
   reached Play. **Correction to the contract above, and this is the binding form:**

   - **Signature:** `export const startNativeUpdate = async (): Promise<boolean>`
   - **What it answers:** `true` when Play answered, whether or not an update existed; `false` when Play could not be
     reached or rejected the request.
   - Everything else in the contract is unchanged.

   Then `checkForUpdates` on Android stamps `now` when `startNativeUpdate()` answered `true`, and takes the failure
   stamp when it answered `false`, and returns `false` either way.

   **`openStore`** keeps its name and signature, `(): Promise<void>`, and becomes iOS-only: it opens `APP_STORE_URL`
   and logs `logger.error('Failed to open store URL:', error);` on failure. On Android it does nothing at all, because
   Play's flow is the destination.

   Comments: one line saying WHY Android answers `false`, one saying WHY no argument is passed to `startUpdate`.
   Nothing else.

6. **Green.** The same command. Expected `Tests:` reports `28 passed, 28 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings` both exit 0. Then the coverage check, which is this session's headline
   requirement:

   ```bash
   npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit \
     --coverage --collectCoverageFrom='device/updates.ts' --coverageReporters=text
   ```

   Expected: `100` in all four columns for `updates.ts`. Anything less is section 2.2, item 6.

7. **Breaks.** Save to `$TMPDIR/breaks-31-1.sh`, run with `bash` from the repository root.

   ```bash
   #!/usr/bin/env bash
   set -u
   SRC=device/updates.ts
   TESTS=device/__tests__/updates.test.ts
   ALL_AS_EXPECTED=1

   run_break() {
     local label="$1" subst="$2"
     cp "$SRC" "$SRC.bak"
     perl -0pi -e "$subst" "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $label"
       ALL_AS_EXPECTED=0
       mv "$SRC.bak" "$SRC"
       return
     fi
     if npx jest "$TESTS" --watchman=false --selectProjects=unit > "$TMPDIR/break-31-1-$label.log" 2>&1; then
       echo "BREAK NOT CAUGHT: $label"
       ALL_AS_EXPECTED=0
     else
       echo "BREAK CAUGHT: $label"
     fi
     mv "$SRC.bak" "$SRC"
   }

   # Our modal must never stack on Google's overlay.
   run_break androidShowsOurModal 's|\QawaitedNative\E|true|'
   # Android must ask Play, never fetch.
   run_break androidSkipsPlay 's|\Qawait InAppUpdates.checkForUpdate()\E|{ updateAvailable: false }|'
   # A Play rejection must be invisible to the user, not thrown.
   run_break playErrorEscapes "s|\\Qlogger.warn('Failed to start native update:', error);\\E|throw error;|"
   # Flexible is the flow: passing true would make it immediate and block the app.
   run_break immediateFlow 's|\QInAppUpdates.startUpdate()\E|InAppUpdates.startUpdate(true)|'
   # iOS must keep its own reader.
   run_break iosLosesItunes 's|\Q&country=gb\E||'

   echo "ALL AS EXPECTED: $ALL_AS_EXPECTED"
   ```

   **`androidShowsOurModal` targets a name the contract gives.** Name the boolean that holds
   `startNativeUpdate()`'s answer `awaitedNative`, so the substitution has a stable target. This is a name the plan
   gives, not the executor's choice.

   Expected: five `BREAK CAUGHT`, then `ALL AS EXPECTED: 1`.

   | Break | Tests expected to fail |
   | --- | --- |
   | `androidShowsOurModal` | `never shows our modal on Android, even when Play has an update` |
   | `androidSkipsPlay` | `asks Play and starts the update when one is available` |
   | `playErrorEscapes` | `shows nothing when Play rejects the check` |
   | `immediateFlow` | `asks Play and starts the update when one is available` |
   | `iosLosesItunes` | `fetches from iTunes API when production iOS`, `reads the App Store version whatever the environment` |

8. **Version and commit.**

   ```bash
   git show uat-2:package.json | python3 -c 'import json,sys;v=json.load(sys.stdin)["version"].split(".");v[2]=str(int(v[2])+1);print(".".join(v))'
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`).

   Add by name: `package.json`, `yarn.lock`, `device/updates.ts`, `device/__tests__/updates.test.ts`, `app.json`,
   `ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`.

   ```bash
   cat > $TMPDIR/msg31-1.txt <<'EOF'
   <VERSION> - feat(updates): Android updates through Play itself, and the HTML scrape is deleted

   Session 30 had Android read its version by scraping an undocumented key out
   of the Play listing page. That key is absent entirely for WhatsApp, Spotify
   and YouTube, so the contract was Google's to break at any time.

   Android now asks Play through the sanctioned in-app updates API, via
   expo-in-app-updates 0.12.0. Play decides whether an update exists, shows its
   own overlay, downloads in the background while the app stays usable, and the
   library completes the install on DOWNLOADED, so there is no second prompt
   and no progress UI to build.

   The flow is FLEXIBLE, never immediate: a prayer-times app must not be blocked
   by an update. No argument is passed to startUpdate, which selects flexible
   and lets Play Console's updatePriority escalate later with no app change.

   checkForUpdates keeps its name, signature, single call site and 24-hour
   throttle, and on Android always answers false: its boolean means "show our
   modal", and our modal must never stack on Google's overlay.

   iOS is untouched and keeps the iTunes reader, because Apple has no in-app
   update mechanism at all. Both Play store URLs go with the scrape, since
   Play's own flow is the destination now.

   The package is pinned to an exact 0.12.0, which carries the fix for the
   SendIntentException crash Play Console flagged in production (issues 20, 21
   and 24), verified present in the installed source.

   100% coverage without a device, through a virtual jest mock. The lazy
   require() pattern used by modules/widgetrefresh cannot reach it: its catch is
   unreachable once the package is installed, measured at 84.21% statements.
   EOF
   git commit -F $TMPDIR/msg31-1.txt
   ```

   Run in the background with its log. The last `Tests:` line ends `passed, <n> total`, and four `100%` lines appear.

9. **Review.** Read `git show <sha>` back cold against this checklist:

   - `startNativeUpdate` has the plan's name and final signature, `Promise<boolean>`, never throws, and passes NO
     argument to `startUpdate`.
   - `checkForUpdates` still returns `Promise<boolean>` and still has one call site.
   - On Android it returns `false` on every path.
   - `getStoreVersion` and the iTunes URL are unchanged, `country=gb` included.
   - `openStore` opens only the App Store, and does nothing on Android.
   - No `readPlayListingVersion`, `PLAY_VERSION_KEY`, `DOTTED_NUMBERS`, `PLAY_LISTING_URL`, `PLAY_STORE_URL` or
     `PLAY_STORE_WEB_URL` remains. Run `grep -n "play.google.com\|market://\|readPlayListing" device/updates.ts` and
     expect nothing.
   - `package.json` pins `expo-in-app-updates` to an exact `0.12.0`, with no `^` or `~`.
   - `yarn.lock` changed only by adding this package.
   - `stores/version.ts`, `shared/versionUtils.ts` and `components/modals/Update.tsx` are NOT in the diff.
   - Comments explain why only.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff feat/31-native-android-updates \
      -m "Merge feat/31-native-android-updates into uat-2: session 31 step 1, reviewed"
    ```

11. **Done when.** The suite prints `28 passed, 28 total`; the coverage command prints `100` four times;
    `grep -c "play.google.com" device/updates.ts` prints `0`. Tick step 1.

---

### Step 2: the Update button is iOS-only

0. **Anchor check.** Both must print `1`:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   for a in 2-1 2-2; do
     python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
       "ai/plans/31-native-in-app-updates/scripts/anchors/$a.txt" app/index.tsx
   done
   ```

1. **Goal.** The modal's Update button opens the App Store, which is an iOS-only action, and the modal can never be
   reached on Android.

2. **Branch.** `git checkout -b feat/31-ios-only-update-button uat-2`

3. **Files.** `app/index.tsx`, `__tests__/app/index.test.tsx`, `app.json`, `package.json`, the three plan files.

4. **Tests first (red).** Suite `__tests__/app/index.test.tsx`, existing. The seven existing prompt tests must NOT
   change.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `never offers the update prompt on Android, because Play owns that flow` (new) | the platform split is visible at the screen, not only in the device layer | `onPlatform('android')` from `@/__tests__/harness`; `checkForUpdates` mocked to resolve `false`, which is what Android returns; advance the settling window | `screen.queryByText(UPDATE_PROMPT_TITLE)` is not on screen |

   Command:

   ```bash
   npx jest __tests__/app/index.test.tsx --watchman=false --selectProjects=components
   ```

   Expected BEFORE the change: this test PASSES already, because Android resolves `false` after step 1. **That is
   expected and is not a section 2.2 item 3 stop**, because the test pins a guarantee rather than driving the change;
   the step's real change is `handleUpdate`, which the break script covers. Say so in `LOG.md`.

5. **Change.** A `(specified)` step.

   `handleUpdate` in `app/index.tsx` keeps its name and shape. Its body calls `openStore()` then
   `setPopupUpdateEnabled(false)`, exactly as today. **No behavioural change is needed**, because `openStore` became
   iOS-only in step 1.

   The only edit is the comment above the `ModalUpdate` block, which must now say why the modal is iOS-only. Replace
   the existing comment line with exactly:

   ```tsx
   {/* iOS only in effect: Android never resolves an update here, because Play's own overlay owns that flow */}
   ```

   Keep the `visible` expression exactly as it is.

6. **Green.** The same command; every test passes, including the new one. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-31-2.sh`.

   ```bash
   #!/usr/bin/env bash
   set -u
   SRC=app/index.tsx
   TESTS=__tests__/app/index.test.tsx
   ALL_AS_EXPECTED=1

   run_break() {
     local label="$1" subst="$2"
     cp "$SRC" "$SRC.bak"
     perl -0pi -e "$subst" "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $label"; ALL_AS_EXPECTED=0; mv "$SRC.bak" "$SRC"; return
     fi
     if npx jest "$TESTS" --watchman=false --selectProjects=components > "$TMPDIR/break-31-2-$label.log" 2>&1; then
       echo "BREAK NOT CAUGHT: $label"; ALL_AS_EXPECTED=0
     else
       echo "BREAK CAUGHT: $label"
     fi
     mv "$SRC.bak" "$SRC"
   }

   # The modal must never stack on What's New or Help.
   run_break modalStacks 's|\QupdateAvailable && !whatsNewVisible && !helpVisible\E|updateAvailable|'
   # Pressing Update must open the store.
   run_break updateDoesNothing 's|\QopenStore();\E||'

   echo "ALL AS EXPECTED: $ALL_AS_EXPECTED"
   ```

   Expected: two `BREAK CAUGHT`, then `ALL AS EXPECTED: 1`.

8. **Version and commit.** The same version command. Add `app/index.tsx`, `__tests__/app/index.test.tsx`, `app.json`,
   `package.json`, the three plan files.

   ```bash
   cat > $TMPDIR/msg31-2.txt <<'EOF'
   <VERSION> - feat(updates): the update prompt is iOS-only, and says so

   Android resolves no update at the screen layer now, because Play's overlay
   owns that flow, so ModalUpdate is reachable on iOS alone. The component is
   unchanged: what makes it iOS-only is where it can be reached, not a prop.

   A test pins that guarantee at the screen rather than only in the device
   layer, so a later change that let Android resolve true would fail here as
   well as there.
   EOF
   git commit -F $TMPDIR/msg31-2.txt
   ```

9. **Review.** `components/modals/Update.tsx` is NOT in the diff; the `visible` expression is unchanged; the comment
   matches the plan verbatim; the seven existing prompt tests are byte-identical.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff feat/31-ios-only-update-button \
      -m "Merge feat/31-ios-only-update-button into uat-2: session 31 step 2, reviewed"
    ```

11. **Done when.** The components suite passes; `git diff uat-2 -- components/modals/Update.tsx` is empty. Tick step 2.

---

### Step 3: the package's own contract is pinned by a test

0. **Anchor check.** None: this step adds a new file.

1. **Goal.** A silent upstream change to the package's API surface fails the suite instead of failing on a user's
   phone, which is the only guard available for a native module this project cannot run on its devices.

2. **Branch.** `git checkout -b test/31-in-app-updates-contract uat-2`

3. **Files.** `device/__tests__/inAppUpdatesContract.test.ts` (new), `app.json`, `package.json`, the three plan files.

4. **Tests first (red).** Suite is new. It imports the REAL package, never a mock, and asserts only its shape.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `the installed package is exactly 0.12.0` | the pinned version is what is installed, since 0.11.0 had Kotlin compile errors (issue #31) | `require('expo-in-app-updates/package.json').version` | equals `'0.12.0'` |
   | `exposes the two functions the app calls` | a rename upstream fails here, not on a phone | the real module | `typeof checkForUpdate` and `typeof startUpdate` are both `'function'` |
   | `declares both platforms to autolinking` | the Android module is actually linked | `require('expo-in-app-updates/expo-module.config.json')` | `platforms` contains `android`; `android.modules` contains `expo.modules.inappupdates.ExpoInAppUpdatesModule` |

   Command:

   ```bash
   npx jest device/__tests__/inAppUpdatesContract.test.ts --watchman=false --selectProjects=unit
   ```

   Expected BEFORE the file exists: `No tests found`. After writing it, all three pass immediately, because they
   describe what is installed. **This suite has no red phase, by design**: it is a contract pin, not a behaviour
   change, and its breaks in part 7 are what prove it guards. Record that in `LOG.md`.

5. **Change.** None to production code. The suite carries a doc comment saying it exists because the native module
   cannot be exercised on this project's devices.

6. **Green.** `Tests: 3 passed, 3 total`. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`.

7. **Breaks.** This step's break edits the installed package rather than our source, so it restores it exactly.

   ```bash
   #!/usr/bin/env bash
   set -u
   SRC=node_modules/expo-in-app-updates/package.json
   TESTS=device/__tests__/inAppUpdatesContract.test.ts
   ALL_AS_EXPECTED=1

   run_break() {
     local label="$1" subst="$2"
     cp "$SRC" "$SRC.bak"
     perl -0pi -e "$subst" "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $label"; ALL_AS_EXPECTED=0; mv "$SRC.bak" "$SRC"; return
     fi
     if npx jest "$TESTS" --watchman=false --selectProjects=unit > "$TMPDIR/break-31-3-$label.log" 2>&1; then
       echo "BREAK NOT CAUGHT: $label"; ALL_AS_EXPECTED=0
     else
       echo "BREAK CAUGHT: $label"
     fi
     mv "$SRC.bak" "$SRC"
   }

   # A version drift must fail here, not on a user's phone.
   run_break versionDrift 's|\Q"version": "0.12.0"\E|"version": "0.11.0"|'

   echo "ALL AS EXPECTED: $ALL_AS_EXPECTED"
   ```

   Expected: `BREAK CAUGHT: versionDrift`, then `ALL AS EXPECTED: 1`. Afterwards
   `git status --porcelain node_modules` must print nothing, and
   `node -e "console.log(require('expo-in-app-updates/package.json').version)"` must print `0.12.0`.

8. **Version and commit.** Add the new test file, `app.json`, `package.json`, the three plan files.

   ```bash
   cat > $TMPDIR/msg31-3.txt <<'EOF'
   <VERSION> - test(updates): pin the in-app-updates package contract

   This project cannot run Play In-App Updates on either of its devices: a
   side-loaded build always answers UPDATE_NOT_AVAILABLE, and the flow only
   works for a build Play itself installed. So the usual proof, running it, is
   unavailable until something reaches an internal test track.

   This suite is the guard that is available. It imports the real package, not a
   mock, and fails if the version drifts, if either function the app calls is
   renamed, or if the Android module stops being declared to autolinking.

   The version pin is not pedantry: 0.11.0 shipped Kotlin compile errors that
   broke the Android build outright.
   EOF
   git commit -F $TMPDIR/msg31-3.txt
   ```

9. **Review.** The suite mocks nothing; it asserts shape only, never behaviour; `node_modules` is not in the diff.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff test/31-in-app-updates-contract \
      -m "Merge test/31-in-app-updates-contract into uat-2: session 31 step 3, reviewed"
    ```

11. **Done when.** `Tests: 3 passed`; the break is caught; `node_modules` is clean. Tick step 3.

---

### Step 4: `releases.json` is deleted, and every live rule that names it

0. **Anchor check.** `[ -f releases.json ]` must be true; the pre-flight checks it.

1. **Goal.** The file the owner never wants to touch again is gone from the repository, and no live rule still tells a
   future session to protect it.

2. **Branch.** `git checkout -b chore/31-delete-releases-json uat-2`

3. **Files.**
   - `releases.json` (DELETED)
   - `README.md`, `ai/AGENTS.md`, `ai/ISSUES.md`, `ai/plans/EXECUTOR-BRIEF.md`, `ai/plans/PLANNER-BRIEF.md`,
     `ai/plans/AUDITOR-BRIEF.md`, `ai/plans/TEMPLATE.md` (the live rules naming it)
   - `shared/versionUtils.ts` (one stale comment)
   - `app.json`, `package.json`, the three plan files

   Historical plan folders keep their text: they record what was true when they ran.

4. **Tests first (red).** None. This step deletes a file no code reads and edits prose. `yarn validate` at commit time
   is the check, and `shared/versionUtils.ts`'s own suite must stay green after the comment edit.

   **Before deleting, prove nothing reads it.** Run, and expect no output:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   grep -rn "releases.json\|githubusercontent" api app components device hooks shared stores widgets modules
   ```

   The one match will be the comment in `shared/versionUtils.ts:18`, which this step rewrites. If anything else
   matches, STOP.

5. **Change.**

   Delete the file with `git rm releases.json`.

   In `shared/versionUtils.ts`, the comment on `toVersionParts` names `releases.json` as a source of untrusted
   version strings. Replace that one sentence so it names what feeds the function now, and change nothing else in the
   file:

   ```ts
    * the app: a `v` prefix, a missing value, and a non-numeric segment.
   ```

   followed by the existing `Number('v1')` sentence, with the final clause rewritten to:

   ```ts
    * the update prompt feeds this whatever the iTunes lookup returns, which the app does not control.
   ```

   In `ai/AGENTS.md`, the `releases.json is untouchable` block is replaced in full by:

   ```markdown
   ### `releases.json` is deleted (owner rule 2026-09-12, closed 2026-09-27)

   The file is gone. Sessions 30 and 31 replaced it: iOS reads the App Store through iTunes Lookup, and Android asks
   Play through the in-app updates API. **Never recreate it, and never add a hand-edited release file of any kind.**
   🐋  "I don't ever want to touch released on Jason ever again."
   ```

   In `ai/plans/EXECUTOR-BRIEF.md`, `PLANNER-BRIEF.md`, `AUDITOR-BRIEF.md` and `TEMPLATE.md`, each has a rule
   forbidding edits to `releases.json`. In each, replace the words `releases.json` with `a hand-edited release file`
   so the prohibition survives the file's deletion, and change nothing else on those lines.

   In `README.md`, delete any line documenting the file, and add nothing.

   In `ai/ISSUES.md`, append one sentence to #35's `releases.json is unread and NOT yet deleted` paragraph, and change
   its heading words `NOT yet deleted` to `deleted in session 31`:

   ```markdown
   **Session 31 deleted it** (2026-09-27), after measuring that every version in it was `1.0.0`, so it could never
   prompt any user of any shipped version.
   ```

6. **Green.** `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0, and
   `npx jest shared/__tests__/versionUtils.test.ts --watchman=false --selectProjects=unit` passes unchanged.

7. **Breaks.** None, and the reason is written here rather than left blank: this step deletes a file and edits prose,
   so there is no decision in code for a substitution to break. The guard is `grep`:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   test ! -f releases.json && echo "FILE GONE"
   grep -rn "releases.json" api app components device hooks shared stores widgets modules | grep -v "hand-edited" || echo "NO CODE REFERENCES"
   ```

   Expected: `FILE GONE`, then `NO CODE REFERENCES`.

8. **Version and commit.**

   ```bash
   cat > $TMPDIR/msg31-4.txt <<'EOF'
   <VERSION> - chore(updates): delete releases.json

   The owner never wants to edit it again, and after sessions 30 and 31 nothing
   reads it: iOS asks the App Store, Android asks Play.

   Deleting it is safe, and this is the measurement rather than an assumption.
   Every version in the file was 1.0.0 while the live App Store build was 1.5.1,
   so isNewerVersion(installed, "1.0.0") is false for every version this app has
   ever shipped. An older build still fetching the file gets a 404, and
   getStoreVersion already answers false on any fetch failure. So no user sees
   any change.

   The standing rules that protected it now forbid a hand-edited release file of
   any kind, so the prohibition outlives the filename.
   EOF
   git commit -F $TMPDIR/msg31-4.txt
   ```

9. **Review.** `releases.json` is deleted and not merely emptied; no rule lost its prohibition, each now naming a
   hand-edited release file; no historical plan folder was edited; `shared/versionUtils.ts` changed by comment only,
   with its code byte-identical.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/31-delete-releases-json \
      -m "Merge chore/31-delete-releases-json into uat-2: session 31 step 4, reviewed"
    ```

11. **Done when.** `test ! -f releases.json`; `yarn validate` green at 100%. Tick step 4.

## 7. Device proof

**Play In-App Updates cannot be exercised on either device, and saying so plainly is part of the proof.** The flow
only answers for a build Play itself installed; `dumpsys package com.mugtaba.athan` on the 3T shows no
`installerPackageName`, which is what a side-load looks like, so `checkForUpdate` will answer
`UPDATE_NOT_AVAILABLE` there however correct the code is. That is why step 3 exists.

What the devices DO prove:

1. **The app still launches and works with the new native module linked**, which is the real risk of adding a native
   dependency. A module that fails to link crashes at startup.
2. **Nothing of ours prompts on Android**, which is the invariant.
3. **iOS is unchanged.**

### Safety

Read the alarm dump before anything, and change no clock:

```bash
adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" > ~/athan-device-sweep/session31/alarms-before.txt
```

Expect the app's armed alarms, including the one every 3T dump shows at `when 2104803640505` (year 2036, not
identified). No clock is changed in this session, so no armed alarm is fired by it. Automatic time is never turned
off.

### Android

```bash
zsh ~/athan-device-sweep/session3/bin/build-mock.zsh uat-2 mocks/simple.ts ~/athan-device-sweep/session31/athan-31.apk
```

Run in the background with its log; success ends `BUILD-MOCK OK`. **The build itself is a proof**: it runs a fresh
`expo prebuild`, so a native module that cannot autolink or compile fails here.

Verify the native module reached the APK before installing:

```bash
AAPT2=~/Library/Android/sdk/build-tools/37.0.0/aapt2
"$AAPT2" dump strings ~/athan-device-sweep/session31/athan-31.apk | grep -c "inappupdates"
```

Expect a non-zero count. **Check that `$AAPT2` exists first**: `ai/AGENTS.md` records that `aapt` is absent on this
machine and a `grep -c` on a missing command returns `0`, which is indistinguishable from a real zero.

Install, then launch with the HOME / `am kill` / doubled `am start` ritual. **`build-mock.zsh` installs under
`com.mugtaba.athan`, not `com.mugtaba.athan.fleettest`.**

If `adb install` hangs with no staging directory, Play Protect has taken focus: session 30 lost ten minutes to it.
Check `dumpsys window | grep mCurrentFocus`, and if it shows `PlayProtectDialogsActivity`, run
`settings put global verifier_verify_adb_installs 0`, force-stop `com.android.vending`, retry, **and restore the
setting to `1` afterwards**.

Then read the logs:

```bash
adb -s 8f7ada76 logcat -d | grep -E "Failed to start native update|Failed to check for updates" \
  > ~/athan-device-sweep/session31/android-update-log.txt
wc -l < ~/athan-device-sweep/session31/android-update-log.txt
```

Expect `0` or a single `Failed to start native update` line. **Both readings pass**, and the distinction is the
point: `0` means Play answered, and one warning line means Play refused a side-loaded build, which is the expected
answer on this hardware. A CRASH is the failure, not a warning. Record which one appeared.

Confirm nothing of ours prompted:

```bash
adb -s 8f7ada76 exec-out screencap -p > ~/athan-store-update-shots/android-31-home.png
```

Read it: the home screen with the prayer list, no error screen, and no update modal.

### iOS

Build and run on the booted simulator through xcodebuildmcp against `ios/Athan.xcworkspace`, scheme `Athan`,
configuration `Debug`. Expect `status SUCCEEDED`. Screenshot the home screen to
`~/athan-store-update-shots/ios-31-home.png` and read it.

**Note the limit session 30 recorded:** `ios/` is a gitignored prebuild artifact, so the simulator app carries a
stale `CFBundleShortVersionString` and a Debug build loads JS from Metro. It proves the code runs; it does not prove
the installed-version string.

### Screenshots

Save every screenshot under `~/athan-store-update-shots/` and open the folder, as the owner asked in session 30. Read
each one; where the model cannot see images, call `vision` with the path and the question in section 11.

### The phone is left

On this session's mock build, automatic time on, `verifier_verify_adb_installs` at `1`.

## 8. Records

### Findings text

Append to `ai/ISSUES.md` #35, under the existing entry, before the `**Proof.**` paragraph:

```markdown
**Session 31 (2026-09-27) replaced the Android half with the native API, on the owner's ruling**
(🐋  "Native always wins versus custom implementation"). Android now asks Play through
`expo-in-app-updates@0.12.0`, pinned exactly, and the HTML scrape is deleted. Play decides, shows its own overlay,
downloads in the background and the library completes the install on `DOWNLOADED`, so the only user action is Google's
mandatory single consent tap. The flow is FLEXIBLE: a prayer-times app must never be blocked by an update, and
`updatePriority()` in Play Console can escalate later with no app change. **iOS keeps `ModalUpdate` and the iTunes
reader, because Apple has no in-app update mechanism at all**, which the package's own README states twice; its iOS
half only opens an App Store sheet.

**Session 30's rejection of this package was withdrawn, and one of its grounds was simply wrong.** The
"unverifiable" objection judged a production mechanism by what a side-loaded test phone can exercise, and the claim
that its iOS half queries the wrong storefront was false: `AppStoreCountry` is documented for exactly that case.
The surviving fact, that Play reports a `versionCode` rather than a version name, turned out not to matter, because
nothing compares it: Play answers `updateAvailable` itself.

**The stored-version flow was NOT disabled on Android**, though the question was asked. `app_installed_version`
answers "was the app upgraded since last launch" and drives the cache-schema wipe, the forced notification reschedule
and the What's New gate; removing it on Android would have reintroduced #34, where an update left the phone silent for
12 hours. It is untouched on both platforms.

**`releases.json` is deleted.** Safe because every version in it was `1.0.0` against a live store build of 1.5.1, so
`isNewerVersion(installed, '1.0.0')` was `false` for every version this app has shipped: the file could not prompt
anyone, even an older build still fetching it.

**DURABLE LESSON: a lazy `require()` of an optional native module cannot reach 100% coverage.**
`modules/widgetrefresh/index.ts` uses that pattern, and its catch is unreachable once the package is installed:
measured at 84.21% statements, 75% branches. A static import plus a virtual Jest mock
(`jest.mock('<pkg>', factory, { virtual: true })`) reaches 100% on all four measures, with the iOS branch reachable
only from a `beforeAll` that calls `jest.resetModules()` then re-mocks `react-native` alongside the package, because a
module-level `Platform.OS` constant is evaluated once per module instance.

**Known limit, stated plainly: Play In-App Updates is unproven on hardware**, and cannot be proven by this project
until a build reaches an internal test track, because the flow only answers for a build Play installed and the 3T
carries a side-load with no `installerPackageName`. `device/__tests__/inAppUpdatesContract.test.ts` is the guard that
was available: it pins the version, the two functions the app calls, and the Android module declaration, so an
upstream drift fails the suite rather than a user's phone.
```

### Table rows

The executor sets `ai/plans/README.md` row 31 to EXECUTED. On PASS the auditor sets it DONE.

### Docs commit

```
<VERSION> - docs(plans): session 31 executed: Android updates natively, releases.json deleted
```

## 9. Push

None in this plan. The audit session pushes after a PASS verdict.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `yarn add` resolves a version other than 0.12.0 | the registry moved | STOP (section 2.2, item 5) |
| `shared/__tests__/widgetRuntimeLoads.test.ts` fails with `(0 , n.memo) is not a function` after the install | the install re-resolved a NESTED `@expo/ui@58.0.7` under `node_modules/expo-widgets/node_modules/` while the flat pin still reads `58.0.5`. Measured in this session's own planning, and `ai/AGENTS.md` carries the trap | Run `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`, then rerun the suite. **Run this suite after the install in step 1 whether or not anything looks wrong** |
| Unrelated suites fail after the install for no reason a diff explains | the install left duplicate copies of a transitive package at different versions | `yarn check --verify-tree`, then remove the offending nested folder and `yarn install --frozen-lockfile` |
| The Android build fails in `:expo-in-app-updates:compileReleaseKotlin` | the SDK 58 incompatibility this plan researched away | STOP and quote the error. Do not patch the package |
| Coverage below 100% on `device/updates.ts` | a branch the test list missed | STOP (section 2.2, item 6). Never add an ignore comment |
| `never asks Play on iOS` fails | the module-level platform constant was evaluated once | Your test needs the `beforeAll` + `jest.resetModules()` shape in section 5. It is work still to do, not a finding |
| The 3T logs `Failed to start native update` | Play refused a side-loaded build | EXPECTED on this hardware. Record it and carry on |
| The app crashes at launch on the 3T | the native module did not link | STOP and quote the logcat line |
| `adb install` hangs with no staging directory | Play Protect dialog | Section 7's remedy, and restore the verifier afterwards |
| A break prints `BREAK NOT APPLIED` | your code does not carry the text targeted | STOP (section 2.2, item 4) |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

### Anticipated review fixes

1. **If `device/updates.ts` imports anything from `expo-in-app-updates` other than the namespace**, replace the import
   with `import * as InAppUpdates from 'expo-in-app-updates';`.
2. **If a comment states what a line does rather than why it exists**, delete that comment.
3. **If `package.json` carries `^0.12.0` or `~0.12.0`**, change it to exactly `0.12.0`.

A finding this list does not answer, meeting all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the
executor applies itself and records in `LOG.md`. Anything else is a STOP.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `device/updates.ts`, `device/__tests__/updates.test.ts`, `package.json`, `yarn.lock`, `app.json` | nothing |
| 2 | `app/index.tsx`, `__tests__/app/index.test.tsx`, `app.json`, `package.json` | nothing |
| 3 | `app.json`, `package.json` | `device/__tests__/inAppUpdatesContract.test.ts` |
| 4 | every file in its list, plus `releases.json` via `git checkout -- releases.json` | nothing |

## 11. Subagents in this plan

None, except `vision` for an image the session's model cannot see. Section 7 produces two screenshots; the exact
question for each is:

> Does this show the app's home screen with a prayer list and a countdown, with no error screen and no update modal
> over it?

No model is named in this plan.

## 12. Report to the owner

Start with `Execution session` and a `Time:` line. Then a few plain sentences on what changed and what was proven,
the progress table, the honest statement that Play In-App Updates is unproven on hardware and why, where the
screenshots are, and the four-line handoff from the `athan-next` skill.
