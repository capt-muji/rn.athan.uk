# Upgrade plan, ranked — session 1 of 4

**Written:** 2026-09-12. **Branch:** `research/upgrades-2026-09` off `uat-2`.
**Scope:** research only. No application code changed, no dependency changed, no
lockfile touched. Everything below is a recommendation for session 2.

Read `BRIEF.md` first. This file is the ordered work list; the brief is the why.

---

## The short version

The headline reason this programme exists does not survive contact with the evidence.
**React 19.3 cannot reach this app**, and not because of caution: React Native ships its
own copy of the React reconciler, and no React Native release in existence, including the
0.88 release candidate, ships the 19.3 one. Section 1 has the proof.

What is actually worth doing is small: one pure-JS patch that removes real development
noise, two dev-only bumps, and the Expo SDK 57 release-train wave, which is sixteen
packages of "no user-facing changes" plus two that do not apply to us. Everything else is
a hold, and section 6 says why for each.

The single most useful sentence in this document is in section 4: **do not run
`npx expo install --fix`.** It would silently downgrade five packages, including the
Reanimated 4.6.0 upgrade that is already done.

---

## 1. React 19.3 — evidence that it is unreachable

### 1.1 React Native bundles its own reconciler

`react-native` does not consume React's reconciler from the `react` package. It ships a
prebuilt copy at `Libraries/Renderer/implementations/ReactFabric-prod.js`. That file
declares its own version:

```js
internals$jscomp$inline_1245 = {
  bundleType: 0,
  version: "19.2.3",
  rendererPackageName: "react-native-renderer",
  currentDispatcherRef: ReactSharedInternals,
  reconcilerVersion: "19.2.3"
}
```

and it reaches into the installed `react` package for the dispatcher:

```js
React = require("react"),
ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
```

So the `react` package supplies element creation, the hook shims, `memo`, `lazy`, `use`
and the internals object. The reconciler, which is where scheduling, Suspense, context
propagation, effects and Fast Refresh actually live, comes from `react-native`.

### 1.2 No React Native release ships the 19.3 reconciler

Checked directly against the published packages, not against release notes:

| Package | Bundled `reconcilerVersion` | `peerDependencies.react` |
|---|---|---|
| `react-native@0.86.3` (installed) | `19.2.3` | `^19.2.3` |
| `react-native@0.87.1` (latest stable) | `19.2.3` | `^19.2.3` |
| `react-native@0.88.0-rc.0` | `19.2.3` | `^19.2.3` |

Setting `react` to `19.3.0` satisfies `^19.2.3`, so nothing complains. It also changes
nothing about the renderer. Every bug fix in the 19.3 changelog that matters to a native
app stays at 19.2.3, and the app runs a 19.3 `react` package against a 19.2.3 reconciler
through a private internals object whose shape carries no stability guarantee across
minors.

Worse, the failure would be quiet. `react-dom` throws "Incompatible React versions" on a
mismatch. That string does not exist anywhere in the React Native renderer, which was
confirmed by grep. A mismatch here produces whatever it produces.

### 1.3 None of the 19.3 headline features apply anyway

Judged one by one against this codebase, which is a single-screen prayer timetable on
expo-router, Jotai, Reanimated and MMKV.

| 19.3 feature | Applies here? |
|---|---|
| `<ViewTransition>` (now stable) | **No.** DOM only. React's own post says React Native support is "in development" |
| `addTransitionType` | **No.** Part of View Transitions |
| Suspense-coordinated image and font reveal | **No.** DOM resource loading |
| Fragment Refs / `FragmentInstance` | **No.** Its entire surface is DOM: `addEventListener`, `getClientRects`, `IntersectionObserver`, `scrollIntoView` |
| `use(browser())` | **No.** Opts a component out of server-side rendering. There is no server |
| Trusted Types support | **No.** Browser CSP feature |
| `<Context>` rendered directly in Server Components | **No.** No RSC |

### 1.4 The core bug fixes are real, and we use none of the APIs

The 19.3 fixes in the `react` package itself are genuine work. They land in the
reconciler, so we could not have them without a new React Native regardless. But it is
worth recording that even with a matching renderer, the benefit here would be close to
nil. Grepped across `app/`, `components/`, `hooks/`, `stores/`, `shared/`, `widgets/`,
`device/`, `api/` and `mocks/`:

| 19.3 fix | API involved | Used in this app? |
|---|---|---|
| Transitions render independently instead of entangling (#37290) | `startTransition`, `useTransition` | **No occurrences** |
| `useDeferredValue` stuck on an old value (#36134) | `useDeferredValue` | **No occurrences** |
| Context propagation into and through Suspense (#36160, #35839) | `Suspense` | **No occurrences** |
| `useSyncExternalStore` missed mutations under hidden `<Activity>` (#36947) | `<Activity>` | **No occurrences** |
| `useEffectEvent` reads stale values in `forwardRef` / `memo` (#34831) | `useEffectEvent` | **No occurrences** |
| Fast Refresh bugs with `lazy`, `memo`, kind changes (#36965 and three others) | `lazy` | **No occurrences.** `memo` is used in 6 places, `forwardRef` in 1 (`components/sheets/screens/Alert.tsx`). Development-only benefit |
| Four `<Activity>` fixes (#34983, #35074, #35091, #35763) | `<Activity>` | **No occurrences** |
| Hang updating a dehydrated Suspense boundary (#37135) | hydration | **No.** No SSR |
| Warning when `use` is called conditionally (#37104) | `use` | **No occurrences** |
| Everything in `react-dom` and `react-server` | web / server | **No** |

### 1.5 Verdict

**Hold `react` at 19.2.3 and `@types/react` at 19.2.18.** Revisit when an Expo SDK ships
a React Native whose bundled `reconcilerVersion` reads `19.3.x`. The check is one command
against the published tarball, so it costs a minute to re-run each SDK cycle.

Moving `@types/react` alone to 19.3.0 is worse than pointless: the types would describe
`ViewTransition`, `FragmentInstance` and `browser()` while the runtime has none of them.
Code that compiles and then crashes is the failure mode that buys.

---

## 2. This Week in React #296 — what applies

Read in full. Most of the issue is web tooling. Items that touch this app, and the
verdict on each.

| Item | Relevance |
|---|---|
| React 19.3 | Section 1. Unreachable |
| **Expo Modules 2.0 preview** | Section 3. Real, and not yet ours |
| **Jotai 3.0** | Section 6. ESM-only, drops `loadable`, which we use |
| **React Native 0.88 RC** | Section 6. Rides a future SDK; still on the 19.2.3 reconciler |
| `react-native-continued-task` (iOS `BGContinuedProcessingTask`, Android WorkManager) | Worth knowing about, not worth adopting. Our background path is `expo-background-task` plus the OS alarm set by `expo-notifications`, and ISSUES #8, #17, #19 and #20 are all about OEM behaviour rather than the API we call. A third-party background library is a large new surface on the exact path where correctness matters most |
| React Native QuickJS alpha (Hermes-compatible JSI runtime) | No. Swapping the JS engine on an alarm clock, on Android 9, for a size win |
| Expo Go now requires login | No. This project builds dev clients and release builds, never Expo Go |
| React DevTools 8.0, React DevTools CDT MCP, Metro MCP, Rozenite, Argent, agent-device | Tooling. None installed. No action |
| Boost 1.7, Uniwind, Streamdown, ReactLynx, Screen Choreography, Goldie, Sentry | Not dependencies |
| Everything in the React and Other sections (Next.js, Turbopack, Base UI, Storybook, Vitest, htmx, NestJS, Playwright, Rslib, Bamboo CSS, cn, Vidact, DevJar, uf, Effective RSC) | Web. No action |

The React Native navigation benchmark post is worth a read at some point for context on
expo-router cold start, but it changes nothing here and is not a work item.

---

## 3. Expo Modules 2.0 — and what it means for `modules/tls13`

**Source:** Expo's own post, `expo.dev/blog/an-early-look-at-expo-modules-2-0`, not a
summary of it.

### 3.1 What it is

The `ModuleDefinition` result-builder DSL (`Name`, `Function`, `AsyncFunction`,
`Property`, `Events`) is replaced by ordinary annotated Swift or Kotlin. Methods get a
`@JS` annotation, async functions use the language's own `async`, properties are plain
`var` or `let`, records are structs. The `@JS` macro also removes per-call dispatch
overhead: Expo measured 100,000 synchronous no-op calls on an iPhone 16 Pro at 135 ms on
SDK 55 against 9 ms on SDK 57 with 2.0, and quotes 2.5x to 5.6x for sync calls against
the 1.0 API.

### 3.2 Status

- **iOS only.** Present in SDK 57 but experimental and undocumented.
- **Official beta in SDK 58.**
- **Android is still in progress.** When it lands it uses the same model in Kotlin.
- Migration is incremental. 1.0 and 2.0 coexist in one module, and an
  `expo-migrate-module` tool handles the Swift side.

### 3.3 Impact on `modules/tls13`: none, now or later

Two independent reasons, and the second is the important one.

**First, the platform.** `modules/tls13/expo-module.config.json` declares
`"platforms": ["android"]`. The module has no iOS side at all. Expo Modules 2.0 is iOS
only today, so there is nothing to migrate.

**Second, and this survives Android support landing: 2.0 addresses the JavaScript-facing
surface, and almost none of this module is that.** The module has exactly one JS-facing
member, and it is a debug aid:

```kotlin
class Tls13Module : Module() {
  override fun definition() = ModuleDefinition {
    Name("Tls13")
    // Observability only: the provider patch itself runs in
    // Tls13InitProvider before any application code exists.
    Function("status") { Security.getProviders()[0].name }
  }
}
```

The part that matters is `Tls13InitProvider`, a `ContentProvider` registered through the
module's own `AndroidManifest.xml` and merged into the app manifest:

```xml
<provider android:name="expo.modules.tls13.Tls13InitProvider"
          android:authorities="${applicationId}.tls13-init"
          android:exported="false" />
```

It exists precisely because it runs before `Application.onCreate`, which is before React
Native, before any Expo module is instantiated, and therefore before any OkHttp client
snapshots `SSLContext.getDefault()`. That ordering is what makes the fix work on Android 9
against a TLS 1.3-only API (ISSUES #21, #32), and it is why the JS-side install fixed
debug and failed release.

Expo Modules 2.0 does not own manifest merging, ContentProvider registration or
application startup ordering, and Expo's post does not mention any of the three. So when
Android support arrives, the total available change is converting one observability
function to an annotation. That is not worth a session.

**Verdict: no action. Re-read at SDK 58 for the Android beta, expect the conclusion to be
the same.**

---

## 4. Inventory — installed against latest

Taken 2026-09-12 from `npx expo install --check` and `yarn outdated`, cross-checked with
`npm view` for the packages neither tool flags.

### 4.1 The trap: never run `expo install --fix`

`npx expo install --check` reports against `expo/bundledNativeModules.json`, which pins
what SDK 57 shipped with. Five of its complaints are cases where **we are deliberately
ahead**, and `--fix` would roll every one of them backwards:

| Package | Installed | `--fix` would install | Note |
|---|---|---|---|
| `react-native-reanimated` | **4.6.0** | 4.5.1 | Deliberate, already-completed upgrade (BRIEF.md) |
| `react-native-worklets` | **0.12.2** | 0.10.1 | Same upgrade |
| `jest` | **30.5.1** | ~29.7.0 | Deliberate |
| `@types/jest` | **30.0.0** | 29.5.14 | Deliberate |
| `typescript` | **7.0.2** | ~6.0.3 | Deliberate |

Session 2 must name every package explicitly. `--fix` is a silent five-package downgrade,
two of them native, one of them the animation engine the whole performance campaign was
measured against.

### 4.2 Full state

**Behind, and moving is recommended (section 5):**

| Package | Installed | Latest | Native? |
|---|---|---|---|
| `reanimated-color-picker` | 5.1.2 | 5.1.3 | No |
| `pino` (dev) | 9.14.0 | 10.3.1 | No |
| `@biomejs/biome` (dev) | 2.5.11 | 2.5.13 | No |
| `react-native-svg-transformer` (dev) | 1.5.2 | 1.5.3 | No |
| 18 Expo packages (table in 5.5) | 57.0.x | 57.0.x+1 | Yes |
| `react-native-svg` | 15.15.4 | 15.15.5 | Yes |

**Behind, and holding (section 6):**

| Package | Installed | Latest | Why held |
|---|---|---|---|
| `react` | 19.2.3 | 19.3.0 | Reconciler is 19.2.3 in every RN release |
| `@types/react` (dev) | 19.2.18 | 19.3.0 | Types ahead of runtime |
| `react-native` | 0.86.3 | 0.87.1 | SDK 58 item |
| `jotai` | 2.20.3 | 3.0.0 | Removes `loadable`, which we use |
| `react-native-gesture-handler` | 2.32.0 | 3.3.0 | New-Arch rewrite; bottom-sheet unverified |
| `react-native-pager-view` | 8.0.2 | 9.0.4 | Android rewritten onto Jetpack Compose |
| `react-native-safe-area-context` | 5.7.0 | 5.9.1 | AGP 9 forward-port |
| `react-native-screens` | 4.26.2 | 4.27.0 | RN 0.87 enablement, transitive only |
| `@babel/core`, `@babel/preset-typescript`, `@babel/plugin-transform-modules-commonjs` (dev) | 7.29.7 | 8.0.x | Blocked by `babel-preset-expo` |
| `husky` (dev) | 8.0.3 | 9.1.7 | Dev churn, real work, no benefit |
| `lint-staged` (dev) | 15.5.2 | 17.5.1 | Two majors of a pre-commit runner |

**Already at latest, no action:** `@gorhom/bottom-sheet` 5.2.14, `date-fns` 4.4.0,
`date-fns-tz` 3.2.0, `expo-build-properties` 57.0.17, `react-native-edge-to-edge` 1.8.1,
`react-native-mmkv` 4.3.2, `react-native-nitro-modules` 0.37.1, `react-native-performance`
6.0.0, `react-native-reanimated` 4.6.0, `react-native-worklets` 0.12.2, `@types/jest`
30.0.0, `jest` 30.5.1, `mp3-duration` 1.1.0, `pino-pretty` 13.1.3, `typescript` 7.0.2.

`@types/node` is a special case: installed 26.4.0, while `npm view @types/node version`
reports 22.20.2. The `latest` dist-tag on that package tracks the LTS line, so 26.4.0 is
ahead of the tag on purpose. No action.

---

## 5. Ranked plan for session 2

Ordered safest and most independent first. Native rebuilds are grouped so the device work
batches into one build.

Judged throughout against the alarm-clock bar: anything touching notification scheduling,
timers, dates or background execution is high stakes regardless of diff size.

### Tier 1 — pure JavaScript, no native rebuild

Each is its own commit. `yarn validate` green is the gate. No device build needed for the
upgrade itself, though item 1 wants a visual check when a build next happens for another
reason.

---

#### 1. `reanimated-color-picker` 5.1.2 → 5.1.3

**Category: fixes a thing we actually have.** The one clear instance on the whole list.

- **Evidence.** The 5.1.3 notes lead with: "No more Reanimated 4.6
  `dependencies should only be used in web implementation` warnings: hook dependency
  arrays are now passed on web only." We are on Reanimated **4.6.0**, which is exactly the
  version that started emitting it.
- **Confirmed against Reanimated's source**, not assumed. The warning fires from
  `useAnimatedStyle.native.ts:51`, `useAnimatedReaction.native.ts`, `useDerivedValue.native.ts`
  and `useHandler.native.ts`, and its only guard is `__DEV__`:

  ```ts
  if (__DEV__ && _dependencies !== undefined && _dependencies !== null) {
    logger.warn('dependencies should only be used in web implementation.');
  }
  ```

  It is **not** gated by strict mode, so the `configureReanimatedLogger({ strict: false })`
  in `app/_layout.tsx` does not suppress it. Every dev launch that opens the colour picker
  logs it.
- **Honest scope.** This is development log noise, not user-facing behaviour. `__DEV__` is
  false in release, so no shipped build is affected. Ranking it first is about risk, not
  impact: it is the safest change available and it removes noise that makes real warnings
  harder to see.
- **Also in 5.1.3, relevant to us:** widgets no longer read shared values during render,
  and no longer remount their inputs on every render.
- **In 5.1.3 but not relevant:** the `ImageBackground` replacement (Panel2, Panel3,
  HueCircular, Preview) and the OpacitySlider and colorKit fixes. We import only
  `ColorPicker`, `Panel1`, `HueSlider` and `Swatches` in
  `components/sheets/screens/ColorPicker.tsx`. The `ImageBackground` work is nonetheless
  useful pre-positioning, since RN 0.87 deprecates it.
- **Risk: low.** Pure JS on top of Reanimated and gesture-handler, no native code, patch
  version, not Expo-managed so no `bundledNativeModules` conflict.
- **Verify.** `yarn validate`. Then, at the next dev build for any reason, open Settings,
  open the colour picker, and confirm logcat shows no `dependencies should only be used`
  lines and the picker still tracks touch correctly.

---

#### 2. `pino` 9.14.0 → 10.3.1

- **Evidence.** Upstream release text, quoted whole: "The only breaking change is dropping
  support for Node 18." Everything else in 10.0.0 is a types addition (`LogFnFields`) and
  test-infrastructure work.
- **Applies cleanly.** This machine runs Node **24.14.1**. `pino` is a **devDependency**
  here, and `shared/logger.ts` is disabled in prod and preview, so the shipped app is not
  affected either way.
- **Risk: low**, with one caveat worth stating rather than hiding: a major version of the
  logger is still the logger. `yarn validate` exercises it through the test suite, and a
  dev launch confirms lines still appear.
- **Verify.** `yarn validate`, then one dev launch with logcat attached to confirm
  structured lines still format.

---

#### 3. `@biomejs/biome` 2.5.11 → 2.5.13

- **Evidence.** 2.5.12 is Astro parser fixes, which cannot apply. 2.5.13 adds nursery
  rules (`useLayeredStyles` for CSS cascade layers, and others). Nursery rules are off by
  default.
- **Expected diff: none.** That is the point.
- **Risk: low, not zero.** A Biome patch can tighten an existing rule and turn
  `biome check .` red on untouched files. That surfaces in `yarn validate` before the
  commit, so the cost is bounded to a formatting pass.
- **Verify.** `yarn validate`. If `biome check .` reports anything new, fix by `yarn format`
  and read the diff rather than accepting it blind.

---

#### 4. `react-native-svg-transformer` 1.5.2 → 1.5.3 (optional)

- **Evidence: none available.** The project publishes no release notes for 1.5.3 and the
  GitHub release API returns 404 for the tag. **This is a guess**, taken on the basis that
  it is a patch bump of a Metro transform used at build time only.
- **Risk: low but unmeasured.** It sits in the bundle pipeline. If it misbehaves, the
  symptom is SVG imports failing at bundle time, which is loud and immediate.
- **Verify.** `yarn validate`, then `yarn start` and confirm the bundle builds and the
  masjid and glow SVGs render.
- **Drop this one without regret** if session 2 is running long. It buys nothing known.

---

### Tier 2 — native rebuild, one device check covers the batch

#### 5. The Expo SDK 57 patch wave — 18 packages, one commit

All eighteen released together on **2026-09-11** as one release-train bump. Read every
changelog on the `sdk-57` branch. **Sixteen of the eighteen record "This version does not
introduce any user-facing changes."**

| Package | Installed → target | Changelog content |
|---|---|---|
| `expo` | 57.0.21 → 57.0.22 | No user-facing changes |
| `expo-notifications` | 57.0.17 → 57.0.18 | No user-facing changes |
| `expo-background-task` | 57.0.16 → 57.0.17 | No user-facing changes |
| `expo-task-manager` | 57.0.16 → 57.0.17 | No user-facing changes |
| `expo-updates` | 57.0.21 → 57.0.22 | No user-facing changes |
| `expo-asset` | 57.0.16 → 57.0.17 | No user-facing changes |
| `expo-audio` | 57.0.4 → 57.0.5 | No user-facing changes |
| `expo-constants` | 57.0.17 → 57.0.18 | No user-facing changes |
| `expo-font` | 57.0.3 → 57.0.4 | No user-facing changes |
| `expo-haptics` | 57.0.2 → 57.0.3 | No user-facing changes |
| `expo-linear-gradient` | 57.0.1 → 57.0.2 | No user-facing changes |
| `expo-linking` | 57.0.9 → 57.0.10 | No user-facing changes |
| `expo-splash-screen` | 57.0.8 → 57.0.9 | No user-facing changes |
| `expo-system-ui` | 57.0.3 → 57.0.4 | No user-facing changes |
| `expo-widgets` | 57.0.18 → 57.0.19 | No user-facing changes |
| `expo-dev-client` (dev) | 57.0.18 → 57.0.19 | No user-facing changes |
| `@expo/ui` | 57.0.17 → 57.0.18 | iOS `NavigationStack`, `Toolbar`, `navigationTitle`, `NavigationLink`, `close` role; Android `DropdownMenu.shadowElevation`; Android `DatePickerDialog` fix |
| `expo-router` | 57.0.20 → 57.0.21 | `LocaleProvider` for runtime navigation direction; iOS native-tabs icon-type crash fix |

**Neither of the two with content applies.**

- `@expo/ui` is imported only by `widgets/PrayerWidget.tsx` and
  `widgets/LockPrayerWidget.tsx`, and only for `Text`, `VStack`, `HStack`, `Image`,
  `Circle`, `RoundedRectangle`, `Spacer`, `ZStack` and modifiers. Nothing in 57.0.18
  touches those. The `widgets` flag is OFF in any case, so `app.config.ts` strips the
  plugin at prebuild and no widget extension is built.
- `expo-router` is used for exactly one thing: `import { Slot } from 'expo-router'` in
  `app/_layout.tsx`. No `Tabs`, no native tabs, no locale-directed navigation.

**So why take it at all?** Because staying on the release train is worth more than the diff
is. A patch line that is current is a patch line where the next real fix is one number
away, and drifting seven patches behind is how a security or crash fix ends up gated
behind an unrelated upgrade. The changelogs say the behavioural risk is nil.

**What this does NOT get us, stated plainly because it is easy to assume otherwise:** the
Android `alarmClock` delivery option (PR #49687, authored by the owner) is **not** in the
57.x line. It first appears under `## 58.0.0 — 2026-09-10` in the `main`-branch
`expo-notifications` changelog. ISSUES #17 is correct: it rides SDK 58, and
`experiment/alarmclock-backport` remains the only route to it on SDK 57.

- **Risk: moderate, entirely because of what the packages are, not what changed.** Four of
  them are `expo-notifications`, `expo-background-task`, `expo-task-manager` and
  `expo-updates`. Empty changelogs are not proof; native code moved. For an alarm clock,
  that earns a device check on its own.
- **Ordering within the commit.** Take all eighteen at once. Splitting an Expo release
  train invites a version skew between `expo` and its packages that is harder to reason
  about than the batch.
- **Verify, on the 3T (`3T_SERIAL`) only.**
  1. `yarn validate` green.
  2. Bump the version in `app.json`, `package.json` and `android/app/build.gradle`
     **before** prebuild. Order matters (AGENTS.md §6).
  3. Prod build. `EXPO_PUBLIC_ENV=prod`, or the app serves `MOCK_DATA_SIMPLE` and writes
     mock times into the device's own MMKV cache, which outlives the build. The tell is a
     Fajr three minutes before the clock.
  4. Delete `index.android.bundle` first and verify the new bundle by md5. Gradle marks the
     bundle task UP-TO-DATE on env-only changes and `assets/app.config` regenerates
     independently, so a correct `versionName` proves nothing about the JavaScript.
  5. One throwaway launch to clear What's New.
  6. `yarn check:device 3T_SERIAL com.mugtaba.athan expected-times.json` and confirm the
     armed alarms still match real prayer times.
  7. Arm an alert, background the app, and confirm it fires. This is the only check that
     actually exercises `expo-notifications` plus `expo-background-task` together.
- **Stop and report** if any prayer time, alarm time or background schedule changes.

---

#### 6. `react-native-svg` 15.15.4 → 15.15.5 (optional, rides the same rebuild)

- **Evidence, and it is all negative.** The 15.15.5 fixes are: Android `MaskView` and
  `LinearGradient` under "RN props 2.0"; macOS Fabric rendering; `currentColor` opacity on
  Apple platforms; a clang override diagnostic; dropping the `warn-once` dependency.
- **Checked against our usage.** Seven files import `react-native-svg`
  (`Masjid`, `masjidGlow`, `masjidRamadanGlow`, `Glow`, `RamadanDecorations`,
  `prayer/Explanation`, `prayer/Alert`). Grep finds **no `currentColor`, no `<Mask>`, and
  no `react-native-svg` `LinearGradient`** anywhere. The gradient in
  `components/ui/BackgroundGradients.tsx` comes from `expo-linear-gradient`, a different
  package. "RN props 2.0" is an opt-in React Native feature flag this project does not
  enable.
- So: **no fix in this release reaches this app.** It is train-staying only.
- **Risk: low**, patch version, but it is native code and Expo pins 15.15.4.
- **Verify.** Rides the tier 2 build. Confirm the masjid, the glows and the Ramadan
  decorations still render.
- **Defer without regret** if the tier 2 build is already long.

---

## 6. Packages that should not move, and why

"If it works, it works" is no longer a blanket rule, but it is still a valid verdict per
package. Here it is the right verdict eleven times.

### `react` 19.2.3 and `@types/react` 19.2.18
Section 1. The reconciler is 19.2.3 in every React Native that exists. Moving the types
alone would describe APIs the runtime does not have.

### `react-native` 0.86.3 → 0.87.1
**Not available under Expo SDK 57.** `expo/bundledNativeModules.json` pins
`react-native: 0.86.3`, and Expo's own native code is compiled against it. RN 0.87 arrives
with SDK 58, which is currently `58.0.0-preview.0` on the `next` tag. It is not a stable
SDK.

Beyond availability, 0.87 is a toolchain move: `compileSdk` and `buildTools` to 37,
`minCompileSdk` to 34, minimum Kotlin 2.0 with the bundled version at 2.2.0, Gradle 9.4.1.
`modules/tls13/android/build.gradle` has to follow all of it.

Worth recording for the SDK 58 session, because the audit is already done. The app is
**clean of every 0.87 breaking change**, checked by grep:

| 0.87 breaking change | Our exposure |
|---|---|
| `StatusBar` `backgroundColor` / `translucent` props and setters removed | **None.** No `StatusBar` usage. `app/_layout.tsx` uses `SystemBars` from `react-native-edge-to-edge` |
| `useColorScheme()` return type now `ColorSchemeName \| null` | **None.** No `useColorScheme` or `Appearance` usage |
| `react-native/jest-preset` removed | **None.** `jest.config.js` uses `babel-jest` with `@babel/preset-typescript` and mocks `react-native` directly |
| `Touchable` root export removed | **None** |
| `NativeDialogManagerAndroid` removed | **None** |
| `rn-get-polyfills` removed | **None** |
| `react-native/src/private/...` deep imports restricted | **None** |
| `SceneTracker` removed | **None** |
| `ImageBackground` deprecated | **None** in app code. `reanimated-color-picker` 5.1.3 already removes its own use |
| Node >= 22.13.0 | Satisfied. Running 24.14.1 |

And the 0.87 Android fixes worth wanting when the time comes: Text descenders no longer
clipped when `lineHeight` equals `fontSize`; Android bold font-weight now accounted for in
Text measurement (the same class of problem as ISSUES #22, the "Sunrise" wrap on the 3T);
`ScrollView.onTouchEvent` catches the framework multi-touch `IllegalArgumentException`;
two `StatusBar` `IllegalArgumentException` crash fixes; React Native containers no longer
delay native touches.

That Text measurement change cuts both ways. It alters Android text metrics, which is
exactly the machinery behind ISSUES #22. Treat it as a layout risk as much as a fix, and
re-check the standard page on the 3T when SDK 58 lands.

### `jotai` 2.20.3 → 3.0.0
**Real migration work, for nothing we need.**

- **`loadable` is removed** (moved to a userland implementation; `unwrap` is the suggested
  replacement, with different semantics). We use it: `stores/sync.ts:24`,
  `export const syncLoadable = loadable(atom(async () => sync({ deferWidgetRefresh: true })))`.
  `unwrap` does not give the `{ state: 'loading' | 'hasData' | 'hasError' }` shape.
- **ESM only.** The CJS, UMD and SystemJS builds are gone. This project is
  `"type": "commonjs"`, Jest runs `testEnvironment: node` with
  `@babel/plugin-transform-modules-commonjs`, and fourteen test sites call
  `require('jotai/vanilla')` directly. Node 24 can `require()` ESM, but "can" is not
  "does, under babel-jest, with this config", and finding out costs a session.
- Node >= 22.12.0 and TypeScript >= 5.5 are both satisfied.
- `atomFamily`, `jotai/babel`, `setSelf` and the `delay` option are also removed. We use
  none of them.
- **Benefit to this app: none identified.** Jotai's own guide says the public API is
  unchanged and that apps running v2 without deprecation warnings should work unchanged.
  There is no bug we have, no capability we want.

**Hold.** Revisit only if something else forces ESM.

### `react-native-pager-view` 8.0.2 → 9.0.4
**The highest-risk item on the list, and it buys nothing.**

9.0.0 is one line: `feat(android): jetpack compose support`. That is the Android
implementation rewritten onto Compose. The three patches since are all fallout from
exactly that: 9.0.1 skips the `kotlin-android` plugin under AGP 9 built-in Kotlin; 9.0.3
gives `ComposeView` its own `Lifecycle` to fix issues #1103 and #1104; 9.0.4 fixes an iOS
`setPage` landing on the wrong index.

This is `app/Navigation.tsx`, the main swipe surface, on an Android 9 SD820. AGENTS.md
performance rule 11 documents that ViewPager2 intercepts drags regardless of JS responders
and that the fix is `scrollEnabled={!overlayIsOn}` while a veil owns the screen. A Compose
Pager replaces that machinery wholesale, and the interop layer is new code carrying a
lifecycle bug that took three patches to settle.

Expo SDK 57 pins 8.0.2. **Hold.**

### `react-native-gesture-handler` 2.32.0 → 3.3.0
v3 is a New Architecture rewrite. Paper support removed, `gestureHandlerRootHOC` and
`RNGestureHandlerEnabledRootView` removed, deprecated components removed, a new hook-based
API and a new `Touchable`.

We import one thing, `GestureHandlerRootView`. But `@gorhom/bottom-sheet@5.2.14` is built
on the RNGH gesture API, and its peer range is `react-native-gesture-handler: ">=2.16.1"`.
That range was written long before v3 existed; a satisfied semver range is not a claim of
support. Bottom sheets are this app's entire interactive chrome (settings, sound, alert).

The app does run the New Architecture (`android/gradle.properties`: `newArchEnabled=true`),
so the rewrite is not disqualifying on that ground.

Two 3.3.0 fixes are worth wanting later: "[Android] Fix buttons firing press events when a
scroll takes over the touch" (#4441), which is the exact failure mode the sheets are
vulnerable to, and "Don't pass dependencies to Reanimated hooks on native" (#4472), the
same warning class as item 1.

Expo SDK 57 pins ~2.32.0. **Hold** until `@gorhom/bottom-sheet` states v3 support, or
Expo moves the pin.

### `react-native-safe-area-context` 5.7.0 → 5.9.1
The whole 5.8 to 5.9 arc is forward-porting to the next toolchain: 5.8.1 "fix TS under RN
0.87", 5.9.0 "Adopt AGP v9", 5.9.1 fixing a source-set regression that AGP 9 adoption
caused ("register `src/paper/java` as a Java source set on old architecture"). On an AGP 8,
RN 0.86 project that is all cost.

The one genuine runtime fix, "skip Fabric SafeAreaView state updates while detached from
window", does not reach us: all five usages are `useSafeAreaInsets`
(`app/Screen.tsx`, `app/Navigation.tsx`, `components/sheets/parts/Sheet.tsx`,
`components/sheets/screens/ColorPicker.tsx`, `components/ui/RamadanDecorations.tsx`) and
there is no `SafeAreaView` anywhere. The remaining fixes are web-only.

Expo SDK 57 pins ~5.7.0. **Hold.** Move it with SDK 58.

### `react-native-screens` 4.26.2 → 4.27.0
The release opens with "This release adds support for React Native 0.87." Everything else
is Stack v5, Split, Tabs and iOS work. No direct import anywhere in the repo; it arrives
transitively under expo-router. Expo pins ~4.26.0. **Hold.**

### `@babel/core`, `@babel/preset-typescript`, `@babel/plugin-transform-modules-commonjs` 7.29.7 → 8.0.x
**Blocked, not deferred.** `babel-preset-expo` depends on roughly forty `@babel/plugin-*`
and `@babel/preset-*` packages, every one of them pinned at `^7.x`, which cannot resolve to
8.x. Yarn would either refuse or produce a duplicated Babel tree.

`babel-jest` peers `"@babel/core": "^7.11.0 || ^8.0.0-0"` and would accept 8, but it is not
the constraint that matters. **Do not attempt until Expo moves.**

### `husky` 8.0.3 → 9.1.7
v9 changed the hook file format and deprecated `husky install` and `husky add` in favour of
`husky` and `husky init`. Our `package.json` script is
`"husky": "husky install && husky add .husky/pre-commit 'npx lint-staged && yarn validate'"`,
so both halves need rewriting and the existing `.husky/pre-commit` preamble needs removing.

Small, genuinely fiddly, and worth exactly nothing to the app. **Hold.** Do it on a day
when the pre-commit hook is already being changed for another reason.

### `lint-staged` 15.5.2 → 17.5.1
Two majors. The breaking changes are survivable: `--shell` removed (not used), processes
spawned via nano-spawn instead of execa, Node >= 22.22.1 (running 24.14.1), Git >= 2.32,
`yaml` now an optional dependency (we configure through the `package.json` key, so it is
not needed).

It would probably just work. It also protects nothing, and a pre-commit runner that
misbehaves blocks every commit in sessions 2 through 4. **Hold** until the programme is
finished.

### `@types/node` 26.4.0
Ahead of the `latest` dist-tag on purpose. **No action.**

---

## 7. Where this document is guessing

Stated plainly, as the brief asks.

| Claim | Basis |
|---|---|
| React 19.3 is unreachable on React Native | **Evidence.** `reconcilerVersion` read directly from the published 0.86.3, 0.87.1 and 0.88.0-rc.0 tarballs |
| None of the 19.3 APIs are used here | **Evidence.** Grep across nine source directories, listed in 1.4 |
| Expo Modules 2.0 cannot touch `modules/tls13` | **Evidence** for the platform half (`"platforms": ["android"]`, and 2.0 is iOS-only). **Reasoned judgement** for the "even after Android lands" half: Expo's post does not discuss ContentProviders or manifest merging, so the conclusion is drawn from what 2.0 is rather than from an explicit upstream statement |
| The sixteen Expo packages are behaviourally inert | **Evidence** that the changelogs say so. **Not evidence** that no native code changed. Hence the device check |
| `alarmClock` is not in the 57.x line | **Evidence.** PR #49687 appears under `## 58.0.0` in the `main`-branch changelog and nowhere in the `sdk-57` one |
| `expo install --fix` would downgrade five packages | **Evidence.** `expo install --check` names each expected version |
| The colour-picker warning fires despite `strict: false` | **Evidence.** The `__DEV__`-only guard read from Reanimated's source |
| The colour-picker fix is dev-only noise | **Evidence**, from the same guard |
| `@gorhom/bottom-sheet` 5.2.14 may break on RNGH 3 | **Guess.** Untested. The peer range technically permits it. Ranked as a hold because the downside is the app's whole sheet layer |
| pager-view 9 is risky on the 3T | **Reasoned judgement**, from the Compose rewrite, the three follow-up patches, and AGENTS.md rule 11. Not measured |
| `react-native-svg-transformer` 1.5.3 is safe | **Guess.** No release notes exist |
| RN 0.87's Text measurement fixes could shift layout | **Reasoned judgement.** They change Android text metrics, which is the machinery behind ISSUES #22 |

---

## 8. Ordering summary for session 2

| # | Change | Commit | Native rebuild | Device check |
|---|---|---|---|---|
| 1 | `reanimated-color-picker` 5.1.2 → 5.1.3 | own | no | visual, opportunistic |
| 2 | `pino` 9.14.0 → 10.3.1 | own | no | dev launch, logs appear |
| 3 | `@biomejs/biome` 2.5.11 → 2.5.13 | own | no | none |
| 4 | `react-native-svg-transformer` 1.5.2 → 1.5.3 (optional) | own | no | bundle builds, SVGs render |
| 5 | Expo SDK 57 wave, 18 packages | one commit | **yes** | **full**: prod build, md5-verified bundle, `yarn check:device` with expected times, one armed alert fired from background |
| 6 | `react-native-svg` 15.15.4 → 15.15.5 (optional) | own | rides #5 | SVGs render |

Everything else: hold, per section 6.

`yarn validate` green before every commit. Version bump in `app.json`, `package.json` and
`android/app/build.gradle` on every commit. Merge into `uat-2` with `--no-ff`. Never touch
`uat`. Never commit the API key.

Session 2 also owns one documentation task the brief already assigned: refreshing
`ai/AGENTS.md` §2 "Stack & Versions", which is drifted from `package.json` today and will
be further drifted by the Expo wave.
