# Session 39 localisation: an independent architecture

This is one alternative, written without sight of the design on `uat`. It is a specification,
not code: this branch changes documents and the version number only. Base commit `c3149dfc`.

## One premise to settle first

The brief asks that stored preferences and armed OS identifiers survive the 2.0.0 upgrade byte
for byte. That is achievable, and this design achieves it, for an install that last ran 1.24.33
or later. It is not achievable by any design for an install that last ran 1.5.2 or earlier:
that build armed alarms with no identifier of its own, so the system chose one, and it keyed
preferences by list index (`05-upgrade.md`, "Which 1.x"). Installs between the two keep their
preferences and identifiers and lose the offline timetable for one launch. No alarm is missed
in any class.

The code does not say which version is live in the stores. `main` is at 1.29.291. If the live
build is older than 1.24.33, the clean route is a 1.29.x release first, so that installs cross
both boundaries before 2.0.0 reaches them. The owner must name the live version before step S15.

## How to read it

| Document | Holds |
| --- | --- |
| `PROPOSAL.md` | this summary: the design, what is kept, what is torn out, the ideal, cost and risk |
| `01-prayer-domain.md` | the prayer id, the registry, the wire-format module, every signature that changes |
| `02-catalog.md` | the catalog's files, types, formatter, gates and translation procedure |
| `02a-catalog-keys.md` | every English key with its exact bytes and source line |
| `03-language-state.md` | the two stored values, first-run detection, the switch, the failure table |
| `04-surfaces.md` | notification titles, channels, widgets, the row, the settings row and sheet |
| `05-upgrade.md` | the 1.x upgrade, step by step, and what can interrupt it |
| `06-test-strategy.md` | every new test with the fault it must catch, and the device gates |
| `07-sequencing.md` | the commits in order, with files, tests, approvals, exports and effort |
| `evidence/*.md` | five fact sweeps of the code, each claim cited to `path:line` |

## The design in one page

**1. A prayer gets an identity that is not its name.** Today the English name does twelve jobs:
it is drawn, it orders the list, it is lower-cased into preference keys and OS identifiers,
slugged into audio and channel names, used as an object key into the stored day and compared
as a string in nine places (`evidence/core.md` section 1). The design adds a closed `PrayerId`
and one registry row per prayer. The 1.x tokens (`last third` with its space, `last_third`
with its underscore) become two frozen columns of that row. One module, `shared/identifiers.ts`,
owns every byte format, and a source guard keeps the formats out of every other file. Rows,
records, the countdown and the sheet state carry an id and no display string.

**2. Strings live in one typed catalog.** One TypeScript object literal per language, imported
statically. The English file's literal types are the schema, so the compiler rejects a missing
key, an extra key, a dropped placeholder and a wrong call-site parameter. There is no i18n
library, no plural engine and no `Intl` call that produces a word: month names, weekday names
and unit letters are catalog entries, and digits come from `String(number)`. A lock file per
language stores the hash of the English each translation was made from, so an English edit
fails the gate for every language until each is looked at again.

**3. A language switch converges; it does not transact.** The selected language is one stored
value and the screens follow it at once. A second stored value records the language that
pending notification titles and channel names were last known to be in. Every full scheduling
pass re-arms every alarm under its unchanged identifier, which replaces its title in place,
renames any channel whose name differs, and then stamps the second value. While the two values
differ, the refresh gate is open. Any operation about to arm in a language other than the
recorded one clears the record first, so the record can never vouch for titles it did not see
written. A crash, a refusal or a timeout at any point leaves alarms that still fire on time in
the previous language, and the next pass finishes the job. Nothing is rolled back.

**4. Baked surfaces get their text from the app, never from themselves.** Titles take a catalog
at arm time. Channel names are renamed in place under the same ids. Widget layouts cannot
import anything, so the app bakes every name, the footer and the card text into props, and the
layouts stop cutting and upper-casing words.

**5. The upgrade migrates nothing.** For an install that last ran 1.24.33 or later, no stored
key is renamed and no value is rewritten. The cache shape version stays `1`, so an offline
upgrade keeps its timetable. Older installs go through the migration and the wipe that 1.x
already has, unchanged. The first 2.0.0 pass
is the one a version change already forces, with a title in the detected language.

**6. Adding a language is one data file, one generated lock file and one registry line.**

## What is kept because it is already right

| Kept | Why | Site |
| --- | --- | --- |
| Deterministic OS identifiers and same-identifier replace | it is what lets a language switch and an upgrade re-title an alarm without ever removing it | `device/notifications.ts:43-66` |
| Schedule first, cancel stale after | the phone never holds fewer alarms than before a pass | `stores/notifications.ts:904-959` |
| The queue lock, repair marks with generations, the guarded sweep, the empty-cache bail, the native timeout | each closes a real failure the code documents; the switch reuses all five unchanged | `stores/notifications.ts:45-79`, `:320-409`, `:1499-1541`, `:1604-1610`, `shared/notifications.ts:32-79` |
| The request-budget planner | language does not touch it | `shared/notifications.ts:268-328` |
| Version change and cache shape as two separate questions | it is why 2.0.0 can upgrade offline | `stores/version.ts:119-135`, `:253-266` |
| The `preference_` prefix as the one thing both wipes keep | the two new keys need no keep-list change | `stores/version.ts:144-156`, `stores/sync.ts:357-371` |
| The persisted-atom rule | first-run detection writes through the atom for this reason | `stores/storage.ts:7-12` |
| Name-keyed preferences and the suffix-free reminder slot 0 | they are the reason no preference migration is needed now | `stores/notifications.ts:203-281` |
| The readable or unreadable row union and the list-day model | untouched | `shared/types.ts:286-307` |
| The widget contract: JSON props, a version stamp, layouts that tolerate older props | the new props ride the same tolerance | `shared/widgetTypes.ts:10-14`, `shared/__tests__/widgetContract.test.ts` |
| Hand-built `HH:mm` and the London clock read through numeric `Intl` | already language-neutral | `shared/time.ts:25-58`, `:175-178` |
| The `Sheet` part and the chevron row | the language row and sheet are built from them | `components/sheets/parts/Sheet.tsx:110-124`, `components/sheets/screens/Settings.tsx:173-184` |
| The pinned-byte suites and the alarm harness | they are the oracle for the whole refactor | `evidence/test-infra.md` sections 4 and 5 |

## What is torn out

| Torn out | Replaced by |
| --- | --- |
| The English name as identity, and the four name arrays | `PrayerId`, the registry, the catalog |
| Byte formats spread over four modules | `shared/identifiers.ts` |
| A prayer passed as four arguments, and two index spaces with a translator between them | one `PrayerId` |
| Display strings stored in rows, records, the countdown store and the sheet state | an id, resolved at draw or bake time |
| The bilingual row, its toggle, the Arabic constants, the Arabic-Indic digit helper | one name per row from the catalog |
| Names from date-fns and from `Intl` under a fixed English locale | catalog entries; `Intl` yields numbers only |
| English word order built in code (`Fajr 2h ago`, `Fajr in 15m`) | templates with placeholders |
| The widest name chosen by character count, cached with no language in the key | every name measured, one cached width per language |
| Word surgery inside widget layouts: upper-casing, comma and space splits, a three-character cut | strings baked by the app |
| Channel names fixed for the life of a channel | names synced on every full pass |
| Automatic mirroring on a right-to-left Android phone, which is on today | `android:supportsRtl="false"` through a config plugin |
| `englishName` and `arabicName` in every stored record | `prayerId`; readers take `id` and `date` only |

## The ideal, if the constraints were ignored

- **One token per prayer everywhere.** `last_third` in storage, in OS identifiers and in file
  names, with no legacy column. It needs a migration of preferences and a re-keying of armed
  alarms, which the byte-for-byte constraint forbids.
- **Text resolved when a notification is shown, not when it is armed.** iOS can localise a
  title at delivery from a key and arguments; Android can build the notification in a receiver
  when the alarm fires. A switch would then re-arm nothing and no title could ever be stale. It
  needs native code beyond the notifications library.
- **The operating system owns the app's language.** With native string resources and per-app
  language, the widget gallery names, the permission prompts, the channel names and the app
  would all follow one switch, and the in-app row would open the system's picker. It gives up
  "one row, chevron, sheet" and needs Android 13.
- **Native widgets reading a shared string table**, so the no-props card is translated too.
- **Real mirroring for right-to-left languages, the script's own digits, and plural-aware
  messages**, with translators and a translation memory. Each is ruled out by a stated
  constraint: the frozen row, Latin digits, no translation staff.
- **A database with versioned migrations** in place of key-prefix conventions, and one stored
  plan that the OS is reconciled against.
- **Reminder audio recorded per language.** The 99 files are frozen.

## Effort and risk

Effort is execution time for one engineer, tests included (`07-sequencing.md` has it per commit).

| Area | Effort | Risk | What could go wrong | What contains it |
| --- | --- | --- | --- | --- |
| Prayer identity (S1, S2) | 16 h | low | a token typed wrong changes a key or an identifier | four independent golden suites and every existing pinned-byte suite, unedited |
| Catalog and language state (S3) | 6 h | low | detection picks the wrong language; a new dependency | a pure matcher with a table test; the dependency is one official package |
| Moving strings (S4 to S6) | 14 h | low | an English string changes by a byte | 43 existing suites query by today's English text and stay unedited |
| First translated pack and gates (S7) | 4 h plus translation | medium | a wrong or untranslated string | twelve gates, back-translation, the `preview` tier, a native reader before release |
| Name width per language (S8) | 3 h | low | a reflow for English users | the English keys are the 1.x keys |
| Imminent reminder (S9) | 2 h | medium | it edits scheduling logic | a red test first; one branch |
| Titles, channels, the baked marker (S10) | 10 h | high | the pass that arms alarms is edited | the pass's order is unchanged; ten switch scenarios; two device gates |
| Widgets (S11) | 10 h | medium | a black widget; clipped names | text-parity test before re-pinning digests; the payload test; two device gates |
| The row (S12) | 5 h | medium | visible change for existing users | two device gates; listed below for the owner |
| Row, sheet, switch entry (S13) | 6 h | low | | component suites, one flow |
| Four more packs (S14) | 4 h plus translation | medium | as S7 | as S7 |
| Upgrade proof and release (S15) | 6 h | medium | a real install behaves unlike the fixture | seven upgrade scenarios; a device gate on a real 1.29.x install |

About 85 hours before translation and device time.

## The three riskiest decisions

**1. Convergence in place of a transaction.** The codebase's own pattern for a change that
touches alarms is commit, then undo on failure, inside one lock acquisition. This design does
not use it for language. The cost is a window in which a title can be in the previous language:
seconds in the normal case, one background interval with the app closed after a crash, longer
if the system starves the task. The bet is that a late title is harmless and a rolled-back
language is confusing. If the owner reads "any language switch" as "no alarm may ever show the
old language", this decision is wrong and the alternative is to block the sheet until the pass
stamps.

**2. Editing the pass that arms alarms.** Titles, channel names and the stamp all hang off
`_rescheduleAllNotifications`, the most defended function in the app. The design adds four
steps and reorders none, and the imminent-reminder fix changes one branch. It also relies on
two platform behaviours that only a device can confirm: re-arming an identifier replaces the
pending request and its title on both systems, and creating a channel that exists renames it.
The first is already load-bearing in 1.x. The second is new. If it fails on a phone, channel
names stay in the old language in system settings and nothing else breaks.

**3. Translations with no translators and no plural engine.** The catalog bets that every
string can stay free of grammatical number for fifty languages, and that machine translation
is safe behind a compiler check, twelve gates, a source-hash lock, a back-translation pass and
a `preview` tier that keeps a pack out of production until a native reader has used it. What
the gates cannot catch is a fluent, well-formed, wrong translation of a religious term. The
`preview` tier is the only defence against that, and it depends on the owner finding a reader
per language.

## What the owner will see change, and must approve

| Change | Why | Step |
| --- | --- | --- |
| The time moves left for every user who had Arabic names on (the default) | the Arabic column shared the free width with the time | S12 |
| A right-to-left Android phone stops mirroring the screen | "never mirrored" is not true today; a config flag makes it true | S12 |
| An upgrading user whose phone is in a shipped language gets that language unasked | first run follows the device, and an upgrade is a first run of the setting | S3, release |
| Arabic explanation digits become Latin | digits stay Latin at 2.0.0 | S12 |
| One new drawing, a globe icon | the language row | S13 |
| The widget's neutral card, and widget gallery names, stay English | the neutral card is drawn before the first push and as the fallback after a render error; gallery names follow the device | S11 |
| A user in English only because no pack matched moves to their own language when a release adds it | English by fallback is not stored as a choice | each release that adds or promotes a pack |
| The Hijri month's spelling may change by a letter | the catalog replaces each phone's own spelling | S4 |
| Text in a script Roboto lacks is drawn in the system's fallback face | no font is added at 2.0.0 | S7 onward |
| One new dependency, `expo-localization` | reading the device's language list | S3 |
| Two new stored keys, and one stored width per language | `03-language-state.md`, `04-surfaces.md` section 5 | S3, S8, S10 |
| One plugin entry in `app.json` | the mirroring flag | S12 |
| Three edits to scheduling logic | signatures (S2), the imminent reminder (S9), the pass (S10) | S2, S9, S10 |

## Three defects found on the way

They exist on `uat` today and are independent of localisation. Each is specified where it
touches this work.

1. A pass that runs within 30 seconds before an armed reminder cancels it
   (`stores/notifications.ts:1040-1051`, `:1130-1139`; `04-surfaces.md` section 2).
2. The home widget's first guard throws on `undefined` props, which is what iOS passes
   (`widgets/PrayerWidget.tsx:90`; `evidence/widgets.md` section 1.4). Not confirmed on a device.
3. The widget closure test walks only the first of the three lock layouts
   (`shared/__tests__/widgetContract.test.ts:73-88`).

## What this run read and did not read

- Read: the code under `shared/`, `stores/`, `device/`, `components/`, `hooks/`, `widgets/`,
  `app/`, `api/`, `modules/`, `plugins/`, the configuration files, the test tooling and the
  parts of `node_modules` the evidence files cite. Each evidence file ends with its own list of
  what was read in full and what in part. For the upgrade, `main` and three older commits in
  the history of `uat` were read for the storage formats they hold.
- Reviewed once, by an independent session that read the documents against the code. It found
  no wrong byte in the identifier tables and no path that drops an alarm. Its ten major
  findings are applied in these documents; the largest are the premise above, the rule that
  clears the baked-language record before arming, and the stricter conditions on stamping it.
- Not read: anything under `ai/plans/` other than this folder, anything under `ai/features/`,
  and any `arch/` or `verify/` branch other than this one.
- One slip, disclosed: a file search by a sub-task printed about eight lines that named files
  under `ai/plans/39-localisation/`, two of them comments about font glyph coverage. No such
  file was opened. The font finding in `evidence/ui-strings.md` comes from parsing the font
  files.
- Not verified on a device: everything in the device-gate table of `06-test-strategy.md`.
