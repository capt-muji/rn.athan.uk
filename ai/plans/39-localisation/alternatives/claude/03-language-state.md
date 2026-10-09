# 03. Language state, first run and the switch

Evidence: `evidence/core.md` sections 4 to 7, `evidence/schedule-time.md` sections 2 and 5.
Citations are `path:line` at base commit `c3149dfc`.

## The model in four sentences

The selected language is one persisted value and is the only source of truth. The app's own
screens read it live, so they change the instant it changes. Three surfaces hold text that was
baked earlier (pending notification titles, Android channel names, widget props) and cannot
change with it. A second persisted value records which language those baked surfaces were last
known to be in, and every scheduling pass closes the gap between the two.

This is a convergence, not a transaction. The alert sheet's commit-with-undo
(`stores/notifications.ts:1330-1372`) is the wrong shape for a language change, for one reason:
a bell that disagrees with its alarms is a lie about whether the phone will ring, and a title in
the previous language is not. Nothing a language switch can leave behind stops an alarm firing
on time, so there is nothing worth undoing, and an undo would add a second way to fail.

## Storage

| Key | Encoding | Written by | Meaning |
| --- | --- | --- | --- |
| `preference_language` | bare string, a locale code such as `ar` | `languageAtom` only | the language the user reads |
| `preference_language_baked` | bare string, a locale code, or absent | `bakedLanguageAtom` only | the language every pending notification title and every channel name is known to be in |

- Both keys carry the `preference_` prefix, so both wipes keep them with no change to either
  keep list (`stores/version.ts:144-156`, `stores/sync.ts:357-371`,
  `evidence/schedule-time.md` section 2). The test that pins the two lists against each other
  (`stores/__tests__/database.test.ts:558-578`) is untouched.
- Neither key matches the index-key pattern (`stores/notifications.ts:493`), so the preference
  migration leaves them alone.
- Both are bare strings written through `atomWithStorageString` (`stores/storage.ts:106-119`),
  never JSON-quoted through `setItem`. The two encodings coexist today
  (`evidence/schedule-time.md` section 2) and a reader must not mix them.
- No existing key is renamed, rewritten or removed. `preference_show_arabic_names`
  (`stores/ui.ts:132`) is left where it is and never read again. It is listed as a known dead
  key in the storage census test (document 06, T-UP-4).

## Module: `stores/language.ts` (new)

Imports: `expo-localization`, `jotai`, `@/shared/locales`, `@/stores/database`,
`@/stores/storage`, `@/shared/logger`. It imports nothing from `stores/notifications.ts`, so
the notification store can import it without a cycle.

```ts
export const LANGUAGE_KEY = 'preference_language';
export const BAKED_LANGUAGE_KEY = 'preference_language_baked';

/** Pure. The first device locale a selectable pack matches, or the default. */
export const matchDeviceLocale = (
  deviceTags: readonly string[],          // BCP 47 tags in the user's preference order
  selectable: readonly LocaleCode[]
): LocaleCode;

/** Pure. What the stored value means: a selectable code, or null when absent or unknown. */
export const readStoredLanguage = (raw: string | undefined, selectable: readonly LocaleCode[]): LocaleCode | null;

export const languageAtom: StoredAtom<LocaleCode>;      // key LANGUAGE_KEY
export const bakedLanguageAtom: StoredAtom<string>;     // key BAKED_LANGUAGE_KEY, default ''
export const catalogAtom: Atom<Catalog>;                // derived: catalogFor(get(languageAtom))

export const getLanguage = (): LocaleCode;              // store.get(languageAtom)
export const getCatalog = (): Catalog;                  // store.get(catalogAtom)
export const setLanguage = (code: LocaleCode): void;    // store.set(languageAtom, code)
export const languageNeedsBake = (): boolean;           // get(bakedLanguageAtom) !== get(languageAtom)
export const markLanguageBaked = (code: LocaleCode): void;  // store.set(bakedLanguageAtom, code)
```

### First-run detection

Runs once, synchronously, when the module is first evaluated. That is before the first render,
because every screen imports the hook that imports this module, and before the first background
pass, because the notification store imports it.

1. `raw = database.getString(LANGUAGE_KEY)`.
2. `stored = readStoredLanguage(raw, SELECTABLE_LOCALES)`.
3. When `stored` is not null: create `languageAtom` with `stored` as its initial value. Write
   nothing.
4. Otherwise: `tags = getLocales().map((locale) => locale.languageTag)`,
   `detected = matchDeviceLocale(tags, SELECTABLE_LOCALES)`, create `languageAtom` with
   `detected` as its initial value, then `store.set(languageAtom, detected)` so the choice is
   persisted at once. A `getLocales` that throws is caught, logged, and treated as an empty list.

The value is persisted on first run on purpose. A later change of the phone's language must not
change the app's, because titles already baked into pending notifications would then disagree
with the screens until the next pass, with no user action to explain it.

An upgrading 1.x user has no `preference_language`, so step 4 applies to them exactly as it
does to a fresh install: device locale, English fallback. One rule, one code path.

A stored code that is no longer selectable (a preview-only locale carried into a production
build, or a locale withdrawn in a later release) is treated as absent. Step 4 replaces it.

### `matchDeviceLocale`, exactly

For each tag in order, lower-cased: for each selectable locale in registry order, the locale
matches when any entry `m` of its `meta.match` list, lower-cased, equals the tag or is a prefix
of it followed by `-`. The first match wins. No match returns `DEFAULT_LOCALE` (`en`).

`meta.match` defaults to the locale's own code, so `ar-SA` matches `ar`. A pack for a language
that needs a script or region to be told apart lists the tags it accepts (for example
`['zh-Hant', 'zh-TW', 'zh-HK']`). That list is data in the pack, so adding such a locale stays
data work.

The whole device list is walked, not the first entry alone. A phone set to a language the app
lacks, with Somali second, gets Somali. That is the rule both operating systems apply when they
choose an app's language.

### Dependency

`expo-localization`, installed with `npx expo install expo-localization` (the SDK 58 version).
It is the one new dependency in this design. `getLocales()` is synchronous and returns the
ordered list. Installing a dependency needs the owner's approval (`ai/AGENTS.md`, Hard rules),
which sequencing step S3 names as its precondition.

No config plugin entry is added for it. The app does not declare its languages to the operating
system at 2.0.0: no `CFBundleLocalizations`, no Android `locales_config`. Declaring them would
add a second language control in the system settings that the in-app row would then have to be
kept in step with.

A Jest mock is added at `shared/__mocks__/expo-localization.ts` and mapped in the shared
`moduleNameMapper` beside `expo-constants` (`jest.config.js:25-38`). It exports `getLocales` as
a `jest.fn` returning `[{ languageTag: 'en-GB', languageCode: 'en' }]` and a
`mockDeviceLocales(tags: string[])` setter, in the style of the settable
`shared/__mocks__/expo-constants.ts`.

## Reading the language

```ts
// hooks/useT.ts (new)
export const useT = (): Translator => {
  const catalog = useAtomValue(catalogAtom);
  return useMemo(() => translatorFor(catalog), [catalog]);
};
```

`Translator` and `translatorFor` are defined in document 02. Components call `const t = useT()`
and `t('settings.title')`. Code outside React takes a `Catalog` as a parameter and never reads
the store itself, with one exception: a scheduling pass reads `getLanguage()` once, at its top,
inside its lock acquisition, and passes the catalog down. That keeps every builder pure and
testable for every locale without a store.

## The switch

The entry point sits beside `commitSoundSelection` (`stores/notifications.ts:1711-1741`),
because it needs the same private lock.

```ts
// stores/notifications.ts
export const commitLanguageSelection = async (next: LocaleCode): Promise<boolean> => {
  if (next === getLanguage() && !languageNeedsBake()) return true;

  setLanguage(next);                       // screens change now, and the choice is durable now

  return withSchedulingLock(async () => {
    try {
      const outcome = await _rescheduleAllNotifications({ deferWidgetRefresh: true });
      return outcome.baked;
    } catch (error) {
      logger.error('LANGUAGE: Baking the new language failed; the next refresh finishes it:', error);
      return false;
    }
  }, 'commitLanguageSelection');
};
```

The return value is for the log and the tests. No screen shows an error and nothing is rolled
back: `false` means "not converged yet".

The sheet that calls it (document 04) does not check notification permission first.
`commitSoundSelection` does not either (`hooks/useNotification.ts:278-290`). A pass on a phone
with permission refused arms what the saved bells ask for, exactly as a sound change does today.

### What a full pass now does with language

`_rescheduleAllNotifications` (`stores/notifications.ts:1585-1668`) gains four steps. Its
existing steps keep their order.

1. **Capture.** First line: `const language = getLanguage(); const catalog = catalogFor(language);`.
   Everything below uses these two values and never reads the store again.
2. **Bail unchanged.** The empty-cache bail (`:1604-1610`) returns
   `{ rescheduled: false, baked: false }` before any work.
3. **Channel names.** Only when the pass is full (`options.only === undefined`):
   `channelsInSync = await syncAndroidChannelNames(catalog)` (document 04). It never throws. It
   returns `false` when the platform refused any part of it.
4. **Arm.** The four `_addAll...` calls pass `catalog` down to the content builders. Their
   refusal counts are summed.
5. **Marks and sweep.** Unchanged (`:1629-1633`).
6. **Stamp.** After the sweep returns, and only when all of these hold: the pass is full,
   `channelsInSync` is true, the summed refusals are zero. Then `markLanguageBaked(language)`.
   The value stamped is the one captured in step 1, never a fresh read.
7. **Widgets.** Unchanged (`:1635-1663`).

The function's return type becomes `{ rescheduled: boolean; baked: boolean }`. The four callers
that read the old boolean (`:1820-1828`, `:1878-1885`, `:1690`, `:1720`) read `rescheduled`.

Why the stamp is sound: a full pass with no refusal has re-armed every row its plan covers
under the same identifier, which replaces the pending request and its title in place
(`device/notifications.ts:43-50`). It has cancelled every recorded identifier it did not
re-arm (`stores/notifications.ts:932-943`, `:1130-1139`), cleared every prayer whose bell is
Off (`:1394-1397`, `:1443-1445`), and swept anything the phone holds beyond the records
(`:1499-1541`). After it, no pending request carries a title built before step 1. The one
exception is fixed in document 04 under "The imminent reminder".

### What opens the gate

`refreshNotifications` (`stores/notifications.ts:1794-1843`) treats an unbaked language as an
open gate. Its first line becomes:

```ts
if (!shouldRescheduleNotifications() && !languageNeedsBake()) {
```

The repair-only branch (`:1796-1810`) is therefore never taken while the language is unbaked: a
narrowed pass cannot stamp, so it would not converge. The background pass needs no change. It
is always full (`:1873-1878`).

## Failure and crash table

"Old language" below means the language in force before the switch. In every row, every alarm
that was armed still fires at its own moment.

| # | What goes wrong | State left behind | What the user sees | What ends it |
| --- | --- | --- | --- | --- |
| 1 | Process dies after `setLanguage`, before the pass starts | selected new, baked old | screens new on relaunch, pending titles old | the first `refreshNotifications` of the next launch (1500 ms after first content, `app/index.tsx:102-111`), or the next background pass |
| 2 | Process dies mid-pass | selected new, baked old, some titles new and some old | as row 1 | as row 1; re-arming an already re-armed row replaces it with identical content |
| 3 | Process dies after the last arm, before the stamp | selected new, baked old, all titles new | nothing wrong | as row 1; the pass repeats and stamps |
| 4 | The phone refuses one arm | that prayer keeps its old alarm and record (`stores/notifications.ts:871-881`), gets a repair mark, no stamp | one prayer's titles old | the next foreground runs a full pass, because the language gate outranks the repair-only branch |
| 5 | A native call never answers | the call is refused after 15 s, the 2 hour gate reopens (`stores/notifications.ts:66-68`), no stamp | as row 4 | as row 4 |
| 6 | The sweep throws | the pass rejects, no stamp | titles new, a stray may remain | the next full pass |
| 7 | Channel rename refused | `channelsInSync` false, arming still runs, no stamp | titles new, a channel name old in system settings | the next full pass renames what still differs |
| 8 | No stored day the windows reach | bail, nothing armed, nothing cancelled, no stamp | titles old until data lands | the refresh that follows the first sync (`app/index.tsx:141-145`) |
| 9 | Two switches in quick succession | both selections written at once; two passes queued | screens show the last choice | each pass reads the selection inside its own lock acquisition, so both bake the last choice; the second is a repeat |
| 10 | A switch while another pass is running | the selection is written; the running pass captured the old language and stamps the old language | titles old for the length of one pass | the switch's own pass is queued behind it and bakes the new one |
| 11 | An alert sheet commit queued behind a switch | it arms one prayer inside its own acquisition with the catalog it reads there | nothing wrong | not needed |
| 12 | Notification permission refused | passes from launch and resume never run (`shared/notifications.ts:579-589`); the switch's own pass runs once | nothing pending can be shown anyway | the first pass after permission is granted |
| 13 | The widget push fails | props keep the old language | widget text old | the next launch sync, the next foreground sync or the next pass, each of which pushes (`evidence/widgets.md` section 4.4) |
| 14 | Storage loses the `setLanguage` write (power loss inside the write) | selected old, baked old | the switch did not happen | the user repeats it; nothing is inconsistent |

The longest a stale title can live with the app closed is one background interval, three hours
at best and at the scheduler's mercy at worst (`shared/constants.ts:168`). That bound is stated
in the proposal as an accepted cost.

## Upgrade and first launch, in this model

| Install | `preference_language` | `preference_language_baked` | First full pass |
| --- | --- | --- | --- |
| Fresh | written by detection | absent, read as `''` | arms what the default bells ask for (nothing), stamps |
| 1.x upgrading, device language English | written `en` | absent | the pass the version bump already forces (`stores/version.ts:261-263`) re-arms every alarm under its existing identifier with a byte-identical title, stamps `en` |
| 1.x upgrading, device language Arabic | written `ar` | absent | the same forced pass re-arms every alarm under its existing identifier with an Arabic title, stamps `ar` |

An absent baked value never equals a locale code, so every install runs one full pass before
the gate can close on language grounds. That pass is the one a version change already forces.

## What this model deliberately lacks

- No per-record language field. A full pass re-arms everything, so one global value is exact.
- No "switch in progress" flag and no progress UI. The selection is the commitment.
- No rollback of the selection, for the reason given at the top.
- No widget marker. Widgets are re-pushed on every launch sync, every foreground sync and
  every pass, so they converge without one. The language is also added to the widget settings
  subscription (document 04), which pushes one second after a switch whether or not the pass
  succeeds.
