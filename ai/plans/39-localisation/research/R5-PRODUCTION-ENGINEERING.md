# R5: Production engineering for 20+ languages

Research report for the localisation programme. Every claim carries a source or a repo measurement. Versions were read from `registry.npmjs.org` on 2026-09-29. Repo facts were read from this worktree.

| Library | Current version | Source |
| --- | --- | --- |
| `i18next` | 26.4.2 | registry.npmjs.org/i18next/latest |
| `react-i18next` | 17.0.15 | registry.npmjs.org/react-i18next/latest |
| `i18next-cli` | 1.74.2 | registry.npmjs.org/i18next-cli/latest |
| `@lingui/core`, `@lingui/cli`, `@lingui/react` | 6.8.0 | registry.npmjs.org |
| `@lingui/macro` | 5.9.5 | registry.npmjs.org/@lingui/macro/latest |
| `typesafe-i18n` | 5.27.1 (last major activity 2023) | registry.npmjs.org |
| `expo-localization` | 57.0.2 (SDK 58 pins `~57.0.x`) | registry.npmjs.org |
| `eslint-plugin-i18next` | 6.1.5 | registry.npmjs.org |
| `babel-plugin-i18next-extract` | 1.1.0 | registry.npmjs.org |
| `i18next-parser` | DEPRECATED, repo archived 2026-02-22 | github.com/i18next/i18next-parser |

Tooling note: `i18next-parser` is archived. Its deprecation notice names `i18next-cli` as the replacement and ships `npx i18next-cli migrate-config` for the transition (https://github.com/i18next/i18next-parser). Any plan written against `i18next-parser` today targets a dead tool.

---

## 1. Key architecture

### 1.1 Natural-language keys versus structured keys

The two styles:

```typescript
// Natural-language key (Lingui default, i18next with keySeparator: false)
t('Change athan')

// Structured key (i18next default, Lingui explicit IDs)
t('settings.sound.changeAthan')
```

The trade has real published evidence on both sides.

| Dimension | Natural keys | Structured keys | Source |
| --- | --- | --- | --- |
| English copy change | Changes the key. Every catalog entry orphans unless the tooling merges. | Free. The key stays, the English value edits in place. | dev.to/spyke/localization-keys-vs-direct-text-keys-5i; locize.com/blog/i18n-without-translation-files |
| Duplicate English, different meanings | Collides. English "Open" as verb and as state need two translations elsewhere. | Distinct keys: `action.open` versus `status.open`. | dev.to report, "Context & Uniqueness" section |
| Naming burden | None. | Every string needs a name. | lingui.dev/guides/explicit-vs-generated-ids |
| Grep from copy to call site | Direct. Grep the English, land on the line. | Two hops: copy lives in a catalog, key greps to the call site. | lingui.dev/guides/explicit-vs-generated-ids ("Searching for a user-facing string will lead to the place in code where it's used") |
| Bundle size | Lingui generates short hash IDs (`MbT6FE`) which beat `index.header.title` in bytes. | Longer keys, more bytes. | lingui.dev/guides/explicit-vs-generated-ids |
| Test assertions | Assert the English string. Breaks on every copy edit. | Assert the key. Survives copy edits. | testing-library.com/docs/example-react-intl/ ("Strings hardcoded into tests mean you have to update both tests and code for any copy changes") |
| Translator context | The source string is the key; context must ride along in comments or a TMS. | The namespace carries context (`settings.sound.*` tells the translator where it lands). | lokalise.com/blog/translation-keys-naming-and-organizing/ |

The collision problem is not theoretical for this repo. `components/sheets/screens/Alert.tsx:31-33` defines labels `'Off'`, `'Silent'`, `'Sound'` for `AlertType`. `Off` as an alert mode and `off` as a generic disabled state are different words in plenty of languages. With natural keys both spell `'Off'` and share one catalog entry, so one of the two gets the wrong translation. The same file has `'Close to save'`, where `Close` is a verb; a natural key freezes that sense.

The copy-change problem hits this repo's test culture hardest. The suite holds about 4,800 tests and a pre-commit hook runs all of them (ai/AGENTS.md section 2 and 6). With natural keys, every English copy tweak changes a key and fails every test asserting it. The repo rule "tests before refactoring" depends on assertions that survive cosmetic change. Structured keys plus a test-mode `t` that returns the key keeps 4,800 tests silent through copy edits.

Rewrites are the cautionary tale: a Medium write-up of renaming roughly 500 keys in a large frontend describes the rename as a multi-developer project (https://jdudzik.medium.com/rewriting-every-i18n-key-in-a-large-frontend-codebase-8fcf01dbcea). Choose as if renaming is expensive, because it is.

**Finding: structured keys win here on three repo-specific grounds: test stability under the 100% coverage regime, the existing `Off`/`Silent`/`Sound` collision, and free English copy edits. The cost is naming 194 strings once.**

### 1.2 Namespacing and file layout

Three layouts exist: one catalog, per-screen namespaces, per-feature catalogs.

| Layout | Fits | Cost | Real example |
| --- | --- | --- | --- |
| One catalog per locale | Apps under roughly 1,000 strings | None at this size | Bluesky `social-app`: one `messages.po` per locale under `locale/locales/<locale>/`, synced nightly by `pnpm intl:extract` (https://github.com/bluesky-social/social-app/blob/main/docs/localization.md) |
| Per-screen namespace | Large apps with lazy-loaded screens | Namespace plumbing, `useTranslation('ns')` everywhere | i18next docs treat it as the scale-out path (https://www.i18next.com/overview/typescript) |
| Per-feature catalogs | Monorepos, independently shipped packages | Config grows; `{name}` catalog tokens in Lingui (https://lingui.dev/ref/conf) | i18next `ResourceNamespaceMap` monorepo pattern, v26.3.0+ (https://www.i18next.com/overview/typescript) |

Bluesky runs Lingui across Web, iOS and Android with community translation through Crowdin on exactly the one-catalog-per-locale layout, with nightly extraction into `messages.po` and a release ritual of `intl:release` pulls. That is the closest published production analogue to this app's size and stack.

**Finding: 194 strings is one catalog. Namespaces buy lazy loading this app does not need and cost indirection on every call site. A single `translation` namespace with structured dotted keys gives the grouping benefit without the plumbing.**

### 1.3 Type safety

Four mechanisms exist. They catch different things.

| Mechanism | Catches at compile time | Misses until runtime | Source |
| --- | --- | --- | --- |
| i18next `CustomTypeOptions` resources augmentation | Typo'd keys, wrong namespace, missing interpolation variables (when resources are a `.ts` file with `as const`) | Missing translation in a non-default locale, plural category gaps, wrong locale data loaded | https://www.i18next.com/overview/typescript |
| i18next selector API (`enableSelector`) | Same, plus IDE "go to definition" into the resource file, and far better type-level performance | Same runtime gaps | https://www.locize.com/blog/i18next-typescript-selector-api |
| `typesafe-i18n` codegen | Everything: keys, params, per-locale completeness of the base locale | Other locales' completeness; project last moved in 2023 | registry.npmjs.com/package/typesafe-i18n; github.com/ivanhofer/typesafe-i18n/discussions/324 |
| Lingui macros | Template expressions are type checked at the call site; plural rules validated during transform | A missing catalog entry renders the source message; the generated hash ID is not checked against a type | https://lingui.dev/ref/macro |

The i18next docs are specific about what still fails only at runtime: interpolation typing requires the resources to live in a TypeScript file with `as const`, because "JSON files don't support `as const` to convert objects to be type literals (yet)" (https://www.i18next.com/overview/typescript, "Not working interpolation values"). The same page documents `strictKeyChecks` (v26+) so a `defaultValue` cannot mask a missing key, and warns that the legacy key-enumeration types can OOM on large resource sets, with `enableSelector: "optimize"` as the fix.

The strongest documented shape, verbatim from the i18next TypeScript guide:

```typescript
// shared/i18n/resources.ts
import en from './locales/en';

export const defaultNS = 'translation' as const;

export const resources = {
  en,
} as const;
```

```typescript
// shared/i18n/i18next.d.ts
import { defaultNS, resources } from './resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: typeof resources['en'];
    strictKeyChecks: true;
    enableSelector: true;
  }
}
```

With that in place:

```typescript
t('settings.sound.changeAthan')            // ok
t('settings.sound.changeAthanX')           // compile error
t('alerts.reminderIn', { minutes: 5 })     // ok only if the value declares {{minutes}}
t('alerts.reminderIn')                     // compile error: missing {{minutes}}
```

Note the boundary condition that matters for the version pins in this repo: the i18next type system needs a recent TypeScript, and the project runs TypeScript 7.0.2 strict (ai/AGENTS.md section 2), which satisfies it.

**Finding: i18next with `CustomTypeOptions` over an `as const` TypeScript catalog is the strongest compile-time story available today. It catches typo'd keys and missing interpolation variables. It cannot catch a missing Arabic entry; that is a test problem, covered in section 5.**

### 1.4 Domain identifiers versus display labels

The industry rule: a value that is stored, logged, compared, or used as a map key is an identifier and is never translated. A value a user reads is a label and is always translated. The .NET localisation guide states the canonical form: keep the enum as the stable identifier and resolve a resource per enum value at the display boundary (https://github.com/valdisiljuconoks/LocalizationProvider/blob/master/common/docs/translate-enum-net.md). Stack Overflow's long-standing answer on localising enums says the same (https://stackoverflow.com/questions/3914688/whats-the-best-way-to-provide-localization-for-enums).

This repo currently merges the two roles in one field. `Prayer.english` is a domain identifier:

- Storage keys: `preference_alert_${type}_${prayerName.toLowerCase()}` (stores/notifications.ts:207).
- Notification identifiers: `athan_${scheduleType}_${englishName.toLowerCase()}_${date}` and `reminder_...` (device/notifications.ts:55, 68).
- Equality: `prayer.english === english` inside `getPrayerForDate` (shared/prayer.ts:504-505).
- Ordering: `EXTRAS_ENGLISH.indexOf(english)` ranks the extras row (shared/prayer.ts:574, components/overlay/overlayContent.ts:53).
- Sound selection: `isDailyPrayer(englishName)` lowercases and looks up a Set (shared/notifications.ts:110).

And the same strings are display labels: `PRAYERS_ENGLISH` renders as the row name, `${englishName} now` is the notification title (shared/notifications.ts:130), `Athan ${soundIndex + 1}` is a channel name (shared/notifications.ts:410).

The failure mode when the split is not made: someone "localises" `Prayer.english` and every stored preference orphans overnight. MMKV keys built from `Midnight` no longer match a row whose field now reads `نصف الليل`. The alert the user configured disappears, `EXTRAS_ENGLISH.indexOf` returns `-1`, and `getPrayerForDate` returns `null` so nothing arms. Worst of all, it breaks silently: `null <= now` is `true` in a past-row check (ai/AGENTS.md, 2026-09-27 lesson), so rows drop without an error.

The standard fix, applied to this repo:

```typescript
// shared/constants.ts: identifiers stay English forever, never rendered
export const PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;
export type PrayerId = (typeof PRAYER_IDS)[number];

// shared/i18n/prayerNames.ts: labels resolved per locale, one map
export const prayerLabel = (id: PrayerId): string => t(`prayer.${id}`);
```

Enforcement options:

| Enforcement | Mechanism | Coverage |
| --- | --- | --- |
| Type | `Prayer.english: PrayerId` where `PrayerId` is a closed union | Any code assigning a free string fails `tsc`. Reading it remains legal, so it stops new identifiers, not display misuse. |
| Lint | GritQL plugin matching string literals inside `label`/`title` props | Catches props, not computed labels. |
| Test | A unit test asserting `PRAYER_IDS` is disjoint from the catalog's rendered output, plus the existing contract-test pattern | The repo already enforces source contracts this way (`widgetContract.test.ts` reads widget sources; `flags.test.ts` pins the app.config mirror). |

**Finding: split the identifier from the label before any catalog exists. It is the prerequisite for every later step, the silent-failure mode is the worst in the app, and the repo's existing contract-test pattern enforces it with no new tooling.**

### 1.5 Where non-UI strings go

The 194 strings split into four classes with four different homes:

| Class | Repo examples | Destination |
| --- | --- | --- |
| UI copy | `'Change athan'`, `'Set your preferences'`, help text | Catalog, structured keys |
| Domain identifiers | `PRAYERS_ENGLISH`, `NIGHT_PRAYER_NAMES`, `MIDNIGHT_CROSSING_PRAYERS` | Stays as English constants, renamed to make the role obvious (`*_IDS`) |
| Log messages | `'Skipping prayer not on this day's list:'` (stores/notifications.ts:840) | Stays English. Logs are developer-facing; Pino output is grepped by humans debugging. |
| Error messages shown to users | `api/client.ts` throws `'Incomplete data received'` (api/client.ts:42, 80, 108) | Split: throw a typed error code, map the code to a catalog key at the display boundary. |

The api/client.ts case deserves the boundary treatment rather than a `t()` call inside the fetcher. The fetcher is a pure data layer under `shared/`, it runs headless in the background task, and calling `t()` there couples data code to the i18n module's load state. A thrown code (`API_ERROR.INCOMPLETE`) with the sheet resolving `t(\`api.error.incomplete\`)` keeps the layer pure and matches the identifier/label split.

`shared/time.ts` is a different case again: `formatDateLong` renders `'EEE, d MMM yyyy'` through `date-fns` with an `en-US`-ish default, and the Hijri formatter pins `'en-US-u-ca-islamic-umalqura'` (shared/time.ts:232, 243). Date formatting is locale data, not copy. The fix is passing the active locale into the existing `Intl.DateTimeFormat` call sites, which Hermes supports natively on Android since RN 0.65 at 57-62 KB per API (https://reactnative.dev/blog/2021/08/17/version-065). The repo already relies on `Intl` heavily (7 non-test usages in `shared/`), so no polyfill question arises for the floor device.

---

## 2. Migration mechanics: 194 literals, safely

### 2.1 Extraction and replacement tooling

| Tool | Extracts | Replaces source | JSX text | Template literals | `.ts` constants | Object literals | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `i18next-cli` 1.74.2 | Yes, SWC parser, scope-aware (`keyPrefix`, `getFixedT`, aliased `t`) | No for `extract`. `localize` command wraps hardcoded strings in `t()` calls as a one-command path | Yes, including `<Trans>` children | Yes | Yes (`.ts` in default input) | Only inside recognised `t` scopes | https://www.npmjs.com/package/i18next-cli; https://www.locize.com/blog/i18next-cli |
| `i18next-parser` | Yes | Never | Partial | Partial | Yes | Partial | Archived 2026-02-22 |
| `babel-plugin-i18next-extract` 1.1.0 | Yes, at build time | Never | Yes | Yes | Yes | Partial | registry.npmjs.com/package/babel-plugin-i18next-extract |
| `@lingui/cli extract` | Yes, into `.po`, marks obsolete and missing | Never; with macros the source IS the extraction unit | Yes via `<Trans>` | Yes via `` t`...` `` | Yes via descriptor calls | Partial | https://lingui.dev/tutorials/react-native |
| `BartoszJarocki/jscodeshift-react-i18next` | Yes | Yes, full codemod | Yes | Yes, converts `${var}` to options | Where reachable from JSX files | Partial | https://github.com/BartoszJarocki/jscodeshift-react-i18next |
| `ts-morph` custom codemod | Whatever you write | Whatever you write | Full control | Full control | Full control | Full control | ts-morph docs |
| LLM-assisted | Varies | Varies; `i18next-cli localize --print-agent-prompt` emits a copy-paste agent runbook for exactly this flow | Yes | Yes | Yes | Yes | https://www.npmjs.com/package/i18next-cli |

The decisive distinction is extract versus replace. Only the jscodeshift codemod, the `i18next-cli localize` command, and a hand-written `ts-morph` transform rewrite the literal at its call site. Everything else leaves `'Change athan'` in the source and expects the macro or an explicit `t()` to appear first.

For this repo the practical answer is small: 194 literals across 43 files is two to three sessions of hand migration with the extraction tool running as a checklist, not a codemod target. The jscodeshift transform generates slug keys (`testComponent.welcome-to-our-platform`) that conflict with any hand-chosen convention, and no automated tool can decide the identifier/label split from section 1.4, which is most of the intellectual work here.

### 2.2 The guard against new hardcoded strings

This repo uses Biome 2.5 with `--error-on-warnings` in pre-commit. No ESLint.

| Existing option | What it catches | Gap |
| --- | --- | --- |
| Biome `style/noJsxLiterals` (since v2.2.4) | String literals as JSX children. With `noStrings: true` also literals inside JSX expressions and attributes. `allowedStrings` permits punctuation. | Nothing outside JSX: `.ts` files, template literals, array entries like the `AlertType` labels | https://biomejs.dev/linter/rules/no-jsx-literals/javascript/ |
| Biome GritQL plugins (stable in 2.5) | Arbitrary structural patterns with `register_diagnostic`, restricted by `includes` globs, suppressible per line | Diagnostic-only: no config parameters, no autofix discipline beyond `fix_kind` | https://biomejs.dev/linter/plugins/; https://biomejs.dev/blog/biome-v2-5/ |
| `eslint-plugin-i18next` `no-literal-string` 6.1.5 | The general rule: any literal with a space, or a capitalised word, anywhere | ESLint. This repo has none and adding it for one rule is a new toolchain | https://www.npmjs.com/package/eslint-plugin-i18next |
| `@calm/eslint-plugin-react-intl` 1.4.1 | `no-literal-strings` for react-intl projects | Same ESLint problem, format-specific | registry.npmjs.org/package/@calm/eslint-plugin-react-intl |

Biome has no `no-literal-string` equivalent today; `noJsxLiterals` is explicitly scoped to JSX and cites `react/jsx-no-literals` as its source, not the i18next rule. A GritQL plugin can express "JSX text that is not a `t()` call" but cannot express "any string literal containing a space in any `.ts` file" with acceptable false-positive control, because GritQL patterns have no word-list configuration (the plugin API exposes only `register_diagnostic` with `span`, `message`, `severity`, `fix_kind`).

The cheapest complete guard for a repo with no ESLint is a Jest test, because Jest already runs in pre-commit and the repo already tests source contracts this way. Concrete design:

```typescript
// shared/__tests__/noHardcodedStrings.test.ts
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = ['app', 'components', 'hooks', 'stores'];
const SKIP_DIRS = ['__tests__', '__mocks__'];
// Files whose literals are identifiers, logs or fixture data, not copy
const ALLOWED = new Set(['shared/logger.ts', 'shared/constants.ts', 'api/client.ts']);

const USER_FACING = /'[A-Z][a-z]+[^']*'|"[A-Z][a-z]+[^"]*"/;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return SKIP_DIRS.includes(entry) ? [] : walk(path);
    }
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });

test('no user-facing string literals outside the catalog boundary', () => {
  const offenders: string[] = [];
  for (const file of walk('src-root')) {
    if (ALLOWED.has(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!/^\s*\/\//.test(line) && !/logger\.(info|warn|error)/.test(line) && USER_FACING.test(line)) {
        offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  expect(offenders).toEqual([]);
});
```

Refinements this repo needs: skip `t('...')` calls themselves (the key is a literal by design), skip `logger.*` lines, and keep the allowlist explicit and short so it is reviewed. The regex approach is honest about being heuristic; the alternative is walking the AST with `ts-morph` in the same test for zero false positives at the cost of a dev dependency. Given 43 files, start with the regex and migrate to `ts-morph` only if it fires wrongly more than once.

Layer it with Biome for fast feedback in the editor:

```json
{
  "linter": {
    "rules": {
      "style": {
        "noJsxLiterals": { "level": "error", "options": { "noStrings": true, "allowedStrings": ["·", "-", " ", ":", "%"] } }
      }
    }
  }
}
```

Note `allowedStrings` needs the separator characters this UI renders inline. Enabling `noStrings: true` also flags attribute literals such as `label='Settings'`, which is the majority of this repo's surface, so the rule earns its place here more than in most codebases.

`i18next-cli lint` exists and reports hardcoded strings "with smart heuristics to reduce false positives" (https://www.npmjs.com/package/i18next-cli). It is a periodic sweep, not a pre-commit gate: it adds a dependency and duplicates what the Jest test already enforces inside the existing hook.

### 2.3 Migration order

No public write-up documents a React Native i18n migration of this shape. The nearest published migrations are architecture migrations, and their consistent lesson is incremental shipping: Shopify's New Architecture migration kept every intermediate state shippable and measured each step (https://shopify.engineering/react-native-new-architecture). The Bluesky localisation docs show the steady state rather than the migration: nightly extraction, release-day pull (https://github.com/bluesky-social/social-app/blob/main/docs/localization.md).

For this repo the order follows dependency, not string count:

1. **Identifier split** (section 1.4). One branch, `PRAYERS_ENGLISH` stays, display call sites gain a label resolver. Nothing user-visible changes. This unblocks everything.
2. **Scaffold**: `shared/i18n/` module, locale atom in `stores/ui.ts` persisted to MMKV as `preference_locale`, catalog with the `translation` namespace, `i18next.d.ts`, the Jest setups from section 5. Migrate one screen: the Settings sheet, 11 strings, proves the pattern end to end including tests and the guard.
3. **Data-layer copy**: `shared/help.ts` (27 strings, pure data), `shared/whatsNew.ts` (13), `EXTRAS_EXPLANATIONS` (9), `api/client.ts` error codes. These are the strings that prove the identifier/label boundary because they live in `.ts` files.
4. **Component copy**: `Alert.tsx` (10), remaining sheets, modals, overlays.
5. **Runtime surfaces**: notification content (section 4.2), channel names (4.3), widget props (4.1). These consume already-resolved labels, so they are edits at the consumption point.
6. **Locale data**: `shared/time.ts` date formatters take the locale argument.
7. **OS surfaces**: `app.json` `locales` and the `expo-localization` plugin (section 4.4).

Each step is a branch, a commit, a version bump, and a green suite, per the repo's standing discipline. The total is roughly 12 to 18 commits. The app ships English at every intermediate point because the catalog's fallback locale is `en` and unmigrated call sites still hold their literals; the guard test's allowlist shrinks one file per commit, which is the reviewable form of progress.

---

## 3. Performance on a Snapdragon 820

### 3.1 Catalog load cost at startup

No public measurement exists for i18next or Lingui catalog load time on Snapdragon 820-class hardware with Hermes. Neither library publishes device-tier benchmarks; the comparison articles that do publish numbers give bundle sizes, not load times: react-i18next around 6 KB, Lingui around 2 KB compiled (https://dev.to/erayg/best-i18n-libraries-for-nextjs-react-react-native-in-2026-honest-comparison-3m8f). The honest statement is that this must be measured in-repo.

The repo owns the instrument for it. The cold-launch anatomy from ISSUES #32 attributes 6.6 s to first frame on the 3T, of which roughly 1.9 s is JS module evaluation and React mount. The experiment:

1. Build gate-ON Release per `e2e/README.md` (`EXPO_PUBLIC_PERF_MONITOR=1`, Metro cache cleared).
2. Add a perf mark pair around the i18n bootstrap in `stores/bootstrap.ts`: one before `i18n.init`, one after the first catalog require resolves.
3. Run `e2e/scripts/baseline-compare.sh` on the smoke flow with the catalog present, then with the catalog stubbed to an empty object, and diff the medians against `e2e/baselines/android-3t.json`.
4. Repeat with all 20 locales bundled versus one.

Expected shape, from the arithmetic rather than a citation: 200 strings of one locale is on the order of 10 to 15 KB of message text, which sits beside the widget timeline measurements this repo already took (23 entries at 9,771 bytes over 3 days, stores/widget.ts figures in ai/AGENTS.md). Evaluating a 15 KB module on the SD820 costs single-digit milliseconds; the risk is not one locale, it is accidentally evaluating twenty.

### 3.2 JSON parse cost, and the Hermes correction

The brief asks about "a known Hermes optimisation where `JSON.parse` of a string literal beats an object literal". That optimisation is a V8 result, and it does not transfer to Hermes. The primary source is the Hermes tech lead, in the issue that opened this exact question:

> "In Hermes it will always be faster to load it as a .js file instead of parsing it as runtime as JSON. However Hermes has a long-standing bug, where large literals, depending on their composition, may take extremely long time to compile, or may in fact never complete the compilation successfully... So, in practice, for now, it is safer to use `JSON.parse()`, unless you have already tried to compile the large array/literal and seen that it compiles successfully and runs in debug mode."

Tzvetan Mikov, facebook/hermes#1046, 2023-07-04 (https://github.com/facebook/hermes/issues/1046).

The full picture:

| Claim | Engine | Status | Source |
| --- | --- | --- | --- |
| `JSON.parse` of a string literal beats an object literal | V8 | True, roughly 1.7x for large payloads; the JSON grammar is simpler than JavaScript's | https://stackoverflow.com/questions/59149074/; Chrome Dev Summit 2019 https://www.youtube.com/watch?v=ff4fgQxPaO0 |
| Same claim | Hermes | False in general: bytecode-precompiled literals load faster than a runtime parse | https://github.com/facebook/hermes/issues/1046 |
| `JSON.parse` as a workaround | Hermes | Safer for very large literals, which can blow up the bytecode compiler | Same issue |
| Hermes `JSON.parse` speed today | Hermes | Improved 2x in 2023 (https://radex.io/react-native/json-parse/) and a further 2.7 to 3.4x landed per the Hermes team in late 2025 (https://x.com/tmikov/status/1993080321626284194) | those sources |
| Hermes on big data generally | Hermes | No JIT; a 4 MB JSON payload took 18 s on Hermes against 2 s on JSC in one report | https://www.reddit.com/r/reactnative/comments/1ah7h36/ |
| The Lingui catalogue request | Lingui | Requested in 2019 to embed catalogues as `JSON.parse` strings; closed without adoption | https://github.com/lingui/js-lingui/issues/601 |

There is no published crossover size for Hermes, because the trade is not primarily size-driven: it is "precompiled bytecode literal against runtime parse", and the bytecode wins until the literal is large enough to trip the compiler bug, which is composition-dependent and undocumented as a number.

For this repo the question is almost moot at 200 strings per locale, and the design that makes it moot at 20 locales too is lazy per-locale modules:

```typescript
// shared/i18n/locales.ts
import type { Locale } from './types';

export const catalogLoaders: Record<Locale, () => Promise<{ default: Catalog }>> = {
  en: () => import('./en'),
  ar: () => import('./ar'),
  // ...
};
```

Metro's `inlineRequires` (which this repo has already audited and tuned, ai/prompts/audit-changes-2.md) then bounds evaluation cost to the active locale plus the fallback regardless of how many ship. Plain TypeScript modules, not `JSON.parse` strings: they load as precompiled Hermes bytecode, they carry `as const` types for section 1.3, and at 10 KB each they are nowhere near the literal-size bug.

### 3.3 Re-render cost of a language switch

How propagation works:

| Library | Mechanism on locale change | Known cost | Source |
| --- | --- | --- | --- |
| react-i18next | Each `useTranslation` subscriber fires `setState`; `useSuspense` defaults true and suspends while loading | 2018: nested HOCs re-rendered quadratically, 5 components produced 50 post-load renders, "2+ seconds" reported on a large app; mitigations `bindI18n: 'languageChanged'`, `bindStore: false` | https://github.com/i18next/react-i18next/issues/456 |
| react-i18next, recent | `t` identity churn caused LobeChat input lag in 2024; pinned to 14.0.2 pending fix | Same class of issue at hook level | https://github.com/i18next/react-i18next/issues/1756 |
| Lingui | `I18nProvider` swaps its context value when `i18n.activate` runs; all context consumers re-render; `forceRenderOnLocaleChange` exists for non-`Trans` strings | Full-tree re-render by design | https://lingui.dev/tutorials/react-native; https://github.com/lingui/js-lingui/issues/1277 |

Cheapest propagation, from cheapest up:

1. **No mid-session switch** (section 6 makes this the recommendation): `t()` reads a module-level active locale fixed at bootstrap. Zero subscription machinery, zero re-render, and the question dissolves.
2. **External store subscription** (a Jotai `localeAtom`): subscribers are render-granular per the repo's own rule 5, so a change re-renders only components reading locale-derived atoms. This is the repo-native pattern if a switcher ever lands.
3. **Context change**: every consumer re-renders; React batches, but the batch is the whole tree.
4. **Key-on-locale remount**: re-runs mount effects, re-measures, and resets animation state. Strictly worse than 2 and 3.

Interaction with Reanimated: shared values survive re-renders untouched, and `useSharedValue` docs note that changing `.value` updates styles without a React re-render (https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/). The danger is a remount, not a re-render: a keyed remount recreates every shared value at its initial value, so any derived value that snaps on first evaluation re-snaps, and an in-flight animation restarts from the snap. A locale change that remounts the prayer list would tear the cascade. Context or store subscription avoids that; remount does not.

### 3.4 Keeping translation out of the animation path

The repo's rule 2 (animated geometry static-in-render or first-eval-snapped) collides with localised text in one specific place: the prayer-row English column. `components/prayer/Prayer.tsx:66` sets `width: Prayer.ui.maxEnglishWidth + padding`, and the width comes from `prayer_max_english_width_*` in MMKV, a grow-only, write-once-forever cache (stores/ui.ts:195-219) that exists because a first-launch measurement can precede font registration (ISSUES #22).

Locale changes text width. "Magrib" and "المغرب" and "Maghrib" measure differently. The options:

| Option | Behaviour | Verdict against repo rules |
| --- | --- | --- |
| Keep one global max across locales seen | Column widens when a wider locale first renders, never narrows | Preserves rule 2 and rule 3 (no post-paint init, first frame settled). Costs a wider column for narrow-script locales. The grow-only design already tolerates this: it self-heals upward by construction |
| Per-locale width keys (`..._standard_ar`) | Correct per-locale geometry | Requires a reset-and-remeasure on locale change, which is a visible reflow at launch and a new key family in the `clearAllExcept` whitelist (a known trap, ai/AGENTS.md performance campaign notes) |
| Precompute max across all bundled locales | One-time cost, stable forever | Needs every locale's names measured or estimated before first render; the font-registration race that motivated grow-only still applies |

**Finding: keep the single grow-only max.** The mechanism already handles "a wider measurement arrived late" (that is its whole design), a locale change is another late wider measurement, and the alternatives violate settled rules the owner has already adjudicated. Note it as an accepted cost: a user whose locale renders narrower than English keeps the English-width column.

The wider rule for keeping strings out of the animation path: text content flows through props and derived atoms, never through a worklet. Worklets hold geometry and colours only. `t()` inside a `useAnimatedStyle` or a worklet function would capture the string at worklet-creation time and cannot re-run on a locale change without re-creating the worklet, which is the same remount hazard as above. This repo's existing structure already complies; state it as an invariant so it stays true.

---

## 4. The two hostile runtimes

### 4.1 Widget runtime

The constraints, as this repo has measured them: the `'widget'` directive serialises only the function body into a string evaluated in a separate JS runtime whose React is a five-name stub; module-scope references blank every card and have broken the app once; helpers must live inside the function body; props are JSON-only and every entry carries a schema version (ai/AGENTS.md widget invariants).

Therefore translated text reaches a widget exactly one way: **the app resolves every string and bakes it into the timeline or snapshot props.** The layout function keeps rendering whatever strings arrive. The widget runtime has no i18n module, no catalog, and no way to load one; a module-scope `t()` call is the known-blank-card failure mode in a new disguise.

What that costs, against this repo's measured budgets:

| Surface | Today | After localisation | Delta |
| --- | --- | --- | --- |
| iOS timeline payload | 3-day horizon: 23 entries, 9,771 bytes (measured, ai/AGENTS.md horizon entry) | Same entry count; `name` fields carry localised labels; footer strings (`'Athan'`, `'Prayer times for London'`, `'Out of date'`, `'Open Athan'` at widgets/PrayerWidget.tsx:316-334) move from layout literals into per-entry or per-timeline props | Roughly 60 to 150 bytes per entry for longer labels: about 2 to 4 KB across the timeline, against a 200 KB payload guard and a 30 MB archive ceiling |
| Entry count | One entry per boundary, by design | Unchanged. Localisation adds bytes, not entries | Zero |
| Android snapshot | One snapshot per push, layout computes at render from a carried window | Labels sit in the snapshot JSON once, not per entry | Negligible |

The entry-count budget is the binding constraint on iOS (roughly 380 entries blacked out every non-trivial kind, masked as a `containerBackground` message; ai/AGENTS.md session 16a). String fields cost bytes, and bytes are two orders of magnitude from the ceiling at the current horizon, so the bake-it-into-props answer is not close to constrained. The alternative, passing keys and resolving in the layout, is not available: the runtime cannot reach a catalog.

One refinement keeps the payload flat: prayer names are already a per-row `name` prop (shared/widgetTypes.ts:49, 128), and static chrome strings like the footer never change per entry, so they belong in a single per-timeline field rather than repeated per entry. The timeline builder already distinguishes per-entry from per-timeline data.

**Should a widget read the system locale independently?** It should not, and for this app it also should not need to. Published evidence on the disagreement problem: iOS widgets follow the system language rather than the app's chosen language, and developers work around it by forcing layout direction from app-written state (https://stackoverflow.com/questions/64175497/localize-ios-14-dynamic-widget-configuration; https://www.reddit.com/r/SwiftUI/comments/j52323/localizing_widgets/); Apple's own guidance treats widget-configuration localisation as honouring the system language (https://developer.apple.com/forums/thread/772209). A widget whose language disagrees with the app is a defect. Since this plan has the app follow the system locale too (section 6), app-resolved props and system-resolved chrome agree by construction, and the only residual risk is a stale widget after a language change until the next timeline push, which the existing reload-after-change path covers.

### 4.2 Notification copy

Up to 64 pending requests are armed in advance, each with its title fixed at schedule time (`genNotificationContent` builds `` `${englishName} now` ``, shared/notifications.ts:130; reminders `` `${englishName} in ${intervalMinutes}m` ``, line 181).

**Can a local notification localise its text at delivery time?**

| Platform | Mechanism | Reachable through `expo-notifications` | Requirement |
| --- | --- | --- | --- |
| iOS | `NSString.localizedUserNotificationStringForKey:arguments:` | **No.** The SDK 58 `NotificationContentInput` exposes `title`, `subtitle`, `body` as plain strings (verified against the published 58.0.7 types, unpkg.com/expo-notifications@58.0.7/build/Notifications.types.d.ts). `titleLocalizationKey` and `bodyLocalizationKey` appear in the SDK's types only on `FirebaseRemoteMessageNotification`, a read-side representation of incoming FCM pushes, never on the scheduling input | `Localizable.strings` in the app bundle, plus native code or a config-plugin-level patch to call the API |
| iOS, behaviour if used | Apple documents the payoff precisely: "The `localizedUserNotificationStringForKey:arguments:` method delays the loading of the localized string until the system delivers the notification. If the user changes the language setting before the system delivers a notification, the system updates the alert text to the user's current language instead of the language in use when the system scheduled the notification." | https://developer.apple.com/documentation/usernotifications/unmutablenotificationcontent | |
| Android | A notification's text can reference a string resource, and resources resolve in the app's locale | **Effectively no for scheduled local notifications.** expo-notifications builds the notification at schedule time and stores the serialised content, posting it later; the text is resolved once, when the JS ran, not at post time. There is no `loc-key` equivalent for local notifications in the SDK | Android's per-app language API (13+) is the system-side answer (https://developer.android.com/guide/topics/resources/app-languages) |

So the finding is: **iOS has a delivery-time localisation path designed for exactly this, and it is not reachable from this stack without native work plus bundle strings files duplicating the JS catalog. Android has no delivery-time path for scheduled local notifications at all.** A dual-source-of-truth catalog (JS plus `Localizable.strings`) for one platform only, reachable only through a patch, fails this repo's consistency bar.

**The re-arm path, which is what this repo needs:**

Cancelling and re-arming 64 requests is cheap in API terms: `removeAllPendingNotificationRequests` exists on both platforms (https://docs.expo.dev/versions/latest/sdk/notifications/), and iOS exposes `removeAllPendingNotificationRequests()` at the OS level (https://developer.apple.com/documentation/usernotifications/unusernotificationcenter/removeallpendingnotificationrequests()). It is not atomic: there is no transaction spanning cancel plus re-add. The failure surface:

- A crash or suspension between cancel and re-add leaves the phone silent. For this app silence is the worst outcome (the app's whole purpose is the athan firing).
- Partial re-arm leaves mixed-language notifications, which is cosmetic, but the same partial state can leave fewer armed rows, which is not.

The repo already holds the answer and should not abandon it: **deterministic identifiers plus in-place replace.** `prayerNotificationIdentifier` and `reminderNotificationIdentifier` (device/notifications.ts:55, 68) produce the same id for the same logical row, and both iOS (`UNUserNotificationCenter` replaces by identifier) and Android (PendingIntent derived from the identifier) treat re-scheduling the same id as an idempotent replace, as the repo's own comment records. So the correct re-arm is not cancel-then-add at all: it is schedule-over, under the existing `withSchedulingLock`, which never passes through a zero-armed state. The stale-language notifications that a plain overwrite would miss are exactly what the existing stale-detection sweep already cancels (shared/notifications.ts, the function that reconciles OS-pending against database records).

**When does a language change trigger the re-arm?** With system-locale-only (section 6), the OS restarts the process on the change: iOS terminates the app on a language change (https://developer.apple.com/forums/thread/734483) and Android delivers a config change that recreates the activity. The next launch must re-arm in the new language immediately rather than waiting on the 2-hour refresh gate, and the repo has the exact scar tissue for this class of bug: ISSUES #36's lesson is that "a stamp is not evidence", and a gate that trusts a recent timestamp skips the work. The fix is one line of shape: include the locale that armed the current set in the scheduling stamp (`preference_last_notification_schedule_check` gains a locale dimension), and treat a mismatch as a forced reschedule. That converts the whole notification-localisation problem into a launch-time check on an existing path.

### 4.3 Android notification channel names

The repo knows sound, importance and audio attributes freeze at creation, which forced the `_v4` channel generation (ai/AGENTS.md 2026-08-31 and 2026-09-26 lessons). The other half of the rule is the useful half here:

> "After you create a notification channel, you can't change the notification behaviors. The user has complete control at that point. However, you can still change a channel's name and description."

https://developer.android.com/develop/ui/views/notifications/channels

And on idempotence: "Recreating an existing notification channel with its original values performs no operation, so it's safe to call this code when starting an app." Microsoft's API docs state the intent outright: "The name and description should only be changed if the locale changes or in response to the user renaming this channel" (https://learn.microsoft.com/en-us/dotnet/api/android.app.notificationmanager.createnotificationchannel?view=net-android-35). The official recommendation behind that is to re-create channels on `ACTION_LOCALE_CHANGED` (https://stackoverflow.com/questions/46317545/android-o-notification-channel-localization; https://github.com/thunderbird/thunderbird-android/issues/3720).

So: **a language change can rename existing channels.** Calling `setNotificationChannelAsync` with the same channel id and a new name updates the user-visible name and description while leaving importance, sound and behaviour frozen, which is precisely the desired split. Channel ids stay English forever: `athan_1_v4`, the extras id, and the reminder ids built from `prayerNameSlug` are domain identifiers under the section 1.4 rule, and keeping them stable means localising names needs no channel-id migration, unlike the sound freeze which forced `_v4`.

Two implementation notes from the repo's own code:

- The session-scoped dedup (`createdReminderChannels`, `createdAthanChannels`, `extrasChannelCreated`, shared/notifications.ts:429-446) skips repeat `setNotificationChannelAsync` calls. A locale change mid-process would need those caches invalidated, but under system-locale-only the process restarts on the change, so the caches start empty and init re-creates every channel with the new name on the next launch. Zero new code, provided the configs' `name` fields read from the label resolver.
- The reminder channel names embed the format string (`` `${englishName} in ${intervalMinutes}m Reminder` ``, shared/notifications.ts:502). That becomes a catalog key with two interpolations, and section 5's placeholder test covers it.

If a channel name could not be renamed, the fallback would be a new channel id per locale, which orphans every user's per-channel OS settings on language change. It can, so that cost is avoided.

### 4.4 Other OS-level surfaces

These strings live in `Info.plist` and `strings.xml`, not JS. In a CNG project, three mechanisms cover them:

| Surface | Mechanism | Notes |
| --- | --- | --- |
| Permission usage descriptions (`NSUserNotificationsUsageDescription`, present in app.json:24) | `expo.locales` in app.json writes `InfoPlist.strings` per locale on iOS and `values-b+<locale>/strings.xml` on Android | Schema: nested `ios`/`android` keys mapping locale to key-value pairs (https://docs.expo.dev/versions/latest/config/app/#locales) |
| Advertising supported locales, enabling per-app language in system settings | `expo-localization` config plugin `supportedLocales` | Writes iOS per-app language support and the Android 13+ locale list (https://docs.expo.dev/guides/localization/) |
| App display name | `CFBundleDisplayName` localises through `InfoPlist.strings`; Android through `app_name` in `strings.xml` | Same `locales` map |
| `CFBundleLocalizations` | Declares the locales the bundle carries; prebuild writes it from the locales config | Required for iOS to offer the app in per-app language settings |

The Android gotcha is documented in an Expo issue: keys written to `values-b+en/strings.xml` and friends must also exist in the default locale, or `lintVitalRelease` fails `ExtraTranslation` and the build dies at the end of Gradle (https://github.com/expo/expo/issues/38860). The safe shape is to define every permission string in the default `values/` set and only then add translations.

On the Expo docs' own recommendation: "On newer Android and iOS versions, app language can be set per app, so you usually don't need to build a custom UI to allow users to change the current locale inside of your app" (https://docs.expo.dev/guides/localization/). That is the documented cheap path and it matches the verdict in section 6.

**Should this app localise its own name? No.** The owner may rename the app (owner rule recorded in shared/help.ts: "The app is never named, because it may be renamed"), user-facing copy never names it, and "Athan" is already a transliterated Arabic word that reads correctly in every plausible target locale. Localising the display name would add a translated string whose only consumer is the home screen, contradict the rename contingency, and buy nothing for users. Localise the permission descriptions (they appear in OS dialogs users must act on) and leave `CFBundleDisplayName` and `app_name` alone.

Siri/Assistant and share-sheet surfaces: this app registers no Siri shortcut donor and its share sheet usage is system-chrome driven, so nothing localises there beyond the entries above.

---

## 5. Testing at 100% coverage

### 5.1 Established Jest patterns for a `t()`-based codebase

Three patterns are documented, in descending order of isolation:

| Pattern | Shape | Source |
| --- | --- | --- |
| Mock returning the key | `__mocks__/react-i18next.js` exporting `useTranslation: () => [{ t: (k) => k, ... }]`, `Trans: ({ children, i18nKey }) => children ?? i18nKey` | https://react.i18next.com/misc/testing |
| Real library in a setup file | Init i18next with test resources, wrap renders in the provider, assert real output | Same page, "Testing without stubbing" |
| Custom render with a provider | `renderWithLocale(ui, { locale })` helper wrapping `IntlProvider`/`I18nextProvider` | https://testing-library.com/docs/example-react-intl/ |

i18next also exports `keyFromSelector` specifically for building a mock `t` that accepts the selector API (https://www.i18next.com/overview/typescript, "Mocking the selector function").

Lingui's equivalent is `i18n.load(messages)` then `i18n.activate(locale)` (https://phrase.com/blog/posts/localizing-javascript-react-apps-with-linguijs/; https://lingui.dev/tutorials/react-native).

### 5.2 Avoiding English assertions that break on copy changes

The react-intl testing guide names the problem exactly: "Strings hardcoded into tests mean you have to update both tests and code for any copy changes" (https://testing-library.com/docs/example-react-intl/). The resolution for this repo:

- Components project: mock `t` to return the key. Assertions read `expect(getByText('settings.sound.changeAthan')).toBeTruthy()`. A copy edit changes neither the key nor the assertion.
- Variables: the mock interpolates minimally, `` t('alerts.reminderIn', { minutes }) => `alerts.reminderIn(${minutes})` ``, so assertions prove the right values reached the right key without embedding English word order.
- A small set of catalog smoke tests renders with the real library and asserts structure (placeholders expanded, no raw `{{` in output), not wording.

This is the structured-key payoff quantified: 4,800 existing tests keep asserting keys that never move.

### 5.3 Catalog completeness, placeholders, plural categories

Concrete test shapes, all pure data and therefore at home in the `unit` project:

```typescript
// completeness: every key in en exists in every other locale
const locales = ['ar', 'fr', /* ... */];
const en = require('@/shared/i18n/locales/en').default;

test.each(locales)('%s covers every English key', (locale) => {
  const catalog = require(`@/shared/i18n/locales/${locale}`).default;
  expect(Object.keys(catalog)).toEqual(Object.keys(en));
});
```

```typescript
// placeholder integrity: every {{var}} in en survives translation
const PLACEHOLDER = /\{\{(\w+)\}\}/g;

test.each(locales)('%s preserves every placeholder', (locale) => {
  const catalog = require(`@/shared/i18n/locales/${locale}`).default;
  for (const [key, source] of Object.entries(en)) {
    const expected = [...String(source).matchAll(PLACEHOLDER)].map((m) => m[1]).sort();
    const actual = [...String(catalog[key]).matchAll(PLACEHOLDER)].map((m) => m[1]).sort();
    expect(actual, key).toEqual(expected);
  }
});
```

```typescript
// plural-category completeness per locale
// CLDR defines six: zero, one, two, few, many, other. Arabic uses all six.
// https://cldr.unicode.org/index/cldr-spec/plural-rules
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules
const REQUIRED_CATEGORIES: Record<string, string[]> = {
  en: ['one', 'other'],
  ar: ['zero', 'one', 'two', 'few', 'many', 'other'],
  // ...one row per supported locale, from CLDR cardinal rules
};

test.each(Object.entries(REQUIRED_CATEGORIES))('%s defines its required plural forms', (locale, required) => {
  for (const [key, source] of Object.entries(en)) {
    if (!/\bcount\b/.test(String(source))) continue;
    for (const category of required) {
      expect(catalogs[locale][`${key}_${category}`], `${locale} ${key} ${category}`).toBeDefined();
    }
  }
});
```

The static per-locale table is deliberate: it pins the CLDR contract in the repo rather than trusting a runtime `Intl.PluralRules.select` probe, which only ever samples one number per call and would need exhaustive sweeps to prove the same thing. Hermes ships `Intl.PluralRules` on Android natively since RN 0.65 (https://reactnative.dev/blog/2021/08/17/version-065); the iOS side needs a verification pass on the floor iOS device before relying on it at runtime, which the table approach makes unnecessary for the test itself.

`i18next-cli status` and `sync` report and repair the same completeness at the CLI level (https://www.npmjs.com/package/i18next-cli), which is the maintainer's tool; the Jest test is the gate.

### 5.4 Pseudolocale as the no-hardcoded-strings proof

Pseudolocalisation transforms source text into accented, lengthened variants precisely to expose unlocalised strings and concatenation (https://lingui.dev/guides/pseudolocalization; Microsoft's methodology note at https://learn.microsoft.com/en-us/globalization/methodology/pseudolocalization). Lingui builds it in: a `pseudoLocale` config entry generates the pseudo catalogue during `compile`, with a `rightToLeft` variant for direction testing.

Practicality with React Native Testing Library: yes, workable, with limits. The shape:

1. Generate a pseudo catalog: every value mapped `a` to `à`, `e` to `ē`, wrapped in brackets for length. A 20-line script over the compiled `en` catalog; no library needed.
2. In the components project, a setup variant registers it: `i18n.init({ resources: { pseudo: { translation: pseudoCatalog } }, lng: 'pseudo' })`.
3. Render each sheet and screen through RNTL and assert no Latin-ASCII run of three or more letters survives outside a known-token allowlist (prayer ids, `HH:mm` patterns, brand-free numerics).

The limits: RNTL renders the JS tree, so this proves the JS surface only; OS surfaces (section 4.4) are outside it, and native sheets show nothing. It also cannot prove text fits, because RNTL does no real layout; detecting clipped Arabic labels stays a device-eye task for the owner. Within those limits it is the strongest automated no-hardcoded-strings proof available, and it composes with the section 2.2 grep guard (the guard stops new literals; pseudo proves the rendered output).

### 5.5 Which setup belongs in which Jest project

The repo runs two projects (jest.config.js): `unit` (`*.test.ts`, node environment, hand-written RN mock) and `components` (`*.test.tsx`, real React Native through RNTL 14).

| Addition | Project | Reason |
| --- | --- | --- |
| Catalog completeness, placeholder integrity, plural categories | `unit` | Pure data over catalog modules; no React, no RN |
| `keyFromSelector`-style mock shape | `unit` | Mock contract is data |
| `t` returning the key, via `jest.components.setup.js` or a `__mocks__` file | `components` | Components render through the hook; the mock must be in the project that mounts them |
| Real-library catalog smoke test | `components` | Needs render |
| Pseudolocale render sweep | `components` | Needs render |
| Hardcoded-string source scan (section 2.2) | `unit` | Reads files, runs fast, no RN |
| i18n bootstrap module tests | `unit` | `stores/bootstrap.ts` is already unit-tested |

The repo's existing lesson applies directly: `jest.setup.js` is shared by both projects as a `setupFiles` entry, and env mutations there leak across test files in a worker (the comment atop jest.setup.js). Any i18n initialisation in the shared setup must be idempotent, or live in the project-specific files.

---

## 6. Verdict

### The plan

**Locale ownership: the OS owns the locale.** No in-app language picker. The app reads the system locale once at bootstrap through `expo-localization` (`getLocales()`), persists nothing about it except where a stamp needs the locale dimension, and declares its supported locales through the `expo-localization` config plugin so iOS and Android 13+ offer per-app language in system settings. The Expo docs recommend exactly this (https://docs.expo.dev/guides/localization/). Every hard runtime problem then becomes a launch-time problem: no mid-session re-render storm, no notification re-arm mid-session, no widget push on language change, no channel cache invalidation, no RTL restart hack. The OS restarts the app on a language change (iOS terminates it; Android recreates the activity), and launch-time init already runs every path that needs the new language.

**Library: `i18next` + `react-i18next`.** Structured keys, single `translation` namespace, catalogs as TypeScript modules with `as const` for compile-time key and interpolation checking, `strictKeyChecks` and the selector API enabled per section 1.3. Justification over Lingui: the strongest documented compile-time typing (which a repo with `tsc` in pre-commit and 100% coverage culture will feel daily), no Babel macro anywhere near the delicate widget transform chain, JSON-free typed catalogs, and `i18next-cli` as the successor toolchain for extraction sweeps. Lingui remains the documented fallback if the owner prefers `.po` files and a translator workflow through Crowdin; Bluesky proves that path works at larger scale (https://github.com/bluesky-social/social-app/blob/main/docs/localization.md).

**Keys: structured, `domain.surface.purpose`**, decided once in a single sitting so the vocabulary is uniform: `prayer.fajr`, `settings.sound.changeAthan`, `alerts.type.off`, `help.notificationsNone.question`. The `AlertType` collision resolves as `alerts.type.off` versus `settings.toggle.off` if the second ever exists.

**Domain identifiers: split first.** `Prayer.english` stays English forever, renamed toward `Prayer.id` in the type while the wire values stay stable (so MMKV keys and notification identifiers never change). Labels resolve through `prayerLabel(id)`. A contract test pins the disjointness.

**Guard: Biome `noJsxLiterals` with `noStrings` for editor-time feedback, plus the Jest source-scan test in pre-commit for full coverage.** No ESLint, no new hook.

**Migration order:** identifier split, scaffold plus Settings sheet, data-layer copy (`help.ts`, `whatsNew.ts`, explanations, api error codes), component copy, notification and channel consumption points, widget props, date formatter locale arguments, OS surfaces. One branch and one commit each, allowlist shrinking as files migrate.

**Widget: app-resolved strings as props.** Footer chrome strings become per-timeline fields; prayer labels ride the existing `name` fields. Entry count unchanged; payload delta measured against the existing 200 KB guard.

**Notifications: schedule-over, never cancel-then-add.** Deterministic identifiers already give idempotent replace on both platforms under `withSchedulingLock`. The scheduling stamp gains the arming locale so a locale mismatch forces reschedule at next launch. Channel names localise through same-id `createNotificationChannel` calls, which Android supports for name and description while behaviour stays frozen; the process restart on locale change makes the existing init path re-create them with new names for free.

**Tests:** key-returning mock in the components project; completeness, placeholder and plural-category suites in the unit project; pseudolocale render sweep in components; source-scan guard in unit.

### The strongest argument against this plan

The commit count. Twelve to eighteen small commits for a feature users experience as "the app is in my language now" is a lot of process for the payload, and the repo's per-commit version bump, full-suite pre-commit and no-fast-forward merges multiply the ceremony. A counter-plan exists: one codemod run, one branch, one review, done in a day. The reason it still loses here is that this codebase's own history shows the expensive defects live exactly where big diffs hide them: the 2026-09-27 lesson (a defect whose break script printed `SURVIVED` because two guards overlapped) and the 2026-09-26 lesson (a blind regex edit silently corrupting 45 files) are both arguments against bulk transforms in this repo. The small-steps plan is slower and survives its own audit.

A second argument worth naming: choosing i18next over Lingui trades away `.po` files and the built-in pseudolocale, both of which a real translator workflow will want if the 20+ languages arrive from humans rather than machine translation. The mitigation is that both are addable later: a `.po` export can be generated from the typed catalogs, and section 5.4's pseudo script is 20 lines.

### The three most expensive decisions to reverse

1. **Natural keys versus structured keys.** Every call site, every catalog entry and every test assertion encodes the choice. The published rewrite of roughly 500 keys took a team and a dedicated project (https://jdudzik.medium.com/rewriting-every-i18n-key-in-a-large-frontend-codebase-8fcf01dbcea); at 194 strings across 43 files with 4,800 tests asserting rendered text, reversing this after migration touches every file this programme touches. Decide it in the scaffold commit.

2. **Identifier versus label in `Prayer.english`.** Retrofitting the split after catalogs exist means a data migration of every stored preference (`preference_alert_*`, the width caches), every armed notification identifier and every `indexOf` ordering site, on devices with no migration runner beyond `handleAppUpgrade`'s cache-wipe path. Doing it before the catalog exists costs one afternoon and zero migrations. Doing it after costs a version-2 of the storage schema.

3. **System-locale-only versus an in-app picker.** The picker commits the app to live locale switching: whole-tree re-render or store-subscription plumbing, notification re-arm from a running process, widget timeline pushes on language change, Android channel-cache invalidation, and RTL direction changes that React Native only applies after a restart (https://reactnative.dev/docs/i18nmanager; https://stackoverflow.com/questions/57677668/layout-is-displayed-in-wrong-direction-in-react-native-using-expo). Adding a picker later is additive work on top of the system path; removing one after users depend on it is a feature removal. Staying system-only is reversible in the cheap direction, which is the definition of a decision worth taking deliberately now.
