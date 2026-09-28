# What R5 settles: the engineering plan, and two corrections it earns

R5 (`research/R5-PRODUCTION-ENGINEERING.md`, 603 lines) is the implementation counterpart to the
other four. It independently reached this session's central conclusion, and corrected two things
the briefs themselves got wrong.

## It independently found the identifier/label split

`CONSTRAINTS.md` C3 named this as the session's central risk from the repo measurement. R5 reached
the same place from the industry side, and its failure-mode description is sharper than mine:

> Someone "localises" `Prayer.english` and every stored preference orphans overnight. MMKV keys
> built from `Midnight` no longer match a row whose field now reads `نصف الليل`. The alert the user
> configured disappears, `EXTRAS_ENGLISH.indexOf` returns `-1`, and `getPrayerForDate` returns
> `null` so nothing arms. Worst of all, it breaks silently: `null <= now` is `true` in a past-row
> check, so rows drop without an error.

That last clause connects to a lesson already in `ai/AGENTS.md` from session 28. The two failures
compound: a translated identifier produces a null row, and the null row is silently dropped rather
than throwing.

Its recommended shape, which the plan adopts:

```typescript
export const PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;
export type PrayerId = (typeof PRAYER_IDS)[number];

export const prayerLabel = (id: PrayerId): string => t(`prayer.${id}`);
```

**Finding R5 states plainly, and the plan takes as its ordering rule:** split the identifier from
the label **before any catalog exists**. It is the prerequisite for every later step, the silent
failure is the worst in the app, and the repo's existing contract-test pattern
(`widgetContract.test.ts`, `flags.test.ts`) enforces it with no new tooling.

This lands in row 38 (D4a, the scaffolding half), not row 39.

## Correction 1: the Hermes JSON optimisation does not exist

My R5 brief asked about "a known Hermes optimisation where `JSON.parse` of a string literal beats
an object literal". That premise was wrong, and R5 caught it with a primary source: it is a **V8**
result, not a Hermes one. From Hermes's tech lead in facebook/hermes#1046:

> "In Hermes it will always be faster to load it as a .js file instead of parsing it as runtime as
> JSON. However Hermes has a long-standing bug, where large literals, depending on their
> composition, may take extremely long time to compile, or may in fact never complete the
> compilation successfully... So, in practice, for now, it is safer to use `JSON.parse()`, unless
> you have already tried to compile the large array/literal."

So the correct design for this repo is **plain TypeScript modules per locale**, loaded lazily. They
compile to Hermes bytecode, they carry `as const` types for key safety, and at about 10 KB each
they are nowhere near the literal-size bug. No `JSON.parse` trick, no JSON files.

This is a better outcome than the brief assumed: the catalogs are typed source, which is what makes
`keyof typeof` key safety free.

## Correction 2: date formatting is locale data, not copy

R5 found a class of string this session had not counted. `shared/time.ts` renders
`'EEE, d MMM yyyy'` through `date-fns` and pins the Hijri formatter to
`'en-US-u-ca-islamic-umalqura'`. Those are not translatable strings; they are locale configuration,
and they must take the active locale rather than be translated.

Row 39's queue entry says "Dates and times are NOT touched (owner): `HH:mm` stays, and the
Gregorian date stays as it is." That ruling is about FORMAT, and it stands. But a date rendered in
English month names inside an otherwise-Arabic interface is a visible defect, so the plan raises
the question of month-name localisation as a proposal rather than deciding it.

R5 notes the repo already uses `Intl` in seven non-test places in `shared/`, so `Intl.DateTimeFormat`
is available on the floor device and no polyfill question arises for dates specifically. That is a
useful boundary on the Hermes `Intl` finding from R1: `DateTimeFormat` and `NumberFormat` ship;
`PluralRules` and friends do not.

## The Biome question, answered

R2 left open whether Biome can replace `eslint-plugin-i18next`'s `no-literal-string`. R5's answer:
Biome has no equivalent rule today, and its GritQL plugin support can match string literals in
specific props but not computed labels.

So the guard is not a lint rule. R5's recommended mechanism is the one the repo already uses for
exactly this kind of source-level invariant: a **contract test that reads the source files**,
matching `widgetContract.test.ts` (which reads widget sources to enforce what a layout may
reference) and `flags.test.ts` (which pins the `app.config.ts` mirror).

That is the right answer for this repo specifically, because it introduces no new tooling and
`ai/AGENTS.md` forbids new patterns where an existing one fits.

## Channel renaming, confirmed with a second source

R4 found that channel names are mutable. R5 confirms it from the Android documentation plus
Microsoft's API docs ("The name and description should only be changed if the locale changes"), and
adds the idempotence guarantee: "Recreating an existing notification channel with its original
values performs no operation."

R5 also found two implementation details from this repo's own code that the plan needs:

1. `shared/notifications.ts:429-446` keeps session-scoped dedup caches
   (`createdReminderChannels`, `createdAthanChannels`, `extrasChannelCreated`) that skip repeat
   `setNotificationChannelAsync` calls. A mid-process locale change would need those invalidated.
2. The reminder channel name embeds a format string,
   `` `${englishName} in ${intervalMinutes}m Reminder` ``, so it becomes a catalog key with two
   interpolations.

**Channel ids stay English forever**, as domain identifiers under the split above. That means
localising names needs no channel-id migration, unlike the sound freeze which forced `_v4`.

## Where R5 disagrees with R1, and how the plan resolves it

R5 assumes a library (its type-safety section is built around i18next's `CustomTypeOptions`), while
R1 recommends no library at all.

The resolution is that R5's substantive findings are library-independent:

| R5 finding | Depends on a library? |
| --- | --- |
| Identifier/label split | No |
| TypeScript catalogs over JSON | No, and it makes `keyof typeof` safety easier without one |
| Contract test as the hardcoded-string guard | No |
| Channel rename, id stability | No |
| Widget strings baked into props | No |
| Notification re-arm | No |
| Date formatting takes the locale | No |

Only the specific `CustomTypeOptions` augmentation is i18next-shaped, and a hand-rolled catalog
gets stronger key safety from `keyof typeof` directly.

## R5's three most expensive decisions to reverse

Worth carrying verbatim into the plan, because they set what must be got right first:

1. The identifier/label split.
2. The key convention.
3. The catalog file layout.

All three are structural and all three land in row 38, the cheap half, which is an argument for
doing that half carefully rather than quickly.
