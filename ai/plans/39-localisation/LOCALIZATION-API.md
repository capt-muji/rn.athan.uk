# The `expo-localization@58.0.1` API, read from the published package

R4 describes this API from the documentation. The plan needs exact signatures, so this is read from
the package itself: `npm pack expo-localization@58.0.1`, then
`package/build/Localization.d.ts` and `Localization.types.d.ts`.

## The four exports

```ts
getLocales():   [Locale, ...Locale[]]
getCalendars(): [Calendar, ...Calendar[]]
useLocales():   [Locale, ...Locale[]]
useCalendars(): [Calendar, ...Calendar[]]
```

Two things the type signature guarantees, and both matter:

1. **The return is a non-empty tuple type**, `[Locale, ...Locale[]]`, not `Locale[]`. So
   `getLocales()[0]` is typed as defined and needs no null check. The docblock says "Guaranteed to
   contain at least 1 element."
2. **The list is ordered by the user's own device preference.** "These are returned in the order the
   user defines in their device settings." That is what makes RFC 4647 lookup over the whole list
   correct rather than reading element zero.

## The finding R4 did not have: `useLocales()` re-renders on an OS change

The docblock for `useLocales` states:

> If the OS settings change, the hook will rerender with a new list of locales.

R4 recommended re-reading `getLocales()` on every `AppState` foreground transition on Android,
because Android lets a user change locale without restarting the app. The hook does that work
already, which is simpler and has no foreground-event plumbing.

**So the plan uses `useLocales()` rather than a foreground listener**, and the `system` mode from
`PLAN-OUTLINE.md` step 3 becomes a derived value rather than an effect. That also keeps it off the
animation path, since it is an ordinary hook subscription rather than an effect writing state after
paint, which `ai/AGENTS.md` Performance Design Rule 3 forbids.

`getLocales()` stays the right call for the non-React paths: the notification scheduling pass and
the widget push, neither of which is in a component.

## The `Locale` fields the plan uses

| Field | Type | Use here |
| --- | --- | --- |
| `languageTag` | `string` | The input to locale negotiation, `'en-GB'`, `'es-419'` |
| `languageCode` | `string \| null` | The fallback key, `'en'`, `'ar'` |
| `languageScriptCode` | `string \| null` | ISO 15924. **Required for Chinese**, `'Hans'` versus `'Hant'`. May be null on Android |
| `regionCode` | `string \| null` | Not used for language selection. See below |
| `textDirection` | `'ltr' \| 'rtl'` | Chooses TEXT alignment, never layout direction |

The rest (`currencyCode`, `currencySymbol`, `languageCurrencyCode`, `measurementSystem`,
`temperatureUnit`, `decimalSeparator`, `digitGroupingSeparator`) are unused by this app.

**`regionCode` is read from the device's Region setting, not from position.** The type documentation
says so outright: it "comes from the Region setting under Language & Region on iOS, Region settings
on Android". So it is not a location signal and cannot substitute for one, which independently
confirms `R4-FINDINGS.md`'s rejection of location-based language guessing: there is no location
here to guess from.

The docs also note `languageRegionCode` exists but say "Prefer using `regionCode` for any
internalization purposes", so the plan uses `regionCode` and never the other.

## `getCalendars()`, which is relevant and was nearly missed

Returns `calendar`, `timeZone`, `uses24hourClock` and `firstWeekday`.

`uses24hourClock` is interesting for this app because the prayer list renders `HH:mm` and
`ai/AGENTS.md` records the time format as settled. This does not reopen that: it is noted so a
later session knows the signal exists without re-deriving it.

The `calendar` field can report an Islamic calendar the user has selected, which touches the Hijri
date setting. Also out of scope, also worth recording.

## What this fixes in the plan

| Was | Now |
| --- | --- |
| Re-read `getLocales()` on AppState foreground (R4) | `useLocales()` hook, which re-renders itself |
| `getLocales()[0]` may be undefined | Typed non-empty tuple, no guard needed |
| Chinese script handling unspecified | `languageScriptCode`, with the Android null case named |

## Reproducing

```bash
cd $(mktemp -d) && npm pack expo-localization@58.0.1 --silent
tar -xzf expo-localization-58.0.1.tgz
cat package/build/Localization.d.ts
cat package/build/Localization.types.d.ts
```
