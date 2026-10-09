/**
 * Feature flags - build-time resolved, statically folded by Metro
 *
 * Values come from the build environment (see .env.example for the catalog):
 * a flag is enabled only when its variable is exactly the string '1'
 * (matching EXPO_PUBLIC_WHATS_NEW_PREVIEW / BG_DEBUG / PERF_MONITOR);
 * absence, '0', or any typo means disabled. Fail direction: mistakes
 * disable, never enable.
 *
 * This file is not the only reader, despite what it used to claim.
 * app.config.ts mirrors the widgets flag for native prebuild
 * (shared/__tests__/flags.test.ts pins the two in lockstep), shared/config.ts
 * reads the environment and the build identity, and four behaviour gates each
 * spell a variable of their own: shared/constants.ts (BG_INTERVAL_MINUTES),
 * shared/time.ts (FORCE_RAMADAN), shared/perf.ts (PERF_MONITOR) and
 * device/backgroundTaskDebug.ts (BG_DEBUG). Those four also require
 * EXPO_PUBLIC_ENV !== 'prod', so a variable left set cannot reach a release
 * build; anything added here or there must hold to the same rule.
 *
 * Lifecycle: every flag names its flip condition in JSDoc. When the
 * condition lands, flip the default here in a version-bumped release;
 * once the feature is stable, delete the flag (gate, .env.example line,
 * and all).
 */

export const FEATURE_FLAGS = {
  /**
   * iOS Home/Lock screen widgets (expo-widgets): the widget extension and
   * every push path in stores/widget.ts. ON, and it stays on: the owner ruled
   * on 2026-09-25 that neither widget flag ships disabled again, so
   * `.env.example` carries 1 for both and flagDefaults.test.ts pins them.
   *
   * It existed to keep the G.1 render chain out of a build: expo-widgets
   * regenerated random SwiftUI view identities per render, so each body
   * evaluation tore down the whole tree and starved the extension's CPU
   * budget. expo-widgets 58.0.1 shipped expo/expo#49810, and the installed
   * 58.0.3 renders `AnyView(view).id(child.childIdentity)` with no `UUID()`
   * anywhere. The G.1 acceptance protocol ran on the iPhone XS on 2026-09-25
   * and passed: all eight home kinds rendered and stayed rendered past ten
   * minutes, no watchdog line, no new cpu_resource report.
   *
   * Now scaffolding awaiting deletion, per the lifecycle rule above.
   */
  iosWidgets: process.env.EXPO_PUBLIC_IOS_WIDGETS === '1',
  /**
   * Android home-screen widgets (expo-widgets' Android implementation,
   * SDK 58). ON, and it stays on: the owner ruled on 2026-09-25 that neither
   * widget flag is ever shipped off again, so `.env.example` carries 1 for
   * both and a build that turns this off is a mistake, not a choice.
   *
   * It matters more than an ordinary flag: while this is off, the prebuild
   * android resolution strips the expo-widgets plugin, so the APK declares no
   * widget providers at all and the app vanishes from the launcher's widget
   * picker. A build that lost the widgets shipped exactly that way once.
   *
   * Now scaffolding awaiting deletion, per the lifecycle rule above.
   */
  androidWidgets: process.env.EXPO_PUBLIC_ANDROID_WIDGETS === '1',
} as const;

export type FeatureFlagId = keyof typeof FEATURE_FLAGS;
