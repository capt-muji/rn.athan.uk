# Research: native in-app updates, and the end of `releases.json`

Measured on 2026-09-27 against `uat-2` at `5c3f2f00` (version 1.29.22). Every claim names the command or source that
produced it, so the audit can rerun it.

## 1. Why this session exists at all

Session 30 replaced the hand-edited `releases.json` with two automatic readers: iTunes Lookup on iOS, and a scrape of
the Play listing page on Android. The owner then made three points that change the design, and each one is right.

🐋  "all users will be installing their apps from the play store or from the App Store. Right now on the phones, we
have just compiled it locally... I have not done it through the App Store or the play store, but we will."

That withdraws session 30's central objection to Play In-App Updates. That session rejected the library partly because
a side-loaded build always answers `UPDATE_NOT_AVAILABLE`, so neither phone could prove it works. **That is a fact
about the test devices, not about the library**, and judging a production mechanism by what a side-load can exercise
was the wrong frame.

🐋  "Native always wins versus custom implementation."

🐋  "I don't ever want to touch released on Jason ever again. I never ever want touch it again, so actually I'm looking
to get rid of that."

## 2. Session 30's other objections, re-tested

| Objection session 30 made | Verdict now | Evidence |
| --- | --- | --- |
| Unverifiable, because a side-load answers `UPDATE_NOT_AVAILABLE` | **Withdrawn.** True of the test phones, irrelevant to real users | Owner's instruction, section 1 |
| Its iOS half queries the wrong storefront for this GB-only listing | **WRONG, and this was a research failure.** `AppStoreCountry` is documented in the package README line 21 for exactly this case: "If your app is not available in the US... set the `AppStoreCountry`" | `README.md:19-33` in the 0.12.0 tarball |
| It reports a `versionCode`, which cannot feed `isNewerVersion` | **True, and it does not matter**, because nothing compares it: Play answers `updateAvailable` itself and `checkAndStartUpdate` never does arithmetic | `ExpoInAppUpdatesModule.kt:121`, `src/index.ts:58-64` |
| It replaces the settled `ModalUpdate` on Android | **True, and now the owner's explicit choice** | 🐋  "Android gets a native. iOS gets a little cool" |
| A new native dependency on the release path | True, unchanged. Mitigated by the compatibility work in section 4 | |

## 3. The two platforms are NOT symmetric, and that decides the whole design

- **Android has a real in-app update API.** Play answers whether an update exists, shows its own overlay, downloads in
  the background and installs. The app writes no prompt at all.
- **iOS has no in-app update mechanism.** The package's own README says it twice: "since iOS does not have any in-app
  update solution, it just opens the app in the App Store on a modal" (`README.md:7` and `:102`). Its iOS
  `startUpdate` is `SKStoreProductViewController`, an App Store sheet presented over the app
  (`ios/ExpoInAppUpdatesModule.swift`, `loadProduct` then `present`).

So iOS needs something to ask the user, and that something is the existing `ModalUpdate`. The result is the least
custom code available:

| | Android | iOS |
| --- | --- | --- |
| Decides an update exists | Play (`updateAvailable`) | iTunes Lookup plus our `compareVersions` |
| Asks the user | **Google's overlay** | **`ModalUpdate`**, because nothing native exists |
| Where the user updates | in the app, never leaving | an App Store sheet over the app |
| Custom code after this session | **none** | the modal, and the store link behind its button |

## 4. Is the package safe to adopt? Measured, not assumed

**Version.** `expo-in-app-updates@0.12.0`, published 2026-06-07, is `latest` on npm. Zero runtime dependencies, peer
`expo: "*"`. Integrity `sha512-RqqT0KEqZNbOk5Zxq+JQ7ph7mH/ZNfKOowPyZI8K2YnYBjjNIOyt5PlSZz5/JtmPsBGe6/oKiu1QY+4rGfY+Eg==`.

**It is built for SDK 56 and we are on SDK 58**, which is the first thing to check rather than hope about. Every
Kotlin API its module uses exists in the installed `expo-modules-core@58.0.7`:

| API used by the package | Where it lives in our installed core |
| --- | --- |
| `OnCreate`, `OnDestroy`, `OnActivityResult` | `modules/ModuleDefinitionBuilder.kt:108`, `:122`, `:164` |
| `Events`, `Constants` | `objects/ObjectDefinitionBuilder.kt:438`, `:89` |

`OnCreate` is additionally proven on the owner's own device by `modules/widgetrefresh`, which uses it in production.

**Its Android dependency resolves into our build with no conflict.** Measured in session 30 by adding
`com.google.android.play:app-update:2.1.0` to `android/app/build.gradle` and running
`./gradlew :app:dependencies --configuration releaseRuntimeClasspath`: `BUILD SUCCESSFUL in 3m 27s`, and its three
transitive dependencies land on versions the app already carries (`play-services-basement 18.1.0 -> 18.3.0`,
`play-services-tasks 18.0.2 -> 18.1.0`, `core-common 2.0.3`). The edit was reverted.

**Platform floor.** Google's documentation: in-app updates are supported on **Android 5.0 (API 21) and higher**, on
phones, tablets and ChromeOS. Our `minSdk` is 24, so every device we ship to is covered. The OnePlus 3T is API 28 and
covered, though being a side-load it will always answer "no update" there.

**What other people have hit.** All 34 issues in the repository are closed. The cluster that matters is a real
production crash, reported three times (#20, #21, #24): `IntentSender$SendIntentException` thrown by
`startUpdateFlowForResult` when the update dialog opens, which Google Play Console flagged for a production user on
2025-11-24. **The fix is in 0.12.0 and was verified in the source we will install**: the call sits inside
`catch (e: IntentSender.SendIntentException)` at `ExpoInAppUpdatesModule.kt:162`. Issue #19 reports Play surfacing
real-world rejections such as `AppUpdateService : Binder has died` and `Install Error(-6)` for low battery or low
disk; the design in section 6 treats every rejection as "no update" and shows the user nothing.

**One more reason to keep our own comparison on iOS.** Issue #16 showed the package's Swift version check was once a
plain string compare, where `"1.0.10" > "1.0.9"` is `false`. It was fixed in 0.9.0, but our `compareVersions` is
numeric per segment, already tested, and already the thing every other version decision in this app uses.

## 5. Flexible or immediate, and what the owner actually asked for

🐋  "If there is an update, we should automatically download it for the user without them asking without them
clicking anything in the background."

Google's documentation, fetched 2026-09-27:

- **Flexible:** "background download and installation with graceful state monitoring... appropriate when it's
  acceptable for the user to use the app while downloading".
- **Immediate:** "fullscreen UX flows that require the user to update and restart the app in order to continue using
  it".

**Flexible is the owner's flow, with exactly one unavoidable deviation.** Google requires a consent dialog:
"When you start a flexible update, a dialog first appears to the user to request consent. If the user consents, then
the download starts in the background, and the user can continue to interact with your app." No app can skip that tap,
and the owner accepted it: 🐋  "You said Android needs 1 consistent tap. Fine, I can accept that."

After that tap the rest is automatic, including the part Google warns you must normally build yourself. Google:
"Unlike with immediate updates, Google Play does not automatically trigger an app restart for a flexible update."
**This package already does it for us**: its `InstallStateUpdatedListener` calls `appUpdateManager.completeUpdate()`
the moment it sees `InstallStatus.DOWNLOADED` (`ExpoInAppUpdatesModule.kt`, `InstallStatus.DOWNLOADED` branch). So
there is no second prompt and no progress UI to write.

A prayer-times app must never be blocked by an update, so immediate is wrong here on its own merits. `updatePriority()`
in Play Console can escalate later without an app change, and the package already reads it (#23, shipped in 0.12.0).

## 6. The iOS flow, exactly as the owner described it

🐋  "some users actually have automatic downloads... so the modal might never pop up for them, but I guess they will
get the what's new modal, right? ... for other iOS users... they will get the modal pop up to update, they will take
them to the store, they will click update, when they come back to the app it will be a new version, and they'll get
the what's new."

Both halves are correct and need no new code:

- A user with App Store automatic updates on is already updated when they next launch, so `isNewerVersion` is false
  and the modal never appears. `shouldShowWhatsNew` then fires, because the installed version differs from
  `whats_new_shown_version`.
- A user without it sees `ModalUpdate`, taps Update, updates in the App Store, and on returning gets What's New the
  same way.

The existing gate in `app/index.tsx` already prevents the two modals stacking:
`visible={updateAvailable && !whatsNewVisible && !helpVisible}`.

## 7. Deleting `releases.json` is safe, and this is the measurement that proves it

The standing rule (`ai/AGENTS.md`) is that the file may be deleted only once the update-prompt feature stops reading
it AND that removal has shipped. Session 30 stopped the reading; this session can finish the job because of what the
file actually contains:

```
production.updatePopup.android.version = "1.0.0"
uat.updatePopup.ios.version            = "1.0.0"
```

Every version in it is `1.0.0`, and the live App Store build is 1.5.1. So for any installed version this app has ever
shipped, `isNewerVersion(installed, "1.0.0")` is `false`: checked at 1.5.1, 1.20.0 and 1.29.22, all `false`.
**The file prompts nobody today and cannot prompt anybody.** A live app still reading it therefore loses nothing when
it 404s, and `getStoreVersion` already answers `false` on any fetch failure.

No shipped code references it: `grep -rn "releases.json\|githubusercontent"` across `device stores shared components
app hooks api` returns one stale comment in `shared/versionUtils.ts:18` and nothing else.

## 8. What this session must NOT touch, and the owner's question that nearly broke it

🐋  "I know iOS still needs our stored version... Does Android need the storage version flow anymore? ... I guess we
can just disable that and disable that entire fluff for Android, but keep it for iOS. Right?"

**No. Disabling it on Android would reintroduce ISSUES #34.** Two different things share the word "version":

| Flow | What it answers | Who uses it | This session |
| --- | --- | --- | --- |
| `app_installed_version` in MMKV, via `getStoredVersion` / `wasAppUpgraded` / `handleAppUpgrade` | "was the app upgraded since the last launch" | `stores/sync.ts:524` and `stores/bootstrap.ts:65`: the cache-schema wipe, the forced notification reschedule, the alert-preference migration, and the What's New gate | **Untouched on both platforms** |
| `getInstalledVersion` plus a store version, in `device/updates.ts` | "does the store have something newer" | the update prompt only | **Deleted on Android, kept on iOS** |

The stored flow never contacts a store: it compares this launch against the previous one. Removing it on Android would
leave an upgraded Android user without the cache wipe and without the forced reschedule, which is exactly ISSUES #34,
where an app update left the phone silent for 12 hours. `stores/version.ts` is therefore out of scope, and no step
touches it.

## 9. Dead code this session removes

The owner's rule: 🐋  "if we have any debt code that both platforms don't need anymore, we can drop that, but if one
of the platforms uses it, then I guess we can just make a platform dependent."

| Code | Fate |
| --- | --- |
| `readPlayListingVersion`, `PLAY_VERSION_KEY`, `DOTTED_NUMBERS`, `PLAY_LISTING_URL` | **Deleted.** The scrape is what native replaces |
| `PLAY_STORE_URL`, `PLAY_STORE_WEB_URL`, the Android half of `openStore` | **Deleted.** Play's overlay is the destination now |
| `APP_STORE_URL` and the iOS half of `openStore` | **Kept**, iOS only |
| `fetchWithTimeout`, the retry stamp, `UPDATE_RETRY_MS`, `UPDATE_FETCH_TIMEOUT_MS` | **Kept**, and they become iOS-only paths |
| `releases.json` | **Deleted**, per section 7 |
| `shared/versionUtils.ts`, `stores/version.ts` | **Untouched** |
