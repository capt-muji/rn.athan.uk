# Package facts (compressed)

Written 2026-09-29 at 113 lines from `registry.npmjs.org`; **compressed 2026-10-07**. The
12-package rejected-library table and the historical `58.0.1` pin are dropped (the `next` tag is
58.0.3 on 2026-10-07; never reintroduce a remembered pin). What survives, because the plan still
needs it (C3):

## The install contract for `expo-localization`

- Read the **`next` dist-tag on the day it installs**, never `latest`: `latest` pointed at the
  SDK 57 line (57.0.2) when this was written, and row 37 hit exactly this trap for
  `expo-location` and `expo-sensors`.
- **Pin the exact version rather than a range**, matching how `expo-widgets` and `@expo/ui` are
  pinned to an exact `58.0.5` after the session 23 breakage.
- **After ANY `yarn add`, run `shared/__tests__/widgetRuntimeLoads.test.ts`**: a re-resolve can
  reintroduce a nested `@expo/ui` copy under `node_modules/expo-widgets/` that blanks every
  widget (session 31). Recovery: `rm -rf node_modules/expo-widgets/node_modules && yarn install
  --frozen-lockfile`.
- `rtl-detect` (its one runtime dep) maps a language tag to a direction; under D7 the answer
  chooses TEXT alignment and base direction, never layout direction.
- Tooling: `i18next-parser` is deprecated ("use i18next-cli instead"); `i18next` itself had zero
  runtime dependencies at 26.4.2.

Reproducing: `npm view expo-localization dist-tags`.
