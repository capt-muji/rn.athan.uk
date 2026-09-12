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
   * iOS Home/Lock screen widgets (expo-widgets). Disabled: the widget
   * extension is stripped at prebuild and all push paths return early,
   * so the broken-render chain (ISSUES.md G.1/G.2) cannot ship.
   * Flip condition (revised 2026-09-12 — the old one can never be met):
   * expo/expo#49244 was CLOSED UNMERGED on 2026-09-11; the maintainer
   * reimplemented it as #49810, merged the same day but UNRELEASED, sitting
   * in expo-widgets' `Unpublished` changelog section above `58.0.0` — so it
   * ships on the SDK 58 line, not as a 57.0.x patch. Installed 57.0.18 still
   * carries the random-UUID identity hack (`DynamicView.swift:26`), and
   * 57.0.16/17/18 each record "no user-facing changes". Flip only once the
   * fix is genuinely installed AND verified on the iPhone XS per the G.1
   * acceptance protocol. Full trail in ISSUES.md G.1 item 0.
   */
  widgets: process.env.EXPO_PUBLIC_WIDGETS === '1',
} as const;

export type FeatureFlagId = keyof typeof FEATURE_FLAGS;
