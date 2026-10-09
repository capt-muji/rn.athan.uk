# 02. The string catalog

The full English key list is `02a-catalog-keys.md`. This document specifies the system around
it: files, types, the formatter, the gates and how a translation is produced. Evidence:
`evidence/ui-strings.md`, `evidence/test-infra.md` sections 1 and 3. Citations are `path:line`
at base commit `c3149dfc`.

## Requirements this answers

- Every user-visible string in the selected language, with digits kept Latin.
- Adding a locale is data work.
- Six locales first, up to fifty later, and one maintainer with no translators.
- Fully offline. No catalog is ever fetched.
- The widget process cannot import the catalog (document 04, section 4), so the catalog must be
  usable as plain strings handed across a JSON boundary.
- The repository's gates: `tsc`, Biome, a global 100 percent coverage threshold over `shared/`,
  and a guard that fails on any export no production file reaches
  (`evidence/test-infra.md` sections 1.1 and 1.5).

## Decision

One TypeScript file per locale, each a single object literal, all imported statically. The
English file is the source of truth and its literal types are the schema. There is no i18n
library, no ICU message syntax, no plural engine and no runtime loading.

Why TypeScript files and not JSON: a `.ts` literal marked `as const` gives the compiler the
exact bytes of every English string, so the compiler can check a call site's parameters and a
translation's placeholders. A JSON import types every value as `string` and can check neither.

Why static imports and not a folder scan: the compiler, the coverage gate and the unused-export
guard all work on the module graph. Fifty packs of 230 short strings add roughly 300 KB of
source to the bundle, which Hermes keeps in its string table and maps lazily. Nothing loads at
switch time, so a switch cannot fail for a missing file.

## Files

```
shared/
  i18n.ts                    format, translatorFor, key helpers
  locales/
    index.ts                 the registry
    types.ts                 LocaleMeta, LocalePack, Messages, MessageKey, ParamsOf, Catalog, TranslationOf
    en.ts                    the source pack
    ar.ts hi.ts ms.ts so.ts th.ts
    notes.json               per-key translator notes and length budgets
    lock/ar.json hi.json ms.json so.json th.json
    __tests__/catalogGate.test.ts, catalogTypes.test.ts, i18n tests
scripts/
  catalog-lock.js            writes a lock file from a pack and en.ts
```

Everything sits under `shared/`, which is already collected for coverage and scanned for unused
exports (`jest.config.js:110-124`, `scripts/find-unused-exports.py:25`). A new top-level folder
would fail the changed-files gate as "not measured" (`scripts/check-changed-coverage.js:149-153`).
`scripts/` is on the unmeasured list (`:31-52`).

`notes.json` and the lock files are JSON on purpose. They are read by tests and by the lock
script only. An exported TypeScript constant that only tests read would trip the unused-export
guard (`shared/__tests__/unusedExports.test.ts:4-6`).

## Types

```ts
// shared/locales/types.ts
export interface LocaleMeta {
  /** BCP 47 language code. Equals the file name and the registry key. */
  readonly code: string;
  /** The language's own name in its own script. Shown in the language sheet, never translated. */
  readonly endonym: string;
  /** Unicode script name of the language's letters, for the gate. For example 'Latin', 'Arabic', 'Devanagari', 'Thai'. */
  readonly script: string;
  /** Device language tags this pack accepts. Defaults to [code]. */
  readonly match?: readonly string[];
  /** 'release': selectable in every build. 'preview': selectable outside production builds only. */
  readonly tier: 'release' | 'preview';
}

export interface LocalePack<M> {
  readonly meta: LocaleMeta;
  readonly messages: M;
}

/** The English strings, as literal types */
export type Messages = (typeof import('./en'))['en']['messages'];
export type MessageKey = keyof Messages;

/** The placeholder names inside a template */
export type PlaceholdersIn<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholdersIn<Rest>
  : never;

/** The arguments `format` needs for a key: none, or one object with every placeholder */
export type ParamsOf<K extends MessageKey> = [PlaceholdersIn<Messages[K]>] extends [never]
  ? []
  : [params: Readonly<Record<PlaceholdersIn<Messages[K]>, string | number>>];

/** What the app reads at run time: every key, any string */
export type Catalog = { readonly [K in MessageKey]: string };

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
/** A string that contains every placeholder of the English template */
type Carrying<P extends string> = [P] extends [never]
  ? string
  : UnionToIntersection<P extends string ? `${string}{${P}}${string}` : never>;

/** What a translated pack's messages must satisfy */
export type TranslationOf = { readonly [K in MessageKey]: Carrying<PlaceholdersIn<Messages[K]>> };
```

A pack file is one statement:

```ts
// shared/locales/en.ts
export const en = {
  meta: { code: 'en', endonym: 'English', script: 'Latin', tier: 'release' },
  messages: {
    'prayer.fajr': 'Fajr',
    'notification.reminder': '{prayer} in {minutes}m',
    // every key of 02a-catalog-keys.md
  },
} as const satisfies LocalePack<Record<string, string>>;

// shared/locales/ar.ts
export const ar = {
  meta: { code: 'ar', endonym: 'العربية', script: 'Arabic', tier: 'preview' },
  messages: { /* every key */ },
} as const satisfies LocalePack<TranslationOf>;
```

What the compiler then refuses, with no test involved:

| Mistake | Where it fails |
| --- | --- |
| A translated pack lacks a key | `satisfies` in that pack |
| A translated pack has a key English does not | `satisfies` in that pack (excess property on a literal) |
| A translation drops a placeholder | `satisfies` in that pack (the value's literal type does not match `Carrying`) |
| A call site uses a key that does not exist | the call site |
| A call site omits a parameter, or passes one the template lacks | the call site |
| A registry entry is not a pack | `shared/locales/index.ts` |

## Registry

```ts
// shared/locales/index.ts
import { isProd } from '@/shared/config';

export const LOCALES = { en, ar, hi, ms, so, th } as const;          // en first, then code order
export type LocaleCode = keyof typeof LOCALES;
export const DEFAULT_LOCALE: LocaleCode = 'en';

/** Registry order. Selectable: every release pack, and preview packs outside production. */
export const SELECTABLE_LOCALES: readonly LocaleCode[];
export const isLocaleCode = (value: unknown): value is LocaleCode;
export const catalogFor = (code: LocaleCode): Catalog => LOCALES[code].messages;
export const metaFor = (code: LocaleCode): LocaleMeta => LOCALES[code].meta;
```

`tier` is how the six-locale confidence build and the public build come from one source. All
five translated packs start at `preview`. The confidence build is a preview-environment build
(`shared/config.ts:4`), so it offers all six. A production build offers `en` alone until a
pack's `tier` is changed to `release`, which is a one-word edit in that pack.

### Adding a locale

1. Add `shared/locales/<code>.ts` (data).
2. Run `node scripts/catalog-lock.js <code>` to write `shared/locales/lock/<code>.json` (data).
3. Add one import and one entry to `LOCALES` in `shared/locales/index.ts`.

Step 3 is the only line that is not data. Gate G0 fails when a pack file exists and is not
registered, so it cannot be forgotten. No component, store, test fixture or native file changes.
The name-width atoms, the language sheet rows and the selectable list all derive from `LOCALES`.

## Formatter

```ts
// shared/i18n.ts
export type Translator = <K extends MessageKey>(key: K, ...args: ParamsOf<K>) => string;

/** Fills a template. Pure. */
export const format = <K extends MessageKey>(catalog: Catalog, key: K, ...args: ParamsOf<K>): string;
export const translatorFor = (catalog: Catalog): Translator;

export const PRAYER_NAME_KEYS: Readonly<Record<PrayerId, MessageKey>>;        // 'last_third' maps to 'prayer.lastThird'
export const PRAYER_HERO_KEYS: Readonly<Record<PrayerId, MessageKey>>;
export const EXPLANATION_KEYS: Readonly<Record<ExtraPrayerId, MessageKey>>;
export const prayerNameKey = (id: PrayerId): MessageKey => PRAYER_NAME_KEYS[id];
export const prayerHeroKey = (id: PrayerId): MessageKey => PRAYER_HERO_KEYS[id];
export const weekdayShortKey = (weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6): MessageKey;
export const monthShortKey = (month: number): MessageKey;          // 1 to 12
export const hijriMonthKey = (month: number): MessageKey;          // 1 to 12
export const hijriMonthShortKey = (month: number): MessageKey;     // 1 to 12
```

`format`, exactly: take `catalog[key]`. With no parameter object, return it. Otherwise, for each
own entry `[name, value]` of the object, replace every occurrence of `{name}` with
`String(value)` using `split` and `join`. Return the result. A number becomes ASCII digits
through `String`, which is what keeps digits Latin in every language. `format` does no
escaping, no pluralisation and no bidirectional control insertion.

The month helpers build the key from the number and assert through their type that it is a key.
A number outside 1 to 12 cannot occur: both callers get the number from a calendar read.

### No plural rules

No string in the app needs one. Every counted string is one of two kinds
(`02a-catalog-keys.md` section 3):

- a whole sentence with a constant number typed into it (`20 mins before Fajr`), which each
  pack translates as a sentence;
- a unit template whose form does not depend on the count (`{n}m`, `{prayer} in {minutes}m`).

A string that would need grammatical number is a copy problem and is fixed in English first,
by rewording it into one of the two kinds. This rule is why a locale is data work: there is no
per-language code.

### No `Intl` for words

`Intl` is used for one thing, as today: reading calendar numbers under a fixed `en-US` locale
(document 04, section 1). Month names, weekday names and unit letters are catalog entries. The
app therefore draws the same bytes on both platforms and inside the widget process, where `Intl`
is not available to a layout at all.

## Gates

G1 is the compiler. The rest are one Jest suite,
`shared/locales/__tests__/catalogGate.test.ts`, written as table tests over `LOCALES` so a new
pack is covered with no test edit.

| Gate | Rule | Catches |
| --- | --- | --- |
| G0 | Every `shared/locales/*.ts` other than `index.ts` and `types.ts` is a value of `LOCALES`; `meta.code` equals the file name and the registry key; `en` is first and the rest are in code order | an unregistered or misnamed pack |
| G1 | `tsc` (see Types) | missing key, extra key, dropped placeholder |
| G2 | The multiset of `{name}` tokens in each value equals the English value's; no other `{` or `}` | a renamed, repeated or invented placeholder |
| G3 | No empty value, no leading or trailing white space, no doubled space, a line break only where English has one | paste damage |
| G4 | No character in Unicode category Nd other than ASCII `0` to `9` | non-Latin digits |
| G5 | No C0 or C1 control and none of U+202A to U+202E, U+2066 to U+2069. U+200C, U+200D, U+200E and U+200F are allowed | invisible characters that reorder text |
| G6 | Each value's visible length is at most the key's `budget` in `notes.json`, when it has one. Visible length is the count of code points outside categories M and Cf | text that cannot fit a fixed box |
| G7 | In a pack whose script is not Latin, every value holds at least one letter of `meta.script`, except keys listed under `@same` in the pack's lock file | an untranslated value |
| G8 | The eleven `prayer.*` values are pairwise different, and so are the eleven `prayerHero.*` values | two rows a user cannot tell apart |
| G9 | The pack's lock file has exactly the pack's keys, and each stored hash equals the hash of the current English value | English changed after it was translated |
| G10 | Each English value marked `frozen` in `notes.json` equals its literal 1.x bytes, typed into the test | a change to a title or channel name English users already hold |
| G11 | In `en`, each `prayerHero.*` equals its `prayer.*` upper-cased | the widget hero drifting from the name |
| G12 | Every key in `notes.json` is a key of `en` | a stale note |

### The lock

`shared/locales/lock/<code>.json`:

```json
{
  "@same": ["widget.brand"],
  "prayer.fajr": "9f2c1a7b3d4e5f60",
  "notification.reminder": "0a1b2c3d4e5f6071"
}
```

Each value is the first 16 hexadecimal characters of the SHA-256 of the English string, as UTF-8,
that the translation was made from. `@same` lists keys whose translation is allowed to carry no
letter of the pack's script (a brand word, a template that is all placeholder and unit).

`scripts/catalog-lock.js <code>` rewrites the file from `en.ts` and the pack. It keeps `@same`
as it finds it. It is the only writer.

The lock turns "a translation exists" into "a translation of this exact English exists". Editing
one English string fails G9 for every pack until each pack's value is looked at again and the
lock is rewritten. With fifty packs that is fifty looks per changed string. That cost is the
point: it is the only thing standing between a one-word English fix and fifty silently wrong
translations.

## Producing a translation with no translators

The catalog is built so that a translation can be produced by a translation session (an agent
session the maintainer runs, never part of the app or the build) and trusted in stages.

| Stage | Who or what | Output | Gate it must pass |
| --- | --- | --- | --- |
| 1. Translate | a translation session, given `en.ts`, `notes.json` and the brief below | `shared/locales/<code>.ts` at `tier: 'preview'` | G1 to G8 |
| 2. Back-translate | a second session, given the new pack only and never the English | an English rendering of every value, kept outside the repository | none |
| 3. Compare | a third session, given the English and the back-translation | a list of keys whose meaning differs | every listed key fixed or accepted by the maintainer |
| 4. Lock | `node scripts/catalog-lock.js <code>` | the lock file | G9, then `yarn validate` |
| 5. Read on a phone | a native reader with the confidence build | corrections, each a one-line edit followed by stage 4 | the device gates of document 06 for that language |
| 6. Release | the maintainer | `tier: 'release'` | none beyond `yarn validate` |

The translation brief, which is fixed text handed to stage 1:

- Translate meaning, not words. Keep each value inside its budget.
- Keep every `{placeholder}` exactly as written. Place it where the language wants it.
- Write every number with the digits 0 to 9.
- Prayer names follow the form Muslims who read this language use for the prayer. Where two
  forms are common, take the shorter.
- A sentence that names a prayer uses that pack's own `prayer.*` value, inflected as the
  language requires.
- `widget.brand` stays `Athan` unless the language has no Latin letters in common use.
- Never add a full stop, a colon or an ellipsis the English lacks.

The Arabic pack does not start from nothing. The source already holds reviewed Arabic for the
eleven names and the five explanations (`shared/constants.ts:15`, `:32`, `:1006-1012`).
`02a-catalog-keys.md` section 5 maps each to its key, and stage 1 for `ar` takes those bytes as
given.

### What this costs

- Per new locale: one pass of stages 1 to 4 over every key (`02a-catalog-keys.md` section 8 has
  the count), then stage 5.
- Per changed English string: one look per pack.
- Per release with a What's New entry: at most eight new strings, once per pack. An item taken
  out of `WHATS_NEW` takes its two keys out of every pack in the same change, which the compiler
  enforces (`02a-catalog-keys.md` section 6).

## What was rejected

- **An i18n library** (i18next, FormatJS, Lingui). Each brings ICU parsing or plural data the
  app does not need, a runtime the widget process cannot use, and `Intl` polyfills for an engine
  whose `Intl` coverage is not uniform across the two platforms. The whole formatter here is one
  function of about eight lines.
- **Operating system string resources.** They follow the device language, not an in-app choice,
  and cannot reach JavaScript-drawn screens without a second system.
- **Keys nested by object.** A flat key map keeps `keyof` exact, keeps every pack diffable line
  by line, and lets the lock file be a flat map too.
- **English text as the key.** It would make every English copy edit a change of identity, which
  is the defect document 01 removes from the prayer model.
