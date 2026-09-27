# Research: ISSUES #35, deprecating `releases.json`

Every claim below was measured on this Mac on 2026-09-27, against `uat-2` at `a265ec1d` (version 1.29.14). Each one
names the command that produced it, so the audit can rerun it.

## 1. The goal, restated from the owner's words

🐋  "when I release to the stores, I want my users to automatically get an update... I don't want to manually handle
the release adjacent anymore."

🐋  "essentially, our goal is to deprecate the released adjacent and have both platforms reading from the store, the
version from the store. If the installed version is old, and then there's a new version available on the store, then
we want to show the update to the users."

🐋  "no need to change how often it triggers. That's already in place, I believe."

So: both platforms read their own store, nothing is hand-edited after a release, and the 24-hour cadence is untouched.

## 2. What ships today

`device/updates.ts` has one reader with two sources:

| Channel | Source today | Manual step |
| --- | --- | --- |
| Production iOS | `itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb` | none |
| Production Android | `raw.githubusercontent.com/.../releases.json` | yes |
| UAT iOS, UAT Android | the same `releases.json` | yes |

`checkForUpdates()` throttles on `popup_update_last_check` at `TIME_CONSTANTS.ONE_DAY_MS`, compares with
`isNewerVersion`, and is called fire-and-forget from `app/index.tsx:117` inside the 1500 ms settling timeout.

## 3. iOS: the lookup works, and `country=gb` is load-bearing, not removable

ISSUES #35 recommends dropping the hard-coded `country=gb` so a user in another storefront gets a correct answer.
**That recommendation is wrong, and measurement is what shows it.**

```
curl -s "https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb" -> resultCount 1, version 1.5.1
curl -s "https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan"            -> resultCount 0
curl -s "https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=us" -> resultCount 0
```

Probed 15 storefronts by `bundleId` (`gb us ca au ie de fr nl se my pk in sa ae za`): **`gb` is the only one that
answers 1; every other answers 0.** The app is published in the GB storefront alone, and a `bundleId` lookup is
storefront-scoped, defaulting to `us` when no country is given. Removing `country=gb` would therefore break the one
channel that already works, for every user.

A second measurement, which matters for the design: **`id=` is not interchangeable with `bundleId=`.**

```
curl -s "https://itunes.apple.com/lookup?id=6740474033"           -> resultCount 0
curl -s "https://itunes.apple.com/lookup?id=6740474033&country=gb" -> resultCount 1, version 1.5.1, "Athan: London"
```

`id=` needs the same country. This is why `expo-in-app-updates`' iOS half cannot be adopted as-is: it reads `AppStoreID`
and `AppStoreCountry` from `Info.plist`, and with no country set it queries the default storefront and answers
`updateAvailable: false` forever for this app. Verified by reading its `ios/ExpoInAppUpdatesModule.swift` at 0.12.0.

**Conclusion for iOS: the existing iTunes Lookup call is already correct and already automatic. It keeps `country=gb`,
and a comment must record WHY, because "drop the hard-coded country" reads like an obvious improvement and is a
regression.**

## 4. Android: Play publishes no version API, and the two candidate answers

Google removed the public "latest version" endpoint deliberately. Two vehicles exist.

### 4.1 Play In-App Updates through `expo-in-app-updates` (REJECTED)

Read at 0.12.0 (`expo-in-app-updates`, `latest`, published 2026-06-07, peer `expo: "*"`, zero dependencies). Its
Android half wraps `com.google.android.play:app-update:2.1.0` correctly and would work. It is rejected on five
measured grounds, not on taste:

1. **It cannot be verified on either phone this project owns.** Play In-App Updates only answers for a build Play
   itself installed. The 3T carries a side-loaded build:
   `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan` prints `versionName=1.28.50` with **no
   `installerPackageName` line at all**, which is what a side-load looks like. `AppUpdateManager` answers
   `UPDATE_NOT_AVAILABLE` for such a build, so a green device proof would be indistinguishable from a broken one.
   ISSUES #35 anticipated this ("acceptance needs an internal-test-track install"), and the owner's instruction
   forbids the cloud path that would provide one.
2. **Its iOS half is wrong for this app**, per section 3: no `AppStoreCountry` means the GB-only listing is invisible.
   Adopting the package would mean keeping our own iOS reader anyway, so it buys one platform, not two.
3. **It reports a `versionCode`, not a version name.** `ExpoInAppUpdatesModule.kt` resolves
   `"storeVersion" to appUpdateInfo.availableVersionCode().toString()`. `app.json` pins `versionCode` to `1000000`
   for every local build, and `compareVersions('1000000', '1.29.14')` is meaningless. The app's whole update story is
   built on the dotted `MAJOR.MINOR.PATCH` string (`ai/AGENTS.md` versioning section), so this value cannot feed
   `isNewerVersion`.
4. **It changes the user-visible flow the owner did not ask to change.** Its flexible and immediate flows replace the
   app's own `ModalUpdate`, and `visuals are settled` (`EXECUTOR-BRIEF.md` section 2).
5. **It is a new native dependency on the release path**, needing a prebuild and a rebuild of both phones to test a
   code path neither phone can exercise.

Its Android dependency WAS proven resolvable, so the finding is about verifiability, not about Gradle. Measured by
adding `implementation 'com.google.android.play:app-update:2.1.0'` to `android/app/build.gradle` and running
`./gradlew :app:dependencies --configuration releaseRuntimeClasspath`: `BUILD SUCCESSFUL in 3m 27s`, the artifact
resolves at `2.1.0`, and its three transitive deps land on versions the app already carries
(`play-services-basement:18.1.0 -> 18.3.0`, `play-services-tasks:18.0.2 -> 18.1.0`, no conflict). The edit was
reverted; `git status --porcelain` is clean.

### 4.2 The Play Store listing page (CHOSEN)

The listing page carries the current version in its embedded data, and it is readable with a plain `fetch`.

```
curl -s "https://play.google.com/store/apps/details?id=com.mugtaba.athan&hl=en&gl=GB"  -> http 200, 1.06 MB
```

The version sits behind a stable key in the page's `AF_initDataCallback` payload:

```
...,"141":[[["1.5.2"]],[[[36]],[[[24,"7.0"]]]]],"145":[null,[null,"- Changed daily reset from midnight...
```

Key `141` holds the version name, and `1.5.2` appears **exactly once in the whole document** (verified by scanning
every occurrence of the literal and printing its context: one hit). Measured across three requests: 200 each, 0.40 to
0.52 s. Measured with and without a browser User-Agent: the key parses from both, so no UA spoofing is needed.

**The honest limits, all measured:**

| Probe | Result | What it means |
| --- | --- | --- |
| `com.mugtaba.athan` | `141` -> `1.5.2` | works for this app |
| `com.whatsapp`, `org.telegram.messenger`, `com.spotify.music` | `141` absent | apps that vary their version per device do not publish one here |
| `com.does.not.exist.zzz9` | HTTP 404 | a wrong package id fails loudly, not silently |

So this is a best-effort read that is correct for THIS app and answers nothing for apps without a single published
version. That is acceptable precisely because a failed read shows no prompt: the design's fail direction is silence,
never a false prompt. It is recorded as the known fragility, with the fallback named in section 6.

**Why not `raw.githubusercontent.com` any more:** it carries no SLA, its limits are IP-based so carrier-NAT users
share a bucket, a file on `main` is a deploy channel with no review gate, and above all it is the manual step the
owner wants gone.

## 5. Two defects ISSUES #35 found, both confirmed by reading the code

1. **A failed check burns the whole 24-hour window.** `device/updates.ts:67-69` runs `setPopupUpdateLastCheck(now)` in
   a `finally`, so a fetch that threw is recorded as a check that happened. A user who launches with no signal loses
   that day's check, in an app explicitly designed to work offline.
2. **Neither fetch has a timeout.** A hung connection leaves a pending promise for the life of the process. Nothing
   awaits it, so nothing visible breaks, but the check neither resolves nor retries within the day.

A third, lower: `openStore()` uses `market://details?id=...` on Android with no `https://play.google.com/...`
fallback, so on a device with no Play client `Linking.openURL` throws and the button does nothing.

## 6. The timeout mechanism: a spike that changed the design

The obvious implementation of the missing timeout is `AbortSignal.timeout(ms)`, which exists in this runtime
(`node_modules/react-native/Libraries/Core/setUpXHR.js` installs both `AbortController` and `AbortSignal`, and
`AbortSignal.js` exports a `timeout` static). `whatwg-fetch` honours `signal` (`dist/fetch.umd.js:626`).

**It is the wrong choice here, and only a spike shows why.** Run in the scratch worktree:

```
shared/__tests__/spike1.test.ts  ->  PASS, but "a timed-out signal rejects..." took 5004 ms
shared/__tests__/spike2.test.ts  ->  PASS
  "AbortSignal.timeout ignores fake timers (real wall time elapses)"          signal.aborted === false after advanceTimersByTime(60)
  "an explicit AbortController driven by setTimeout IS fake-timer controllable" aborted === true after advanceTimersByTime(5000)
```

`AbortSignal.timeout` is armed by a host timer Jest's fake timers do not replace, so a test of a 5-second timeout
costs 5 real seconds of suite time and cannot be driven deterministically. An explicit `AbortController` aborted from
a `setTimeout` is fully controllable. **The plan therefore specifies `AbortController` plus `setTimeout`, which is
both testable at 100% coverage and free of real waiting.** Both spike files were deleted.

## 7. What `expo-updates` is, and why it is not this

The owner wondered whether `expo-updates` is the answer. It is already a dependency (`~58.0.9`) and is used for
exactly one thing: `components/ui/Error.tsx` calls `Updates.reloadAsync()` on the error screen's Refresh. `app.json`
carries no `updates` block and no `runtimeVersion`, so no OTA channel is configured.

It is not the answer to this issue for two reasons. It ships JavaScript over the air from EAS, and EAS is read-only
for this project (`ai/AGENTS.md`: 🐋  never build on EAS and never push anything to it). And it cannot deliver a
native change at all, so a store release would still need a store prompt. The two mechanisms answer different
questions; this issue is the store one.

## 8. The shape this plan builds

One reader, two automatic sources, no hand-edited file, and the same 24-hour cadence:

| Channel | Source after this plan | Manual step |
| --- | --- | --- |
| iOS (production and UAT alike) | iTunes Lookup, `bundleId` + `country=gb` | none |
| Android (production and UAT alike) | the Play listing page for `APP_CONFIG.androidPackage` | none |

The environment split disappears with `releases.json`: both `isProd()` branches existed only to choose between the
live store and the hand-edited file, and a UAT build now reads the same live store as production. That is a
deliberate, owner-visible consequence: a TestFlight or internal-test tester whose build is NEWER than the public
store sees no prompt, which is right, and one whose build is OLDER is told to update, which is also right.

`releases.json` itself is NOT deleted by this plan. `ai/AGENTS.md` is explicit: 🐋  it stops being read only once the
update-prompt feature no longer reads it AND that removal has shipped; the file is deleted in a separate commit after
that, never before. This plan makes the app stop reading it and says so in the records; the deletion is a later,
separate act by the owner once a release carrying this plan is live in both stores.
