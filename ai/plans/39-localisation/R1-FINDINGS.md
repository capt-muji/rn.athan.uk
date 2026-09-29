# What R1 settles: the library choice, and the trap that would have shipped

R1 (`research/R1-LIBRARY-LANDSCAPE.md`, 642 lines) compares the i18n libraries against this repo's
real constraints. Its most valuable finding is not the recommendation; it is a failure mode that
would have reached production with a green test suite.

## The trap: Jest passes, Hermes fails

**Hermes does not implement `Intl.PluralRules`.** R1 verified this against the Hermes repository
documentation on `main`, which lists `PluralRules`, `ListFormat`, `RelativeTimeFormat`,
`DisplayNames` and `Locale` as "Planned" rather than shipped.

**Node implements all of them.** Measured on this machine:

```
node has Intl: {"PluralRules":true,"NumberFormat":true,...,"Segmenter":true}
node ar categories: 0=zero 1=one 2=two 3=few 11=many 100=other
```

Jest runs on Node. So plural code written against `Intl.PluralRules` passes every test, at 100%
coverage, and then renders the wrong form on a phone. Arabic is the worst case, because it has
**six CLDR plural categories** and an unpolyfilled resolver falls back to English's two.

This is precisely the class of defect `ai/AGENTS.md` records over and over: a guard that reads
healthy while the device misbehaves. It is also the reason the repo's widget suite builds and
evaluates the real bundle rather than asserting on names.

**The rule it forces:** any plural implementation ships with a canary test that deletes
`Intl.PluralRules` from the global before exercising the code, so the suite reproduces Hermes's
environment rather than Node's. Without that test, the suite is actively misleading here.

### What this repo can and cannot verify today

`node_modules/react-native/ReactAndroid/hermes-engine/build.gradle.kts:350` sets
`-DHERMES_ENABLE_INTL=True`, with the comment that RN builds Hermes with Intl support only, to
avoid a build-type matrix. So `Intl` exists on Android.

That flag does **not** say which Intl APIs are implemented. Hermes's Android Intl is a Java/ICU
binding layer and its coverage is partial by design. The Hermes source is not vendored into
`node_modules` (only `sdks/hermes-engine` is present), so the exact surface cannot be read from
this checkout.

**Status: R1's claim is credible and corroborated by the build flag's own framing, but it is not
independently verified here.** The settling experiment is one line in the app on a real device:

```js
logger.info({ pluralRules: typeof Intl.PluralRules, locale: typeof Intl.Locale });
```

on the OnePlus 3T (Android 9, the floor device) and on the iPhone XS. The plan carries this as a
named pre-flight experiment, because the library decision below depends on the answer.

## The measured numbers

| Package | Runtime size | Note |
| --- | --- | --- |
| `@lingui/core` | 2,116 B gzipped | Smallest runtime |
| `i18n-js` | 14.2 KB gzipped | Only candidate with embedded plural rules |
| `i18next` + `react-i18next` | 24 KB gzipped | |
| `react-intl` + `@formatjs/intl` | 25 KB gzipped | |
| `@formatjs/intl-pluralrules` | 46,780 B raw | The polyfill every ICU library needs on Hermes |
| `@formatjs/intl-locale` | 102,761 B raw | Lingui's official RN path mandates this too |

So Lingui's 2 KB runtime is misleading: its documented React Native path requires roughly **155 KB
of polyfill** before minification. i18next since v24 dropped its plural fallback, so it needs the
same polyfill for Arabic to be correct.

**Catalogs are cheap at every scale**, measured against this repo's real corpus: 5,317 B per
language, so 20 languages is 104 KB and 60 languages is 312 KB, against a 4.4 MB bundle. The
"bundle all the languages" worry was unfounded.

## R1's recommendation, and why it fits this repo

**A hand-rolled typed catalog plus a `t()` function**, with a CLDR-generated plural table embedded,
zero runtime dependencies, `expo-localization` for detection, and one Jotai/MMKV atom for the
choice.

The reasoning tracks `ai/AGENTS.md`'s own ladder: "does this need to exist? already in the
codebase? stdlib? native platform? installed dependency? one line? only then the minimum that
works." Detection is native (`expo-localization`), state is installed (Jotai and MMKV, already
used for every other preference), dates are already handled by `date-fns`, and what remains is a
lookup function.

It also has a property that matters given the finding above: **a hand-rolled plural table works on
Hermes without a 46 KB polyfill**, because it never calls `Intl.PluralRules`. The library options
all need the polyfill to be correct in Arabic, which is the app's most important non-English
language.

Key safety comes from `keyof typeof` against the English catalog, which is compile-time and free.

## R1's own strongest counter-argument, which the plan must answer

> The hand-rolled plural table re-implements, without fourteen years of battle testing, the exact
> edge cases the ecosystem already fixed. A silent table bug ships wrong reminder copy to every
> Arabic speaker, no community watchdog will file it, and CLDR revises rules over time.

This is a real risk and the mitigation belongs in the acceptance criteria rather than in prose:

1. **Generate the plural table from `make-plural`, never hand-write it.** It becomes committed
   generated data with a regeneration command, like the repo's existing
   `scripts/generate-widget-assets.py` pattern.
2. **Pin it with exhaustive per-language count tests**, asserting every CLDR category boundary.
3. **Keep the `Intl.PluralRules`-deleted canary**, so the tests run in Hermes's environment.
4. **Keep the catalog shape one-to-one with i18next resources**, so migrating to i18next later is
   mechanical rather than a rewrite.

Point 4 is the one that makes the decision reversible, which matters because R1 also finds a
crossover: past roughly 40 languages, or the moment a translation-management system with human
review enters the picture, i18next's operations tooling earns its 24 KB.

## How much plural support this app needs

Worth stating, because it changes the weight of the counter-argument. The app's copy is almost
entirely fixed labels: "Settings", "Close", "Change athan", prayer names. The measured plural
surface is small: reminder intervals ("in 5 minutes"), and a handful of count-bearing strings.

The app's own reminder copy today is `${englishName} in ${intervalMinutes}m`, an abbreviation that
sidesteps pluralisation entirely. If the translated forms keep an abbreviated shape where the
language allows it, the plural surface shrinks further.

So the honest position is that plurals are a **correctness requirement on a small surface**, not a
pervasive one, which favours the small self-owned implementation over a 46 KB polyfill.

## What R1 confirms independently

- **Notification copy is frozen at schedule time on both platforms**, matching what this session
  read from the `expo-notifications` Swift source. Every candidate library exposes a synchronous
  non-hook `t`, which is what a scheduling pass needs.
- **Dynamic `import()` stays banned**, per the repo's own widget-transform lesson. Catalogs load by
  lazy `require()`, which `inlineRequires: true` already optimises, and exactly one catalog is
  loaded on a switch. Fully offline, satisfying owner decision D3.
- **No i18n import should be reachable from `widgets/*.tsx`.** R1 notes `react-i18next` calls
  `React.createContext` at module scope, which the five-name widget stub happens to provide today
  but is not guaranteed to tomorrow. Zero imports is the posture regardless, which is what
  `CONSTRAINTS.md` C2 already required.

## Where R1 and the other reports disagree

R2 and R4 both assume i18next, and R2's CI tooling recommendation (`i18next-cli`) is built for it.
R1 recommends no library at all.

This is resolved rather than split: `i18next-cli` extracts and validates `t()` call sites and JSON
catalogs. A hand-rolled `t()` with i18next-shaped JSON catalogs is compatible with it, which is
exactly why R1's fourth mitigation insists the catalog shape stays one-to-one with i18next
resources. The tooling can be adopted without the runtime.

The plan takes R1's runtime, R2's pipeline and tooling, R4's detection and set, and R3's rendering
rules.
