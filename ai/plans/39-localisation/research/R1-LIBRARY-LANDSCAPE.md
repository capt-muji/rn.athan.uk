# R1: The i18n library landscape, measured (compressed)

Research report for session 39. Written 2026-09-29 at 641 lines. **Compressed 2026-10-07** to
the sections other documents do not carry; the conclusions and measured numbers this plan
actually builds on live in `R1-FINDINGS.md` (the Hermes-no-`Intl` finding and the canary-test
rule it forces, the polyfill inventory, the 5,317 B/language catalog cost, the hand-rolled
recommendation with its four mitigations, and the ~40-language/TMS crossover rule). Recover
the full original from git history (C4).

What is kept here, because nothing else carries it:

## 1. The headline comparison table (R1 §3.1)

Versions, bytes, downloads and dates read from the npm registry, Bundlephobia and unpkg on
2026-09-29. `expo-localization` reads from the `next` dist-tag on install day, never a
remembered pin; dist-tags move (it was 57.0.2 on `latest` and the SDK-58 preview line on
`next` when this was written; see `VERSIONS.md` for the install contract).

| Candidate | Latest (date) | Licence | Runtime deps (transitive) | Min+gz bundle | Weekly downloads | Bus factor |
| --- | --- | --- | --- | --- | --- | --- |
| `i18next` + `react-i18next` | 26.4.2 + 17.0.15 (2026-09-03 / 09-21) | MIT | 5 packages, no polyfills; 8 with plural polyfill set | 13,703 + 10,229 B | 25.4M + 18.8M | Low: one primary maintainer (locize founder), company-backed |
| `@lingui/core` + `@lingui/react` | 6.8.0 (2026-09-23) | MIT | ~14 with the mandated polyfills | 2,116 + 1,775 B | 1.7M + 1.2M | Medium: active team, v6 modernisation shipped 2026-04-22 |
| `react-intl` (FormatJS) | 12.1.3 (2026-09-24) | BSD-3-Clause | ~11 with polyfills | 15,183 B + `@formatjs/intl` 10,126 B | 3.6M | High: Meta-affiliated maintainers, very active |
| `intl-messageformat` standalone | 12.1.2 | BSD-3-Clause | 3 | 10,126 B | 23.0M | High |
| `expo-localization` | `latest` / `next` dist-tags (2026-09-21) | MIT | 1 (`rtl-detect`); native module | JS side trivial | 3.2M | High (Expo core) |
| `react-native-localize` | 3.7.2 (2026-09-15) | MIT | 0; native TurboModule (codegen'd) | 384 B JS | 659k | Low-medium: zoontek, long reliable record |
| `i18n-js` | 4.5.3 (2026-03-04) | MIT | 3 (`lodash`, `make-plural`, `bignumber.js`) | 14,189 B | 642k | Low: one maintainer |
| `intlayer` / `react-native-intlayer` | 9.5.11 | Apache-2.0 | 5+ | not measured | 12.5k (RN package) | Early: CDN-centric design conflicts with D3 offline |
| `@tolgee/react` | 7.2.1 | MIT | 2 | not measured | 95k | Dev-tool-centric, needs Tolgee server; conflicts with D3 |
| Roll-your-own typed catalog + `t()` | n/a | n/a | 0 runtime (1 dev-time generator) | ~0 B beyond catalogs | n/a | You |

Market check from the same week: the download split (i18next 25.4M weekly, react-intl 3.6M,
Lingui 1.7M core) matches the 2026 comparison articles; react-i18next is the dominant
production default, and Expo's own docs name the pairing libraries while providing no
translation layer themselves.

Per-candidate detail that survives compression, because it is not restated in R1-FINDINGS:

- **i18next 26.4.2**: zero runtime deps in i18next itself; `react-i18next` adds
  `@babel/runtime`, `html-parse-stringify` (1,878 B gz) and `use-sync-external-store` (221 B
  gz). `context.js` calls `React.createContext()` at module scope, a name the widget stub
  provides today, with no guarantee about the next release. TypeScript `CustomTypeOptions`
  gives compile-time key checking; the selector API is default in v26.
- **Lingui 6.8.0**: ESM-only, Node 22.19+; install footprint cut 62 MB to 35 MB, transitive
  tree 146 to 104 packages (their measured numbers). `@lingui/macro` has no v6: the macro
  moved into `@lingui/babel-plugin-lingui-macro` in the Babel config, `babel-plugin-macros`
  deprecated. Its Metro transformer adds a `.po` compile stage beside this repo's existing
  svg transformer, jsx-runtime shim and widget transform, the integration risk that ranked
  it third.
- **react-intl 12.1.3**: reads `RelativeTimeFormat`, `ListFormat`, `DisplayNames` (every one
  missing on Hermes) and calls `onError(MISSING_INTL_API)` when absent. Strongest
  maintenance of the set.
- **i18n-js 4.5.3**: embedded `make-plural` 7.5.0, the only library whose pluralisation works
  with zero `Intl` support out of the box; costs `lodash` + `bignumber.js`, no compile-time
  key safety, one maintainer.
- **expo-localization vs react-native-localize**: same job; localize adds locale-change
  listeners and a second native module to align on every SDK bump. Either is fine; the
  Expo-pinned one fits this repo.

## 2. The `HERMES_ENABLE_INTL` flag: what it does and does not settle (R1 §4.2)

`node_modules/react-native/ReactAndroid/hermes-engine/build.gradle.kts:350` sets
`-DHERMES_ENABLE_INTL=True`, with the comment that RN builds Hermes with Intl support only,
to avoid a build-type matrix. So `Intl` exists on Android.

That flag does **not** say which Intl APIs are implemented. Hermes's Android Intl is a
Java/ICU binding layer and its coverage is partial by design. The old `NOINTL`/`INTL` AAR
split (57 to 62 KB per ABI, the Hermes doc's own measurements) no longer exists: RN 0.88.0-rc.2
pins a single `com.facebook.hermes:hermes-android` version with no flavour dimension, and the
Maven directory for `260318099.0.3` holds exactly one release AAR (85,411,457 B) with no intl
variant. Intl support is compiled in and cannot be toggled by an app.

**Status: R1's "no `Intl.PluralRules` on Hermes" claim is credible and corroborated by the
build flag's own framing, but it is not independently verified here.** The Hermes source is
not vendored into `node_modules` (only `sdks/hermes-engine` is present). `R1-FINDINGS.md`
carries the settling experiment: one `logger.info({ pluralRules: typeof Intl.PluralRules,
locale: typeof Intl.Locale })` line on the OnePlus 3T (Android 9, floor device) and the
iPhone XS, carried as a named pre-flight. The library decision depends on the answer.

## 3. What would verify the residual UNVERIFIED items (R1 §15)

| Claim | What would verify it |
| --- | --- |
| i18next `lng: 'cimode'` returns raw keys as a test mode | Read i18next 26.4.2 resolver code, or one Node line against the installed package |
| Sub-millisecond parse of one 5.3 KB catalog on the SD820 | A `react-native-performance` mark around first `t()` on a 3T release build |
| `make-plural` 8.1.0's CLDR version | Changelog check; cross-check any rule against current CLDR before generating the table |
| Lingui v6 under Yarn 1 with `unstable_enablePackageExports` in this Metro config | A spike: install `@lingui/core@6` in a branch, require it through Metro and Jest |
| `react-native-localize` on New Architecture in RN 0.88-rc.2 specifically | A one-hour 3T spike, if it is ever preferred over `expo-localization` |
| Bundlephobia figures for `expo-localization` | Service errored for this package; measure from the unpacked tarball or accept the negligible thin-wrapper size |
