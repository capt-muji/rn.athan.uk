/**
 * The round-9 Extra Schedule route (T-623, surface A). Dev-only: the harness
 * module loads through require() behind the dev check (the app/index.tsx
 * pattern), and the route renders nothing in release, so no production
 * surface exists.
 */

export default function DevFastingR9ExtrasRoute() {
  if (!__DEV__) return null;
  const { ExtrasR9Screen } =
    require('@/devlayouts/r9/ExtrasR9Screen') as typeof import('@/devlayouts/r9/ExtrasR9Screen');
  return <ExtrasR9Screen />;
}
