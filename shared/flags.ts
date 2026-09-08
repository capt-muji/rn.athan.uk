/**
 * Feature flags - build-time resolved, statically folded by Metro
 *
 * Values come from the build environment (see .env.example for the catalog):
 * a flag is enabled only when its variable is exactly the string '1'
 * (matching EXPO_PUBLIC_WHATS_NEW_PREVIEW / BG_DEBUG / PERF_MONITOR);
 * absence, '0', or any typo means disabled. Fail direction: mistakes
 * disable, never enable.
 *
 * This file is the single reader: no other module may spell an
 * EXPO_PUBLIC flag variable (the one exception is app.config.ts, which
 * mirrors the widgets flag for native prebuild - shared/__tests__/flags.test.ts
 * pins the two in lockstep).
 *
 * Lifecycle: every flag names its flip condition in JSDoc. When the
 * condition lands, flip the default here in a version-bumped release;
 * once the feature is stable, delete the flag (gate, .env.example line,
 * and all).
 */

export const FEATURE_FLAGS = {
  /**
   * iOS Home/Lock screen widgets (expo-widgets). Disabled: the widget
   * extension is stripped at prebuild and all push paths return early,
   * so the broken-render chain (ISSUES.md G.1/G.2) cannot ship.
   * Flip condition: expo-widgets@57.0.16 (expo/expo#49244) verified on
   * the iPhone XS per the G.1 acceptance protocol.
   */
  widgets: process.env.EXPO_PUBLIC_WIDGETS === '1',
} as const;

export type FeatureFlagId = keyof typeof FEATURE_FLAGS;
