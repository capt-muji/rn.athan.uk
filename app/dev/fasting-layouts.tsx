/**
 * The fasting layout exploration route (T-623). Dev-only: the harness module
 * loads through require() behind the dev check (the app/index.tsx pattern),
 * and the route renders nothing in release, so no production surface exists.
 */

export default function DevFastingLayoutsRoute() {
  if (!__DEV__) return null;
  const { FastingLayoutsScreen } =
    require('@/devlayouts/FastingLayoutsScreen') as typeof import('@/devlayouts/FastingLayoutsScreen');
  return <FastingLayoutsScreen />;
}
