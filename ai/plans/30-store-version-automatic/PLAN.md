# Plan: Session 30. Both stores answer for themselves, so `releases.json` is never read again (ISSUES #35)

| Field | Value |
| --- | --- |
| Brief | `ai/ISSUES.md` #35, plus the owner's instruction of 2026-09-27 (section 1) |
| Planned at | `a265ec1d` (version 1.29.14), 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | nothing |
| Steps | 3, each one branch, one commit, one version |
| Device | iPhone XS simulator (booted) and OnePlus 3T `8f7ada76`, both on a mock build; no production build needed (section 7 says why) |
| Owner decisions still needed | None. The owner ruled 🐋  "Please don't ask me any questions. Make assumptions", so section 2.1 records each decision as the planner's, with its reason |

## 1. Goal

Today the update prompt asks a file the owner hand-edits on GitHub after every store release. Forget that edit and
nobody is ever prompted, which is the failure the owner actually cares about. When this plan is DONE, each platform
asks its own store: iOS keeps its iTunes Lookup, which is already automatic, and Android reads the version off its own
Play listing instead of the file. `releases.json` is read by no code path, the 24-hour cadence is unchanged, and two
real defects found while confirming this are fixed: a failed check no longer burns the whole day's window, and neither
fetch can hang for the life of the process. The owner notices by releasing to Play and being prompted on the next
day's launch without touching anything.

The owner's words that govern this session:

🐋  "essentially, our goal is to deprecate the released adjacent and have both platforms reading from the store, the
version from the store. If the installed version is old, and then there's a new version available on the store, then
we want to show the update to the users."

🐋  "no need to change how often it triggers. That's already in place, I believe."

🐋  "please do not use the EAS Cloud at all to build anything to compile anything. Everything should be compiled
locally."

🐋  "when you write comments, keep them compact, and I only write the why, never the whats, never the how, because
that should be self-explanatory through the code."

🐋  "Please don't ask me any questions. Make assumptions."

The standing rules that also bind it:

- 🐋  "`releases.json` is untouchable... It stops being read only once the update-prompt feature is removed from the
  codebase and that removal has shipped; the file is deleted in a separate commit after that, never before."
  (`ai/AGENTS.md`). So this plan makes the app stop reading it and does not delete it.
- 🐋  Never build on EAS and never push anything to it (`ai/AGENTS.md`).
- Visuals are settled: no colour, size, spacing, text, icon or animation changes (`EXECUTOR-BRIEF.md` section 2). The
  update modal's copy and layout are untouched by all three steps.

## 2. Decisions

### 2.1 Taken

1. **Android reads its Play listing page; `expo-in-app-updates` is rejected.** Planner, 2026-09-27, on five measured
   grounds in `RESEARCH.md` section 4.1. The decisive one: Play In-App Updates only answers for a Play-installed
   build, and `dumpsys package com.mugtaba.athan` on the 3T prints no `installerPackageName`, so neither phone this
   project owns can exercise it, and the owner forbade the cloud path that would provide a Play-installed build. It
   also reports a `versionCode` (`1000000` in every local build) where the app's whole comparison is a dotted version
   string, and its iOS half queries the wrong storefront for this GB-only listing.
2. **`country=gb` STAYS on the iTunes lookup**, against ISSUES #35's own recommendation to drop it. Planner,
   2026-09-27: measured across 15 storefronts, `gb` is the only one that answers for this `bundleId`; every other
   returns `resultCount 0`, so dropping it would break the one channel that already works
   (`RESEARCH.md` section 3).
3. **The `isProd()` split disappears with the file.** Planner, 2026-09-27: both branches existed only to choose
   between a live store and the hand-edited file. A UAT build now reads the same live store as production, so a tester
   on a newer build than the public store sees no prompt, and one on an older build is told to update. Both are
   correct.
4. **The timeout is an explicit `AbortController` driven by `setTimeout`, not `AbortSignal.timeout`.** Planner,
   2026-09-27, from a spike: `AbortSignal.timeout` is armed by a host timer Jest's fake timers do not replace, so the
   spike's 5-second case cost 5004 ms of real suite time and `signal.aborted` stayed `false` after
   `advanceTimersByTime`. An `AbortController` aborted from a `setTimeout` is fully fake-timer controllable
   (`RESEARCH.md` section 6).
5. **A failed check retries after one hour, not after a full day.** Planner, 2026-09-27: the owner said the cadence is
   already in place and needs no change, so the SUCCESS cadence stays at exactly `TIME_CONSTANTS.ONE_DAY_MS`. A failure
   is not a check, so it gets its own shorter stamp rather than burning the day. One hour is the smallest interval
   that cannot become a per-launch network call for a user reopening the app repeatedly offline.
6. **`openStore` gains an `https://play.google.com/...` fallback on Android.** Planner, 2026-09-27: ISSUES #35's third
   defect. `market://` throws on a device with no Play client and the failure is only logged, so the button does
   nothing. This is a behaviour fix, not a visual one: the same button, the same label, a destination that resolves.
7. **`releases.json` is left byte-identical.** Owner's standing rule, quoted in section 1.
8. **Coverage stays at 100% on all four measures, and every new decision gets a break.** Owner, 2026-09-27: 🐋  "I made
   this bulletproof, 100% does coverage".
9. **Screenshots are captured for the owner into `~/athan-store-update-shots/` and opened.** Owner, 2026-09-27: 🐋 
   "show me screenshots... save them to a folder... open those screenshots so I can see them." This overrides
   `EXECUTOR-BRIEF.md`'s "the owner receives no screenshots" for this session only, because the owner asked for them
   by name; they are saved to a folder and opened locally, never attached to a message.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens. Do not guess.

1. **Any anchor count other than 1.** Question: "Anchor `<file>` counts `<n>` in `<source>`, not 1. The plan is stale
   against `uat-2`. Set the row to NEEDS REPLAN?"
2. **A test fails that this plan does not name.** Question: "`<test name>` failed and the plan does not predict it.
   The failure line is `<line>`. What should happen?"
3. **A test the plan says must fail passes instead.** Question: "`<test name>` was expected to fail before the change
   and it passed, so it guards nothing yet. Stop here?"
4. **A break prints `BREAK NOT APPLIED: <label>`.** Question: "Break `<label>` substituted nothing, so the code I
   wrote does not carry the text the plan targets. What should the break target instead?"
5. **A review finding that section 10 does not give word for word, and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** Question: "My review of `<sha>` found `<finding>`. The plan does not give
   this fix. Apply it?"
6. **The Play listing page answers something other than a parseable version during step 2's live check.** Question:
   "The Play listing for `com.mugtaba.athan` returned `<what>`, so `readPlayListingVersion` cannot be proven against
   the live page. Proceed on the fixture tests alone?"
7. **Anything the step does not answer that would otherwise be a decision.** Question: "The plan does not say `<X>`.
   What should it be?"
8. **Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.** Question: "This step appears to require
   a change to `<X>`, which the plan forbids. Stop?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-30.sh` and run `bash $TMPDIR/preflight-30.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/usr/bin/env bash
set -u
REPO=/Users/muji/repos/rn.athan.uk
STEP="${1:?usage: preflight-30.sh <step number>}"
FOLDER=ai/plans/30-store-version-automatic
fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

cd "$REPO" || fail "checkout $REPO is missing"
[ "$(pwd)" = "$REPO" ] || fail "wrong checkout: $(pwd)"
[ "$(git branch --show-current)" = "uat-2" ] || fail "not on uat-2: $(git branch --show-current)"

DIRTY=$(git status --porcelain -- . ":(exclude)ai/plans/README.md" ":(exclude)$FOLDER" || true)
[ -z "$DIRTY" ] || fail "tree holds files beyond ai/plans/README.md and this plan folder:
$DIRTY"

git fetch -q origin uat-2 || fail "git fetch origin uat-2"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is not a descendant of origin/uat-2"

VERSION=$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')
echo "package.json version: $VERSION"
python3 - "$VERSION" <<'PY' || fail "version is lower than the planned-at 1.29.14"
import sys
def parts(v): return [int(x) for x in v.split('.')]
sys.exit(0 if parts(sys.argv[1]) >= parts('1.29.14') else 1)
PY

# Needs first: nothing, so no row is checked.

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}

check_anchor() {
  local n
  n=$(count_anchor "$1" "$2")
  echo "anchor $1 in $2: $n"
  [ "$n" = "1" ] || fail "anchor $1 counts $n in $2, not 1 (NEEDS REPLAN)"
}

# Step 1 changes device/updates.ts wholesale, so its anchor is the file's import block.
if [ "$STEP" -le 1 ]; then
  check_anchor "$FOLDER/scripts/anchors/2-1.txt" device/updates.ts
fi
# Step 2 anchors on stores/ui.ts, which no earlier step of this plan touches.
if [ "$STEP" -le 2 ]; then
  check_anchor "$FOLDER/scripts/anchors/2-2.txt" stores/ui.ts
fi

command -v node >/dev/null || fail "node is missing"
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest is missing (nightly clean?)"

STATE=$(adb -s 8f7ada76 get-state 2>&1)
[ "$STATE" = "device" ] || fail "OnePlus 3T is not attached: $STATE"
echo "3T: $STATE"

BOOTED=$(xcrun simctl list devices booted | grep -c "Booted")
[ "$BOOTED" -ge 1 ] || fail "no iOS simulator is booted"
echo "booted simulators: $BOOTED"

echo "PREFLIGHT OK"
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does | This plan |
| --- | --- | --- |
| `device/updates.ts` | The whole update check: fetches a store version, throttles, compares, opens the store | Steps 1, 2 and 3 all change it |
| `stores/ui.ts` | Holds `popupUpdateLastCheckAtom` (`popup_update_last_check`) plus its getter and setter | Step 2 adds nothing; it reuses them |
| `shared/versionUtils.ts` | `compareVersions` and `isNewerVersion`, numeric per segment, tolerating a `v` prefix | Unchanged; read only |
| `shared/config.ts` | `APP_CONFIG.iosAppId`, `APP_CONFIG.androidPackage`, `isProd()` | Read only; `isProd()` stops being used by `updates.ts` |
| `shared/constants.ts` | `TIME_CONSTANTS.ONE_DAY_MS` | Step 2 adds one sibling constant |
| `app/index.tsx:117` | `checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate))` | Unchanged; the signature it calls does not change |
| `components/modals/Update.tsx` | The prompt itself | Unchanged, because visuals are settled |
| `releases.json` | The hand-edited file | Untouched, and after step 1 unread |

Anchors, saved in full under `scripts/anchors/`:

- `scripts/anchors/2-1.txt`: `device/updates.ts` lines 1 to 21 at "Planned at", the import block through the
  `ReleasesConfig` type. Step 1 replaces everything it names.
- `scripts/anchors/2-2.txt`: `stores/ui.ts` lines 86 to 90 at "Planned at", `popupUpdateLastCheckAtom` with the
  comments either side. Step 2 reads it to confirm the stamp's key and default have not moved.

### How the pieces interact

| When | What runs | Order |
| --- | --- | --- |
| Cold launch, 1500 ms after mount | `app/index.tsx`'s settling timeout calls `checkForUpdates()`, not awaited | after `reopenRefreshGateOnColdLaunch`, `initializeNotifications` and `runBackgroundTaskDebugSequence` |
| Inside `checkForUpdates` | reads `getPopupUpdateLastCheck()`, returns `false` early if inside the window | synchronous, before any fetch |
| Then | `getInstalledVersion()` then `await getStoreVersion()` | one network call, or none |
| Then | `isNewerVersion(installed, store)` | pure |
| Finally | `setPopupUpdateLastCheck(now)` | today unconditional; step 2 makes it conditional |
| On resolve | `setPopupUpdateEnabled(hasUpdate)` in `app/index.tsx` | the modal's `visible` prop derives from it |

Nothing awaits `checkForUpdates`, and nothing else calls it: `codegraph_explore` reports 4 call sites, all in
`app/index.tsx`'s one statement and its tests. So a slow or failed check can never block a render, and the only
observable effects are the stamp it writes and the boolean it answers. That is what makes the timeout safe to add and
the stamp the only thing the retry rule can get wrong.

### Existing tests

`device/__tests__/updates.test.ts`, 21 tests over four describes, measured with
`npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit` at "Planned at":

| Test | What it proves | This plan |
| --- | --- | --- |
| `returns false if checked within 24 hours` | the throttle short-circuits before any fetch | kept, unchanged |
| `proceeds if last check was more than 24 hours ago` | the window opening lets a fetch happen | changed in step 1: its `releases.json` fixture becomes a Play page fixture |
| `fetches from iTunes API when production iOS` | the iTunes URL, verbatim, and the comparison | changed in step 1: iOS no longer depends on `isProd` |
| `returns false when iTunes API returns empty results` | `resultCount 0` yields no prompt | kept, unchanged |
| `fetches from releases.json for UAT iOS` | the GitHub URL for the non-prod iOS path | DELETED in step 1: that path no longer exists |
| `returns true when store version is newer than installed` | a newer store version prompts | changed in step 1: fixture becomes a Play page |
| `returns false when installed version is current` | an equal version does not prompt | changed in step 1: same reason |
| `returns false on network failure (fetch throws)` | a throw yields no prompt | kept, unchanged |
| `returns false when version is null in releases.json` | an absent version yields no prompt | changed in step 1: becomes a Play page with no version key |
| `returns false when installedVersion is empty` | no installed version yields no prompt | kept, unchanged |
| `always calls setPopupUpdateLastCheck even on failure` | the `finally` stamp | INVERTED in step 2: this is the defect |
| `calls setPopupUpdateLastCheck on success` | the success stamp | kept, unchanged |
| `logs warning when fetch fails (getStoreVersion inner catch)` | the exact warn text | kept, unchanged |
| `logs error when outer catch is triggered` | the exact error text and the stamp | changed in step 2: the stamp assertion becomes the failure stamp |
| `fetches exactly once for production iOS (iTunes API only)` | one network call per check | kept, unchanged |
| `fetches from releases.json for production Android` | the GitHub URL for prod Android | changed in step 1: becomes the Play URL |
| `fetches from releases.json for UAT Android` | the GitHub URL for UAT Android | DELETED in step 1: no environment split remains |
| `opens App Store URL on iOS` | the App Store URL, verbatim | kept, unchanged |
| `logs error when Linking.openURL throws on iOS` | the failure is logged | kept, unchanged |
| `opens Play Store URL on Android` | the `market://` URL | changed in step 3: a fallback follows the throw |
| `logs error when Linking.openURL throws on Android` | the failure is logged | changed in step 3: the fallback is tried first |

`__tests__/app/index.test.tsx` mocks `@/device/updates` wholesale (`checkForUpdates`, `openStore`), so no step changes
it: the seven update-prompt tests there assert the modal's behaviour against a mocked checker, and the signature
`checkForUpdates(): Promise<boolean>` is unchanged by every step.

`components/modals/__tests__/Update.test.tsx` renders the prompt and is untouched.

### Why the obvious simple fix is wrong

**Adding `expo-in-app-updates` is the obvious answer and it cannot be proven here.** `RESEARCH.md` section 4.1 has the
five grounds; the decisive one is that neither phone can exercise Play In-App Updates, because a side-loaded build
gets `UPDATE_NOT_AVAILABLE` and a passing device check would be indistinguishable from a broken one.

**Dropping `country=gb` is the obvious tidy-up and it is a regression.** `RESEARCH.md` section 3: `gb` is the only
storefront that answers for this `bundleId`.

**Using `AbortSignal.timeout` is the obvious way to add the missing timeout and it is untestable.** `RESEARCH.md`
section 6: its host timer ignores Jest's fake timers, costing 5 real seconds per case.

## 5. Design

**The invariant, in one sentence a test can check:** `getStoreVersion()` resolves the version the platform's own store
publishes, or `false`, and reads no URL other than `itunes.apple.com` on iOS and `play.google.com` on Android.

Two supporting invariants, one per remaining step:

- **Step 2:** `checkForUpdates()` stamps `popup_update_last_check` with `now` only when it reached a comparison, and
  stamps `now - ONE_DAY_MS + UPDATE_RETRY_MS` when it did not, so a failure costs one hour of the window and never a
  day; and no fetch it starts can stay pending longer than `UPDATE_FETCH_TIMEOUT_MS`.
- **Step 3:** pressing Update reaches a resolvable store URL on Android even with no Play client installed.

### The approach

One reader, two automatic sources, selected by platform alone:

```
getStoreVersion()
  iOS      -> itunes.apple.com/lookup?bundleId=<APP_CONFIG bundle>&country=gb  -> results[0].version
  Android  -> play.google.com/store/apps/details?id=<APP_CONFIG.androidPackage>&hl=en&gl=GB -> key "141"
```

The Android parse is its own named, exported function so it can be tested against fixtures and broken by a break
script without a network: `readPlayListingVersion(html)`. It accepts only a dotted numeric string, so a page that
changed shape answers `null` and the caller answers `false`, which shows no prompt. **The fail direction is silence,
never a false prompt**, which is why every failure path in this design returns `false` rather than throwing.

The failure stamp is expressed as a point in the past rather than as a separate stored key, so the throttle stays one
comparison against one value and no new storage key enters the MMKV schema (`ai/AGENTS.md` lists MMKV schema changes
under "Ask First", and this design needs none).

### Alternatives rejected

| Alternative | Why not |
| --- | --- |
| `expo-in-app-updates` (Play In-App Updates) | Unverifiable on either phone; reports a `versionCode`; its iOS half queries the wrong storefront; replaces the settled modal; new native dependency on the release path (`RESEARCH.md` 4.1) |
| Keep `releases.json` for UAT only | Leaves the manual step in place for every UAT release, which is the step the owner wants gone, and leaves a second source to keep in sync |
| `expo-updates` OTA | Ships JS from EAS, which is read-only here, and cannot deliver a native change, so a store prompt is still needed (`RESEARCH.md` 7) |
| Our own hosted JSON on a CDN | Still a manual edit after each release, plus a new piece of infrastructure to own |
| `AbortSignal.timeout` | Untestable under fake timers, 5 real seconds per case (`RESEARCH.md` 6) |
| A second MMKV key for the failure stamp | A schema change where arithmetic on the existing key answers the same question |
| Scraping the Play page for a `Version` label | There is none in the served HTML: `grep -c "Current Version"` is 0. The `141` key is the only carrier |

### Concurrency trace

`checkForUpdates` has exactly one caller and is never awaited, so there is no interleaving to reason about beyond a
second launch inside the window, which the throttle already short-circuits before any fetch. What the change does to
each path:

| Path | Before | After |
| --- | --- | --- |
| Cold launch, window closed | returns `false`, stamps `now` (defect: even on failure) | returns `false`, stamps nothing, because it never reached a fetch |
| Cold launch, window open, store answers | fetch, compare, stamp `now` | identical, with a 10-second ceiling on the fetch |
| Cold launch, window open, network down | fetch throws, stamp `now`, day lost | fetch throws, stamp `now - ONE_DAY_MS + UPDATE_RETRY_MS`, retried in an hour |
| Cold launch, window open, connection hangs | promise pending for the life of the process | aborted at 10 seconds, then the failure stamp |
| Two launches an hour apart, both offline | second is refused by the stamp | second retries, which is the point |
| Backgrounded mid-fetch | nothing awaits it; the process keeps the promise | unchanged, except the timer now resolves it |

### What the scratch worktree proved

The whole change was built in `~/athan-device-sweep/worktrees/plan-30` at `uat-2`, then deleted. What it taught, so the
executor knows the contracts are buildable and the numbers are measured rather than guessed:

| Proof | Result |
| --- | --- |
| `npx tsc --noEmit` with all three steps applied | exit 0 |
| `npx biome check device/updates.ts device/__tests__/updates.test.ts shared/constants.ts --error-on-warnings` | `Checked 3 files in 10ms. No fixes applied.` |
| `npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit` | `33 passed, 33 total`, which is where step 3 lands |
| `yarn validate` | `173 passed` suites, `4771 passed` of `4773` tests with 2 skipped, and 100% on all four measures: statements 4409/4409, branches 1966/1966, functions 916/916, lines 3973/3973 |
| The four `readPlayListingVersion` tests against the fixture carrying SVG path data | all 4 pass, and `shapeOnlyParse` fails 3 of them |
| The `abandons a fetch that has not answered in ten seconds` test | passes in 1 ms of real time, because the `AbortController` is fake-timer driven |

The suite totals after this plan will differ from `4771` by however many tests land between "Planned at" and execution;
what is fixed is the per-suite count in each step's part 6 and the 100% on all four measures.

### Design review

Reviewed by this planning session on 2026-09-27, rereading the design and the code map cold and attacking them. Five
findings, all applied before the steps were written:

1. **The retry stamp could reopen the window on a clock jump.** Writing `now - ONE_DAY_MS + UPDATE_RETRY_MS` is a
   point in the past, so a user whose clock moves backwards gets an earlier `lastCheck` and the window stays closed
   longer, never shorter. Checked the other direction too: a forward jump reopens it, which is the same behaviour the
   success stamp already has. No extra guard is needed, and step 2's test list pins the arithmetic rather than the
   wall-clock outcome.
2. **A 10-second timeout plus a 1500 ms defer is 11.5 seconds of a possible pending promise on a cold launch.**
   Nothing awaits it and nothing renders from it, so the only cost is a socket. Accepted, and recorded here so a later
   reader does not read the number as arbitrary.
3. **The first draft parsed the Play page with a bare regex on the version shape,** which would have matched an SVG
   path (`M5.84 14.09c...`) or a `minimumOsVersion`. Measured: scanning the real page for `1\.\d+\.\d+` returns 8
   hits, 7 of them inside SVG path data. The parse is therefore keyed on the `"141"` key and validated against a
   full-string dotted-numeric pattern, and the fixture in step 1's tests carries the SVG noise so the test would fail
   if the key were dropped.
4. **`isProd()` becoming unused in `updates.ts` must not leave a dead import.** Step 1's file list and review
   checklist both name it, and Biome would fail the commit on an unused import anyway.
5. **Deleting two tests needs a reason a reviewer can check.** Both deleted tests assert a URL that no longer exists
   in the code, so they cannot be rewritten to prove anything about the new behaviour: their replacement is the new
   Play-URL test, and the `noGitHubUrl` break proves the GitHub host is gone for good.

## 6. Steps

- [x] Step 1: DONE in `fb79a770`
- [x] Step 2: DONE in `bb281574`
- [x] Step 3: DONE in `472f734b`

---

### Step 1: Android reads its own Play listing, and `releases.json` is read by nothing

0. **Anchor check.** Run, and expect `1`:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/30-store-version-automatic/scripts/anchors/2-1.txt device/updates.ts
   ```

   Any other count means NEEDS REPLAN (section 2.2, item 1).

1. **Goal.** `getStoreVersion()` reads the live Play listing on Android and the live App Store on iOS, with no
   environment split and no GitHub URL anywhere in the app.

2. **Branch.** `git checkout -b fix/30-store-version-from-stores uat-2`

3. **Files.**
   - `device/updates.ts` (changed)
   - `device/__tests__/updates.test.ts` (changed)
   - `app.json`, `package.json` (version bump)
   - `ai/plans/README.md`, `ai/plans/30-store-version-automatic/PLAN.md`,
     `ai/plans/30-store-version-automatic/LOG.md` (progress)

   Nothing else may change. `releases.json` in particular stays byte-identical.

4. **Tests first (red).** Suite: `device/__tests__/updates.test.ts`, existing.

   Two tests are DELETED, because each asserts a URL the code no longer contains and neither can be rewritten to prove
   anything about the new behaviour: `fetches from releases.json for UAT iOS` and
   `fetches from releases.json for UAT Android`.

   Six tests are CHANGED, each keeping its name and its purpose while its fixture becomes a Play listing page:
   `proceeds if last check was more than 24 hours ago`, `fetches from iTunes API when production iOS`,
   `returns true when store version is newer than installed`, `returns false when installed version is current`,
   `returns false when version is null in releases.json` (renamed, see the table), and
   `fetches from releases.json for production Android` (renamed, see the table).

   These must NOT change: `returns false if checked within 24 hours`,
   `returns false when iTunes API returns empty results`, `returns false on network failure (fetch throws)`,
   `returns false when installedVersion is empty`, `calls setPopupUpdateLastCheck on success`,
   `logs warning when fetch fails (getStoreVersion inner catch)`,
   `fetches exactly once for production iOS (iTunes API only)`, and all four `openStore` tests.

   A shared fixture the new tests use, given verbatim because its noise is load-bearing: it carries the SVG path data
   that a shape-only regex would match, so a parse keyed on anything but the `"141"` key fails these tests.

   ```ts
   /** A Play listing page reduced to what the parse must survive: the version key, and SVG path data a shape-only regex would match */
   const playListingHtml = (version: string | null): string =>
     [
       '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12"/>',
       '<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11"/>',
       '"139":[[["Tools"]]],',
       version === null ? '"140":[[["no version here"]]],' : `"141":[[["${version}"]],[[[36]],[[[24,"7.0"]]]]],`,
       '"145":[null,[null,"- Changed daily reset from midnight to last prayer"]]',
     ].join('');
   ```

   The rows:

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `reads the version from the Play listing on Android` (new; replaces `fetches from releases.json for production Android`, in the Android describe) | Android asks Play itself, at the exact URL, and reads the key | `playListingHtml('2.0.0')`, installed `1.0.33`, `isProd` true | `mockFetch` called with `https://play.google.com/store/apps/details?id=com.mugtaba.athan&hl=en&gl=GB` and `{ headers: { 'Cache-Control': 'no-cache' }, signal: expect.anything() }`; `mockIsNewerVersion` called with `('1.0.33', '2.0.0')`; result `true` |
   | `reads the Play listing on Android whatever the environment` (new, in the Android describe) | the `isProd` split is gone: a UAT build reads the same live store | `playListingHtml('3.0.0')`, `isProd` false, installed `1.0.33` | `mockFetch` called with the same `play.google.com` URL; `mockIsNewerVersion` called with `('1.0.33', '3.0.0')`; result `true` |
   | `returns false when the Play listing carries no version` (renamed from `returns false when version is null in releases.json`, moved into the Android describe) | an unparseable page shows no prompt | `playListingHtml(null)`, `isProd` true | result `false`; `mockIsNewerVersion` not called |
   | `returns false when the Play listing version is not a dotted number` (new, in the Android describe) | the parse rejects a value it cannot compare | a page whose `"141"` key holds `varies with device` | result `false`; `mockIsNewerVersion` not called |
   | `reads the App Store version whatever the environment` (new, in the iOS describe) | iOS no longer depends on `isProd` either | `{ results: [{ version: '1.0.34' }] }`, `isProd` false, installed `1.0.33` | `mockFetch` called with `https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb`; `mockIsNewerVersion` called with `('1.0.33', '1.0.34')`; result `true` |
   | `fetches from iTunes API when production iOS` (changed: keeps its name, drops its dependence on `isProd` being true) | the iTunes URL, verbatim, and the storefront that answers | unchanged fixture, `isProd` true | unchanged assertions, plus that the URL contains `country=gb` |
   | `proceeds if last check was more than 24 hours ago` (changed: fixture) | the window opening lets a fetch happen | `{ results: [{ version: '1.0.33' }] }` on the iOS default platform | `mockFetch` called; `mockIsNewerVersion` called with `('1.0.33', '1.0.33')`; result `false` |
   | `returns true when store version is newer than installed` (changed: fixture) | a newer store version prompts | `{ results: [{ version: '1.0.34' }] }` | `mockIsNewerVersion` called with `('1.0.33', '1.0.34')`; result `true` |
   | `returns false when installed version is current` (changed: fixture) | an equal version does not prompt | `{ results: [{ version: '1.0.33' }] }` | `mockIsNewerVersion` called with `('1.0.33', '1.0.33')`; result `false` |
   | `reads the version out of a real Play listing payload` (new, in a new `readPlayListingVersion` describe) | the parse works on the page shape as served, not only on a tidy fixture | `playListingHtml('1.5.2')` | returns `'1.5.2'` |
   | `answers null when the version key is absent` (new, same describe) | a page shape change is refused rather than guessed | `playListingHtml(null)` | returns `null` |
   | `answers null for a version that is not dotted numbers` (new, same describe) | only a comparable version is accepted | a page whose `"141"` key holds `varies with device` | returns `null` |
   | `answers null for an empty document` (new, same describe) | an empty body is refused | `''` | returns `null` |

   The mock for `react-native` in this suite must gain nothing: `Platform` and `Linking` are already there.
   `AbortController` is a global in the unit environment, proven by the spike in `RESEARCH.md` section 6.

   Command, path first:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit
   ```

   Expected BEFORE the change: the suite fails. `readPlayListingVersion` is not exported, so the four
   `readPlayListingVersion` tests fail at import with
   `TypeError: (0 , _updates.readPlayListingVersion) is not a function`, and the Android and iOS URL tests fail with
   an `expect(mockFetch).toHaveBeenCalledWith(...)` mismatch naming
   `https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json` as the received URL. If any of those
   pass, or a test outside this suite fails, STOP (section 2.2, items 2 and 3).

5. **Change.** This is a `(specified)` step: build it from the contracts below.

   **`device/updates.ts`.** Remove `RELEASES_URL`, the `PlatformVersion`, `UpdatePopup` and `ReleasesConfig` types, and
   the `isProd` import, which no line uses after this step.

   Add two module constants:

   | Name | Value |
   | --- | --- |
   | `ITUNES_LOOKUP_URL` | unchanged: `https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb` |
   | `PLAY_LISTING_URL` | `` `https://play.google.com/store/apps/details?id=${APP_CONFIG.androidPackage}&hl=en&gl=GB` `` |

   Add one exported function:

   - **Name and signature:** `export const readPlayListingVersion = (html: string): string | null`
   - **What it answers:** the version name the Play listing page publishes, or `null` when the page does not carry one
     it can compare.
   - **How it decides:** it takes the first capture of the `"141"` key's first string, and accepts it only when the
     whole string matches dotted decimal numbers.
   - **What it must never do:** never throw, never return a value that is not made only of digits and dots, and never
     match a number found anywhere else in the document.
   - **Log lines:** none. A `null` here is an ordinary outcome the caller logs nothing for, because the caller's own
     `false` is what the app acts on.

   These two values are given verbatim, because every term matters:

   ```ts
   const PLAY_VERSION_KEY = /"141":\s*\[\s*\[\s*\[\s*"([^"]+)"/;
   const DOTTED_NUMBERS = /^\d+(\.\d+)*$/;
   ```

   **Change `getStoreVersion`** to keep its signature, `(): Promise<string | false>`, and:

   - on iOS, fetch `ITUNES_LOOKUP_URL` and answer `data.results[0]?.version || false`, exactly as today;
   - on Android, fetch `PLAY_LISTING_URL`, read the body as text, pass it to `readPlayListingVersion`, and answer that
     or `false`;
   - keep the `try/catch` that answers `false` on any failure, and keep its log line verbatim:
     `logger.warn('Failed to fetch store version:', error);`
   - keep `{ headers: { 'Cache-Control': 'no-cache' } }` on both fetches. Step 2 adds the signal.

   The invariant this step keeps, from section 5: `getStoreVersion()` resolves the version the platform's own store
   publishes, or `false`, and reads no URL other than `itunes.apple.com` on iOS and `play.google.com` on Android.

   Comments: one line saying WHY `country=gb` stays, because dropping it reads like an improvement and is a
   regression; one line saying WHY the parse is keyed on `"141"` rather than on the version's shape. Nothing else. No
   comment restates what a line does.

6. **Green.** The same command. Expected: `Tests:` reports `26 passed, 26 total` for this suite. The arithmetic, so a
   different number is diagnosable rather than puzzling: 21 today, minus the 2 deleted, plus these 7 added, where the
   two renamed tests change a name and a fixture without changing the count:

   | Added | Describe |
   | --- | --- |
   | `reads the Play listing on Android whatever the environment` | `checkForUpdates (Android)` |
   | `returns false when the Play listing version is not a dotted number` | `checkForUpdates (Android)` |
   | `reads the App Store version whatever the environment` | `checkForUpdates` |
   | `reads the version out of a real Play listing payload` | `readPlayListingVersion` (new describe) |
   | `answers null when the version key is absent` | `readPlayListingVersion` |
   | `answers null for a version that is not dotted numbers` | `readPlayListingVersion` |
   | `answers null for an empty document` | `readPlayListingVersion` |

   Then both of these exit 0:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

7. **Breaks.** Save to `$TMPDIR/breaks-30-1.sh` and run `bash $TMPDIR/breaks-30-1.sh` from the repository root.

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
     if npx jest "$TESTS" --watchman=false --selectProjects=unit > "$TMPDIR/break-30-1-$label.log" 2>&1; then
       echo "BREAK NOT CAUGHT: $label"
       ALL_AS_EXPECTED=0
     else
       echo "BREAK CAUGHT: $label"
     fi
     mv "$SRC.bak" "$SRC"
   }

   # The GB storefront is the only one that answers for this bundleId.
   run_break dropGbCountry 's|\Q&country=gb\E||'
   # The parse must key on "141", not on the version's shape.
   run_break shapeOnlyParse 's|\Q"141":\E.*?\Q"([^"]+)"\E|(\\d+(?:\\.\\d+)+)|'
   # A value that is not dotted numbers cannot be compared.
   run_break acceptAnyVersion 's|\Q^\d+(\.\d+)*\E\$/|.*/|'
   # Android must ask Play, never GitHub. Anchored on the constant's name, because step 3 adds a second
   # play.google.com URL and an unanchored search would break the wrong line.
   run_break noGitHubUrl 's|\QPLAY_LISTING_URL = `https://play.google.com/store/apps/details?id=\E|PLAY_LISTING_URL = `https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json#|'
   # The no-cache header is what stops a stale answer.
   run_break dropNoCache "s|\\Q'Cache-Control': 'no-cache'\\E|'X-Ignored': 'no-cache'|"

   echo "ALL AS EXPECTED: $ALL_AS_EXPECTED"
   ```

   **Every substitution above uses `\Q...\E` rather than hand-escaped metacharacters, and a `|` delimiter rather than
   `{}`.** This is not style: a hand-escaped version of `shapeOnlyParse` was written first, and it printed
   `BREAK NOT APPLIED` because the escaping was wrong in a way no reading caught. `\Q...\E` quotes the whole search
   literally, so the search text can be pasted from the source.

   **The one metacharacter that must stay OUTSIDE `\Q...\E` is `$`.** Perl interpolates `$\` as a variable before
   `\Q` takes effect, so `\Q^\d+(\.\d+)*$\E` silently matches nothing. That is why `acceptAnyVersion` ends
   `\Q...\E\$/` with the `$` escaped on its own, and it is the reason that break failed on the first attempt.

   Expected: five `BREAK CAUGHT` lines, then `ALL AS EXPECTED: 1`.

   | Break | Tests expected to fail |
   | --- | --- |
   | `dropGbCountry` | `fetches from iTunes API when production iOS`, `reads the App Store version whatever the environment` |
   | `shapeOnlyParse` | `reads the version out of a real Play listing payload`, `answers null when the version key is absent` |
   | `acceptAnyVersion` | `answers null for a version that is not dotted numbers`, `returns false when the Play listing version is not a dotted number` |
   | `noGitHubUrl` | `reads the version from the Play listing on Android`, `reads the Play listing on Android whatever the environment` |
   | `dropNoCache` | `fetches from iTunes API when production iOS`, `reads the version from the Play listing on Android` |

   Afterwards `git status --porcelain` must list only this step's files and the three plan files.

8. **Version and commit.**

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   git show uat-2:package.json | python3 -c 'import json,sys;v=json.load(sys.stdin)["version"].split(".");v[2]=str(int(v[2])+1);print(".".join(v))'
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`), all three matching.
   `android/app/build.gradle` is gitignored and never added.

   Add, by name: `device/updates.ts`, `device/__tests__/updates.test.ts`, `app.json`, `package.json`,
   `ai/plans/README.md`, `ai/plans/30-store-version-automatic/PLAN.md`,
   `ai/plans/30-store-version-automatic/LOG.md`.

   ```bash
   cat > $TMPDIR/msg-1.txt <<'EOF'
   <VERSION> - fix(updates): both stores answer for themselves, so releases.json is read by nothing

   Android read its version from a file the owner hand-edited on GitHub after
   every release. Forget the edit and nobody is prompted, which is the failure
   this replaces. It now reads the version off its own Play listing, and iOS
   keeps the iTunes lookup it already had.

   The environment split goes with the file: both branches existed only to pick
   between a live store and the hand-edited file, so a UAT build now reads the
   same live store as production.

   readPlayListingVersion is keyed on the listing payload's "141" key and
   accepts only dotted numbers. A shape-only match would have taken an SVG path
   coordinate: the real page holds 8 matches for a bare version shape and 7 of
   them are path data. An unreadable page answers null, the caller answers
   false, and no prompt is shown, which is the fail direction this check needs.

   country=gb stays on the iTunes lookup, against ISSUES #35's own suggestion to
   drop it. Measured across 15 storefronts: gb is the only one that answers for
   this bundleId, so dropping it would break the one channel already working.

   Two tests asserting the GitHub URL are deleted rather than rewritten, because
   the path they cover no longer exists. The noGitHubUrl break proves the host
   is gone.

   releases.json is untouched, per the standing rule: it is deleted separately,
   by the owner, once a release carrying this has shipped in both stores.

   ISSUES #35.
   EOF
   git commit -F $TMPDIR/msg-1.txt
   ```

   Run it in the background with its log (`EXECUTOR-BRIEF.md` section 3). In the log, the last `Tests:` line ends
   `passed, <n> total`, and four `100%` coverage lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this checklist:

   - `readPlayListingVersion` has the exact name and signature the contract gives, answers a version or `null`, never
     throws, and its two regexes are byte-for-byte the plan's.
   - `getStoreVersion` still returns `Promise<string | false>`, and its `logger.warn` text is unchanged.
   - `ITUNES_LOOKUP_URL` still carries `country=gb`, and a comment says why.
   - No `raw.githubusercontent.com`, no `RELEASES_URL`, no `ReleasesConfig`, and no `isProd` import remains in
     `device/updates.ts`. Run `grep -n "githubusercontent\|isProd\|releases" device/updates.ts` and expect nothing.
   - `releases.json` is not in the diff.
   - Exactly two tests were deleted, and each was one asserting the GitHub URL.
   - Every kept test named in part 4 is byte-identical.
   - Comments explain why only, one line each, and none restates what a line does.
   - Nothing beyond the step's file list changed.
   - No visual change: `components/modals/Update.tsx` is not in the diff.

   A clean read is: every box above holds, and the diff contains nothing you cannot point at a contract for. Handle a
   finding as `EXECUTOR-BRIEF.md` section 4, item 8 says.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/30-store-version-from-stores \
      -m "Merge fix/30-store-version-from-stores into uat-2: session 30 step 1, reviewed"
    ```

11. **Done when.**
    - `npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit` prints `26 passed, 26 total`.
    - `grep -c githubusercontent device/updates.ts` prints `0`.
    - `git diff uat-2 --stat -- releases.json` prints nothing.
    - Tick `- [x] Step 1: DONE in <sha>` in section 6.

---

### Step 2: a failed check costs an hour, not a day, and no fetch can hang

0. **Anchor check.** Run, and expect `1`:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/30-store-version-automatic/scripts/anchors/2-2.txt stores/ui.ts
   ```

   Any other count means NEEDS REPLAN.

1. **Goal.** A check that never reached a comparison is not recorded as a check that happened, and no fetch it starts
   can stay pending for the life of the process.

2. **Branch.** `git checkout -b fix/30-failed-check-keeps-its-window uat-2`

3. **Files.**
   - `device/updates.ts` (changed)
   - `device/__tests__/updates.test.ts` (changed)
   - `shared/constants.ts` (changed)
   - `shared/__tests__/constants.test.ts` (changed)
   - `app.json`, `package.json` (version bump)
   - the three plan files

4. **Tests first (red).**

   Suite `device/__tests__/updates.test.ts`, existing. One test is INVERTED, because it currently pins the defect:
   `always calls setPopupUpdateLastCheck even on failure` becomes
   `stamps a failed check an hour back so the day is not lost`. One is CHANGED:
   `logs error when outer catch is triggered`, whose stamp assertion becomes the failure stamp.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `stamps a failed check an hour back so the day is not lost` (replaces `always calls setPopupUpdateLastCheck even on failure`) | a fetch that threw costs an hour of the window, not a day | `mockFetch` rejects; `Date.now()` pinned with `jest.useFakeTimers({ now: 1_700_000_000_000 })` | `mockSetPopupUpdateLastCheck` called with exactly `1_700_000_000_000 - 86_400_000 + 3_600_000` |
   | `stamps a successful check with now` (new) | a real check still costs the full day | iTunes fixture `{ results: [{ version: '1.0.33' }] }`; clock pinned as above | `mockSetPopupUpdateLastCheck` called with exactly `1_700_000_000_000` |
   | `retries an hour after a failure and not before` (new) | the retry window is the one the constant names | first call rejects, then `mockGetPopupUpdateLastCheck` returns the value the first call stamped; second call's clock is `+3_599_999` ms, a third at `+3_600_001` | after the second call `mockFetch` has been called once in total; after the third, twice |
   | `stamps nothing when the throttle refuses the check` (new) | a refused check is not a check | `mockGetPopupUpdateLastCheck` returns `Date.now()` | `mockSetPopupUpdateLastCheck` not called; `mockFetch` not called |
   | `abandons a fetch that has not answered in ten seconds` (new) | a hung connection cannot stay pending | `mockFetch` returns a promise that only rejects when its `init.signal` fires `abort`; fake timers advanced by `10_000` | the call resolves `false`, and `mockSetPopupUpdateLastCheck` is called with the failure stamp |
   | `leaves a fetch that answers inside ten seconds alone` (new) | the timeout does not cut a slow but working answer | `mockFetch` resolves after `9_999` ms of fake time with the iTunes fixture | result follows `mockIsNewerVersion`; `signal.aborted` is `false` |
   | `logs error when outer catch is triggered` (changed) | the exact error text, and that this path takes the failure stamp | unchanged: `mockGetInstalledVersion` throws | unchanged error assertion; the stamp assertion becomes the failure value |

   Suite `shared/__tests__/constants.test.ts`, existing. One new test:

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `the update retry is shorter than the update check window` (new) | a retry can never be longer than the window it shortens, which would make it a no-op | the two constants | `TIME_CONSTANTS.UPDATE_RETRY_MS` is greater than 0 and less than `TIME_CONSTANTS.ONE_DAY_MS` |

   Command, path first:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   npx jest device/__tests__/updates.test.ts shared/__tests__/constants.test.ts --watchman=false --selectProjects=unit
   ```

   Expected BEFORE the change: `the update retry is shorter than the update check window` fails with
   `expect(received).toBeGreaterThan(expected)` on `undefined`, because `UPDATE_RETRY_MS` does not exist;
   `stamps a failed check an hour back so the day is not lost` fails because the stamp is `1700000000000`, not
   `1699996600000`; `abandons a fetch that has not answered in ten seconds` times out, because nothing aborts the
   fetch. If any of those pass, STOP.

5. **Change.** A `(specified)` step.

   **`shared/constants.ts`.** Add two members to `TIME_CONSTANTS`, beside `ONE_DAY_MS`:

   | Key | Type | Value | Meaning |
   | --- | --- | --- | --- |
   | `UPDATE_RETRY_MS` | number | `60 * 60 * 1000` | How long a check that never reached a comparison costs, instead of a whole day |
   | `UPDATE_FETCH_TIMEOUT_MS` | number | `10 * 1000` | How long a store fetch may stay pending before it is abandoned |

   **`device/updates.ts`.** Two changes.

   First, a private helper:

   - **Name and signature:** `const fetchWithTimeout = async (url: string): Promise<Response>`
   - **What it answers:** the response, exactly as `fetch` would.
   - **How:** it aborts through an `AbortController` armed by a `setTimeout` of
     `TIME_CONSTANTS.UPDATE_FETCH_TIMEOUT_MS`, passes the controller's signal to `fetch` alongside the unchanged
     `{ 'Cache-Control': 'no-cache' }` header, and clears the timer in a `finally` so a fast answer leaves no pending
     timer behind.
   - **What it must never do:** never swallow an error, because `getStoreVersion`'s own `catch` is what turns a
     failure into `false`; never use `AbortSignal.timeout`, which Jest's fake timers cannot drive.
   - **Log lines:** none.

   Both fetches in `getStoreVersion` go through it.

   Second, `getStoreVersion` must distinguish two outcomes it conflates today, because that conflation is what makes
   the failed-check defect impossible to fix. Today it catches its own fetch failure and answers `false`, and it also
   answers `false` for a store that replied cleanly with no version. A network failure therefore reaches
   `checkForUpdates` as a falsy value and NOT as a throw, so no `try`/`catch` shape in the caller can tell "the phone
   is offline" from "the store published nothing". Only one of those deserves an hourly retry.

   So its return type widens to three values:

   - **Name and signature:** `const getStoreVersion = async (): Promise<string | null | false>`
   - **What each value means:** a string is the version the store published; `null` is "the store answered and
     published no version this reader could use"; `false` is "the read failed", which is the fetch throwing, the
     timeout aborting, or the body not parsing as the platform's shape.
   - **What it must never do:** never return `false` for a store that answered cleanly with no version, and never
     return `null` for a failure.
   - **Log lines:** unchanged, `logger.warn('Failed to fetch store version:', error);` in its `catch`.

   iOS returns `null` for `resultCount 0`. Android returns `null` when `readPlayListingVersion` answers `null` on a
   page that WAS fetched successfully, and `false` when the fetch itself failed.

   Third, `checkForUpdates` keeps its signature, `(): Promise<boolean>`, and replaces its `finally` with these four
   rules:

   | What happened | What it stamps | Why |
   | --- | --- | --- |
   | The throttle refused the check | nothing | It never checked, and it already returns before the `try` |
   | `getStoreVersion` answered a version string | `now` | A real check happened, so it costs the full day |
   | `getStoreVersion` answered `null` | `now` | The store answered; "nothing published" is an answer, and retrying it hourly forever would be a network call per launch for no gain |
   | `getStoreVersion` answered `false`, or the body of the `try` threw | `now - TIME_CONSTANTS.ONE_DAY_MS + TIME_CONSTANTS.UPDATE_RETRY_MS` | No check happened, so it costs an hour rather than the day |

   The invariant, from section 5: `checkForUpdates()` stamps `popup_update_last_check` with `now` only when it reached
   a comparison, and stamps `now - ONE_DAY_MS + UPDATE_RETRY_MS` when it did not, so a failure costs one hour of the
   window and never a day; and no fetch it starts can stay pending longer than `UPDATE_FETCH_TIMEOUT_MS`.

   `!installedVersion` keeps its current behaviour of returning `false` without prompting, and takes the success stamp:
   the check ran, and the app simply could not read its own version.

   Comments: one line saying WHY a failure gets its own stamp rather than the day's, and one saying WHY the timeout is
   an explicit controller rather than `AbortSignal.timeout`. Nothing else.

6. **Green.** The same command. Expected: `Tests:` reports `31 passed, 31 total` for `updates.test.ts`: 26 after step 1,
   plus the 5 rows in part 4 that are new, since `stamps a failed check an hour back so the day is not lost` replaces
   `always calls setPopupUpdateLastCheck even on failure` and adds nothing. `constants.test.ts` passes with one more
   test than before. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings` both exit 0.

   Because step 1's four tests around `resultCount 0` and an unparseable page now exercise the `null` return rather
   than `false`, their assertions are unchanged: they assert `checkForUpdates` answers `false` and
   `mockIsNewerVersion` was not called, both of which still hold.

7. **Breaks.** Save to `$TMPDIR/breaks-30-2.sh` and run it from the repository root.

   ```bash
   #!/usr/bin/env bash
   set -u
   TESTS="device/__tests__/updates.test.ts shared/__tests__/constants.test.ts"
   ALL_AS_EXPECTED=1

   run_break() {
     local label="$1" src="$2" subst="$3"
     cp "$src" "$src.bak"
     perl -0pi -e "$subst" "$src"
     if cmp -s "$src" "$src.bak"; then
       echo "BREAK NOT APPLIED: $label"
       ALL_AS_EXPECTED=0
       mv "$src.bak" "$src"
       return
     fi
     if npx jest $TESTS --watchman=false --selectProjects=unit > "$TMPDIR/break-30-2-$label.log" 2>&1; then
       echo "BREAK NOT CAUGHT: $label"
       ALL_AS_EXPECTED=0
     else
       echo "BREAK CAUGHT: $label"
     fi
     mv "$src.bak" "$src"
   }

   # A failure recorded as a check is the defect this step fixes.
   run_break failureBurnsTheDay device/updates.ts 's|\Qnow - TIME_CONSTANTS.ONE_DAY_MS + TIME_CONSTANTS.UPDATE_RETRY_MS\E|now|'
   # A retry longer than the window would make the retry a no-op.
   run_break retryLongerThanWindow shared/constants.ts 's|\QUPDATE_RETRY_MS: 60 * 60 * 1000\E|UPDATE_RETRY_MS: 48 * 60 * 60 * 1000|'
   # Without the abort the fetch stays pending for the life of the process.
   run_break noAbortSignal device/updates.ts 's|\Q, signal: controller.signal\E||'
   # The timer must actually abort the fetch, not merely exist.
   run_break timerNeverAborts device/updates.ts 's|\QsetTimeout(() => controller.abort(), TIME_CONSTANTS.UPDATE_FETCH_TIMEOUT_MS)\E|setTimeout(() => undefined, TIME_CONSTANTS.UPDATE_FETCH_TIMEOUT_MS)|'
   # A successful check must still cost the full day.
   run_break successStampsRetry device/updates.ts 's|\QsetPopupUpdateLastCheck(now);\E|setPopupUpdateLastCheck(now - TIME_CONSTANTS.ONE_DAY_MS + TIME_CONSTANTS.UPDATE_RETRY_MS);|'

   echo "ALL AS EXPECTED: $ALL_AS_EXPECTED"
   ```

   The `\Q...\E` and `$` rules from step 1's part 7 apply here too, and all five were proven to apply while planning.

   **Why `timerNeverAborts` targets the callback and not the delay.** The obvious break is to make the delay enormous,
   and it does not work: `setTimeout` clamps any delay above 2^31-1 to **1 ms**, so `Number.MAX_SAFE_INTEGER` makes the
   timeout fire SOONER rather than never, node warns `Timeout duration was set to 1`, and the test still passes. That
   version was written first and printed `BREAK NOT CAUGHT`. Breaking the abort itself is the honest target.

   Two of these constrain how you may write the code, so read them before step 5 rather than after:

   - `noAbortSignal` searches for `, signal: controller.signal`, so the signal must be the LAST property of the
     `fetch` init object and must be named `controller`. That is the contract's variable name, not a preference.
   - `successStampsRetry` searches for `setPopupUpdateLastCheck(now);` with its semicolon, so the success stamp must be
     a bare statement passing `now`, not an expression wrapped in a helper whose argument is computed elsewhere.

   If either prints `BREAK NOT APPLIED`, that is a STOP under section 2.2 item 4, and never a reason to reshape the
   break.

   Expected: five `BREAK CAUGHT` lines, then `ALL AS EXPECTED: 1`.

   | Break | Tests expected to fail |
   | --- | --- |
   | `failureBurnsTheDay` | `stamps a failed check an hour back so the day is not lost`, `retries an hour after a failure and not before` |
   | `retryLongerThanWindow` | `the update retry is shorter than the update check window`, `stamps a failed check an hour back so the day is not lost` |
   | `noAbortSignal` | `abandons a fetch that has not answered in ten seconds` |
   | `timerNeverAborts` | `abandons a fetch that has not answered in ten seconds`, which takes about 10 s to fail, because jest's own test timeout is what ends a promise the code never settles |
   | `successStampsRetry` | `stamps a successful check with now` |

8. **Version and commit.** The same version command as step 1. Add, by name: `device/updates.ts`,
   `device/__tests__/updates.test.ts`, `shared/constants.ts`, `shared/__tests__/constants.test.ts`, `app.json`,
   `package.json`, and the three plan files.

   ```bash
   cat > $TMPDIR/msg-2.txt <<'EOF'
   <VERSION> - fix(updates): a failed check costs an hour, and no store fetch can hang

   The stamp sat in a finally block, so a fetch that threw was recorded as a
   check that happened and the user lost that whole day's check. This app is
   built to work offline, so that is exactly the user it hurt.

   A check that reached a comparison still costs the full day. One that did not
   is stamped an hour back instead, which is why getStoreVersion now answers
   null for "the store published no version" separately from false for "the read
   failed": without that distinction, an offline failure and a clean empty answer
   are the same value, and only one of them deserves a retry.

   Neither fetch had a timeout, so a hung connection left a pending promise for
   the life of the process. Both now go through an explicit AbortController
   armed by setTimeout. AbortSignal.timeout would read better and is untestable
   here: its host timer ignores Jest's fake timers, so a 10-second case costs 10
   real seconds and signal.aborted stays false after advanceTimersByTime.

   ISSUES #35.
   EOF
   git commit -F $TMPDIR/msg-2.txt
   ```

9. **Review.** Against this checklist:

   - `getStoreVersion` returns `Promise<string | null | false>`, and each of the three values means what the contract
     says.
   - `checkForUpdates` still returns `Promise<boolean>`, so `app/index.tsx` is unaffected.
   - The success stamp is exactly `now`; the failure stamp is exactly
     `now - TIME_CONSTANTS.ONE_DAY_MS + TIME_CONSTANTS.UPDATE_RETRY_MS`.
   - A refused check stamps nothing.
   - `fetchWithTimeout` clears its timer in a `finally`, and no code path uses `AbortSignal.timeout`. Run
     `grep -c "AbortSignal.timeout" device/updates.ts` and expect `0`.
   - Both constants are in `TIME_CONSTANTS`, and `ONE_DAY_MS` is unchanged at `24 * 60 * 60 * 1000`.
   - Comments explain why only.
   - Nothing beyond the file list changed, and `components/modals/Update.tsx` is not in the diff.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/30-failed-check-keeps-its-window \
      -m "Merge fix/30-failed-check-keeps-its-window into uat-2: session 30 step 2, reviewed"
    ```

11. **Done when.**
    - The step's Jest command passes with the counts in part 6.
    - `grep -c "AbortSignal.timeout" device/updates.ts` prints `0`.
    - Tick `- [x] Step 2: DONE in <sha>` in section 6.

---

### Step 3: the Android store button resolves without a Play client

0. **Anchor check.** None: this step changes only `openStore` in `device/updates.ts`, which step 1 already rewrote, so
   an anchor taken at "Planned at" could not be verified. The step's red test is what proves the code is where the
   plan expects.

1. **Goal.** Pressing Update on Android reaches a resolvable store URL even on a device with no Play client.

2. **Branch.** `git checkout -b fix/30-play-store-web-fallback uat-2`

3. **Files.**
   - `device/updates.ts` (changed)
   - `device/__tests__/updates.test.ts` (changed)
   - `app.json`, `package.json` (version bump)
   - the three plan files

4. **Tests first (red).** Suite `device/__tests__/updates.test.ts`, existing, in its `openStore (Android)` describe.

   `opens Play Store URL on Android` keeps its name and its assertion: the first attempt is still `market://`.
   `logs error when Linking.openURL throws on Android` is CHANGED, because a throw now tries the web URL before it
   logs.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `opens Play Store URL on Android` (unchanged) | the Play client is still preferred | `mockOpenURL` resolves | called once with `market://details?id=com.mugtaba.athan` |
   | `falls back to the Play web page when no Play client handles the intent` (new) | the button works without Play installed | `mockOpenURL` rejects on the first call and resolves on the second | called twice; the second call is `https://play.google.com/store/apps/details?id=com.mugtaba.athan`; `mockLoggerError` not called |
   | `logs error when Linking.openURL throws on Android` (changed) | a total failure is still reported | `mockOpenURL` rejects on both calls | `mockLoggerError` called with `'Failed to open store URL:'` and the second error; `mockOpenURL` called twice |
   | `does not fall back on iOS` (new, in the iOS `openStore` describe) | iOS has one destination and must not try a second | `mockOpenURL` rejects | called exactly once, with the App Store URL; `mockLoggerError` called with `'Failed to open store URL:'` |

   Command:

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit
   ```

   Expected BEFORE the change: `falls back to the Play web page when no Play client handles the intent` fails with
   `expect(jest.fn()).toHaveBeenCalledTimes(expected)` showing `Received number of calls: 1`. If it passes, STOP.

5. **Change.** A `(specified)` step.

   `openStore` keeps its signature, `(): Promise<void>`, and:

   - on iOS, opens `APP_STORE_URL` and logs a failure exactly as today, with one attempt only;
   - on Android, opens `PLAY_STORE_URL` (`market://details?id=...`, unchanged) and, when that rejects, opens
     `PLAY_STORE_WEB_URL` before logging;
   - logs, only when the last attempt for that platform failed, with the text unchanged:
     `logger.error('Failed to open store URL:', error);`
   - never shows the user anything: no alert, no toast, no visual change of any kind.

   One new module constant:

   | Name | Value |
   | --- | --- |
   | `PLAY_STORE_WEB_URL` | `` `https://play.google.com/store/apps/details?id=${APP_CONFIG.androidPackage}` `` |

   The invariant, from section 5: pressing Update reaches a resolvable store URL on Android even with no Play client
   installed.

   Comment: one line saying WHY the fallback exists, namely that a device without the Play client refuses the
   `market://` intent. Nothing else.

6. **Green.** The same command. Expected: `Tests:` reports `33 passed, 33 total`: 31 after step 2, plus the 2 genuinely
   new tests, `falls back to the Play web page when no Play client handles the intent` and `does not fall back on iOS`.
   The other two rows in part 4 are an unchanged test and a changed one, and neither adds to the count. Then
   `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-30-3.sh` and run it from the repository root.

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
     if npx jest "$TESTS" --watchman=false --selectProjects=unit > "$TMPDIR/break-30-3-$label.log" 2>&1; then
       echo "BREAK NOT CAUGHT: $label"
       ALL_AS_EXPECTED=0
     else
       echo "BREAK CAUGHT: $label"
     fi
     mv "$SRC.bak" "$SRC"
   }

   # Without the web URL the button does nothing on a device with no Play client.
   run_break noWebFallbackUrl 's|\QPLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=\E|PLAY_STORE_WEB_URL = `market://details?id=|'
   # The Play client must still be preferred.
   run_break webUrlFirst 's|\QPLAY_STORE_URL = `market://details?id=\E|PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=|'
   # iOS has one destination and must not retry.
   run_break iosAlsoFallsBack "s|\\Qconst IS_IOS = Platform.OS === 'ios';\\E|const IS_IOS = false;|"

   echo "ALL AS EXPECTED: $ALL_AS_EXPECTED"
   ```

   Every substitution is anchored on the constant's NAME, not on its URL, because after step 3 two constants hold a
   `play.google.com` URL and an unanchored search would break the wrong one. All four were proven to apply to exactly
   the intended line while planning. The `\Q...\E` and `$` rules from step 1's part 7 apply here too.

   Expected: three `BREAK CAUGHT` lines, then `ALL AS EXPECTED: 1`.

   | Break | Tests expected to fail |
   | --- | --- |
   | `noWebFallbackUrl` | `falls back to the Play web page when no Play client handles the intent` |
   | `webUrlFirst` | `opens Play Store URL on Android` |
   | `iosAlsoFallsBack` | `does not fall back on iOS`, `opens App Store URL on iOS` |

8. **Version and commit.** The same version command. Add, by name: `device/updates.ts`,
   `device/__tests__/updates.test.ts`, `app.json`, `package.json`, and the three plan files.

   ```bash
   cat > $TMPDIR/msg-3.txt <<'EOF'
   <VERSION> - fix(updates): the Android store button resolves without a Play client

   market://details resolves only where the Play client is installed. Without
   it Linking.openURL threw, the failure was logged, and the button did nothing
   at all for the user who pressed it.

   Android now tries the market:// intent first, so a device with Play still
   gets the native store, and falls back to the https Play page when that
   intent finds no handler. iOS keeps its single destination and must not
   retry, which the iosAlsoFallsBack break pins.

   ISSUES #35.
   EOF
   git commit -F $TMPDIR/msg-3.txt
   ```

9. **Review.** Against this checklist:

   - `openStore` still returns `Promise<void>` and still shows the user nothing.
   - Android tries `market://details?id=` first and the `https://play.google.com/store/apps/details?id=` page second.
   - iOS makes exactly one attempt.
   - The `logger.error` text is byte-identical to before.
   - `PLAY_STORE_WEB_URL` is built from `APP_CONFIG.androidPackage`, never from a literal package name.
   - Comments explain why only.
   - Nothing beyond the file list changed, and no visual file is in the diff.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/30-play-store-web-fallback \
      -m "Merge fix/30-play-store-web-fallback into uat-2: session 30 step 3, reviewed"
    ```

11. **Done when.**
    - The step's Jest command prints `33 passed, 33 total`.
    - `yarn validate` passes with 100% on all four measures.
    - Tick `- [x] Step 3: DONE in <sha>` in section 6.

## 7. Device proof

**No production build is needed, and that is a measured conclusion rather than a convenience.** The update prompt's
inputs are the installed version and the store's published version; neither depends on whether the app holds real or
mock prayer data, and `device/updates.ts` reads no prayer data at all. What the phone and simulator prove is the part
tests cannot: that the real Play listing and the real App Store answer a real device's fetch, and that the prompt the
owner sees is unchanged.

The owner asked for screenshots of the result, so this section produces them and opens them:

🐋  "show me screenshots and show me what they look like, save them to a folder, take multiple screenshots... and open
those screenshots so I can see them."

They are saved under `~/athan-store-update-shots/` and opened locally with `open`. They are never attached to a
message.

### 7.1 Safety, before anything else

This session changes no clock and arms no alarm, so the clock-change ritual does not apply. Read the alarm dump anyway,
so a later reader can see the phone was not disturbed:

```bash
adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" > ~/athan-device-sweep/session30/alarms-before.txt
```

Expected: the app's armed alarms, including the one alarm every 3T dump shows at `when 2104803640505` (year 2036, not
identified). **No clock is changed in this session, so no armed alarm is fired by it.** If the dump lists nothing at
all, that is not a failure of this session: it means the phone currently holds no armed alarms, which this plan
neither causes nor fixes. Record what it printed and go on.

Automatic time is never turned off in this session, so nothing has to be restored.

### 7.2 The live endpoints answer, from this Mac

Run before any build, and save:

```bash
mkdir -p ~/athan-device-sweep/session30
cd /Users/muji/repos/rn.athan.uk
{
  echo "=== iTunes lookup, the URL device/updates.ts uses on iOS"
  curl -s "https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb" \
    | python3 -c 'import json,sys;d=json.load(sys.stdin);print("resultCount",d["resultCount"],"version",d["results"][0]["version"] if d["resultCount"] else None)'
  echo "=== Play listing, the URL device/updates.ts uses on Android"
  curl -s "https://play.google.com/store/apps/details?id=com.mugtaba.athan&hl=en&gl=GB" \
    | python3 -c 'import re,sys;h=sys.stdin.read();m=re.search(r"\"141\":\s*\[\s*\[\s*\[\s*\"([^\"]+)\"",h);print("key141",m.group(1) if m else None)'
} > ~/athan-device-sweep/session30/live-endpoints.txt 2>&1
cat ~/athan-device-sweep/session30/live-endpoints.txt
```

Expected, measured on 2026-09-27: `resultCount 1 version 1.5.1` and `key141 1.5.2`. The exact versions will differ as
the owner releases; what must hold is that both lines carry a dotted version and neither says `None`. If either says
`None`, STOP (section 2.2, item 6).

Then prove the shipped parser agrees with the live page, using the app's own function rather than a copy of it:

```bash
cd /Users/muji/repos/rn.athan.uk
curl -s "https://play.google.com/store/apps/details?id=com.mugtaba.athan&hl=en&gl=GB" > $TMPDIR/play-live.html
cat > $TMPDIR/parse-live.test.ts <<'EOF'
import { readFileSync } from 'node:fs';

import { readPlayListingVersion } from '@/device/updates';

it('reads a version out of the Play listing as served today', () => {
  const html = readFileSync(`${process.env.TMPDIR}play-live.html`, 'utf8');

  expect(readPlayListingVersion(html)).toMatch(/^\d+(\.\d+)*$/);
});
EOF
cp $TMPDIR/parse-live.test.ts device/__tests__/parseLive.test.ts
npx jest device/__tests__/parseLive.test.ts --watchman=false --selectProjects=unit \
  > ~/athan-device-sweep/session30/parse-live.txt 2>&1
rm device/__tests__/parseLive.test.ts
tail -6 ~/athan-device-sweep/session30/parse-live.txt
```

Expected: `1 passed, 1 total`. This file is a throwaway proof and is deleted by the command that ran it, so it is
never committed. Confirm with `git status --porcelain`, which must list only the three plan files.

### 7.3 The prompt still looks and behaves as it did, on both platforms

Both devices run a MOCK build, because the prompt's appearance and its two buttons do not depend on prayer data.

**Build once for Android:**

```bash
zsh ~/athan-device-sweep/session3/bin/build-mock.zsh uat-2 mocks/simple.ts ~/athan-device-sweep/session30/athan-30.apk
```

Run it in the background with its log. Success ends `BUILD-MOCK OK`; a `FAILED` line is a STOP. Install with:

```bash
adb -s 8f7ada76 install -r ~/athan-device-sweep/session30/athan-30.apk
```

`-r` keeps the app's data. `build-mock.zsh` installs under `com.mugtaba.athan`, NOT
`com.mugtaba.athan.fleettest`: it sets `PKG=com.mugtaba.athan` and `versionCode 1000000` with the debug keystore
precisely so it goes on over the owner's local build, and the `fleettest` suffix belongs to the separate
`EXPO_ANDROID_SUFFIX` ritual in `ai/AGENTS.md`. Every command below therefore names `com.mugtaba.athan`.

Then launch, following the ritual in `ai/AGENTS.md`: never force-stop, press HOME, then
`adb -s 8f7ada76 shell am kill com.mugtaba.athan`, then a DOUBLED `am start`, because the first start after an install
lands on the launcher.

**For iOS, use the booted simulator** (`xcrun simctl list devices booted` showed `iPhone XS replica (18)` booted at
planning time). Build and run it with xcodebuildmcp against the existing `ios/Athan.xcworkspace`, scheme `Athan`,
configuration `Debug`, on that simulator. Do not prebuild: `app.json` is unchanged by this plan except its version,
and a prebuild would rewrite native folders this session has no reason to touch.

**The check on each platform** is that the prompt appears when the store has a newer version, and that its two buttons
do what they did before. The live store version is `1.5.x` and the installed build is `1.29.x`, so the real comparison
answers "no update", which is correct and shows nothing. To see the prompt, drive the app's own state rather than
faking a store: the prompt's visibility is `popupUpdateEnabledAtom`, which the app sets from the check's boolean.

Reach it through the same path a real newer release would take, by pointing the check at a version that IS newer. The
honest way to do that without editing shipped code is to run the app from a throwaway local commit that raises nothing
but the comparison's input. **This session does not do that**, because it would mean building from a ref that is not
`uat-2` and the value proved is already covered by `__tests__/app/index.test.tsx`'s seven prompt tests, which render
the real modal against a mocked checker and assert exactly these behaviours.

So the device proof is deliberately narrower than the test proof, and says so: on each platform, confirm the app
launches, reaches the home screen, and writes the update check's own log line with no error. Read it from logcat on
Android:

```bash
adb -s 8f7ada76 logcat -d | grep -E "Failed to fetch store version|Failed to check for updates" \
  > ~/athan-device-sweep/session30/android-update-log.txt
wc -l ~/athan-device-sweep/session30/android-update-log.txt
```

Expected: `0` lines, because a phone with a network reaches the Play listing and parses it. A `Failed to fetch store
version` line means the device could not read the page, which is a finding worth recording in `LOG.md` even though the
app is designed to shrug it off.

On iOS, read the simulator's log for the same two strings:

```bash
xcrun simctl spawn booted log show --last 5m --predicate 'processImagePath CONTAINS "Athan"' \
  | grep -E "Failed to fetch store version|Failed to check for updates" \
  > ~/athan-device-sweep/session30/ios-update-log.txt
wc -l ~/athan-device-sweep/session30/ios-update-log.txt
```

Expected: `0` lines.

### 7.4 The screenshots the owner asked for

Take these on the iOS simulator, where a screenshot is a single command, and on the 3T. Save every one into
`~/athan-store-update-shots/`, then open the folder.

```bash
mkdir -p ~/athan-store-update-shots
cd ~/athan-store-update-shots

# iOS simulator: the home screen the check runs behind, and both list pages
xcrun simctl io booted screenshot ios-1-home-standard.png
# swipe to the Extras page with mobile-mcp, then:
xcrun simctl io booted screenshot ios-2-home-extras.png
# open Settings from the masjid icon, then:
xcrun simctl io booted screenshot ios-3-settings.png

# OnePlus 3T: the same three
python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-store-update-shots/android-1-home-standard.png
python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-store-update-shots/android-2-home-extras.png
python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-store-update-shots/android-3-settings.png

open ~/athan-store-update-shots
```

Navigate between pages with `mobile-mcp`, whose element refs survive a layout change, rather than with coordinates.
Read `e2e/device-atlas-oneplus3t.md` BEFORE taking any 3T screenshot: its launcher and dialog coordinates are already
mapped, and only what `mobile-mcp` and Maestro cannot reach earns a new atlas row.

Read each screenshot yourself if your model can see images, and ask one question per image: "does this show the app's
home screen with a prayer list and a countdown, and no error screen and no modal?" If your model cannot see images,
call the `vision` subagent with the path and that exact question (section 11).

The screenshots prove the app is healthy on both platforms with this change in. They cannot prove the prompt's
appearance, because the real store version is older than the installed build; `LOG.md` must say that plainly rather
than implying the prompt was photographed.

### 7.5 What the phones are left on

Both devices are left on the mock build this session installed, which is what the owner asked for:

🐋  "when you're done, I would like you to have the latest versions installed on both these apps these phones."

Automatic time was never turned off, so nothing is restored. Record in `LOG.md` the `versionName` each device ends on:

```bash
adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan.fleettest | grep versionName
```

## 8. Records

### Findings text

Replace the whole of ISSUES #35 in `ai/ISSUES.md`, keeping its number and heading level, with this text. The executor
replaces only the named placeholders with values it measured.

```markdown
### 35. [FIXED <VERSION_3>, session 30] The update prompt read a hand-edited file on GitHub; both stores now answer for themselves

Raised by the owner on 2026-09-12 and closed on 2026-09-27. 🐋  "our goal is to deprecate the released adjacent and
have both platforms reading from the store, the version from the store."

**What ships now.** `device/updates.ts` has one reader with two automatic sources, chosen by platform alone, with no
environment split:

| Channel | Source | Manual step |
|---|---|---|
| iOS, production and UAT alike | `itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb` | none |
| Android, production and UAT alike | the Play listing page for `APP_CONFIG.androidPackage`, parsed by `readPlayListingVersion` | none |

The 24-hour cadence is unchanged, as the owner asked.

**`country=gb` STAYS, against this issue's own original recommendation.** Measured across 15 storefronts on
2026-09-27: `gb` is the only one that answers for this `bundleId`, and `us`, `ca`, `au`, `ie`, `de`, `fr`, `nl`, `se`,
`my`, `pk`, `in`, `sa`, `ae` and `za` all return `resultCount 0`. The app is published in the GB storefront alone and
a `bundleId` lookup is storefront-scoped, defaulting to `us`. Dropping the country would have broken the one channel
that already worked. `id=` behaves the same way: `id=6740474033` alone returns 0, and with `country=gb` returns 1.

**Play In-App Updates was rejected, on verifiability.** `expo-in-app-updates@0.12.0` wraps
`com.google.android.play:app-update:2.1.0` correctly, and that dependency was proven to resolve into this app's
`releaseRuntimeClasspath` with no conflict (`BUILD SUCCESSFUL in 3m 27s`; its three transitive deps land on versions
the app already carries). It is still the wrong answer here: Play In-App Updates only answers for a build Play
installed, and `dumpsys package com.mugtaba.athan` on the 3T shows no `installerPackageName` at all, so a side-loaded
build gets `UPDATE_NOT_AVAILABLE` and a green device check would be indistinguishable from a broken one. It also
reports `availableVersionCode()`, a `versionCode` that every local build pins at `1000000`, where this app's whole
comparison is a dotted version string; and its iOS half reads `AppStoreCountry` from `Info.plist`, so with no country
it queries the wrong storefront for this GB-only listing. Adopting it would have bought one platform and replaced the
settled modal.

**How the Android parse is written, and why not the obvious way.** `readPlayListingVersion(html)` keys on the listing
payload's `"141"` key and accepts the value only when the whole string is dotted decimal numbers. A regex on the
version's SHAPE would have been wrong: the real page holds 8 matches for `1\.\d+\.\d+` and 7 of them are SVG path
coordinates. The version string itself appears exactly once in the document. Measured limits: the key is present for
this app and absent for `com.whatsapp`, `org.telegram.messenger` and `com.spotify.music`, which vary their version per
device, and a wrong package id answers HTTP 404 rather than failing silently. So this is a best-effort read that is
correct for this app, and an unreadable page answers `null`, the caller answers `false`, and no prompt is shown. **The
fail direction is silence, never a false prompt.**

**Two defects this issue found are fixed.** A failed check used to be stamped in a `finally` block, so a fetch that
threw was recorded as a check that happened and an offline user lost that whole day, in an app built to work offline.
A check that reached a comparison still costs `TIME_CONSTANTS.ONE_DAY_MS`; one that did not is stamped
`now - ONE_DAY_MS + UPDATE_RETRY_MS`, an hour. That distinction is why `getStoreVersion` answers three values rather
than two: `null` for "the store published no version", `false` for "the read failed". And neither fetch had a timeout,
so a hung connection left a pending promise for the life of the process; both now go through an `AbortController`
armed by a `setTimeout` at `UPDATE_FETCH_TIMEOUT_MS`.

**DURABLE LESSON: `AbortSignal.timeout` is untestable under Jest's fake timers.** It reads far better than an explicit
controller and it is armed by a host timer that `jest.useFakeTimers` does not replace, so `signal.aborted` stays
`false` after `advanceTimersByTime` and a 5-second case costs 5004 ms of real suite time. An `AbortController` aborted
from a `setTimeout` is fully controllable. Any future timeout in this repo uses the controller.

The third, lower defect is fixed too: `openStore` on Android tried `market://details?id=...` only, which throws on a
device with no Play client, and the failure was logged so the button did nothing. It now falls back to
`https://play.google.com/store/apps/details?id=...`; iOS keeps its single destination.

**`releases.json` is unread and NOT yet deleted.** The standing rule is that it stops being read only once the change
has shipped, and the file is deleted in a separate commit after that, never before. After session 30 no code path
reads it: `grep -c githubusercontent device/updates.ts` prints `0`. **The owner deletes the file once a release
carrying this is live in both stores.** Until then the live apps in both stores still read it, so it must keep its
current version values.

**Proof.** `<TESTS_AFTER>` at 100% on all four measures; `<BREAKS_TOTAL>` breaks across three steps, every one caught.
The live endpoints answered from this Mac (`resultCount 1` for iTunes, a parseable `141` key for Play), and the
shipped `readPlayListingVersion` was run against the page as served that day. Both phones were left on the session's
mock build. Evidence in `ai/plans/30-store-version-automatic/` and `~/athan-device-sweep/session30/`.
```

Also update `ai/ISSUES.md`'s line 6, which lists the open issues. Today it reads:

```
history); open issues keep their detail verbatim. Open now: #10, #17, #27, #37, G.1, G.2, #35.
```

It becomes:

```
history); open issues keep their detail verbatim. Open now: #10, #17, #27, #37, G.1, G.2.
```

And add one line to the `## Fixed (index)` list, in its numeric position after `#34`:

```
- #35 — Update prompt read a hand-edited releases.json; both stores now answer for themselves (fixed)
```

`ai/AGENTS.md`'s `releases.json` rule gains one sentence at its end, because the rule's own trigger has now fired:

```
**Session 30 (2026-09-27) made the app stop reading it**, so the remaining condition is a shipped release: once a
release carrying session 30 is live in both stores, the owner deletes the file in its own commit.
```

### Table rows

The executor sets the `ai/plans/README.md` row 30 status to EXECUTED. On PASS the auditor sets it DONE and applies
this cell text to the matching `ai/prompts/README.md` row:

```
DONE 2026-09-27 (<VERSION_1> to <VERSION_3>). ISSUES #35 closed: both platforms read their own store, `releases.json` is read by nothing, and the 24-hour cadence is unchanged. Android reads the version off its Play listing (`readPlayListingVersion`, keyed on the payload's `"141"` key, dotted-numbers only); iOS keeps the iTunes lookup, and `country=gb` STAYS because measurement across 15 storefronts shows `gb` is the only one that answers for this `bundleId`. `expo-in-app-updates` was rejected on verifiability: Play In-App Updates answers only for a Play-installed build and the 3T shows no `installerPackageName`, so neither phone could ever prove it, and it reports a `versionCode` where this app compares dotted versions. Two defects fixed beside it: a failed check was stamped in a `finally` and burned the whole day for an offline user, and neither fetch had a timeout. DURABLE LESSON: `AbortSignal.timeout` is untestable under fake timers, so the timeout is an explicit `AbortController`. `releases.json` is NOT deleted: the owner deletes it once a release carrying this ships in both stores
```

### Docs commit

```
<VERSION> - docs(plans): session 30 executed: both stores answer for themselves, releases.json unread
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts other than 1 | `uat-2` moved since "Planned at" | NEEDS REPLAN (section 2.2, item 1) |
| The live Play listing has no `"141"` key | Google changed the page shape | STOP, section 2.2 item 6. The fixture tests still pass, so the code is provably correct against the shape this plan measured; the owner decides whether to ship a reader for a page that no longer answers |
| `curl` to the Play listing answers HTTP 404 | the package id is wrong | STOP. `APP_CONFIG.androidPackage` is the only source of it; do not hard-code a package name |
| A break prints `BREAK NOT APPLIED` | your code does not carry the text the break targets | STOP (section 2.2, item 4). Never reshape your code to fit a break |
| `abandons a fetch that has not answered in ten seconds` hangs instead of failing | the mock `fetch` does not listen for `abort` on its `init.signal` | This is your test to correct, towards the plan's row for it: the mock must reject when the signal aborts. Not a STOP |
| Jest reports real seconds elapsed on a timeout test | the code used `AbortSignal.timeout` | Fix your code to use `AbortController` + `setTimeout`, per step 2's contract. It is work still to do |
| `versionLockstep.test.ts` fails | the three version numbers differ | Set all three to the step's version and commit again |
| The 3T install prints `INSTALL_FAILED_VERSION_DOWNGRADE` | the device holds a newer build | STOP and ask. Never `pm clear` and never uninstall |
| The simulator build fails on signing | a simulator build needs none | STOP and quote the error |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

### Anticipated review fixes

These are the only fixes the executor may apply to anything this plan fixed, and each is given word for word:

1. **If `device/updates.ts` still imports `isProd` after step 1,** delete `isProd` from the import list in
   `import { APP_CONFIG, isProd } from '@/shared/config';`, leaving `import { APP_CONFIG } from '@/shared/config';`.
2. **If a comment in `device/updates.ts` states what a line does rather than why it exists,** delete that comment.
3. **If the doc comment above `getStoreVersion` still names `releases.json` or GitHub after step 1,** replace the
   whole comment with these three lines:

   ```ts
   /**
    * The version the platform's own store publishes: the App Store on iOS, the Play listing on Android.
    * `country=gb` is load-bearing, not tidiable: measured across 15 storefronts, `gb` is the only one that
    * answers for this bundleId, so dropping it returns resultCount 0 for every user.
    */
   ```

A finding this list does not answer, and that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the
executor applies itself and records in `LOG.md`. Anything else is a STOP.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `device/updates.ts`, `device/__tests__/updates.test.ts`, `app.json`, `package.json` | nothing (no new file) |
| 2 | `device/updates.ts`, `device/__tests__/updates.test.ts`, `shared/constants.ts`, `shared/__tests__/constants.test.ts`, `app.json`, `package.json` | nothing |
| 3 | `device/updates.ts`, `device/__tests__/updates.test.ts`, `app.json`, `package.json` | nothing |

Also delete `device/__tests__/parseLive.test.ts` if section 7.2 left it behind: it is a throwaway proof and must never
be committed.

## 11. Subagents in this plan

None, with one conditional exception. The session does its own planning, execution, review and audit (owner,
2026-09-26).

The exception is reading an image, which is a capability that differs between models. Section 7.4 produces six
screenshots. If the session's model can see images, it reads them itself. If it cannot, it calls the `vision` subagent
once per image, with the path and this exact question:

> Does this show the app's home screen with a prayer list and a countdown, with no error screen and no modal over it?

No model is named anywhere in this plan.

## 12. Report to the owner

Start with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`. Then:

- a few plain sentences: that both platforms now read their own store, that `releases.json` is read by nothing and
  still exists on purpose, that the failed-check and timeout defects are fixed, and what the live endpoints and the
  two devices showed;
- the progress table, in `EXECUTOR-BRIEF.md` section 6's format;
- the one thing waiting on the owner: deleting `releases.json` once a release carrying this ships in both stores;
- where the screenshots are (`~/athan-store-update-shots/`) and that they were opened;
- the four-line handoff from the `athan-next` skill, section 5.
