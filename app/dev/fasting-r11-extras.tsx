/**
 * The round-11 Extra Schedule route (T-623, surface A). Dev-only: the harness
 * module loads through require() behind the dev check (the app/index.tsx
 * pattern), and the route renders nothing in release, so no production
 * surface exists.
 */

export default function DevFastingR11ExtrasRoute() {
  if (!__DEV__) return null;
  const { ExtrasR11Screen } =
    require('@/devlayouts/r11/ExtrasR11Screen') as typeof import('@/devlayouts/r11/ExtrasR11Screen');
  return <ExtrasR11Screen />;
}
