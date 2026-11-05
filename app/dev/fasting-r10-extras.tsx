/**
 * The round-10 Extra Schedule route (T-623, surface A). Dev-only: the harness
 * module loads through require() behind the dev check (the app/index.tsx
 * pattern), and the route renders nothing in release, so no production
 * surface exists.
 */

export default function DevFastingR10ExtrasRoute() {
  if (!__DEV__) return null;
  const { ExtrasR10Screen } =
    require('@/devlayouts/r10/ExtrasR10Screen') as typeof import('@/devlayouts/r10/ExtrasR10Screen');
  return <ExtrasR10Screen />;
}
