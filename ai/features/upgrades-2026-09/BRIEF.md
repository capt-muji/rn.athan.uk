# Upgrades & audit — programme brief

**Opened:** 2026-09-12, by the owner, immediately after the uat-2 programme closed.

`uat-2` is **not** merged into `uat`, and will not be for a while. The owner deferred
that deliberately to fit this work in first: *"I don't want to merge UAT 2 into UAT for
a little while longer... I've thought of some more things we want to address."*

## What changed in the owner's standing instructions (2026-09-12)

Three reversals. Each supersedes something written down earlier, so read them before
trusting any older document.

1. **Package upgrades are now IN SCOPE.** This reverses the constraint in
   `ai/features/uat-2/AUDIT-BRIEF.md` ("No package upgrades. The owner deferred them:
   if it works, it works"). Owner: *"this sounds like a good time to upgrade packages"*.
   That brief has been corrected, but older session prompts may still repeat the old
   rule — this brief wins.
2. **Task 16 (countdown tip clamp, visual confirmation) is CLOSED**, no work remaining.
   Owner checked it on device: *"the tip is fine. you can leave it."*
3. **Tasks 23–24 (merge `uat-2` → `uat`, then refresh the alarm-clock backport) are
   DEFERRED**, not cancelled, and still require the owner's explicit word.

## The arc — four sessions

The owner asked for this to be split because long single sessions kept compacting.
Each session ends by handing the owner a paste-block for the next.

| # | Session | Prompt | Touches code? |
|---|---|---|---|
| 1 | Upgrade research → ranked plan | `ai/prompts/upgrade-research.md` | **No** |
| 2 | Upgrade execution, one package at a time | written at the end of S1 | Yes |
| 3 | Code audit: findings (task 19) | `ai/features/uat-2/AUDIT-BRIEF.md` | **No** |
| 4 | Code audit: changes (task 20), one at a time | written at the end of S3 | Yes |

Why split here specifically: S1 fills its context with changelogs and will compact —
that is fine, because its entire output is a file. S2 needs a clean context for device
work. S3 wants fresh eyes on code it has not just been editing. S4 needs the
one-change-at-a-time discipline that a tired context stops honouring.

After all four: merge `uat-2` → `uat` on the owner's word, then the backport, and only
then the v2.0 global expansion (a much larger research-led programme the owner has
already flagged as its own multi-session effort).

## Version inventory at the time of writing

`package.json` @ 1.24.34. The headline gaps:

- **react 19.2.3** — 19.3 released 2026-09-09, the reason this programme exists.
- react-native 0.86.3, expo ~57.0.21, expo-router ~57.0.20, typescript ~7.0.2,
  jotai 2.20.3, react-native-mmkv 4.3.2, biome 2.5.11, jest ^30.4.2.
- **Already current, do not "upgrade" again:** `react-native-reanimated` **4.6.0** and
  `react-native-worklets` **0.12.2**. An older plan document recommends moving to
  exactly these versions; that work is DONE. Anything still outstanding from that plan
  is app-code, not a version bump (`Countdown.tsx` resync gap, `Ago.tsx`,
  `Navigation.tsx` dot opacity, the mid-bounce guard in `useAlertSwapBounce.ts`).

`ai/AGENTS.md` §2 "Stack & Versions" is **already drifted** from `package.json` (it
lists expo 57.0.17, expo-notifications ~57.0.15, expo-router ~57.0.17, expo-widgets
~57.0.15, @expo/ui ~57.0.14). Refreshing that table is a deliverable of session 2, not
an optional tidy.

## Upstream watch — verified 2026-09-12, do not re-derive

The owner believed three tracked PRs had merged and that they fixed the iOS widgets.
The actual position, checked against the GitHub API and the installed source:

| Item | Reality |
|---|---|
| **#49244** widget view identity | **Closed UNMERGED** 2026-09-11. Maintainer: *"we decided to take a different approach"* |
| **#49810** widget view identity | **MERGED 2026-09-11** by jakex7 — the replacement. **Unreleased**, sits above `58.0.0` in the changelog → **SDK 58 line**, not a 57.0.x patch |
| **#49687** Android alarmClock delivery | Merged 2026-09-08. Android notifications, *not* widgets. Already adopted on `experiment/alarmclock-backport` |
| **#48786** | Not a PR — an **open issue**: `[expo-background-task] iOS getStatusAsync() never reads the real Background App Refresh permission`. Touches our background path |
| **#50038** | Merged: Android Gradle failure when no Android widget configured. Only matters if Android widgets are ever configured |

**The iOS widgets cannot be fixed by upgrading within the 57.x line.** Installed
`expo-widgets@57.0.18` still contains the root cause — `DynamicView.swift:26`,
`let uuid = NodeIdentityWrapper(id: UUID())` under a `TODO(@jakex7)` calling it a hack —
and 57.0.16/17/18 each record "no user-facing changes". The `widgets` flag stays OFF.

**DECIDED 2026-09-12 — patch-package backport, deferred to its own session.** Owner:
*"We will leave the iOS widget backport patch for another session. Not this session, but
we will do the same thing we did for the alarm clock. We will also patch it, but we're
gonna defer that as well."*

So: backport, **not** "wait for SDK 58". Follow the shape already proven in
`ai/prompts/alarmclock-backport.md` — patch-package the MERGED upstream code, carry it on
its own branch, delete the patch when the real release ships. ISSUES.md G.1 already
sanctions this for merged-but-unreleased code and the clock started 2026-09-11.

Backport target is **#49810**, resolved against the installed **57.0.18** sources — not
#49244, which never merged. They are different diffs, so G.1's existing backport note
about a `render()` conflict with #49535 refers to the dead PR and may not apply.

Not part of sessions 1–4. When it happens it needs all four of:

1. the patch itself (`patch-package`, `postinstall` hook, as the alarm-clock branch did);
2. **the `widgets` flag flipped ON** — this is the part that will catch someone out.
   While the flag is off, `app.config.ts` strips the expo-widgets plugin at prebuild, so
   there is no widget extension in the build at all. Patching `node_modules` alone
   produces a build that appears to change nothing;
3. an EAS dev build (widgets are iOS-only; local gradle is irrelevant here);
4. **the iPhone XS reconnected** for the G.1 acceptance protocol — all 8 home kinds
   render and hold ≥10 min, zero `cpu_resource` reports, zero watchdog lines. The XS is
   deliberately disconnected for sessions 1–4; this is the one piece of work that needs
   it back.

## Device policy — the OnePlus 3T only

Owner, 2026-09-12: *"literally all your testing on the 1+3T... that's really the one
that's the baseline model. The iPhone XS works perfectly fine. It's a faster phone."*
The XS was connected for the widget work and then **deliberately disconnected** once
that turned out to be blocked upstream, specifically so testing time does not double.

Test on **`3T_SERIAL` (OnePlus 3T, Android 9, SD820)** and nothing else. It is the
slowest device in the fleet, which makes it the most *sensitive* one, not merely the
cheapest to cover: every real defect this programme has found surfaced there because it
is slow. #34 only reproduces because the post-paint refresh beats the API fetch on that
hardware — on a fast phone the race is always won and the bug is invisible. Likewise the
3.1 s TLS provider install (#21/#32) and the 6.2 s cold `Displayed` are 3T-only
phenomena. "It works on the XS" has never been evidence of anything.

The wider fleet (XS, S23, 8T, Find X8, 5T) is deferred. The XS's only outstanding role
is the G.1 widget acceptance protocol, which is blocked upstream anyway.

## Standing constraints (all still live)

- **Never commit the API key.** It lives in the session scratchpad and reaches builds
  through `EXPO_PUBLIC_API_KEY` only. The owner has said this more times than any other
  instruction.
- **This app is an alarm clock.** A prayer time two minutes wrong is a bug; a
  notification on the wrong night is a serious one. Correctness of *times* outranks
  performance, tidiness and novelty. Judge every upgrade by that.
- **Nothing may assume London.** v2.0 goes global. `PRAYER_TIMEZONE` in
  `shared/constants.ts` is the single setting.
- **One change at a time**, measured before and after, verified on the device.
- Version bump in `app.json` **and** `package.json` on every commit; commit prefix
  `X.Y.Z - `. Keep `android/app/build.gradle` `versionName` in step or the next build
  reports the wrong version on device (AGENTS.md calls this "the app-info lie").
- Feature branches off `uat-2`, merged back with `--no-ff`. **Never commit to `uat`**
  without the owner's explicit word.
- **Git writes are authorised** for these autonomous sessions — commit, push, and merge
  into `uat-2`. This is an owner override of `ai/AGENTS.md` §7 ("Never Do: Git write
  operations"), the same override recorded in `ai/prompts/next-session-bugs.md`.
- **The "sleep ≤ 15 s" rule in AGENTS.md §7 does NOT apply to Claude models.** Owner,
  2026-09-12: *"Feel free to sleep more than 15 seconds, that rule was for a different
  model. I want you to work however you want to work... But only for yourself. Not for
  other models. As in, not for non-Claude models."* Fable 5.1, Opus 5, Sonnet 5 and
  Haiku are all Claude, so these sessions are exempt — use whatever wait actually suits
  the work (a 35 s settle after an app launch, a long build poll). AGENTS.md §7 stays as
  written because it still governs non-Claude models; do not "fix" it.

## Read the gotchas before building — they are not optional

`e2e/README.md` §Gotchas. On 2026-09-12 three of its entries were re-discovered the
expensive way because the list was not read first, costing a full device run:

- A **non-prod build serves `MOCK_DATA_SIMPLE`** and writes mock prayer times into the
  device's own MMKV cache, outliving the build that caused it. The tell is
  `fajr: addMinutes(-3)` — a "Fajr" three minutes before the clock is the mock.
- **Gradle marks the JS bundle task UP-TO-DATE on env-only changes**, so restarting the
  daemon is not enough. Delete `index.android.bundle` and verify by md5; `app.config`
  regenerates independently, so a correct version in the APK proves nothing about the
  JavaScript inside it.
- **`--verbose` prints no test names here.** Confirm a test actually ran with
  `yarn jest <file> -t "<phrase>"`, never by a rising total.

## Model

**Settled 2026-09-12: Opus 5 at max effort, for every session and every subagent in this
programme.** The owner checked their plan and it does not include Fable 5.1, so the earlier
note asking for Fable is void. Owner: *"I said I would use effort max for fable 5.1, but it
turns out my plan doesn't have fable 5.1. I can only use opus 5 max effort. So that's what
we will use going forward for everything."* Sessions 2 and 4 touch prayer times and
notification scheduling, where the correctness bar is highest.

## Update log

**2026-09-12:** Programme opened. Brief written, session 1 prompt at
`ai/prompts/upgrade-research.md`, uat-2 tracker and audit brief corrected.

**2026-09-12, session 1 closed.** `ai/features/upgrades-2026-09/PLAN.md` written on
`research/upgrades-2026-09`. No application code and no dependency changed. What was
decided:

- **React 19.3 is unreachable, and that is the headline.** React Native ships its own
  prebuilt copy of the reconciler. `react-native@0.86.3`, `0.87.1` and `0.88.0-rc.0` all
  report `reconcilerVersion: "19.2.3"`, read directly from the published tarballs, and all
  three peer `react: ^19.2.3`. Setting `react` to 19.3.0 satisfies the range, changes only
  the thin element and hook package, and leaves every 19.3 reconciler fix absent. The
  mismatch is silent: the "Incompatible React versions" guard exists in `react-dom` and not
  in the React Native renderer. Separately, all five 19.3 headline features are DOM, SSR or
  RSC, and the codebase uses none of the APIs the core bug fixes touch (no
  `startTransition`, `useDeferredValue`, `Suspense`, `useEffectEvent`, `<Activity>` or
  `lazy`). **`react` and `@types/react` hold.**
- **Expo Modules 2.0 is iOS-only and experimental in SDK 57, official beta in SDK 58,
  Android still in progress.** `modules/tls13` declares `"platforms": ["android"]`, so
  there is nothing to migrate now. When Android lands, the available change is one
  observability `Function("status")` becoming an annotation: 2.0 replaces the JS-facing
  DSL, and the part that matters is `Tls13InitProvider`, a manifest-merged ContentProvider
  running before `Application.onCreate`, which the Expo module system does not own.
  **No action, re-read at SDK 58.**
- **The Expo 2026-09-11 patch wave is a release-train bump.** Sixteen of the eighteen
  flagged packages record "no user-facing changes". The two with content do not apply:
  `@expo/ui` 57.0.18 adds iOS navigation components we do not use (and the `widgets` flag
  is off), `expo-router` 57.0.21 adds `LocaleProvider` and a native-tabs fix while we use
  only `Slot`. Take the wave anyway to stay current, as one commit with one device check.
- **The `alarmClock` delivery option is not in the 57.x line.** PR #49687 appears under
  `## 58.0.0 — 2026-09-10` in the `main`-branch `expo-notifications` changelog and nowhere
  in the `sdk-57` one. ISSUES #17 stands; the backport branch stays the only route.
- **`npx expo install --fix` must never be run.** It would downgrade five packages against
  `bundledNativeModules.json`: reanimated 4.6.0 to 4.5.1, worklets 0.12.2 to 0.10.1, jest
  30 to 29.7, typescript 7 to 6.0.3, `@types/jest` 30 to 29.5.14. Session 2 names every
  package explicitly.
- **Recommended, in order:** `reanimated-color-picker` 5.1.3 (removes real Reanimated 4.6
  dev warnings, confirmed `__DEV__`-gated and therefore not suppressed by our
  `strict: false`), `pino` 10.3.1 (devDep, only breaking change is dropping Node 18),
  `@biomejs/biome` 2.5.13, optionally `react-native-svg-transformer` 1.5.3, then the Expo
  wave, then optionally `react-native-svg` 15.15.5.
- **Held, with reasons in PLAN.md §6:** react, @types/react, react-native 0.87 (SDK 58),
  jotai 3 (removes `loadable`, used at `stores/sync.ts:24`), pager-view 9 (Android
  rewritten onto Jetpack Compose, and it is the main swipe surface), gesture-handler 3
  (New-Arch rewrite, `@gorhom/bottom-sheet` support unverified), safe-area-context 5.9
  (AGP 9 forward-port), screens 4.27 (RN 0.87 enablement), Babel 8 (blocked: every
  `babel-preset-expo` plugin is pinned `^7.x`), husky 9 and lint-staged 17 (dev churn).
- **Added out of scope, at the owner's request: ISSUES #35**, the update-prompt and
  `releases.json` question. Answers recorded there: a GitHub failure does not break the app,
  but a failed check burns the whole 24-hour window because the `finally` stamps the
  throttle unconditionally, and neither fetch has a timeout. Production iOS is already
  automatic through iTunes Lookup; production Android should move to Google Play In-App
  Updates; `releases.json` then survives as a testers-only file, which removes the manual
  release step and dissolves the scale worry. Needs its own session: it is a new native
  dependency on the release path.

**2026-09-12, session 2 closed.** The plan executed in full on
`upgrade/packages-2026-09`, merged into `uat-2` with `--no-ff` as `064d09b` and pushed.
Six commits, 1.24.38 to 1.25.1, each gated on a green `yarn validate` (42 suites, 1015
tests).

- **Taken:** `reanimated-color-picker` 5.1.3 (1.24.39), `pino` 10.3.1 (1.24.40),
  `@biomejs/biome` 2.5.13 (1.24.41), `react-native-svg-transformer` 1.5.3 (1.24.42), the
  18-package Expo SDK 57 wave as one commit (1.25.0), and the `ai/AGENTS.md` §2 refresh
  (1.25.1). `npx expo install --fix` was never run; every package was named explicitly,
  and reanimated 4.6.0, worklets 0.12.2, jest 30.5.1, typescript 7.0.2, `@types/jest`
  30.0.0, react 19.2.3 and react-native 0.86.3 were all verified unmoved afterwards.
- **Held: `react-native-svg` 15.15.5**, the last optional item. PLAN.md already found
  that none of its fixes reach this app, and `expo@57.0.22` still pins 15.15.4, so taking
  it would put native code ahead of the SDK pin for no benefit. Everything in PLAN.md §6
  remains held.
- **The alarm clock did not move.** The armed Fajr alert read `2026-09-13 04:57` before
  the wave and `2026-09-13 04:57` after it, with `handleAppUpgrade()` wiping the prayer
  cache and refetching from the live API in between, so every time was re-derived rather
  than read from storage. Prod build on the 3T, fresh bundle confirmed by md5 change.
- **PLAN.md's warning that empty changelogs are not proof was tested, not trusted.** Both
  versions of all 18 packages were unpacked and compared. For `expo-notifications`,
  `expo-background-task` and `expo-task-manager` the prebuilt `classes.jar` is
  byte-identical by md5 across the bump, so the compiled Android code on the alarm path
  did not change at all; `expo-updates` ships no AAR and its source is byte-identical.
  Only `@expo/ui` and `expo-router` carry real changes, in surfaces this app does not
  import.
- **PLAN.md step 7 could not be run.** Arming an alert and watching it fire from
  background needs clock manipulation, and the 3T has no root: `date` returns
  `Operation not permitted` and `auto_time` is 1. Probed with a no-op value so nothing
  could change. The Fajr alarm was left armed for 04:57 so the check happens on the
  device's own schedule.
- **Trap worth recording for any future session.** A version bump makes
  `handleAppUpgrade()` wipe the device's prayer cache, and the committed `.env` carries
  the placeholder `EXPO_PUBLIC_API_KEY=key` from `.env.example`. Building without the real
  key therefore strands the phone with no prayer data and no armed alarms, which looks
  exactly like an upgrade regression. It is not. Have the real key in hand **before**
  bumping. The error screen is in fact positive proof the build is `prod`, since a
  non-prod build returns `MOCK_DATA_SIMPLE` instead of attempting a fetch.
- `ai/AGENTS.md` §2 is no longer drifted. It now carries the verified-at version, and a
  new subsection naming the five packages `expo install --fix` would downgrade, so that
  rule lives where someone would actually look rather than only in PLAN.md.
