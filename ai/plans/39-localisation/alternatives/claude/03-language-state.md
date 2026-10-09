# 03. Language state, first run and the switch

Evidence: `evidence/core.md` sections 4 to 7, `evidence/schedule-time.md` sections 2 and 5.
Citations are `path:line` at base commit `c3149dfc`.

## The model in four sentences

The selected language is one persisted value and is the only source of truth. The app's own
screens read it live, so they change the instant it changes. Three surfaces hold text that was
baked earlier (pending notification titles, Android channel names, widget props) and cannot
change with it. A second persisted value records which language the first two of those were
last known to be in, and every scheduling pass closes the gap between the two.

This is a convergence, not a transaction. The alert sheet's commit-with-undo
(`stores/notifications.ts:1330-1372`) is the wrong shape for a language change, for one reason:
a bell that disagrees with its alarms is a lie about whether the phone will ring, and a title in
the previous language is not. Nothing a language switch can leave behind stops an alarm firing
on time, so there is nothing worth undoing, and an undo would add a second way to fail.

## Storage

| Key | Encoding | Written by | Meaning |
| --- | --- | --- | --- |
| `preference_language` | bare string, a locale code such as `ar`, or absent | `languageAtom` only | the language the user chose, or the device language the app matched on first run. Absent means neither has happened, and the app is in English by fallback |
| `preference_language_baked` | bare string, a locale code, or absent | `bakedLanguageAtom` only | the one language every pending notification title and every channel name is known to be in. Absent means that is not known |

- Both keys carry the `preference_` prefix, so all three wipes keep them with no change to
  either keep list: the upgrade wipe and the error screen's Refresh
  (`stores/version.ts:144-156`, `components/ui/Error.tsx:28`) and the refresh swap
  (`stores/sync.ts:357-371`). The test that pins the two lists against each other
  (`stores/__tests__/database.test.ts:558-578`) is untouched.
- Neither key matches the index-key pattern (`stores/notifications.ts:493`), so the preference
  migration leaves them alone.
- Both are bare strings written through `atomWithStorageString` (`stores/storage.ts:106-119`),
  never JSON-quoted through `setItem`. The two encodings coexist today
  (`evidence/schedule-time.md` section 2) and a reader must not mix them.
- No existing key is renamed, rewritten or removed. `preference_show_arabic_names`
  (`stores/ui.ts:132`) is left where it is and never read again. It is listed as a known dead
  key in the storage census test (document 06, T-UP-4).

## Modules: `shared/locales/match.ts` and `stores/language.ts` (new)

The two pure functions live in `shared/locales/match.ts`, so the store imports them and the
unused-export guard sees a production caller.

```ts
// shared/locales/match.ts
/** The first device locale a selectable pack matches, or null when none does. */
export const matchDeviceLocale = (
  deviceTags: readonly string[],          // BCP 47 tags in the user's preference order
  selectable: readonly LocaleCode[]
): LocaleCode | null;

/** What the stored value means: a selectable code, or null when absent or unknown. */
export const readStoredLanguage = (raw: string | undefined, selectable: readonly LocaleCode[]): LocaleCode | null;
```

`stores/language.ts` imports `expo-localization`, `jotai`, `@/shared/locales`,
`@/shared/locales/match`, `@/stores/database`, `@/stores/storage` and `@/shared/logger`. It
imports nothing from `stores/notifications.ts`, so the notification store can import it without
a cycle. The two key strings are module-private constants; tests spell the keys out, as the
repository's key-contract suites do (`stores/__tests__/notifications.test.ts:223-237`).

```ts
// stores/language.ts
const LANGUAGE_KEY = 'preference_language';
const BAKED_LANGUAGE_KEY = 'preference_language_baked';

export const languageAtom;        // atomWithStorageString(LANGUAGE_KEY, resolved); see First run
const bakedLanguageAtom;          // atomWithStorageString(BAKED_LANGUAGE_KEY, ''); module-private
export const catalogAtom: Atom<Catalog>;                // derived from languageAtom through catalogFor

export const getLanguage = (): LocaleCode;              // the atom's value when isLocaleCode accepts it, else DEFAULT_LOCALE
export const getCatalog = (): Catalog;                  // store.get(catalogAtom)
export const setLanguage = (code: LocaleCode): void;    // store.set(languageAtom, code)
export const languageNeedsBake = (): boolean;           // store.get(bakedLanguageAtom) !== getLanguage()
export const markLanguageBaked = (code: LocaleCode): void;  // store.set(bakedLanguageAtom, code)
export const clearLanguageBaked = (): void;             // resetStoredAtom(bakedLanguageAtom, BAKED_LANGUAGE_KEY)
```

Both atoms come from the existing string factory (`stores/storage.ts:106-119`). No new atom
type is declared: `StoredAtom` is private to `stores/storage.ts` (`:25`), and where another
document writes `StoredNumberAtom` it is shorthand for `ReturnType<typeof atomWithStorageNumber>`,
declared locally the way `MigratableAtom` is today (`stores/notifications.ts:475`).

### First run

Runs once, synchronously, when the module is first evaluated. That is before the first render,
because every screen imports the hook that imports this module, and before the first background
pass, because the notification store imports it.

1. `raw = database.getString(LANGUAGE_KEY)` and `stored = readStoredLanguage(raw, SELECTABLE_LOCALES)`.
2. `tags = getLocales().map((locale) => locale.languageTag)`, with a `getLocales` that throws
   caught, logged and treated as an empty list. `detected = matchDeviceLocale(tags, SELECTABLE_LOCALES)`.
3. `resolved = stored ?? detected ?? DEFAULT_LOCALE`. `languageAtom` is created with `resolved`
   as its initial value.
4. What is written:

| Case | Write | Why |
| --- | --- | --- |
| `stored` is a selectable code | nothing | the choice stands; the device language is not consulted again |
| the key is absent and `detected` is a code | `store.set(languageAtom, detected)` | a real match is persisted at once, so a later change of the phone's language cannot change the app's and leave baked titles disagreeing with the screens |
| the key is absent and nothing matched | nothing | English by fallback is not a choice. When a pack for this phone's language ships, or leaves the `preview` tier, the next launch matches it |
| the key holds a code that is not selectable | `resetStoredAtom(languageAtom, LANGUAGE_KEY)`, then the two rows above | a preview-only locale carried into a production build, or a locale since withdrawn |

An upgrading 1.x user has no `preference_language`, so this applies to them exactly as it does
to a fresh install: device language where a pack exists, English otherwise. One rule, one code
path.

The third row has a consequence that is intended: a user in English by fallback finds the app
in their own language on the first launch after a release that adds it. That launch finds the
baked value different from the language, and its first pass re-titles every alarm in place.
A user who picks English in the sheet has a stored choice and is never moved.

### `matchDeviceLocale`, exactly

For each tag in order, lower-cased: for each selectable locale in registry order, the locale
matches when any entry `m` of its `meta.match` list, lower-cased, equals the tag or is a prefix
of it followed by `-`. The first match wins. No match returns `null`.

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
kept in step with, and on iOS it would switch mirroring on (document 04, section 5).

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
and `t('sheet.settings.title')`. Code outside React takes a `Catalog` as a parameter and never
reads the store itself, with one exception: an operation that takes the scheduling lock reads
`getLanguage()` once, at the top of its acquisition, and passes the catalog down. There are two
such readers: `_rescheduleAllNotifications`, and the alert sheet's commit
(`stores/notifications.ts:1341`), whose arm and undo both use the value it read. That keeps
every builder pure and testable for every locale without a store.

## The rule that keeps the baked value honest

The baked value may name a language only while every pending title is in it. Two operations
maintain that, and nothing else writes the value.

- **Invalidate before arming.** Every operation that is about to arm under the lock, full pass,
  narrowed repair pass and alert commit alike, compares the language it captured with the baked
  value. When they differ it calls `clearLanguageBaked()` before its first arm. From that moment
  the phone may hold titles in two languages, and the value says so by being absent.
- **Stamp after a clean full pass.** Only a full pass that armed everything, was refused
  nothing, and swept, writes the value (step 7 below).

Without the first rule a switch to a second language that dies half-way, followed by a switch
back, would leave the selected language equal to a baked value that was written before either
switch, with the second language's titles still pending and the gate shut.

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

### What a pass now does with language

`_rescheduleAllNotifications` (`stores/notifications.ts:1585-1668`) gains the steps in bold. Its
existing steps keep their order.

1. **Capture.** First line: `const language = getLanguage(); const catalog = catalogFor(language);`.
   Everything below uses these two values and never reads the store again. A full pass
   (`options.only === undefined`) also sets the module flag `languageBakeTriedThisProcess`.
2. Bail, unchanged (`:1604-1610`). It returns `{ rescheduled: false, baked: false }` before any
   work.
3. **Invalidate.** `if (languageNeedsBake()) clearLanguageBaked();`, in full and narrowed passes.
4. **Channel names.** Only in a full pass: `channelsInSync = await syncAndroidChannelNames(catalog)`
   (document 04). It never throws. It returns `false` when the platform refused any part of it.
5. Arm. The four `_addAll...` calls pass `catalog` down through `_addMultiple...`,
   `scheduleNotificationForDate` and `scheduleReminderNotificationForDate` to the content
   builders (`:826-882`, `:904-959`, `:1012-1076`, `:1094-1155`, `:1382-1454`). Their refusal
   counts are summed.
6. Marks, unchanged (`:1629-1630`). **The sweep reports what it did**:
   `_sweepStaleScheduledNotifications` returns `{ skipped: boolean; refused: number }`. `skipped`
   is the early return when no record exists and the phone holds requests (`:1521-1526`).
   `refused` is the length of the list `_cancelStaleNotificationIds` already returns and the
   sweep discards today (`:1533`).
7. **Stamp.** Only when all of these hold: the pass is full, `channelsInSync` is true, the summed
   refusals are zero, the sweep was not skipped, the sweep was refused nothing. Then
   `markLanguageBaked(language)`. The value stamped is the one captured in step 1, never a
   fresh read.
8. Widgets, unchanged (`:1635-1663`).

The function's return type becomes `{ rescheduled: boolean; baked: boolean }`. Two callers read
the old boolean and now read `rescheduled` (`:1820-1828`, `:1878-1885`). Three ignore the result,
as today (`:1690`, `:1720`, `:1808`).

The alert commit does steps 1 and 3 at the top of its own acquisition
(`stores/notifications.ts:1341`) and passes its catalog to `applyPrayerAlerts` and to
`undoPrayerAlertChange` (`:1201-1241`, `:1271-1309`, `:1345-1368`). It never stamps.

What the stamp then means: every request the app has a record of was armed in this pass under
its unchanged identifier, which replaces the pending request and its title in place
(`device/notifications.ts:43-50`); every recorded identifier the pass did not re-arm was
cancelled and the phone accepted the cancel (`stores/notifications.ts:932-943`, `:1130-1139`);
every prayer whose bell is Off was cleared (`:1394-1397`, `:1443-1445`); and the phone holds
nothing beyond the records (`:1528-1534`).

Two things the stamp does not cover, both by decision:

- A reminder due in under 30 seconds is left pending in its previous language rather than
  re-armed or cancelled (document 04, section 2). It fires within those 30 seconds.
- A notification already delivered and sitting in the shade keeps the text it was delivered
  with.

### What opens the gate

`refreshNotifications` (`stores/notifications.ts:1794-1843`) treats an unbaked language as an
open gate, once per process. Its first lines become:

```ts
const languageGateOpen = languageNeedsBake() && !languageBakeTriedThisProcess;
if (!shouldRescheduleNotifications() && !languageGateOpen) {
```

`languageBakeTriedThisProcess` is a module variable in `stores/notifications.ts`, false at
load and set by step 1 of every full pass. It bounds the cost of a language that cannot be
baked (a cancel the phone keeps refusing, for example): one extra full pass per process, not
one per return to the foreground. After that the ordinary triggers carry it: the 2 hour gate,
the Android cold-launch reopen and every background pass, each of which is a full pass and
stamps when it can.

While the language gate is spent and the 2 hour gate is closed, the repair-only branch
(`:1796-1810`) runs as today for marked prayers. It re-arms them in the current language and
cannot stamp.

## Failure and crash table

"Old language" means the language in force before the switch. In every row, every alarm that
was armed still fires at its own moment.

| # | What goes wrong | State left behind | What the user sees | What ends it |
| --- | --- | --- | --- | --- |
| 1 | Process dies after `setLanguage`, before the pass starts | selected new, baked old, all titles old | screens new on relaunch, pending titles old | the first `refreshNotifications` of the next launch, which runs when the launch sync has data (`app/index.tsx:141-145`) or 1500 ms after first content (`:102-111`), whichever is first; or the next background pass |
| 2 | Process dies mid-pass | selected new, baked absent, titles mixed | as row 1 | as row 1; re-arming a row that was already re-armed replaces it with identical content |
| 3 | Process dies after the last arm, before the stamp | selected new, baked absent, all titles new | nothing wrong | as row 1; the pass repeats and stamps |
| 4 | The phone refuses one arm | that prayer keeps its old alarm and record (`stores/notifications.ts:871-881`) and gets a repair mark; baked absent | one prayer's titles old | the next foreground's repair-only pass re-arms that prayer in the new language; the next full pass stamps |
| 5 | A native call never answers | the call is refused after 15 s and the 2 hour gate reopens (`stores/notifications.ts:66-68`); baked absent | as row 4 | the next foreground runs a full pass, because the 2 hour gate is open |
| 6 | The pending-list call of the sweep rejects | the pass rejects after arming; baked absent | titles new; a stray may remain | the next full pass |
| 7 | A channel rename is refused | arming still runs; baked absent | titles new, one channel name old in system settings | the next full pass renames what still differs |
| 8 | No stored day the windows reach | bail: nothing armed, nothing cancelled, baked unchanged | titles old until data lands | the refresh that follows the first sync (`app/index.tsx:141-145`) |
| 9 | Two switches in quick succession | both selections written at once; two passes queued | screens show the last choice | each pass reads the selection inside its own acquisition, so both bake the last choice; the second is a repeat |
| 10 | A switch while another pass is running | the running pass captured the old language and may stamp the old language | titles old for the length of one pass | the switch's own pass is queued behind it; it invalidates, then bakes the new language |
| 11 | An alert commit queued behind a switch | it invalidates if needed and arms one prayer with the catalog it read | nothing wrong | not needed |
| 12 | Notification permission refused | the resume path does not refresh (`shared/notifications.ts:579-589`); the launch refresh has no permission check and does (`app/index.tsx:141-145`), and so does the switch's own pass | nothing pending can be shown anyway | the launch refresh or the switch's pass |
| 13 | The widget push fails | props keep the old language | widget text old | the next launch sync, the next foreground sync or the next pass, each of which pushes (`evidence/widgets.md` section 4.4), and the settings subscription one second after a switch |
| 14 | Storage loses the `setLanguage` write (power loss inside the write) | selected old, baked old | the switch did not happen | the user repeats it; nothing is inconsistent |
| 15 | The phone holds requests the app has no record of and nothing is armed | the sweep is skipped (`stores/notifications.ts:1513-1526`), so no stamp | a request nobody's settings ask for can fire with an old title, as it can in 1.x | the first pass that has a record to compare against. Until then the cost is one full pass per process |
| 16 | Switch to a second language dies half-way; the user switches back | selected first, baked absent (cleared by the second language's first arm), titles mixed | screens first language; some titles second | the switch back runs a full pass, because an absent baked value never equals the selection |
| 17 | A refusal that does not clear | baked absent for as long as it lasts | titles for the refused request old | bounded by the once-per-process gate; every ordinary full pass retries |
| 18 | A release makes a pack selectable for a user who was in English by fallback | selected changes at launch, baked old | the app is in the user's language unasked | the launch's first pass; this is the intended path |

Rows 2 and 3 cannot be told apart from the outside and do not need to be. The longest a stale
title can live with the app closed is one background interval, three hours at best and at the
scheduler's mercy at worst (`shared/constants.ts:168`). That bound is stated in the proposal as
an accepted cost.

## Upgrade and first launch, in this model

| Install | `preference_language` | `preference_language_baked` | First full pass |
| --- | --- | --- | --- |
| Fresh, device language has a pack | written by the match | absent | arms what the default bells ask for (nothing), stamps |
| Fresh, no pack | absent | absent | the same, in English |
| Upgrading, device language English | written `en` | absent | the pass the version bump already forces (`stores/version.ts:261-263`) re-arms every alarm under its existing identifier with a byte-identical title, stamps `en` |
| Upgrading, device language Arabic, Arabic selectable | written `ar` | absent | the same forced pass re-arms every alarm under its existing identifier with an Arabic title, stamps `ar` |

An absent baked value never equals a locale code, so every install runs one full pass before
the gate can close on language grounds. That pass is the one a version change already forces.
Document 05 says which older installs this table does not describe.

## What this model deliberately lacks

- No per-record language field. A clean full pass re-arms everything, so one global value is
  exact, and the invalidation rule keeps it exact between passes.
- No "switch in progress" flag and no progress UI. The selection is the commitment.
- No rollback of the selection, for the reason given at the top.
- No widget marker. Widgets are re-pushed on every launch sync, every foreground sync and
  every pass, so they converge without one. The language is also added to the widget settings
  subscription (document 04), which pushes one second after a switch whether or not the pass
  succeeds.
