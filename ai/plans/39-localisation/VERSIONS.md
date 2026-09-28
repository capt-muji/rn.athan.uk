# Package facts, read from the npm registry on 2026-09-29

Read directly from `registry.npmjs.org/<pkg>/latest` rather than taken from a report, because
`ai/AGENTS.md` and the global rules both forbid guessing a version, and because two of the
research reports quote figures that the registry contradicts.

| Package | Version | Runtime deps | Licence | Note |
| --- | --- | --- | --- | --- |
| `i18next` | 26.4.2 | **0** | MIT | Zero runtime dependencies |
| `react-i18next` | 17.0.15 | 3 | MIT | `@babel/runtime`, `html-parse-stringify`, `use-sync-external-store` |
| `i18next-cli` | 1.74.2 | 16 | MIT | Dev tool only, so its dep count never reaches the bundle |
| `i18next-parser` | 9.4.0 | 17 | MIT | **DEPRECATED**: "Project is deprecated, use i18next-cli instead" |
| `@lingui/core` | 6.8.0 | 2 | MIT | `@lingui/message-utils`, `@lingui/babel-plugin-lingui-macro` |
| `@lingui/cli` | 6.8.0 | 21 | MIT | Dev tool only |
| `react-intl` | 12.1.3 | 3 | BSD-3-Clause | Pulls `intl-messageformat` |
| `intl-messageformat` | 12.1.2 | 2 | BSD-3-Clause | |
| `@formatjs/intl-localematcher` | 0.9.0 | 1 | MIT | `@formatjs/fast-memoize` |
| `@formatjs/intl-pluralrules` | 6.3.15 | 2 | MIT | The Arabic six-category polyfill, if needed |
| `react-native-localize` | 3.7.2 | **0** | MIT | Zero deps, but a second native module |
| `expo-localization` | **57.0.2** | 1 | MIT | `rtl-detect`. See the warning below |

## Correction 1: `i18next-parser` really is deprecated

R2 claimed this and the registry confirms it outright: the `deprecated` field on the published
package reads "Project is deprecated, use i18next-cli instead". Any plan that names
`i18next-parser` is specifying a dead tool. `i18next-cli` 1.74.2 is the replacement.

## Correction 2: `expo-localization`'s `latest` is 57.0.2, NOT an SDK 58 version

R4 recommends `expo-localization` and refers to "SDK 58, recommended `~57.0.1` compatible line",
which reads as a contradiction. The registry settles the shape of the problem: the `latest`
dist-tag points at **57.0.2**, which is the SDK 57 line.

This repo is on the SDK 58 preview. `ai/plans/README.md` row 37 records exactly this trap for
two other packages: "Packages are published for SDK 58 but only under the `next` tag, NOT
`latest`: `expo-location` 58.0.8 and `expo-sensors` 58.0.0 (`latest` still points at the 57
line)."

**Confirmed on the day, 2026-09-29:**

```
npm view expo-localization dist-tags
  latest: 57.0.2
  next:   58.0.1
```

The SDK 58 line exists and is published as `58.0.1` under `next`, exactly as row 37 found for
`expo-location` and `expo-sensors`. An `expo install expo-localization` or a `yarn add` without a
version would install **57.0.2**, the wrong major, against an SDK 58 app.

So `expo-localization` is the same situation, and the plan must:
- read the `next` dist-tag on the day it installs, never `latest`;
- pin the exact version rather than a range, matching how `expo-widgets` and `@expo/ui` are pinned
  to an exact `58.0.5` after the session 23 breakage;
- re-run `shared/__tests__/widgetRuntimeLoads.test.ts` after the install, because `ai/AGENTS.md`
  records that ANY `yarn add` can reintroduce a nested `@expo/ui` copy that blanks every widget.

That last point is not hypothetical. Session 31 hit it while adding an unrelated dependency.

## What this says about the library choice

`i18next` having **zero runtime dependencies** is the strongest single fact for a bundle-sensitive
app, and it holds at the current version. `react-i18next` adds three, of which
`use-sync-external-store` is a React shim and `@babel/runtime` is almost certainly already present.

`@lingui/core` at 2 deps is close, and `react-intl` at 3 (pulling `intl-messageformat`, which
pulls 2 more) is the heaviest of the three.

The dependency counts above are direct dependencies only. R1 was asked for transitive counts and
installed sizes, which is the number that actually decides a bundle question, so its verdict
supersedes this table on size. This table is the version and licence truth.

## Reproducing

```js
await fetch('https://registry.npmjs.org/i18next/latest').then(r => r.json())
```

For the SDK 58 question specifically, the dist-tags matter rather than `latest`:

```bash
npm view expo-localization dist-tags
```
