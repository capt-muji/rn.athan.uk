# Next session: code audit, the changes (part 2 of task 20)

Read `ai/AGENTS.md` first, act as Orchestrator. This continues task 20, which session 4 started
on 2026-09-12 and did not finish. Everything in `ai/prompts/audit-changes.md` still applies:
read it as well, it is the governing brief. This file records what changed since, so the next
session does not re-derive it.

## Where things stand

`uat-2` is at **1.25.30**. Twenty four version-bumped commits landed, each on its own branch,
merged `--no-ff`, pushed. The suite is **43 suites, 1035 tests**, up from 42/1015 and never down.

**Eighteen numbered findings are closed with code.** The full table, the four new findings and
the two corrections are at the end of `ai/features/uat-2/AUDIT-FINDINGS.md`, under "Session 4,
part 1". Read that section before anything else in the document.

The OnePlus 3T holds a **prod build of 1.25.30**, matching `uat-2` HEAD, with real London data,
Fajr on Sound, one alarm armed and `yarn check:device` green.

## Four things session 4 learned that change how you should work

**1. `[test]` is not proof.** Finding 2 was marked `CONFIRMED [test]` and was **wrong about the
shipped bundle**. `metro.config.js` sets `inlineRequires: true`, so module evaluation defers to
first use; jest's graph is eager. Measured on device, `stores/notifications.ts` evaluates 5 ms
*after* `handleAppUpgrade` removes the gate key, so the old code worked in Release. Any
remaining finding whose mechanism depends on **when a module first evaluates** must be checked
on the device before you believe it. Finding 4 was re-checked and stands, because its parts
live in one file.

**2. Never build with `EXPO_PUBLIC_PERF_MONITOR=1` on the owner's device casually.** That build
runs the mock API and writes fabricated prayer times into MMKV. Installing a prod build over it
at the same version does **not** clear them (`wasAppUpgraded()` false), and bumping the version
does not either (post-#34 an upgrade only wipes when `cacheSchemaChanged()`). The only recovery
without root is `adb shell pm clear`, which also destroys the alert preferences and needs them
re-entered by hand through the UI. Session 4 hit this and recovered it; budget for that or do
not take the measurement.

**3. The pre-commit hook now works for config files.** Finding 61: `biome.json` ignores
`metro.config.js` and `jest.config.js` while lint-staged fed them to Biome, which errored, so
those files were uncommittable except with `--no-verify` — which skips Biome on everything else
**and** the related-test run. Fixed with `--no-errors-on-unmatched`. Do not reach for
`--no-verify`; if the hook fails now, it has found something.

**4. The version bump touches three files and one is gitignored.** `app.json`, `package.json`
and `android/app/build.gradle`. The last is not tracked, so it never appears in a commit, but it
must stay in step or local device builds ship the wrong `versionName`. Session 4 used a helper
in the scratchpad that bumps all three and verifies they match; rewrite it, it is six lines.

## What is left, in the brief's order

The original prompt's step order still governs. Remaining work, by step:

| Step | Findings | Note |
| --- | --- | --- |
| 4 | **5** | Android's five daily athan channels, never created at schedule time. The highest silent-alarm risk left. Device-verify through `yarn check:device`, which session 4 repaired. |
| 5 | **8**, 47 | One guard in `validateApiResponse` closes both, and closes finding 6's escape-hatch question with it. |
| 6 | **10, 11, 24, 22, 26, 21** | Cheap guards. Each is a small test. |
| 7 | 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 27, 48, 49, 50, 52, 53, 54, 55, 56, 57 | The rest of Tier 2, in document order. |
| 8 | 34, 36 | The rest of Tier 3. 28, 29, 30, 31, 32, 33, 35 are done. |
| 9 | **44**, 46 | Tier 5. 44 is the one that matters and is fixable today. 43 is a note. 45 is withdrawn. |
| 10 | a-aa, plus the four accessibility items | Tier 6. 52 and 53 lead it. |
| — | 37, 38, 39, 41 | Tier 4 iOS widgets, behind the off flag. The brief recommends doing these four and leaving 40 and 42 recorded. |

Findings **1** and **45** are settled and need no work. Finding **9** is resolved by the owner's
ruling but keeps a live fix direction: an `env` block in `eas.json` stating the contract the
dashboard already provides, plus a config-time failure when the environment is prod or preview
and the key is absent or still the placeholder.

## One open question for the owner, not for you to decide

**Finding 6's escape hatch.** The owner's position is that reaching the error screen means
something has gone wrong, so wiping and refetching is right. Tracing the paths showed that
holds for a corrupt cache and fails for a failed fetch, which is the common case. The wipe is
now gone. Finding 8 closes the corrupt-cache path at source. If the owner still wants a reset
after that, it is a second explicitly labelled destructive button, not the only button on the
screen. Put it to them once finding 8 has landed.

## Device and key

The 3T (`3T_SERIAL`) and nothing else; the iPhone XS stays disconnected. A prod build needs the
real API key passed through shell env, never committed and never written into the repository.
Session 4 kept it at mode 600 in the session scratchpad and verified with a repository-wide
grep that it never reached the tree. Ask the owner for it; do not assume the previous
scratchpad survives, and remember `/tmp` is wiped nightly.

Build ritual that worked, every time:

```sh
rm -rf node_modules/.cache/metro
find android/app/build -name index.android.bundle -delete
export EXPO_PUBLIC_ENV=prod
export EXPO_PUBLIC_API_KEY=$(cat <scratchpad>/.api_key)
./android/gradlew -p android assembleRelease
adb -s 3T_SERIAL install -r android/app/build/outputs/apk/release/app-release.apk
```

Verify the APK before trusting it: `unzip -p app-release.apk assets/app.config` for the version,
and the bundle md5 against the previous build. An identical md5 is correct only when the
JavaScript genuinely did not change.

## The bar, unchanged

This app is an alarm clock. A prayer time two minutes wrong is a bug; a notification on the
wrong night is a serious one. One finding, one branch, one commit. The whole suite passes
before and after every commit and never goes down. Never edit a test to make it pass. Break a
fix deliberately to prove its test bites, which session 4 did for every fix that had one.
