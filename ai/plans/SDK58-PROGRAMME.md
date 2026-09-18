# SDK 58 adoption programme (owner rulings, 2026-09-18)

Briefs for queue rows 12 through 17. A row's planning session writes its
`ai/plans/NN-*/PLAN.md` from the brief here; the queue table in `README.md` is the authority
for order and status. Verified facts carry their source. Facts re-verified 2026-09-18.

## Programme rules (owner rulings, 2026-09-18)

1. **Bleeding edge on purpose.** `uat-2` moves to the SDK 58 beta now and rides it. No store
   or production release from the session 12 merge until session 16 (stable re-pin) is DONE
   and RN 0.88 is out of release candidate. Full release notes land only at stable
   (~Oct 7 to 14).
2. **`experiment/alarmclock-backport` is kept**, frozen on SDK 57 at the 1.24.10 era, as the
   known-good backup. Nothing deletes it. Its prompt (`ai/prompts/alarmclock-backport.md`)
   records that deletion day (B9) is cancelled by owner ruling.
3. **Moonsighting (session 11) is deferred until further notice**, absolute last, after the
   SDK 58 programme and the deferred owner features at the bottom of this file.
4. **Verify against real sources, always.** Every session confirms APIs via docs-mcp (scrape
   the v58 docs first, resolving the exact version from the npm registry) and opensrc for
   package source. The changelog under-specifies.
5. **Full gates every session**: `yarn validate`, `yarn test:tz`, e2e/device checks where
   relevant (`yarn check:device`, `e2e/flows`).
6. **All dependencies move to latest compatible versions in session 12**, expo-managed and
   third-party, every package named explicitly. Never `npx expo install --fix`.
7. **Foreground show-by-default is wanted** (owner ruling). Verified: our handler
   (`hooks/useNotification.ts:11-18`) returns sound, badge, banner and list all true, which
   matches SDK 58's new built-in default handler (PR #49072). The flip is a no-op for us by
   construction; session 12 verifies on device only.
8. **R8 stays on** (new default) for smaller and faster-starting release builds, unless the
   first 3T release build misbehaves. Opt-out: `expo-build-properties`
   `android.enableMinifyInReleaseBuilds: false`.
9. **Not adopted**: `threadIdentifier` grouping (visual change), SwiftPM (CocoaPods stays the
   default supported path), Noxcturnal transformer (experimental, needs a Babel-free setup),
   `backgroundOverlay` migration (unused), `disableAutoLaunch` (only `disableFab` gets
   documented, session 13).
10. **Adopted beyond the upgrade**: `delivery: 'alarmClock'` (session 12), `largeIcon`
    notification icon on Android (session 12; owner wants the icon on the left, asset picked
    from on-device screenshots; reverted 1.27.231 the same day, owner-rejected on the shade
    proof).

## Environment refresh (before session 12 executes)

| Item | Action | Owner |
| --- | --- | --- |
| macOS 26 to 27 | System upgrade, first | Owner |
| Android Studio | `brew upgrade --cask android-studio android-commandlinetools` (installed 2024.3.1.13 from 2025-03-06; cask latest 2026.1.4.7), after macOS 27 | Agent, any session |
| Android SDK components | Update via Android Studio SDK Manager after the cask upgrade | Agent |
| Xcode | Already 27.0 (27A266a) | Done |
| Device Hub | App lives at `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`. Screen-share spinner is a known Xcode 27 beta rough edge; automation (simctl, mobile-mcp, xcodebuildmcp, Maestro) unaffected | Note only |

Session 12 planning needs none of this (no builds); only execution does.

## 12. SDK 58 beta upgrade + alarmClock + largeIcon

**Goal.** `uat-2` runs SDK 58 beta with `delivery: 'alarmClock'` adopted and the Android
notification large icon configured, everything else visually and behaviorally identical,
verified on the 3T.

**Verified facts.**

- npm: `expo` beta line is `58.0.0-preview.N` on the `next` dist-tag; library packages are
  plain `58.0.x` (`expo-notifications` at 58.0.3 as of 2026-09-18). #49687 merged 2026-09-08,
  commit `257006e`, carried by the beta.
- `delivery` API (from the backport prompt's merge-commit inspection; re-verify via opensrc
  against installed 58.0.x): `delivery: 'bestEffort' | 'alarmClock'` on `DateTriggerInput`
  and the repeating wall-clock triggers. Android-only, default `'bestEffort'`, degrades to
  best-effort without the exact-alarm permission.
- Permissions already present: `app.json` android.permissions has `USE_EXACT_ALARM` and
  `SCHEDULE_EXACT_ALARM` (lines 35-36). No permission work needed.
- Adoption sites (moved since the backport prompt was written): `device/notifications.ts`
  lines 100-104 (at-time trigger) and 217-221 (reminder trigger), both
  `type: SchedulableTriggerInputTypes.DATE` trigger literals.
- Foreground flip (#49072) mechanics, from the PR diff: a default handler allowing
  banner + list + sound + badge is auto-subscribed at import; native timeout paths present
  instead of dropping. Our handler overrides it with the same values, so no-op for us.
- `largeIcon` (#49481), from the PR diff: plugin prop `largeIcon?: string`, local image path,
  resized to 64x64 dp and shown next to the notification text. Plugin writes
  `notification_large_icon.png` into all drawable densities and a manifest meta-data
  `expo.modules.notifications.large_notification_icon`. A notification carrying its own image
  uses that instead (ours carry none). Unlike the small icon (all-white), the large icon may
  be full-color art.
- expo-widgets plugin config: top-level `supportedFamilies` and `contentMarginsDisabled` are
  deprecated aliases; the v58 docs prescribe the nested `ios.supportedFamilies` form. Our
  `app.json` uses the top-level form (10 widget entries).
- RN removals that touch us: `InteractionManager.runAfterInteractions` at
  `components/prayer/List.tsx:67` (migrate to `requestIdleCallback`, keep the cancel cleanup);
  deep import `react-native/Libraries/Utilities/BackHandler.*` at
  `components/sheets/parts/__tests__/Sheet.test.tsx:21-22`. No `expo-router/react-navigation`
  imports anywhere (verified). Strict TS API is default; the `customConditions` opt-out
  exists but is removed after 0.88, so migrate now, do not opt out.
- Toolchain: Xcode 27.0 installed (SDK 58 builds for iOS 27, prebuild emits
  `SceneDelegate.swift`); Node v24.14.1 satisfies the 24.3 floor.
- iOS 27 caveats that cannot be tested yet (no iOS 27 runtime installed): `requireFullScreen`
  (we set it, `app.json` line 14) and `ScreenOrientation.lockAsync` (our
  `plugins/portraitOnlyIpad.js`) may no-op while apps are resizable. Record as deferred risk,
  revisit when an iOS 27 runtime or device exists.

**Step sketch.**

1. Branch `upgrade/sdk-58-beta` from `uat-2`. Versioning as usual (bump every commit; minor
   bump 1.28.0 at merge, feature grade).
2. Docs prep: docs-mcp scrape of `https://docs.expo.dev/versions/v58.0.0/` root (exact version
   resolved from npm first). opensrc reads: `expo-notifications@58` (trigger parsing,
   `delivery` semantics, permission fallback), the plugin source for `largeIcon`.
3. Package wave: expo-managed set from the beta `bundledNativeModules.json`, named explicitly.
   Third-party by hand from their releases: `react-native-mmkv` + `react-native-nitro-modules`
   (Nitro must match RN 0.88), `react-native-pager-view`, `react-native-svg`,
   `react-native-edge-to-edge` (check whether RN 0.88 makes it obsolete; drop if so),
   `react-native-screens`, `react-native-gesture-handler`, `react-native-safe-area-context`.
   Re-derive the deliberately-ahead table (reanimated, worklets, jest, @types/jest,
   typescript) against the 58 pins and update `ai/AGENTS.md` section 2 afterwards.
4. Native regen: delete `ios/` and `android/` (gitignored prebuild artifacts), prebuild with
   the usual env rituals. Confirm `SceneDelegate.swift` in the iOS template.
5. Migrations: `InteractionManager` to `requestIdleCallback`; fix the test deep import; walk
   the expo-router SDK 57 to 58 migration guide and the RN Strict TS guide; `tsc` gates the
   rest.
6. Adoptions: `delivery: 'alarmClock'` in both trigger literals (sites above). Update
   trigger-shape expectations in `device/__tests__` and add one mock-capture assertion per
   path proving the field reaches `scheduleNotificationAsync`.
7. `largeIcon`: add the plugin prop with the chosen asset. Candidates:
   `assets/icons/config/icon-android-adaptive.png` (glyph foreground, may read sparse) or
   `icon-ios.png` (full square art). Owner picks from a 3T screenshot of a real notification.
   Config change requires the prebuild regen (rides step 4).
8. expo-widgets config hygiene: move the 10 widget entries to the nested `ios.*` form.
9. R8 watch and fingerprint check on the first release build; confirm `expo-updates` runtime
   version policy is unaffected by the `balanced` fingerprint default.
10. iOS sanity: build with Xcode 27, run on the iOS 26.5 simulator, schedule a notification.
    No XS release build needed (no iOS functional change).

**Acceptance seeds.**

- `yarn validate` and `yarn test:tz` green.
- 3T local release build via the prebuild ritual, real data (the 3T currently runs the mock
  1.27.159, so install a production build first).
- `adb -s 8f7ada76 shell dumpsys alarm | grep -A2 mugtaba` shows `window=0` (alarm-clock
  class; was windowed `+1h`).
- A prayer fires at the minute across a real boundary; foreground arrival looks and sounds
  the same as today.
- Visual parity: settled-screen screenshots before and after, read by the vision subagent,
  identical except the accepted notification large icon.
- Disclose and observe: alarm-clock class alarms make most Android skins show the small
  alarm icon in the status bar while armed. Report what the 3T, 8T and Find X8 actually show.
- No R8 crash on launch or schedule.

**Risks.**

- Beta and RC churn mid-row: 58.0.x patches keep landing; re-run
  `npx expo install --check` (safe, report-only) before each device build.
- `react-native-edge-to-edge` and Nitro/MMKV compatibility are the two most likely
  third-party friction points.
- Rollback: revert the merge commit on `uat-2`; the backport branch remains the SDK 57
  known-good.

## 13. Agent tooling

**Goal.** `@expo/agent-cli` investigated and, if it earns its place, wired into our tooling
discovery, plus the dev-launcher and Device Hub workflow documented.

**Verified facts.**

- `@expo/agent-cli` (alias `expo-agent-cli`), experimental, announced in the SDK 58 beta
  changelog. Sits atop Expo CLI, EAS CLI and `expo-doctor`, falls back to Expo CLI. Commands:
  `status` (answers Expo Go compatibility without starting the app), `dev` (one-command start,
  decides when a build is needed), `smoke` (dev plus screenshot plus stop),
  `skills:sync` (installs co-located agent skills from node_modules). Setup:
  `npx @expo/agent-cli@latest agents:setup`.
- It is LOCAL tooling: it drives the local project, local devices and local servers on this
  machine. The remote option is the separate paid EAS Simulator service, out of scope.
- `expo-dev-launcher` 58 adds `disableFab=1` and `disableAutoLaunch=1` URL params on the dev
  launcher deep link: hide the floating button, stop the dev menu auto-opening. Dev builds
  only; no code change, pure workflow documentation (the FAB annoyed the owner on the
  simulator).
- Device Hub app path and the screen-share spinner caveat (environment refresh table above).

**Scope.**

1. Install nothing permanently unless it proves useful; run via npx first. `status` and
   `smoke` against this repo; record honest results (beta software).
2. Decision: adopt or shelve, with reasons. If adopt: npx-based usage documented in
   `ai/AGENTS.md` Tool Routing (it must sit alongside the existing MCPs and CLIs, discoverable
   by any future session), plus a devDep decision documented either way.
3. Document the dev-launcher URL params (exact launch URL shape, verified on a dev build) in
   the same Tool Routing section, and the Device Hub location and caveat.

**Acceptance seeds.** AGENTS.md carries the guidance; `smoke` result recorded; zero app-code
changes.

## 14. Expo Modules 2.0 spike on modules/tls13

**CANCELLED by the owner, 2026-09-18, while planning this row; never re-queued.** Their words:
"Okay, skip this session. We don't care about it. We don't want it. Let's just ignore it. Not
defer it. Just cancel this straight up. We don't want to do it ever again. At least not until
the very far future, which will be never."

The planning session's finding behind the cancellation: the "both platforms" fact below is
wrong for the installed SDK. In `expo-modules-core` 58.0.3 (the newest published 58.x,
2026-09-16) the 2.0 API exists only as Swift macros (`ios/Core/ExpoModulesMacros.swift`;
`@expo/expo-modules-macros-plugin` ships an `apple` directory only), no Kotlin `@JS` or
`@ExpoModule` annotation exists anywhere in the installed tree, the changelog tags every 2.0
entry `[iOS]`, and the blog post says Android is "still in the works". `modules/tls13`
declares `"platforms": ["android"]`, so there is no Swift side to migrate and nothing on the
Kotlin side to migrate to; the `expo-migrate-module` skill is Swift-only and not installed.
The 3T verification this row wanted (SDK 58 release build, real data, cold launch, TLS fetch
on Android 9) already ran in session 12's proof ("the release TLS fetch works with
compileSdk 37", session 12 `LOG.md`, 2026-09-18). The module stays on the 1.0 DSL
indefinitely. The brief below is kept as the historical record.

**Goal.** Learn Expo Modules 2.0 by migrating our one local module; keep it only if the 3T
proves TLS still installs before any HTTP client on Android 9.

**Verified facts (from the Expo blog, an early look at Expo Modules 2.0).**

- 2.0 is beta in SDK 58 on both platforms. A module is an annotated Swift or Kotlin class:
  `@JS` on methods (the async keyword decides Promise vs sync), plain `var`/`let` for
  properties, `@ExpoModule` on the class. No DSL, no `definition()`.
- Migration is incremental: `definition()` and annotations coexist in one module; move pieces
  one at a time. An `expo-migrate-module` skill exists (ships with 2.0, agent-facing).
- Performance: sync calls 2.5 to 5.6x faster than the DSL on iOS Release; Android beats both
  the old DSL and TurboModules in their microbenchmarks.
- Docs are thin during beta; source reading (opensrc, expo/expo repo) is the primary
  reference.

**Scope.**

1. Read `modules/tls13` as it stands (Android ContentProvider calling GMS
   `ProviderInstaller.installIfNeeded` before `Application.onCreate`, ISSUES #21).
2. Migrate the Kotlin side to annotations, JS API unchanged. The manifest provider wiring may
   stay as-is; only the module class modernizes.
3. Verify on the 3T (Android 9, worst case by design): release build, real data, cold launch
   fetch succeeds; optionally compare against the 1.24.17 cold-launch anatomy (the 3.1s GMS
   `ProviderInstaller` chunk should be unchanged).
4. Decision gate: keep if verification passes and the code reads simpler; revert if the beta
   API gaps force workarounds.

**Risks.** Production-critical module for Android 9 and below; beta API churn; that is why
this is isolated from session 12.

## 15. Android home-screen widgets

**Goal.** Android prayer widgets via the new `expo-widgets` Android implementation, reusing
our pure timeline architecture.

**Verified facts.**

- SDK 58 changelog: `expo-widgets` adds an Android implementation; widgets run their own JS
  bundle on a dedicated Hermes runtime, with interactions and Material Colors
  (#46961, #47035, #48454).
- The v58 docs page still leads with iOS (plugin config, `ios.supportedFamilies` nested form,
  `initialLayout`, `configuration` options exist now). The Android specifics (config keys,
  layout authoring against the `@expo/ui` Jetpack Compose subset, timeline push API) must be
  extracted from the docs' Android sections and the package source in the planning session.
- Our architecture: pure builder `shared/widgetTimeline.ts` (no RN imports, platform-neutral
  by construction), IO layer `stores/widget.ts`, layouts `widgets/*.tsx` written against the
  SwiftUI subset. The `'widget'` directive constraints (no module-scope refs, static imports
  only, props JSON-only with `v` schema) likely apply to the Android runtime too; verify.
- The iOS `widgets` feature flag is OFF (G.1 pending) and `app.config.ts` strips the whole
  `expo-widgets` plugin when OFF. Android widgets would need either their own flag or a
  deliberate decision to ship them unflagged; decide in planning.

**Scope.**

1. Research pass: Android timeline API, layout runtime, families, interactions, Material
   Colors, app-group equivalent, refresh mechanics. Sources: v58 docs, opensrc on
   `expo-widgets@58`.
2. Design the port: reuse the pure builder unchanged if possible; write Compose-subset
   layouts mirroring the iOS compositions (small countdown trio first; medium list later).
3. This row likely splits into a research session plus one or two build sessions once sized.

**Risks.** New feature on a beta library; scope unknown until the research pass; that is why
it is sequenced late and split.

## 17. iOS widget timeline horizon, 14 to 30 days

**Goal.** Answer "can the widget timeline cover 30 days instead of 14 without bloating the
payload or breaking WidgetKit rules", and do it if sound.

**Verified facts.**

- The horizon is one constant: `TIMELINE_DAYS = 14` at `stores/widget.ts:76`, feeding
  `createPrayerSequence(schedule, startDate, TIMELINE_DAYS + 1)`.
- Constraints in play: WidgetKit's ~5-minute entry spacing floor; the 200KB payload guard
  (raised when the medium day list grew entries ~30 percent); the terminal stale-guard card
  at the horizon; the virtual-week simulation and contract test suites pin current behavior.
- Entries beyond the first 24h are boundary-flip entries only (6 to 7 per day), so 30 days
  roughly triples far-future entries, not the minute-step entries. The medium widget's day
  list is the payload driver. A possible shape: slim far-future entries (drop the day list,
  countdown only) so the guard holds.

**Scope.** Feasibility math and a decision; if green, extend the constant, adjust the builder
and the simulation tests, verify on the iOS simulator. Owner leans 30 days but explicitly
wants the feasibility answered first ("if we can even do it").

## 16. SDK 58 stable re-pin (waits on the stable release)

**Trigger.** The `latest` dist-tag moves to 58 stable, RN 0.88 is stable, the root
`CHANGELOG.md` merges, the release blog post lands. Expected ~Oct 7 to 14. This row may jump
the queue the day it triggers.

**Scope.**

1. `npx expo install --check` against `latest`; name and bump everything it reports.
2. Read the full release notes (the owner's standing instruction from 2026-09-16: the beta
   changelog is incomplete) and act on anything new that touches us.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates one more time.
4. Reopen the store-release path (programme rule 1 ends here).
5. Bookkeeping: close the ISSUES #10/#17 references that waited on #49687 adoption; note in
   `ai/prompts/alarmclock-backport.md` that B9 (deletion day) is cancelled and the branch is
   the SDK 57 backup; update `ai/AGENTS.md` (stack table, ahead-pins table, prompt table row).

## Deferred owner features (recorded 2026-09-18, sequenced after the SDK 58 programme, before moonsighting)

Each becomes a row only when the owner specs and schedules it. Feasibility notes are the
planning session's starting point, not settled fact; each gets its own research pass.

### D1. Notification sound through silent mode (Android + iOS, user permission)

Owner goal: prayer sounds play at full volume even when the phone is silenced, with user
permission.

- Android: feasible. Set `setBypassDnd(true)` on our notification channels; the app already
  holds `ACCESS_NOTIFICATION_POLICY` (`app.json` line 38). The user must grant "Do Not
  Disturb access" once in system settings (deep link exists); a small permission flow is the
  session's work. Our new alarm-clock delivery class should also help on OEM skins.
- iOS: the hardware mute switch can only be overridden by Critical Alerts, an entitlement
  Apple grants narrowly (medical, security, public safety); prayer apps have historically
  been rejected, so do not promise this. The reachable ceiling is Time Sensitive
  notifications, which break through Focus and DND modes but still respect the mute switch
  for sound. The research session verifies both claims against current Apple documentation.

### D2. Qibla direction finder (compass to Mecca)

Owner-specced concept: a compass. Depends on device location (see D5) and device sensors.
Defer until its time; needs location for true north vs magnetic north handling.

### D3. Rolling buffer 2 days to 1, plus a second reminder

Owner rationale: background tasks now schedule notifications reliably, so the buffer can
shrink and the freed iOS pending-notification slots pay for a second reminder.

- UI shape (owner): a Reminders master toggle, then Reminder 1, then Reminder 2, where
  Reminder 2 stays disabled until Reminder 1 is enabled.
- iOS 64-pending cap math: 11 prayers x 2 days x 2 (at-time + one reminder) = 44 today;
  11 x 1 day x 3 (at-time + two reminders) = 33, comfortable headroom.
- Risk to weigh in the session: the 2-day buffer is also the force-quit survival window
  (only user force-quit breaks the background chain on iOS; recovery is the next app open,
  about 18h in the winter worst case). A 1-day buffer shortens that window; the session
  decides whether the stop-gap rebuild plus reschedule-on-open covers it.

### D4. Localization for v2.0 (English, Arabic, Bahasa Indonesia, Urdu, more)

Owner goal: the app goes global in v2.0 with a language switcher. Today Arabic is the
hardcoded second language in many places. Touches prayer names and explanations
(`EXTRAS_ENGLISH`/Arabic pairs), the Alert and What's New copy, widgets (labels are
precomputed into timeline props), and every hardcoded string. v2.0-grade scope; keep the
switcher manual (device-locale detection is optional polish via expo-localization).

### D5. Location support (v2.0)

Prerequisite for multi-city and the qibla finder (D2). Note for that time: SDK 58 rewrote
`expo-location` around a provider abstraction as an opt-in preview; the research session
picks the preview vs classic API.

## Answered question: update prompt from the stores instead of releases.json

Status: partially done, tracked as ISSUES #35 (not part of the SDK 58 programme). Production
iOS already reads the live App Store version via iTunes Lookup automatically; Android and
UAT iOS still read `releases.json`. Per the standing rule, `releases.json` becomes deletable
only after the update-prompt feature is removed from the codebase AND that removal has
shipped, in a separate commit. A future session implements ISSUES #35 when scheduled;
nothing in the SDK 58 programme conflicts with it.

## Ruling log (changelog sweep, owner decisions 2026-09-18)

| Item | Ruling |
| --- | --- |
| iOS 27, scene life cycle, UIScreen.main | Care at upgrade, free (prebuild artifact, no custom AppDelegate) |
| requireFullScreen + orientation locks | Care; deferred risk, no iOS 27 runtime yet |
| Device Hub | In use by owner; CLI support rides the upgrade |
| iPhone Duo | No |
| `delivery: 'alarmClock'` | THE goal, session 12 |
| Foreground flip | Wanted; no-op for us (handler matches the new default); verify |
| iOS delegate forwarding | No |
| `threadIdentifier` | No grouping |
| `largeIcon` | Yes, adopt, session 12, asset from screenshots; reverted 1.27.231 the same day (owner rejected the shade proof) |
| Android widgets | Definitely; own session (15) |
| Live Activities | Not us, double-checked (our staleness is the deliberate terminal card) |
| @expo/ui spacing/Host changes | Care later; widgets flag is OFF so inert now |
| Router core rework | Care at upgrade, migration guide; no deep imports today |
| Router data loaders, native tabs | Low |
| Async web routes, web features | No |
| Prebuilt expo-modules-core | Free win |
| Faster module calls | Free |
| Expo Modules 2.0 | Cancelled, session 14 (owner, 2026-09-18): iOS-only in SDK 58, no Kotlin authoring API to migrate to; row never re-queued |
| SwiftPM | No, CocoaPods stays |
| Fingerprint balanced | Verify in session 12 |
| R8 | Keep on, watch first release build |
| Noxcturnal | No |
| NODE_ENV | Nothing to do |
| Proxy/tunnel fixes, tunnel v2 | No |
| AVD + adb rewrite | Rides the upgrade; env refresh ordered |
| `@expo/agent-cli` | Yes, session 13 |
| EAS Observe, PostHog | No |
| Strict TS, API removals | Care, migrations in session 12 |
| RN font variation, ArrayBuffer, DevTools | No |
| `disableFab` / `disableAutoLaunch` | Document in session 13 (`disableFab` adopted in workflow) |
| expo-audio, camera, file-system, image, secure-store, sqlite, location, font | Not installed or not needed; location noted for v2.0 (D5) |
| Deprecations (File.md5, AppMetrics, useLibSQL, backgroundOverlay) | No |
| Node floors, AGP 9 | Satisfied |
