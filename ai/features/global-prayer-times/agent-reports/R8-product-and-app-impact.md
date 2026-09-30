# R8: what worldwide prayer times mean for the product, and what they cost this codebase

**Agent:** R8, wave 2 of the global prayer times research. **Written:** 2026-09-30.
**Status: RESEARCH ONLY.** No app code changed, nothing built, nothing installed, no git command run.

**Scope.** Wave 1 established what is true about prayer times worldwide. This report is the bridge from that
evidence to a product decision and a work plan. It answers five things: what the shipped app assumes and where,
which data-model gaps wave 1 exposed that parameterisation cannot close, what comparable apps actually do, what
this app can honestly claim, and how to sequence the work.

**How claims are marked.**

- **measured** means this agent read it in this repository's own source or computed it here. Every code claim
  carries a `file:line`.
- **cited** means a named external source asserts it, with a URL and a fetch date in the sources table.
- **wave 1** means R1, R2, R3, R4 or `ai/features/moonsighting/RESEARCH-FINDINGS.md` established it and this
  report repeats it without re-measuring.
- **UNVERIFIED** means it could not be established and is recorded as open.

**Tool path.** `codegraph_explore` was attempted first per the brief and returned "the project at
/Users/muji/athan-global-wt isn't indexed with codegraph (no `.codegraph/` directory)", so every code fact below
was read directly from source in this worktree. Web research went through the `tinyfish` MCP, with the
`agent-browser` CLI used for one JavaScript-rendered page (`islamicfinder.org`'s calculation-method table). No
`curl` was used.

---

## Findings in one page

1. **The London assumption is not one constant, it is four independent systems.** They are the timezone
   (`PRAYER_TIMEZONE` at `shared/constants.ts:258`, read in three places in `shared/time.ts` and transitively by
   every date in the app), the provider wire format (`api/client.ts` and `shared/types.ts`), the storage schema
   (`prayer_YYYY-MM-DD` in `stores/database.ts:138`, with no location in the key), and the display copy. Only the
   last is cosmetic. Measured.
2. **The largest single code risk is the MMKV key scheme, and it is silent.** `prayer_${date}`
   (`stores/database.ts:138,153`) has no room for a location. A user who changes city and keeps the old year
   cached reads the old city's times under the new city's name, with no error anywhere in the pipeline. Every
   downstream guard checks shape, never provenance. Measured.
3. **The English prayer name is a domain identifier, and worldwide makes that constraint harder, not easier.**
   Session 39 measured 27 MMKV preference keys, 2 notification id formats, 11 audio slugs, 67 mp3 files and the
   canonical display order all built from it (`ai/plans/39-localisation/MEASURED.md` sections 2 and the four-system
   table). R2's Imsak result adds a new demand on the same string: Turkey's Fajr row is named `İmsak` and
   Malaysia's `Imsak` is a different row ten minutes earlier. **The concept, the identifier and the label must
   become three separate things**, and only the label may vary. Wave 1 plus measured.
4. **Six of the app's eleven rows survive worldwide unchanged; five do not.** `Fajr`, `Sunrise`, `Dhuhr`, `Asr`,
   `Magrib`, `Isha` map onto every authority's table. `Midnight`, `Last Third`, `Suhoor`, `Duha` and `Istijaba`
   each hit a different problem: Duha collides with a real published row (JAKIM `Duha`, Brunei `Doha`, Kemenag's
   4.5 degrees) that is not the app's `Sunrise + 20`; Suhoor collides conceptually with the official `Imsak` row;
   Istijaba is published almost nowhere (null in 24 of 28 locales, session 39's catalog). Measured against
   `shared/constants.ts:9,26,54` and `shared/constants.ts:225`.
5. **Imsak is a labelling problem with two opposite failure modes, and the data model must carry the concept, not
   the row name.** In Malaysia and Indonesia `Imsak` is a real extra row exactly 10 minutes before Subuh (R2,
   measured 30 of 30 days). In Turkey `İmsak` IS the Fajr row and there is no separate Fajr (R2). A model with an
   `imsak` field and a `fajr` field, filled naively, is 10 minutes wrong in one country or the other. The fix is a
   per-source declaration of which concept each published row carries.
6. **Jamaah is already in the app's own types and has never been read.** `IApiSingleTime` types `fajr_jamat`,
   `dhuhr_jamat`, `asr_jamat`, `magrib_jamat`, `isha_jamat` (`shared/types.ts:18,24,30,34,38`), each commented
   "not used in app", and `REQUIRED_TIMES` (`api/client.ts:48`) drops them. R2 found congregation time is a
   first-class column worldwide, with a measured 48-minute gap at one Toronto mosque. This is the cheapest large
   feature available, because the wire data is already arriving.
7. **The app's Asr comment is the reverse of its data, and it is load-bearing for a worldwide Asr setting.**
   `shared/types.ts:25` documents `asr` as Hanafi and line 27 documents `asr_2` as Shafi; wave 1 established the
   data is the other way round. The app shows `asr`, the one-shadow Shafi time. Fixing the comment is trivial;
   deciding which one a user sees is an owner ruling that a worldwide app cannot avoid, because R2 measured a
   50-minute gap at Islamabad and East London Mosque prints both columns side by side.
8. **Zones defeat the coordinate model, and the app is well placed to adopt them because it never had coordinates
   in the first place.** JAKIM publishes 60+ named zones; Brunei decrees +3 minutes for Belait and +1 for Tutong in
   writing (R2). The app's current location model is a single implicit constant, not a latitude and longitude, so
   there is no coordinate-only assumption to unwind. The right abstraction is a **source identity** (authority plus
   zone or city plus timezone), with coordinates as one kind of source identity among several.
9. **No serious competitor sells method choice as the primary control; every one of them auto-selects and offers an
   override.** Muslim Pro ships an "App Recommended" toggle the user turns OFF to reach the method list (cited).
   Athan Pro "automatically adjusts prayer times according to the ones used by the largest mosques and Islamic
   ministries in each country" and exposes the manual override as a fallback (cited). Pillars "has an option to
   automatically default to the most common prayer calculation method depending on your location" (cited). Guidance
   by the `adhan` authors advertises "no setup required... automatically find your location and configure the prayer
   times" (cited). **Auto-with-override is the settled shape of this product category.**
10. **Every serious competitor also ships per-prayer manual minute offsets, and they describe them as the fix for
    "my mosque differs".** Muslim Pro's "Manual Corrections" page adjusts each prayer up or down (cited). Athan Pro
    tells the user to "add + or subtract - minutes to each prayer" (cited). IslamicFinder advertises "Minutes
    Adjustment to make Prayer times 100% accurate according to local Masjid" (cited). Mawaqit, which does not
    compute for mosques at all, instead supports a CSV upload (cited). This is the industry's answer to the same
    problem this app's owner is worried about.
11. **The accuracy claims made in this market are unsupportable, and several are self-contradicting.**
    IslamicFinder's page title is "Most Accurate Prayer Times" while the same company's Athan Pro help page explains
    that the times may not match your mosque and tells you to correct them by hand (both cited). Mawaqit claims
    "100% Accurate" and is the only one entitled to something like it, because it republishes a mosque's own
    timetable rather than computing (cited). Muslim Pro's marketing says "the most accurate mobile app for prayer
    times" while its own Disclaimer says the content is "not intended to replace any official information provided
    by your local mosque or any other religious authority" and makes "no representations as to the accuracy" (both
    cited). **The honest claim is available and it is a competitive differentiator, because nobody else is making
    it.**
12. **The honest claim this app can make is a reproduction claim, not an accuracy claim.** Proposed wording, in full
    in section 5: the app promises to show **what a named authority published**, names that authority on the screen
    where the times are, and says plainly that authorities differ. It never promises the user's mosque, because R4
    measured nine central London mosques disagreeing by 26 minutes on Fajr and 48 on Asr.
13. **A per-prayer manual offset does not breach the never-invent rule, and the distinction that resolves it is
    authorship.** The standing ruling (`ai/features/uat-2/AUDIT-FINDINGS.md` finding 70) forbids the APP inventing,
    copying, averaging or substituting a time. A user typing "+2 on Fajr" is the user asserting their own mosque's
    time. The conditions that keep it honest are in section 5.4: the offset is explicit, visible on the row, never
    defaulted to non-zero, and never applied silently.
14. **An existing London user must see zero change, and the mechanism already exists in the codebase.** Session 39
    established the pattern: existing installs pin explicitly, only fresh installs negotiate
    (`ai/plans/39-localisation/ASSUMPTIONS.md` A1b). Applied here: on upgrade, an install with cached prayer days
    and no source setting is pinned to **London Prayer Times, explicitly**, and keeps the same provider, the same
    key scheme and the same times. A computed source would move their Fajr by -7 to +6 minutes and their Isha by
    -4 to +11 (wave 1, `ai/features/moonsighting/RESEARCH-FINDINGS.md` section 4.5), which for a user who chose this
    app for London's unified timetable is a defect, not a feature.
15. **The cache wipe on a source change is the one destructive operation the migration must get right.** The upgrade
    path already wipes by whitelist (`stores/version.ts:145-157`) and keeps `preference_`,
    `scheduled_notifications_`, `scheduled_reminders_` and the measured widths. A source change must wipe
    `prayer_` and `fetched_years`, must NOT wipe preferences, and must re-arm the notification plan, because up to
    64 armed OS requests carry the old source's instants. `stores/sync.ts:358-372` already demonstrates the exact
    whitelist to copy.
16. **Sequencing: the first three sessions must all be invisible to users.** In order: (1) make the source explicit
    without changing anyone's times, (2) make the timezone per-source, (3) build the verification fixtures R3
    demanded, all before any second source ships. The reason is that every one of them is a refactor of load-bearing
    machinery with a silent failure mode, and each is independently revertible only while nothing else depends on it.
    Full sequence in section 7.

---

## 1. The codebase inventory: what the app assumes today

All line numbers measured in this worktree on branch `research/global-prayer-times`, app version `1.29.140`
(`package.json:3`).

### 1.1 Summary table

| # | Assumption | Where | What worldwide breaks | Size |
| --- | --- | --- | --- | --- |
| A1 | One timezone for every prayer time | `shared/constants.ts:258` | Every stored clock reading is ambiguous once two cities are cached | Large |
| A2 | The calendar day is London's day | `shared/time.ts:25-34`, `:265-268` | Day boundaries, cache keys and `belongsToDate` all shift per location | Large |
| A3 | The Hijri date is computed in London | `shared/time.ts:241-254` | Off by a day either side of sunset for a user in another zone | Small |
| A4 | Ramadan season is decided in London | `shared/time.ts:310-341` | Decorations appear a day early or late elsewhere | Small |
| A5 | Night times and Istijaba build on a London instant | `shared/prayer.ts:115-176`, `:130-138` | Correct once A1 is fixed; the logic itself is latitude-safe | None, downstream of A1 |
| A6 | One provider, one wire shape | `api/config.ts:3-7`, `shared/types.ts:12-39` | Field names, row set and response envelope all differ per source | Large |
| A7 | Six required fields, one `HH:mm` pattern | `api/client.ts:48,51,78-111` | Extra published rows (Imsak, Syuruk, Duha, jamaah) are dropped before storage | Medium |
| A8 | One year per request, one year cached | `stores/sync.ts:431-509` | The shape survives; the trigger to refetch on a source change does not exist | Medium |
| A9 | MMKV key has no location | `stores/database.ts:138,153` | Two cities' data collide silently under one key | Large |
| A10 | "London, UK" on the screen | `components/day/Day.tsx:48` | Wrong text for everyone else | Trivial |
| A11 | "Prayer times for London" in the widget | `widgets/PrayerWidget.tsx:318,524` | Same, and baked into widget timeline props | Small |
| A12 | App Store slug `athan-london`, GB storefront | `device/updates.ts:15,17` | The update link and the iTunes lookup are storefront-scoped | Small |
| A13 | TLS 1.3 only, because of this one provider | `device/tls13.ts`, `modules/tls13/` | Becomes dead weight or becomes necessary again, depending on the new source | Small |
| A14 | 6 standard + 5 extras, fixed canonical order | `shared/constants.ts:9,26`, `shared/prayer.ts:569-579` | The published row set differs per country | Large |
| A15 | The English prayer name is the identifier | 4 systems, 67 files on disk | Turkey and Malaysia demand the same string carry different concepts | Large |
| A16 | One Asr, documented backwards | `shared/types.ts:25-28` | Two Asr columns are published side by side in the app's own home market | Medium |

### 1.2 The timezone, and its three readers

`shared/constants.ts:254-258` already anticipates this:

> `Timezone of the prayer timetable: every stored prayer time is a wall-clock time here.`
> `The one place to change when the app serves other cities (v2.0)`

**It is not the one place.** It is the one place the value is written, and the value is then baked into a
module-scope object.

- **`prayerClockFormatter`, `shared/time.ts:25-34`.** An `Intl.DateTimeFormat` constructed at module load with
  `timeZone: PRAYER_TIMEZONE`. Everything flows from it: `readOffsetByIntl` (`:51-58`) reads it,
  `prayerTimezoneOffset` (`:75-94`) caches its answers in two module-level `Map`s (`:67-68`), `readPrayerClock`
  (`:101-113`) derives the calendar from it, and `createPrayerDatetime` (`:151-165`), `formatPrayerTime`
  (`:175-178`) and `formatDateShort` (`:265-268`) are built on that. **The two caches are the specific trap**:
  `dayOffsets` and `quarterHourOffsets` are keyed by date and quarter hour only, not by zone, so a per-location
  timezone must key them by zone or clear them on a change, or the app silently uses the previous city's offset.
  Measured.
- **`formatHijriDateLong`, `shared/time.ts:241-254`.** Passes `timeZone: PRAYER_TIMEZONE` to an
  `islamic-umalqura` formatter. Worldwide this must be the user's own zone, because the Hijri day the user is in
  is a function of where they stand.
- **`isRamadan`, `shared/time.ts:310-341`.** Two more `islamic-umalqura` formatters at `:320` and `:331`, deciding
  whether the app is in Ramadan or the pre-Ramadan Sha'ban window (`ISLAMIC_DAY.RAMADAN_DECORATION_DAYS_BEFORE`,
  `shared/constants.ts:251`). Same issue, lower stakes: a decoration, not a prayer time.

**The downstream code in `shared/prayer.ts` needs no change of its own once the zone is per-location**, and this is
worth saying because it looks like it would. `magribCrossesIntoNextDay` (`:115-118`) and `getIstijabaTime`
(`:130-138`) already take instants rather than clock strings precisely so they survive a Magrib past midnight,
and `getNightTimesForDay` (`:159-176`) already refuses to borrow a Magrib from the wrong day. `ai/AGENTS.md`
records the 2026-09-27 sweep that proved this pair correct at latitude over 84,006 states in four polar cities.
The machinery is latitude-ready; only its zone input is pinned.

**Test cost, measured.** 6 files reference `Europe/London` directly outside `ai/`; the shared harness
`__tests__/harness.ts` and `hooks/__tests__/londonDays.ts` pin three real London days (`2026-09-10` to `-12`) that
every rendering suite builds on. 182 test files exist. A per-location zone does not break them, because the harness
would keep London as its fixture city, but every assertion about "the prayer timezone" becomes an assertion about
"this fixture's timezone" and the distinction must be made deliberately rather than discovered.

### 1.3 The provider contract

`api/config.ts` is seven lines and pins everything:

```
endpoint: 'https://www.londonprayertimes.com/api/times'
```

- **`buildApiUrl`, `api/client.ts:19-24`.** Composes `format`, `key`, either `year=` or `date=`, and
  `24hours=true`. The comment at `:14-18` records why `24hours=true` is load-bearing: without it afternoon times
  come back in 12-hour form and still pass `TIME_PATTERN`, so nothing downstream could catch it. That is a
  provider-specific quirk encoded in a provider-agnostic-looking function.
- **`validateApiResponse`, `api/client.ts:39-45`.** Requires a `times` object with at least one key. Rejects an
  empty year as `Incomplete data received`.
- **`REQUIRED_TIMES`, `api/client.ts:48`.** `['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha']`. Note `magrib`
  with one `h`: wave 1 measured that `moonsighting.com` emits `maghrib`, so a second source needs a field mapping
  rather than a passthrough.
- **`TIME_PATTERN`, `api/client.ts:51.`** `/^([01]\d|2[0-3]):[0-5]\d$/`, anchored. Wave 1 measured that
  `moonsighting.com` pads its values (`"06:25   "`) and every day would fail. A worldwide client needs a
  normalising step before the pattern, or a per-source pattern.
- **`validateApiTimes`, `api/client.ts:78-111`.** Per-field, not per-day: an unreadable field becomes `null` and
  the day survives. The 25-line comment above it (`:53-77`) is the most valuable thing in the file for this
  research, because it documents that the design already anticipates a polar run of `"-----"`. It throws only when
  nothing from today onwards is readable. **This is the right shape for worldwide and needs no change.**
- **`filterApiData`, `shared/prayer.ts:39-54`.** Drops everything before yesterday, using
  `TimeUtils.isDateYesterdayOrFuture`, which reads the London day. Downstream of A1.
- **`transformApiData`, `shared/prayer.ts:70-95`.** Copies the six times and derives `suhoor`, `duha` and
  `istijaba` from `TIME_ADJUSTMENTS` (`shared/constants.ts:225-230`: `-20`, `+20`, `-60`). **These three constants
  are the app's own convention, not any authority's**, and section 3.4 shows where that collides.
- **`IApiSingleTime`, `shared/types.ts:12-39`.** 13 fields for 6 prayers. The five `*_jamat` fields and `asr_2` are
  typed, fetched and discarded. Section 3.2 and 3.3.
- **`fetchDay`, `api/client.ts:191-206`.** Hardcodes `city: 'london'` at `:199` when wrapping a single day into the
  shared pipeline. One-line change, listed because it is the kind of thing a grep for `London` with a capital L
  misses.

### 1.4 The sync and storage model

- **Year per request.** `Api.fetchYear` (`api/client.ts:158-164`), driven by `updatePrayerData`
  (`stores/sync.ts:431-509`) across three scenarios: December fetches next year alone when this year is cached
  (`:441-456`), December fetches both (`:461-491`), otherwise this year alone (`:493-504`). R4 measured that the
  same shape transfers to a whole-year AlAdhan fetch (27 KB gzipped) and to JAKIM's own zone API, so **the yearly
  architecture the owner wants is confirmed and needs no redesign**, only a new trigger.
- **The missing trigger.** `needsDataUpdate` (`stores/sync.ts:275-287`) refetches when today is not stored or when
  December needs next year. **Nothing refetches because the source changed**, because there is no source. A source
  change must behave like `replacePrayerCache` (`:338-389`) does today, and that function is the right model: it
  reads the armed days first (`:345`), wipes by whitelist (`:358-372`), carries yesterday across the wipe
  (`:349-374`), and reopens the notification gate when an armed day changed (`:126-132`).
- **The key scheme.** `saveAllPrayers` writes `prayer_${prayer.date}` (`stores/database.ts:136-145`);
  `getPrayerByDateString` reads `prayer_${date}` (`:152-160`). **No location, no source, no zone.** Two
  consequences. First, cached data from city A is indistinguishable from city B. Second,
  `stores/sync.ts:67-74`'s `isTodayGapInStoredYear` and `:393`'s `getAllWithPrefix('prayer_${year}-')` both scan by
  the prefix, so the key change reaches the sync layer, not just the database layer.
- **What the schema marker buys.** `CACHE_SCHEMA_VERSION = 1` (`stores/version.ts:135`) exists for exactly this
  case: its own comment says to bump it "when a release changes the SHAPE of cached data". A key-scheme change is
  the textbook bump, and `cacheSchemaChanged` (`stores/version.ts:166-186`) treats a missing marker as changed, so
  the mechanism already handles the one-time wipe.
- **The notification bookkeeping is keyed by schedule and index, not by location.**
  `scheduled_notifications_${scheduleType}_${prayerIndex}_${id}` (`stores/database.ts:193`) and
  `scheduled_reminders_...` (`:258`). These records describe what the OS has armed. A source change invalidates
  every armed instant, so the records and the alarms must both be swept, and `stores/sync.ts:364-371`'s comment
  explains why the wipe deliberately keeps them today ("a new timetable does not change what the OS has armed") --
  which is true for a new timetable of the SAME source and false for a different source. **That comment becomes
  wrong the day a second source ships, and it is the kind of correct-until-it-is-not invariant that costs a
  release.**

### 1.5 The hardcoded London strings

Three, all measured:

| File and line | String | Note |
| --- | --- | --- |
| `components/day/Day.tsx:48` | `London, UK` | The natural home for the authority name. Section 5.2 |
| `widgets/PrayerWidget.tsx:318` | `Prayer times for London` | Widget subtitle |
| `widgets/PrayerWidget.tsx:524` | `Prayer times for London` | The `NeutralCard` placeholder |
| `device/updates.ts:15` | `itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb` | The comment says `country=gb` is load-bearing because the app is published in the GB storefront alone |
| `device/updates.ts:17` | `apps.apple.com/gb/app/athan-london/id...` | The slug |

The widget strings are the awkward pair, because `ai/AGENTS.md` records that a widget layout can never call a
translation library (the widget runtime's React is a five-name stub). Any authority name in a widget must be
resolved in the app and baked into the timeline props, exactly as session 39 concluded for localisation. The
`README.md:157` line "Prayer times data sourced from London Prayer Times" is the public-facing version of the same
claim and is where the honest-claim wording should also land.

**`athan-london` is a store listing question, not a code question.** The slug in a URL can be changed; the App
Store product page identity and its reviews cannot be moved without cost. Out of scope for this report, flagged so
it is not discovered late.

### 1.6 `modules/tls13`

`device/tls13.ts` (24 lines) and `modules/tls13/android/.../Tls13InitProvider.kt` exist for one reason, stated in
both files' own comments: `www.londonprayertimes.com` accepts TLS 1.3 alone, and Android 9 and older ship TLS 1.3
disabled. The `ContentProvider` installs Play Services' security provider before `Application.onCreate` because
OkHttp snapshots `SSLContext.getDefault()` at client construction.

Three outcomes, and the research cannot pick between them:

- If v2.0 is fully offline with no HTTP at all, the module becomes dead code and should be deleted.
- If v2.0 keeps London Prayer Times as London's source, the module stays exactly as it is.
- If v2.0 adds a second HTTP source, **that source's TLS requirements are UNVERIFIED** and must be measured before
  the module's fate is decided. Wave 1 recorded the same gap for the moonsighting hosts
  (`ai/features/moonsighting/RESEARCH-FINDINGS.md` section 4.1: "Whether the moonsighting hosts need them has not
  been measured").

The module is small and harmless when unnecessary, so the risk here is not cost, it is deleting it and then
needing it.

### 1.7 The prayer set and the identifier

**The set** (`shared/constants.ts:9,26`):

```
PRAYERS_ENGLISH = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']
EXTRAS_ENGLISH  = ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']
```

**The order is an owner invariant.** `ai/AGENTS.md:821` records it: "Extras display order invariant (owner) --
Midnight 1st, Last Third 2nd, Suhoor 3rd, Duha 4th, Istijaba 5th (Friday-only, always last). Enforced by
`canonicalDisplayOrder` + `EXTRAS_ENGLISH`; never re-litigate." `canonicalDisplayOrder` is at
`shared/prayer.ts:569-579` and ranks by `EXTRAS_ENGLISH.indexOf(english)`.

**The identifier's blast radius, from session 39's own measurement** (`ai/plans/39-localisation/MEASURED.md`
sections 2, confirmed against this worktree):

| System | Site | Built from |
| --- | --- | --- |
| MMKV preference keys | `stores/notifications.ts:207` | `preference_alert_${type}_${prayerName.toLowerCase()}` |
| OS notification id (at-time) | `device/notifications.ts:50` | `athan_${scheduleType}_${englishName.toLowerCase()}_${date}` |
| OS notification id (reminder) | `device/notifications.ts:61-66` | `reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}` |
| Audio filename | `shared/notifications.ts:147,161-162` | `prayerNameSlug(name)` then `reminder_${slug}_${interval}.mp3` |
| Android channel id | `shared/notifications.ts:388-389` | `reminder_${slug}_${intervalMinutes}_v3` |
| Display order | `shared/prayer.ts:574` | `EXTRAS_ENGLISH.indexOf(english)` |
| Islamic-day rules | `shared/prayer.ts:248,258,348,358` | `MIDNIGHT_CROSSING_PRAYERS.includes`, `NIGHT_PRAYER_NAMES.includes` |
| Row lookup from the stored record | `shared/prayer.ts:407` | `rawData[name.toLowerCase()]` |

Measured in this worktree: `assets/audio/reminders/` contains **67 files**, and Android's `res/raw` accepts
`[a-z0-9_]` only, so those slugs can never carry a non-Latin script. Session 39's conclusion stands and is
strengthened by this wave: **the English name is the identifier, permanently.**

What R1 and R2 add is a second, independent reason for the same split. Session 39 needed the identifier stable so
a language change does not orphan preferences. Worldwide needs it stable so a SOURCE change does not, and it needs
one more layer: the concept. `shared/prayer.ts:407` reads the stored record by `name.toLowerCase()`, which ties the
identifier to the storage field name as well. Three things currently collapsed into one string:

1. **The concept** (the second prayer of the day, whose window ends at sunrise).
2. **The identifier** (`Fajr`, forever, in keys and filenames).
3. **The label** (`Fajr` in English, `İmsak` in Turkish, `Subuh` in Indonesian).

Turkey is the case that proves all three are needed: the concept is Fajr, the identifier must stay `Fajr` or 67
mp3 files break, and the label must read `İmsak` or the user is looking at a row their national timetable does not
print.

---

## 2. What the app does well already, and should not lose

Stated because a worldwide rewrite is the moment these get discarded by accident.

1. **Per-field nullability with `--:--` rendering.** `api/client.ts:78-111` and
   `shared/types.ts:108-122`. R1 measured that Fajr and Isha have no answer at all above roughly 49 degrees in
   summer, and R3 measured that `adhan` returns `Invalid Date` by default rather than guessing. The app already has
   the only correct representation of "this time does not exist", and `UNAVAILABLE_TIME` (`shared/constants.ts:268`)
   is drawn only, never stored, never parsed.
2. **The never-substitute rule and its enforcement.** `ai/features/uat-2/AUDIT-FINDINGS.md` finding 70. Wave 1's
   R4 section 5.6 independently reached the same line for a different reason: a constant-offset correction model
   (Model A) is non-compliant because on 40% of values it would display a time the authority never printed, while
   an exact per-day residual (Model C) is compliant because it reconstructs the authority's own digits. **The rule
   the app already has is the rule the data model needs.**
3. **A row that has no time still has a place.** `createPrayersForSingleDay` (`shared/prayer.ts:376-422`) returns an
   `UnreadablePrayer` rather than dropping the row, and `compareListOrder` (`shared/sequence.ts:45`) orders by list
   position rather than by instant because an unreadable row has none. Polar days need exactly this.
4. **The 64-request budget is a platform ceiling, handled as one.** `shared/constants.ts:75` and the 2026-09-27
   entry in `ai/AGENTS.md`. Worldwide adds no new alarms, but a source change re-arms all of them, so the budget is
   a migration constraint (section 6).

---

## 3. The data-model gaps, each with a proposed design answer

Each subsection states the evidence from wave 1, then what the model must hold, then a concrete proposal. The
proposals are designs to be ruled on, not decisions.

### 3.1 Imsak

**The evidence.** R2, measured. Malaysia: JAKIM's official API returns `imsak` and `fajr` as separate fields and
the gap was exactly 10 minutes on all 30 sampled days of zone `SGR01`, with no seasonal variation. Indonesia:
Kemenag's own words, "Imsak 10 menit sebelum waktu Subuh", confirmed at 10 minutes on 30 sampled days. Turkey:
Diyanet's table has six rows and the first is `İmsak`; **there is no Fajr row to compare it against**. Brunei
prints `Imsak` and `Suboh` as separate columns. Singapore and Germany publish an Imsak only in a Ramadan context.

**The failure mode, stated exactly.** A calculation library configured to JAKIM's own published angles lands on
JAKIM's published **Imsak**, not its Subuh (R2, measured: computed Fajr minus official Subuh was -8 to -10 minutes
every day, while computed Fajr minus official Imsak was 0 to +2). So the two errors are:

- Label a Malaysian computed Fajr as "Fajr" and the user prays 10 minutes early.
- Label a Turkish `İmsak` as an Imsak, hide it behind a Suhoor row, and the user has no Fajr row at all.

**What the model must hold.** Not a field named after a row. A **binding between a published row and a concept**,
declared per source. The concepts are fixed and small; the row names are not.

**Proposal I1: a source declares a row map.**

| Concept | What it is | Published as |
| --- | --- | --- |
| `fajr` | The prayer whose window opens at dawn | `Fajr`, `Subuh`, `İmsak` (Turkey), `Sobh`, `الفجر` |
| `imsak` | The caution margin before `fajr`, where an authority publishes one | `Imsak` (Malaysia, Indonesia, Brunei) |

A source declares, in data rather than in code:

```
londonPrayerTimes: { fajr: 'fajr' }                       // no imsak published
jakim:             { fajr: 'subuh', imsak: 'imsak' }      // both published, both stored
diyanet:           { fajr: 'imsak' }                      // the İmsak row IS fajr
```

Three rules follow, and each closes a specific failure:

1. **`fajr` is always populated, from whichever published row carries the concept.** So Turkey's `İmsak` lands in
   `fajr`, every downstream rule (`NIGHT_PRAYER_NAMES`, the night calculation, the notification identifier
   `athan_standard_fajr_...`) keeps working, and every preference key survives.
2. **`imsak` is populated only when the source publishes one.** Never derived, never computed from `fajr - 10`.
   Deriving it would be inventing a time the authority did not print, which finding 70 forbids, and R4's Model A
   versus Model C analysis independently rules out.
3. **The LABEL of the `fajr` row is a per-source, per-locale string.** In Turkey it reads `İmsak`. This is the same
   mechanism session 39 already needs for localisation, with one extra input (the source), and that is the argument
   for doing the identifier/label split once for both reasons.

**What this costs the app.** `imsak` is a new nullable field on `ISingleApiResponseTransformed`
(`shared/types.ts:108-122`) and a new Extras row. Section 3.4 shows it collides with `Suhoor`, which is the harder
half.

**Open for the owner.** Whether a user in Turkey should see one row or two. The Turkish tradition prints one; the
app's own Suhoor row is a second one it invented. Recommended: follow the source, which for Turkey means one row.

### 3.2 Jamaah and iqama

**The evidence.** R2: East London Mosque prints `Begins` and `Jamā'ah` for every prayer. A Cairo mosque on Mawaqit
publishes fixed jamaah offsets of +25, +20, +20, +10, +20. ISNA-Jami Mosque Toronto prints Fajr 06:30 against an
Athan of 05:42, **a 48-minute gap**, and Isha 08:45 against 08:30. Masjidbox separates "Athan times (Start)" from
"Iqamah Time (Jamaah)" as configurable things. R2's conclusion: "No calculation reproduces these."

**What the app already has.** `shared/types.ts:18,24,30,34,38` type `fajr_jamat`, `dhuhr_jamat`, `asr_jamat`,
`magrib_jamat`, `isha_jamat`, each commented "not used in app". `api/client.ts:48`'s `REQUIRED_TIMES` drops them
before `transformApiData` sees them. **The data has been arriving from London Prayer Times since the app shipped
and has never once been rendered.**

**What the model must hold.** A jamaah time is a **second time per prayer, from the same source, of a different
kind**. It is not a variant of the prayer time and it is not derived from it. It has three properties the model
must respect:

1. It exists for some prayers and not others.
2. It is not available from any computation, so a computed source has no jamaah at all, and that null must be
   representable.
3. It is the time the user attending that mosque actually acts on, so it competes with the start time for the
   countdown and the notification.

**Proposal J1: jamaah is an optional second instant per row, never a replacement, and never the default alarm.**

- `ISingleApiResponseTransformed` gains a nullable `jamaah` per standard prayer, populated only where the source
  publishes one.
- The row renders both when a jamaah exists, with the start time primary. R2's evidence that mosques print `Begins`
  and `Jamā'ah` side by side is direct evidence for side by side rather than a toggle.
- **The alarm decision is an owner ruling and should not be defaulted.** Arming the jamaah rather than the start
  would double the requests against a 64 ceiling that session 28 measured is already tight
  (`ai/AGENTS.md`, 2026-09-27: standard 6 prayers with both reminders covers 3 days). The safe default is that the
  jamaah is displayed and never armed, with arming it a later, explicit feature.
- Extras never have a jamaah. Midnight, Last Third, Suhoor, Duha and Istijaba are not congregational.

**Why this is the cheapest large win available.** The types exist, the wire data exists, `validateApiTimes` would
need five more optional fields, and the London user gets a visibly better product with no change to any existing
time. It is also the only part of this whole report that makes the app strictly more faithful to its current source
rather than less.

**The trap to record.** R2 found a 48-minute gap at Toronto. If a jamaah time is ever shown without its start time,
or in a widget where only one fits, the app is showing a number that is not the prayer time and may be three
quarters of an hour from it. The widget is the risk, because `widgets/PrayerWidget.tsx` renders one time per row.

### 3.3 Two Asr columns

**The evidence.** R2: East London Mosque's published timetable carries `1 Mithl` and `2 Mithl` side by side.
Wifaqul Ulama publishes both, defining Shafi Asr at shadow factor 1 and Hanafi at factor 2, and tells a reader with
no local scholar to use the Hanafi time. R1: every national authority timetable measured publishes exactly ONE Asr,
and it is always the standard factor-1 one, including in Hanafi-majority Turkey (measured 49 minutes from the
Hanafi computation) and Saudi Arabia (55 minutes). `moonsighting.com` records a third factor, 4/7 for Shia. R2
measured the Islamabad gap at 50 minutes.

**What the app has, and the defect.** `shared/types.ts:25` says `asr` is "Hanafi calculation" and `:27` says
`asr_2` is "Shafi calculation, not used in app". **Wave 1 established this is backwards**
(`ai/features/moonsighting/RESEARCH-FINDINGS.md` section 4.5: "the app shows `asr`, the Shafi'i (one shadow length)
Asr"). The comment is wrong; the behaviour is the one-shadow Asr.

**What the model must hold.** Not "an Asr setting". A source publishes either one Asr or two, and that is a
property of the source, not of the user.

**Proposal A1: `asr` is always the source's primary Asr; `asrAlternate` is nullable and populated only when the
source publishes a second.**

- A source that publishes one Asr (every national authority measured in R1) fills `asr` and leaves `asrAlternate`
  null. The user gets no Asr choice, because the authority does not offer one, and offering a choice the authority
  does not publish would mean computing a time it never printed.
- A source that publishes two (London Prayer Times today, Wifaqul Ulama, East London Mosque) fills both, and the
  user chooses which is shown. The choice is a display preference over two published numbers, so it breaks no rule.
- A COMPUTED source is the one case where the app itself decides the factor, and there the madhhab setting is a
  genuine calculation input, not a display preference. R1's conclusion applies: "the Asr factor cannot be derived
  from the country".

**Three concrete actions this implies, in increasing size:**

1. Correct the comments at `shared/types.ts:25-28`. Trivial, and should happen regardless of anything else in this
   report, because a wrong comment about which madhhab a shipped time belongs to is the worst kind of stale
   comment.
2. Decide which Asr a London user sees. Wave 1 left this open as owner question 8. **Recommendation: do not change
   it.** Existing users have been praying the app's `asr` for its whole life, and the standing rule is that an
   existing user's settings are never silently changed. Surface `asr_2` as an option; never switch anyone.
3. Add `asrAlternate` to the model when a second source needs it.

### 3.4 Extra rows: the app's Extras against the world's published rows

**The evidence.** R2: Malaysia's official row order is `IMSAK`, `SUBUH`, `SYURUK`, `DUHA`, `ZOHOR`, `ASAR`,
`MAGHRIB`, `ISYAK`. Brunei prints `Imsak`, `Suboh`, `Syuruk`, `Doha`, `Zohor`, `Asar`, `Maghrib`, `Isyak`.
Indonesia's Kemenag criteria define Dhuha at the sun 4.5 degrees above the horizon. Turkey publishes `Kıble Saati`
and an astronomical sunrise and sunset distinct from the `Güneş` and `Akşam` prayer rows.

**The app's Extras and where they come from** (`shared/constants.ts:26,54` and `:225-230`):

| App row | How the app gets it | Published anywhere? | Conflict |
| --- | --- | --- | --- |
| `Midnight` | Midpoint of Magrib to Fajr, computed from two stored days (`shared/time.ts:406-413`) | Rarely as a row; Al-Azan ships it as a setting (cited) | None. It is a derived concept, not a claimed authority row |
| `Last Third` | Two thirds through the same night (`shared/time.ts:412`) | Rarely | None, same reason |
| `Suhoor` | `Fajr - 20` (`TIME_ADJUSTMENTS.suhoor = -20`) | **Yes, and differently.** The official row is `Imsak` at Fajr **-10** in Malaysia and Indonesia | **Direct conflict.** Section 3.1 |
| `Duha` | `Sunrise + 20` (`TIME_ADJUSTMENTS.duha = 20`) | **Yes, and differently.** JAKIM prints `Duha`, Brunei `Doha`, Kemenag defines it at the sun 4.5 degrees up | **Direct conflict.** Same name, different number |
| `Istijaba` | `Magrib - 60` on Fridays (`shared/prayer.ts:130-138`) | **Almost nowhere.** Null in 24 of 28 locales in session 39's sourced catalog | No conflict, but no external support either |
| (absent) | -- | `Syuruk` / `Syuruq` | The app's `Sunrise` covers it |
| (absent) | -- | `Kıble Saati` (Turkey) | Out of scope; rows 37, 40 and 41 own qibla |

**The two real conflicts, stated precisely.**

- **`Duha` is the sharp one.** The app publishes a row called `Duha` whose value is `Sunrise + 20` minutes, a
  convention of the app's own. JAKIM publishes a row called `Duha` whose value is JAKIM's. A Malaysian user opening
  the app sees a familiar row name against an unfamiliar number, with no way to tell that the app's Duha is not
  their timetable's Duha. **This is worse than a missing row, because it looks right.**
- **`Suhoor` against `Imsak` is the same shape with different numbers.** 20 minutes against 10.

**Proposal E1: a derived Extra must never wear a published row's name when a published row of that name exists for
the user's source.**

Three mechanisms, in order of preference:

1. **Take the published row when the source publishes one.** If JAKIM publishes `Duha`, show JAKIM's Duha and stop
   computing. This is the only option that fully honours the never-invent rule: `Sunrise + 20` is the app's
   invention, and it is indistinguishable on screen from the authority's number.
2. **Where no source publishes it, keep the app's derived row and mark it as derived.** Midnight, Last Third and
   Istijaba are in this class today and can stay. The Extras explanation strings already do this work
   (`shared/constants.ts:54-60`: "20 mins after Sunrise" is literally printed in the app), which is a genuinely
   strong existing position: the app already tells the user how its Extras are computed.
3. **Where the source publishes a row the app has no concept for, add it or drop it, never rename it.**

**Proposal E2: `TIME_ADJUSTMENTS` becomes per-source.** Today it is four module constants
(`shared/constants.ts:225-230`) and one comment in `shared/types.ts:142-143` says they are "the only place they are
defined; do not restate a number here without it". Worldwide, `suhoor: -20` is the app's number for London and
`-10` is Indonesia's for Indonesia, so the constant becomes source data and the comment's rule (one definition
point) must be preserved through the move.

**The order invariant survives.** `ai/AGENTS.md:821` fixes Midnight, Last Third, Suhoor, Duha, Istijaba in that
order. Adding `Imsak` needs a position in it, which is an owner ruling, not a design decision. The natural reading
of every official table (Imsak first, before Subuh) argues for Imsak before Suhoor if both ever coexist, but if
proposal I1 is adopted they rarely will, because Imsak IS that source's Suhoor.

### 3.5 Zones rather than coordinates

**The evidence.** R2: JAKIM publishes by zone, "more than 60 named zones such as `SGR01` and `WLY01`, each covering
several districts. The official time for a village is its zone's time, not the time computed at the village."
Brunei's ministry states on its own page that Belait district adds 3 minutes and Tutong adds 1. R1 adds that JAKIM
assigns separate zones to high ground (`PHG06` Cameron Highlands, `PRK07` Bukit Larut, `SBH06` Gunung Kinabalu),
which is elevation handled by zoning.

**Why this is an opportunity rather than a problem for this app specifically.** The app has never had coordinates.
Its location model is a single implicit constant and its provider takes a `key` and no position
(`api/client.ts:19-24`). So there is no coordinate-shaped abstraction to unwind. A worldwide app that started from
`lat`/`lon` would have to retrofit zones; this one can adopt the right abstraction first time.

**Proposal Z1: the app's location model is a SOURCE IDENTITY, of which a coordinate is one kind.**

```
{ kind: 'provider', id: 'london-prayer-times', timezone: 'Europe/London' }
{ kind: 'zone',     id: 'jakim:SGR01',         timezone: 'Asia/Kuala_Lumpur' }
{ kind: 'zone',     id: 'mora:belait',         timezone: 'Asia/Brunei' }
{ kind: 'computed', method: '...', coords: {...}, timezone: 'Asia/Jakarta' }
```

Properties this buys, each answering something wave 1 found:

- **A zone needs no coordinate at all**, which is what JAKIM's model actually is.
- **The timezone travels with the source**, which is A1's fix and R4's finding 17 (a stale tz database made every
  Moroccan prayer time an hour wrong on 103 days of 2026).
- **The source identity is the natural MMKV key prefix**, which closes A9: `prayer_${sourceId}_${date}`.
- **Brunei's decreed district offsets are a property of the zone**, not a correction the app applies to a
  coordinate. `mora:belait` is a different source identity from `mora:brunei-muara`, and its published times are
  its published times.
- **It makes "which authority is this" a first-class, displayable fact**, which section 5.2 needs.

**What it does NOT solve.** Choosing the zone for a user. A coordinate maps to a JAKIM zone only through a
polygon set or a district lookup that this research has not sourced. R4's survey found JAKIM's zone list but no
authoritative zone-to-coordinate mapping, so **zone selection from GPS is UNVERIFIED and should be assumed to need
a user-facing picker at first**. A picker is also what every mosque-clock product does: R2 found Al-Harameen clocks
select "cities by international telephone dialing code".

---

## 4. What comparable apps actually do, and what they claim

Every row below is **cited** from the source named. Where a figure could not be established from the vendor's own
material it is marked UNVERIFIED rather than estimated. These are documentation and store-listing readings, not
installed-app measurements; no app was installed or driven on a device for this report, and that limit is recorded
in section 8.

### 4.1 The comparison

| App | Methods exposed | Auto-select by country? | Per-prayer offsets? | Names the authority? | High latitude | Accuracy claimed |
| --- | --- | --- | --- | --- | --- | --- |
| **Muslim Pro** (Bitsmedia) | A "Fixed Calculation (Advanced)" list including Muslim World League; Asr school separately; the France article names UOIF 12, GMP 18 and "some other Mosques 15" | **Yes.** An "App Recommended" toggle is ON by default and must be turned OFF to reach the list | **Yes.** A dedicated "Manual Corrections" page adjusts each prayer up or down | **Partly.** A "Verified" badge appears beside a city whose times were "added and verified with the local Mosques and/or Religious Authorities" | A "High Latitude Adjustment" setting, described as "relevant for locations above 48 degrees" and it "should match your local mosque" | "the most accurate mobile app for prayer times and Adhan"; "Muslim Pro partners with trusted religious authorities"; **and its own Disclaimer says the content is "not intended to replace any official information provided by your local mosque"** |
| **Athan / Athan Pro** (IslamicFinder / Quanticapps) | 7 named organisations published on the web product with their angles (MWL 18/17, Egyptian 19.5/17.5, Karachi 18/18, Umm Al-Qura 18.5 with Isha at 90 min and 120 in Ramadan, ISNA 15/15, UOIF 12/12, MUIS 20/18) | **Yes.** "The Athan Pro application automatically adjusts prayer times according to the ones used by the largest mosques and Islamic ministries in each country", with an "Auto Detection" option | **Yes.** "add + or subtract - minutes to each prayer"; the Windows product advertises "Minutes Adjustment to make Prayer times 100% accurate according to local Masjid" | **Yes, as a setting label.** The web page prints the active method and its angles under the times: "Islamic Society of North America ... Fajr 15.0 degrees, Isha 15.0 degrees, Hanbali, Maliki, Shafi" | UNVERIFIED from the vendor's own material | "Most Accurate Prayer Times" (site title); "the most accurate prayer times"; "100% accurate according to local Masjid" (as the RESULT of the user's own manual adjustment) |
| **Pillars** | "Multiple Calculation Methods", named on the marketing site as "including the Moonsighting Committee, ISNA and Muslim World League"; Asr school as "Early & Late Asr Time" | **Yes.** "an option to automatically default to the most common prayer calculation method depending on your location (e.g. in North America it's ISNA)", exposed as "Autopilot" / "Auto detect" | **Not yet.** Its FAQ says "NOTE: We will also be giving users the ability to set their own custom angles and fixed adjustments soon" | **Yes.** A user screenshot quoted in `r/islam` shows the app printing "Fajr 18.0 degrees, 17.0 degrees, Hanbali, Maliki, Shafi" | "we have the following two high latitude rules available", with an angle-based third "soon" | No accuracy superlative in the store listing. Positions on "Ad-free, Muslim made and privacy focused" instead |
| **Guidance** (Batoul Apps, the `adhan` authors) | "an impressive set of advanced configurations" for those who want them, unenumerated publicly | **Yes, and it leads with it.** "Guidance just works - no setup required. It will automatically find your location and configure the prayer times for your area" | UNVERIFIED | **In its release notes, yes, and it names the RULING.** 4.8.2: "Based on the ruling of the Fiqh Council of North America, the default calculation method for users in the US and Canada has been updated to be the 'Islamic Society of North America' method which uses a Fajr and Isha angle of 15 degrees" | UNVERIFIED | **No accuracy superlative found anywhere in its listing or site.** The quietest claim in the field |
| **Mawaqit** | 10 named methods listed in its help centre with angles, plus mosques may set their own angles | **No, and deliberately.** It shows "the prayer times chosen by the mosques". A calculated fallback exists "if no mosques are around you" | **Yes, for mosques.** The mosque admin downloads a CSV, edits it, and re-uploads with the source switched from "Automatic" to "Calendar" | **Yes.** The mosque IS the named authority | UNVERIFIED | **"100% Accurate: Salah and iqamah times as set by your Imam"** and "Unlike other apps that provide you with approximations, we provide you with the precise timetables set by your Imam". **This is the one claim in the field that is defensible, because it is a republication claim, not a calculation claim** |
| **e-Diyanet** (the Turkish state's own app) | None exposed. It is the authority | **n/a.** It serves Diyanet's own tables | UNVERIFIED | Implicitly: the publisher is Diyanet İşleri Başkanlığı | Diyanet's published rule applies (R1: Isha at Maghrib + 1h20 above 45 degrees) | "Accurate and reliable prayer times based on your location". No superlative |
| **Al-Azan** (open source, AGPL-3.0, `meypod/al-azan`) | "Many options for Adhan calculation" via `adhan-js`; "very transparent on method of calculation" per its Play listing | UNVERIFIED | Reminders before or after a prayer time; per-prayer minute offsets UNVERIFIED | UNVERIFIED | **Yes, and it is the best behaviour found in the whole survey.** Release 2.3.1: "Now the app warns if some days cannot be calculated due to polar conditions and asks user to set them early to not get surprises" | None. Positions on "Ad-Free", "No internet permission: the app can never access the internet", "Doesn't use any kind of trackers" |

**Muslim Assistant** could not be studied. The name resolves to several unrelated products across Play, the App
Store and Huawei AppGallery, and no vendor documentation naming its calculation settings was located. Recorded as
UNVERIFIED rather than filled in from a listicle.

### 4.2 The product question: is method choice a setting users understand?

**No, and the evidence is consistent across every source read.**

The clearest single piece is a user in the `r/islam` thread on Pillars, after three separate commenters had
correctly explained angles, madhhab and high-latitude rules:

> "Thank you for the long comment I really appreciate it! it's still to technical and I just want to know how to
> fix it. Just looking for someone just tell me what to do, idc what the problem is or why I just want the right
> times on there."

And in the same thread, from a different user:

> "Also choosing a calculation method as a revert is already confusing enough as it is lol."

The answer that thread converged on, repeatedly and from different people, was not a setting. It was **"just look
up your local masjid and use their timings"** and **"Use MAWAQIT, it automatically connects with a masjid nearby"**.

A second thread ("I broke my fast at 6:58, and my sister broke hers at 7:01") produced the same answer from six
different commenters: follow your local mosque's timetable, apps can be wrong.

**What the products do about it, which is the stronger evidence than what users say.** Every one of the five
computing apps in the table ships auto-selection as the default and hides the method list behind a toggle, a
switch, or an "advanced" label. Muslim Pro requires turning OFF "App Recommended" to see the list at all. Pillars
calls its version "Autopilot". Guidance's entire pitch is "no setup required". **Four independent teams, with very
different philosophies about ads, privacy and price, converged on the same interaction model.** That is the
strongest available evidence that method choice is an expert control, and the product's real job is picking
correctly on the user's behalf and being clear about what it picked.

**The third piece: everyone also ships an escape hatch, and it is always a per-prayer minute offset.** Muslim Pro,
Athan Pro and IslamicFinder all ship it and all describe it in the same terms, as the way to match the local
mosque. Pillars has committed to shipping it. Mawaqit's equivalent is the mosque's own CSV. Section 5.4 uses this.

### 4.3 What breaks trust, from reviews and forums

Cited, and worth reading as failure modes rather than as competitor weaknesses.

1. **A mismatch with the local mosque is read as a bug, not as a method difference.** The `unstar.app` review
   analysis of 1-to-3-star reviews across the five largest apps lists it as one of five complaints that "repeat
   regardless of which job an app leads with": "Reviews describe times drifting several minutes from the
   neighborhood mosque, the app defaulting to the wrong calculation method for the user's region, and Asr time
   being off because the app used the wrong juristic (Hanafi vs Shafi) setting. For a tool whose entire job is
   timing, a few minutes is a real failure."
2. **Users compare apps against each other and treat the difference as one app lying.** "Mawaqit is showing fajar
   at 1.45 am and muslim pro at 3.54 am" (Facebook group, cited). Both are correct outputs of different
   conventions.
3. **A change in the app's own times, without explanation, is alarming.** "My muslim pro app changed the fajr time
   back 16 minutes from yesterday. my whole family was freaking out lol and had to verify with several websites."
   **This is the exact shape of the migration risk in section 6.**
4. **A high-latitude setting left wrong produces times users read as broken, and nothing in the app says so.** The
   `r/islam` Belgium thread: the user thought Pillars had a bug across several methods; the cause was the
   high-latitude rule, diagnosed by another user, and the fix was a setting. Notably, Pillars' own developer
   replied in the thread that "the top right '!' icon indicates he is not using our recommended settings", so the
   app DID signal it and the signal was not understood.
5. **Silent notification failure outranks time accuracy in anger.** The same review analysis puts "Adhan
   notifications that silently fail" among the top five, worse on Android battery managers. This app has already
   done that work (sessions 25, 27, 28), which is worth knowing when weighing where v2.0's effort goes.

**The product lesson, and it is the one this app is best placed to act on: the trust failure is not that the app
is wrong, it is that the user cannot tell WHY it differs.** Every complaint above is resolvable by the app saying,
on the screen where the time is, whose time it is showing.

---

## 5. The honest claim

The owner's thesis: "my thesis of research need, honestly, this is accuracy. We need absolute accuracy for this."

R1's finding, in its own words: "an app claiming absolute accuracy for Fajr and Isha claims something no authority
on earth claims for itself." FCNA's own 2024 paper says the Fajr and Isha phenomenon is "not scientifically
predictable for each location on Earth" and puts the observed range at 12 to 18 degrees "or even between 9 to 20"
(cited, R1). Diyanet, a state authority, says in writing that on the high-latitude question "up to now no unity has
been achieved on any single estimation method" (cited, R1).

**The resolution is not to abandon the accuracy thesis. It is to notice that the owner's thesis is about
faithfulness and the word "accuracy" is doing two jobs.** The app's existing behaviour already shows which job the
owner means. Finding 70's ruling is: "the app's entire value is that it shows THEIR number rather than the app's."
That is a faithfulness standard, and it is achievable absolutely.

### 5.1 What the app can truthfully promise

**The promise, in one sentence, proposed as the canonical wording:**

> **Athan shows you the prayer times exactly as your chosen authority publishes them. It never calculates a time
> of its own, never adjusts one, and never fills a gap with a guess.**

That is absolute, it is testable, and no competitor in section 4 makes it.

**A longer form, for a Help entry or a store listing:**

> **Whose times are these?**
>
> Prayer times differ between authorities, and they differ by more than most people expect. For Fajr and Isha the
> published positions of the world's authorities span about eight degrees of solar depression, which is worth 35
> minutes near the equator and over an hour in northern Europe. The reason is not that anyone is careless: the
> first light of dawn is not a fixed angle of the sun, and the authorities say so themselves.
>
> So Athan does not tell you the one correct time, because there is no such thing to tell. It tells you what one
> named authority published, and it names that authority beside the times. If you switch to another authority, the
> times will change, and that is not a fault in either of them.
>
> Athan never invents a prayer time. It does not average two sources, it does not copy yesterday's time into a
> gap, and where a time genuinely does not exist, as Fajr and Isha do not on some summer days in the far north, it
> shows `--:--` rather than a number.

**What the app must never say**, with the reason:

| Do not say | Why |
| --- | --- |
| "The most accurate prayer times" | No authority claims this for itself. R1 finding 10 |
| "100% accurate" | Only true of a republication of one mosque's own table, which is Mawaqit's position, not this app's |
| "Verified by scholars" | Unless a named body has verified this app's output, which none has |
| "Accurate to the minute" | True for Dhuhr, sunrise and Maghrib, false for Fajr and Isha, and the sentence does not distinguish |
| "Matches your mosque" | R4 measured nine central London mosques 26 minutes apart on Fajr |

**One claim the app CAN make that is unusually strong, and should:** it is offline. R3 and R4 both conclude a local
library plus shipped data is viable. Al-Azan's Play listing shows the marketing value: "No internet permission: the
app can never access the internet." That is a promise about the product's nature, it is verifiable by the user in
the OS permission screen, and it costs nothing in honesty.

### 5.2 Naming the authority in the UI

**Principle: the authority appears on the screen where the times are, not in a settings sheet the user visits
once.** Athan Pro and Pillars both already print the method under the times on their web products (cited), which
is evidence the pattern is acceptable to users in this category.

**The proposed placement, using the app's existing furniture:**

`components/day/Day.tsx:48` currently renders `London, UK` as `styles.location`, secondary colour, small size,
directly above the date. That line is already an origin statement, and it is the right slot. It becomes the source
line:

| Source kind | What the line reads |
| --- | --- |
| A provider serving a mosque-adopted table | `London Prayer Times · London, UK` |
| A national authority's own feed or data | `JAKIM · Selangor (SGR01)` |
| A computed method | `Muslim World League · Jakarta` |

Three rules:

1. **It always names a body, never a technique.** `Muslim World League` rather than `18 / 17 degrees`. The angle
   pair belongs in a detail view for the user who wants it, and R1's finding that most such pairs are UNVERIFIED as
   the named body's own position means the app should be careful about printing an angle as if the body published
   it.
2. **Tapping it opens the source detail**, which is where the honest paragraph from 5.1 lives, along with what this
   source publishes (does it have an Imsak? a jamaah? two Asr columns?) and where its data comes from.
3. **A computed source says so.** The user should be able to tell "this came from the authority's own table" from
   "this was computed with the authority's stated parameters", because R4 measured that for JAKIM those two differ
   by 10 minutes on Fajr.

**The widgets need the same line** (`widgets/PrayerWidget.tsx:318,524`), resolved in the app and baked into the
timeline props, per the widget-runtime constraint in `ai/AGENTS.md`.

### 5.3 What to say when the user's mosque differs

**The evidence that makes this unavoidable.** R4 measured nine central London mosques within a few kilometres
disagreeing by **26 minutes on Fajr and 48 on Asr**. R2 found that the London unified timetable's own publishers
answer the question directly: asked "I live in London but my local Mosque has different times, what should I do",
the published answer is **"You should follow your local mosque"**.

**Proposal: the app says the same thing the timetable's own publishers say, and says it before the user has to ask.**

Draft wording for the source detail view:

> **My mosque's times are different**
>
> That is normal, and it does not mean either is wrong. Mosques a few streets apart can differ by twenty minutes or
> more, because each chooses its own convention, and many print a congregation time that is set for the
> congregation's convenience rather than calculated at all.
>
> If your mosque publishes a timetable, follow your mosque. Athan shows you a published authority's times so you
> have a reliable reference; it does not replace your mosque.

**Why this is the right answer rather than a defensive one.** It is what the source this app currently ships says
about itself. It is what every user in the forum threads in section 4.3 told every other user. And it converts the
app's single largest complaint category from a bug report into an explanation the user can act on.

**One thing NOT to do: do not offer to "find my mosque".** Mawaqit does it and its terms forbid this app from using
its data (R4 finding 7: "Our API is currently private and not publicly available", "Any commercial use is strictly
prohibited"). Promising mosque times without a mosque data source would be a promise the app cannot keep.

### 5.4 Should the app offer per-prayer manual offsets?

**Recommendation: yes, with four conditions. It does not breach the never-invent rule, and the distinction that
resolves it is authorship.**

**The rule, verbatim** (`ai/features/uat-2/AUDIT-FINDINGS.md` finding 70, owner, 2026-09-13):

> "We absolutely never, ever, ever, ever want to copy a different prayer. We don't want to copy yesterday or
> tomorrow, never, ever, ever do that."
>
> **Absolute and permanent. No copying, no averaging, no interpolation, no synthesised value of any kind, for any
> field, under any circumstance.**

**The reasoning the owner gave for it, which is the part that decides this question:**

> "A substituted time is indistinguishable from a real one on screen -- same row, same font, same countdown, same
> athan at the end of it. Someone prays to it. Landing within a minute does not make it London Prayer Times'
> figure, and the app's entire value is that it shows *their* number rather than the app's."

**Two things in that reasoning, and they separate cleanly.**

1. **Provenance.** The number must be somebody's, and the user must know whose. A substituted time fails because it
   is the app's number wearing the authority's name.
2. **Indistinguishability.** The user cannot see that the number is not what it appears to be.

A user-entered offset passes the first test outright: the number is the user's, and the user knows it, because they
typed it. It fails the second test only if the app hides it. **So the rule is preserved by making the offset
visible, not by refusing it.**

There is also a positive argument. R2's most decisive finding is that a mosque's printed time may be hand-edited,
bulk-uploaded or an administratively fixed congregation time, and **no calculation reproduces it by any means**.
For the user whose mosque works that way, an offset is the only mechanism that exists. Refusing it does not protect
them; it leaves them with an app that is wrong for them and no way to say so. Every competitor in section 4 reached
the same conclusion.

**The four conditions, each closing a specific way this could go wrong:**

| Condition | What it prevents |
| --- | --- |
| **Never defaulted to non-zero, for any country, ever.** The app ships every offset at 0 | An app-authored adjustment smuggled in under a user-facing name. A per-country default offset IS the app inventing a time |
| **Visible on the row it changes**, not only in a settings sheet | The indistinguishability failure. The user must be able to see at a glance that this row is adjusted |
| **Reversible in one action, per prayer and in total** | A user who set an offset months ago, forgot, and now cannot explain their times |
| **Never applied to a source that publishes the row exactly.** An offset shifts the app's DISPLAY of a published time; the stored published time is never overwritten | Losing the authority's own number, which is the thing the app exists to show. It also keeps the offset removable and keeps the source detail view able to show both |

**One more condition worth considering, offered rather than recommended:** cap the offset. A 48-minute jamaah gap
(R2, Toronto) is real, so a cap of a few minutes would be wrong. But an unbounded offset lets a user construct a
time that is not a prayer time at all. No evidence was found either way in the competitor survey; every app
examined appears to allow arbitrary minutes. Recorded as an open question.

**What the offset must NOT become.** A substitute for a source. If a user in Malaysia has to apply +10 to Fajr to
match JAKIM, the app has failed and the fix is JAKIM's data, not the user's arithmetic. R4's correction-table
finding exists precisely so that never happens.

---

## 6. The migration: what happens to an existing London user

### 6.1 What the user has

| Asset | Where | Survives an upgrade today? |
| --- | --- | --- |
| Alert preference per prayer per schedule | `preference_alert_{standard,extra}_{name}` (`stores/notifications.ts:207`) | **Yes**, `preference_` is whitelisted (`stores/version.ts:151`) |
| Reminder settings, two slots per prayer | `preference_reminder_*` | Yes, same whitelist |
| Sound choice, display toggles, countdown bar, hijri | `preference_*` | Yes |
| Up to 64 armed OS notification requests | The OS, tracked in `scheduled_notifications_*` and `scheduled_reminders_*` (`stores/database.ts:193,258`) | **Yes**, and deliberately: `stores/sync.ts:364-371` keeps them through a cache swap |
| A cached year of prayer days | `prayer_YYYY-MM-DD` (`stores/database.ts:138`) | Only if `CACHE_SCHEMA_VERSION` (`stores/version.ts:135`) did not change |
| `fetched_years` markers | `stores/database.ts:176-180` | Wiped on upgrade, re-earned on the next sync |
| Measured column widths | `prayer_max_english_width_*` | Yes, whitelisted (`stores/version.ts:156`, in the list at `:144-156`) |
| Home-screen and lock-screen widgets | iOS and Android timeline props | Re-pushed on the next sync (`stores/sync.ts:245-261`) |

### 6.2 The answer

**On upgrade to v2.0, an existing London user's times do not change, their settings do not change, and their
alarms do not change. Nothing about their app is different except that it can now tell them where its times come
from.**

**The mechanism, copied from session 39's ruling** (`ai/plans/39-localisation/ASSUMPTIONS.md` A1b, and
`PROPOSALS.md`: "existing installs pin to English explicitly, and only fresh installs negotiate from the device
locale"):

| Install state on first v2.0 launch | Source assigned |
| --- | --- |
| Has cached `prayer_*` days and no source preference | **`london-prayer-times`, written explicitly.** Never negotiated from the device locale, never from GPS |
| Fresh install, no cached days | Negotiate: device region, then a picker |

**Why the explicit pin matters more here than it did for language.** A locale mis-negotiation shows a user the
wrong words. A source mis-negotiation shows a user a different prayer time and arms an alarm on it. Wave 1
measured what that would look like for a London user moved to the moonsighting source: **Fajr -7 to +6 minutes,
Isha -4 to +11, sunrise -4 to -2, Dhuhr and Maghrib 0 or +1, Asr 0 to +2**
(`ai/features/moonsighting/RESEARCH-FINDINGS.md` section 4.5). Section 4.3's third trust finding is the user's
reaction to exactly that: "my muslim pro app changed the fajr time back 16 minutes from yesterday. my whole family
was freaking out."

### 6.3 What must never change for an existing London user

1. **Their times.** Same provider, same endpoint, same six fields, same derivations.
2. **Their alert preferences.** The identifier that builds those keys is the English prayer name and it must not
   move. This is the point at which the localisation identifier split and the worldwide source work are the same
   piece of work.
3. **Their armed alarms, unless the times moved.** Same identifiers, same instants, so same-identifier scheduling
   replaces in place and nothing needs cancelling. The comment above `forceNotificationReschedule`
   (`stores/version.ts:181-194`) explains why: "same-identifier scheduling replaces in place, so a reschedule that
   finds nothing to change leaves no gap."
4. **Their widgets.** Same content, re-pushed.
5. **Their App Store product identity.** Out of scope, flagged.

### 6.4 What must happen when a user CHOOSES to change source

This is a different event from an upgrade and the code must treat it as one. It is destructive and it must be:

1. **Explicit.** The user picked it.
2. **Warned, with numbers if the app can compute them.** "Your Fajr will move by about 7 minutes" is a far better
   experience than the Muslim Pro review quoted above, and the app can compute the delta because it has both the
   old cached year and the new source.
3. **Wipe `prayer_*` and `fetched_years` for the old source, keep every `preference_*`.** The whitelist at
   `stores/sync.ts:358-372` is the template and already handles everything except the source key itself.
4. **Re-arm the whole notification plan.** Every armed instant belongs to the old source. `forceNotificationReschedule`
   (`stores/version.ts:194-202`) and `reopenNotificationGate` (`stores/sync.ts:83-89`) are the existing mechanisms.
   Session 39 measured the equivalent cost for a language change: up to 64 requests re-armed, no cancel pass needed
   because identifiers are deterministic. The same holds here as long as the identifiers do not change, which is
   another reason the identifier must not carry the source.
5. **Repush the widgets.**
6. **Bump `CACHE_SCHEMA_VERSION`** if and only if the key shape changed.

**One sharp edge to record.** `stores/sync.ts:364-371` deliberately keeps `scheduled_notifications_` and
`scheduled_reminders_` through a cache wipe, with the comment "Alarm records describe what the OS has armed, which
a new timetable does not change." **For a source change that comment is false**, and following it would leave the
sweep unable to cancel alarms armed on the old source's instants. That comment is correct today and becomes a
defect the moment a second source exists, which is exactly the kind of invariant that survives review because it
reads as reasoning rather than as an assumption.

---

## 7. Proposed sequencing

Each step is one session in the plan-execute-audit programme, small, independently shippable, and with an
acceptance criterion the session can check for itself. The ordering rule throughout: **anything with a silent
failure mode goes before anything that depends on it, and everything invisible goes before anything visible.**

### The sequence

| # | Session | Why here | Acceptance criterion | Visible to users? |
| --- | --- | --- | --- | --- |
| **S1** | **Split the prayer identifier from the prayer label** | Session 39 already established this is the prerequisite for localisation; this wave adds a second, independent reason (Turkey's `İmsak` must label the Fajr row). Doing it once serves both. A type-level guard must make passing a label where an identifier is required a compile error | Every one of the 4 systems in section 1.7 takes a typed identifier; `tsc` rejects a display string in an identifier position; every existing MMKV key, notification id and audio slug is byte-identical before and after; suite green | **No** |
| **S2** | **Make the source explicit, with exactly one source** | The single highest-value refactor and the only one that is genuinely free of behaviour change. Introduces the source identity (Z1), moves the MMKV key to `prayer_${sourceId}_${date}`, bumps `CACHE_SCHEMA_VERSION`, and pins every existing install to `london-prayer-times` explicitly | An existing install upgrades, its source reads `london-prayer-times`, its times are identical day for day against a pre-upgrade capture, its preferences are intact, its alarms are unmoved. A fresh install gets the same source. Nothing on screen changes | **No** |
| **S3** | **Make the timezone a property of the source** | Must follow S2 because the source is what owns the zone. Must precede any second source. The two module-level offset caches in `shared/time.ts:67-68` are the specific trap and must be keyed by zone | `PRAYER_TIMEZONE` no longer exists as a global; `Europe/London` appears only in the London source's own definition and in test fixtures; the offset caches are zone-keyed and a zone change clears or bypasses them; all 182 suites green with London as the fixture source | **No** |
| **S4** | **Build the verification fixtures** | R3's strongest recommendation, verbatim: "Build the USNO fixture suite described in Part 3 before writing any feature code... it is the direct answer to 'we can't verify if it's correct or not'." It costs one fetch script and about 400 committed JSON rows and needs no astronomy written by this project. Doing it after a second source ships means shipping unverified | A committed fixture set of USNO sunrise, sunset and transit for a spread of cities and dates; a test that fails when a computed sunrise or transit moves by 2 minutes or more; documented as covering the astronomy only, never the Fajr, Isha or Asr conventions | **No** |
| **S5** | **Name the authority on screen** | The first visible step, and deliberately the smallest one. It ships the honest claim with one source, so the copy is proved before there is a second source to explain. `components/day/Day.tsx:48` and the two widget strings | The day header names the source; tapping it opens a source detail with the section 5.1 wording; the widget subtitle is resolved in the app and baked into timeline props; the `--:--` and never-invent statements are in Help | **Yes, small** |
| **S6** | **Surface jamaah** | Independent of every other step, because the data is already arriving (`shared/types.ts:18-38`). It is the only step that makes the app strictly more faithful to its CURRENT source. Deliberately placed before any second source so the row design is settled on data the team can already see | Five `*_jamat` fields survive validation as nullable; the row shows both times where a jamaah exists; no alarm is armed on a jamaah; the widget never shows a jamaah alone; an existing user's times, preferences and alarms are unchanged | **Yes** |
| **S7** | **Add ONE second source, chosen to exercise the hardest case** | The first real test of everything S2 to S5 built. **Malaysia (JAKIM) is the right choice**, because it is the only candidate that exercises zones, a published Imsak, a published Duha, a documented 10-minute Fajr policy AND a keyless whole-year feed, all at once. Singapore would be easier and would prove nothing | A JAKIM zone reproduces JAKIM's published year for that zone exactly, day by day, against a committed capture; the Imsak row appears and the app's derived Suhoor does not; the Duha row is JAKIM's, not `Sunrise + 20`; a London user is completely unaffected | **Yes** |
| **S8** | **The source switch, with its wipe, re-arm and warning** | Cannot be built before S7, because there is nothing to switch to. Must be built immediately after, because until it exists the second source is unreachable | Switching sources wipes only that source's cached days, keeps every preference, re-arms the full plan within the 64-request budget, repushes the widgets, and warns with the measured delta before it commits | **Yes** |
| **S9** | **Per-prayer manual offsets** | After the source switch, because a user should try the right source before reaching for arithmetic. All four conditions from section 5.4 are acceptance criteria, not implementation notes | Every offset ships at 0 for every country; an adjusted row is visibly marked; one action clears one offset and one clears all; the published time is never overwritten in storage and is visible in the source detail | **Yes** |
| **S10** | **The computed source, with `adhan@4.4.6`** | Last of the core sequence, and this ordering is the deliberate part. R3 recommends `adhan`, R4 measured that AlAdhan's authority-named methods do not reproduce those authorities, and R1 measured that most library angle pairs are UNVERIFIED as the named body's position. So the computed source is the **least** authoritative option and should be the fallback for places no authority feed covers, not the foundation | `highLatitudeRule` is set explicitly and never left at the default; `rounding` is `Nearest`; the polar policy is decided in the app and `Invalid Date` becomes `--:--`; the source detail says plainly that this is a computation from a published parameter set and not the authority's own table |  **Yes** |

### What must come first, and why, in one paragraph each

**S1 before everything.** Every later step touches the prayer name. Session 39 measured that changing it while it
is still an identifier orphans 27 preference keys and up to 64 armed alarms, silently, because `null <= now` is
`true` so the dropped rows never throw. The cost is an afternoon now against a storage migration of every user's
preferences later. This is session 39's own conclusion and this wave only adds a second reason for it.

**S2 before S3 and before any second source.** The MMKV key is the silent one. `prayer_${date}`
(`stores/database.ts:138`) will happily serve city A's Fajr to a user in city B, and nothing in
`validateApiTimes`, `filterApiData`, `transformApiData` or the sequence builder checks provenance, because none of
them has any concept of it. Every guard in the pipeline checks shape. Adding a second source before the key
carries a source identity is adding a data-corruption path that no test in the current suite could catch.

**S3 before any second source.** `prayerClockFormatter` (`shared/time.ts:25`) is constructed at module load and its
answers are cached in two zone-blind `Map`s. A second source in another zone, with this unfixed, gives correct
clock strings stored against the wrong instants, which is a wrong alarm rather than a wrong display.

**S4 before S10, and ideally before S7.** R3's point is that the project's stated fear ("we can't verify if it's
correct or not") has a concrete answer that costs almost nothing, and that the answer is worth most before the code
it checks exists. It also draws the boundary explicitly: the fixtures prove the solar astronomy and can never prove
a Fajr angle, an Isha rule or an Asr factor, because those are juristic inputs no astronomical authority publishes.
Knowing where verification stops is as valuable as the verification.

**S5 before S7.** The honest claim is easier to write, and much easier to review, with one source on screen than
with two. Shipping the copy first also means the first user-visible change of v2.0 is the app becoming more
transparent, not the app becoming different.

**S6 anywhere from S5 onward.** It is genuinely independent and it is the one step that improves the product for
the existing user base rather than for a future one. If the programme needs a visible win early, this is it.

**S7 chosen as Malaysia, deliberately.** R4 measured that JAKIM serves 365 rows for a zone in one keyless request,
and that a correction table reproduces its published year within 2 minutes on 100% of 10,950 values with six
signed bytes per zone, or exactly with a 345-byte residual. R2 measured the Imsak structure to the day. R1 measured
that JAKIM's own published angle does not reproduce JAKIM's own output. **It is the best-evidenced country in the
whole research and it exercises every gap in section 3 except jamaah.** Picking an easy country first would
validate a design against the case it was not designed for.

**S10 last, and this is the finding most likely to surprise.** The instinct is to start with a calculation library
because it covers the whole world at once. The evidence says the opposite: R4 measured AlAdhan's method 17, which
carries JAKIM's name, at **0 of 365 days exact and 9 to 12 minutes early on Fajr every single day**; R1 found the
canonical angle table traces to a project whose own documentation admits "no contacts have been made to obtain the
correct (or up-to-date) numbers as published by such organizations"; and R4's Model A versus Model C analysis puts
an approximated time on the wrong side of the never-invent rule. A computed source is the right answer for the many
places no authority feed reaches. It is the wrong thing to build the architecture around.

### What is NOT in this sequence, and why

- **Elevation.** R4 measured 2.06 to 4.51 minutes per 100 m depending on latitude and season, and R1 found only two
  sources worldwide that specify it at all. Real, and not a v2.0 blocker. It should be recorded as a known limit in
  the source detail view rather than modelled.
- **Coordinate-to-zone lookup.** UNVERIFIED (section 3.5). Until a mapping is sourced, S7 ships a zone picker.
- **Hijri calendar and moon sighting.** Out of scope by the brief.
- **Qibla.** Rows 37, 40 and 41 own it.
- **The App Store listing identity** (`athan-london`). A business decision, flagged in section 1.5.
- **Localisation rows 38 and 39.** They interleave with S1, which is shared work, and this report does not
  re-sequence them. The dependency worth stating: **S1 is row 38's step 38.1**, so it is done once, not twice.

---

## 8. UNVERIFIED and open

Recorded so nothing weak reads as established.

1. **The competitive study is documentation-based, not device-based.** No app was installed or driven. Every
   settings claim comes from the vendor's own help centre, store listing or marketing page. Where a vendor
   publishes nothing the cell reads UNVERIFIED rather than an estimate. **A device pass over Muslim Pro, Athan Pro,
   Pillars and Guidance, screenshotting the actual settings trees, would raise every row in section 4.1 by a tier
   and is the single highest-value follow-up in this report.**
2. **Muslim Assistant could not be studied at all.** The name maps to several unrelated products across three
   stores and no vendor documentation was located.
3. **Guidance's high-latitude behaviour and offset support are UNVERIFIED.** Its own site advertises "an impressive
   set of advanced configurations" and enumerates none of them. Since it is the `adhan` authors' own app, what it
   exposes is unusually informative about what the library's maintainers think users need, and it is unread.
4. **Al-Azan's per-prayer offsets are UNVERIFIED.** Its listing names reminders "before or after a prayer time",
   which is a different thing.
5. **No accuracy claim was read in a store-listing screenshot.** All claims in section 4.1 come from listing text
   and marketing pages fetched as markdown, so a claim rendered only in a screenshot image was not seen. The
   `vision` subagent could close this.
6. **Whether the offset should be capped is open.** No evidence found either way; every app examined appears to
   allow arbitrary minutes.
7. **Whether a Turkish user should see one row or two** (section 3.1) is an owner ruling, not a design conclusion.
8. **Whether existing London users should be offered `asr_2`** is wave 1's open question 8 and is still open. This
   report only recommends never switching anyone silently.
9. **The second source's TLS requirements are unmeasured** (section 1.6), so `modules/tls13`'s fate is undecided.
10. **Coordinate-to-zone mapping for JAKIM is unsourced** (section 3.5).
11. **The jamaah alarm question is deliberately left open** (section 3.2). Arming jamaah times against a 64-request
    ceiling that session 28 measured is already tight needs its own measurement, not a default.
12. **No count of how many of the app's 182 test files would need changes** for S2 or S3 was produced. 6 files
    reference `Europe/London` directly; the real figure is higher because the harness is shared. Wave 1 recorded
    "62 tests still assert London's clock values and DST rule"
    (`ai/features/moonsighting/RESEARCH-FINDINGS.md` section 4.2), and that figure was not re-measured here.
13. **The estimates in the "Size" column of section 1.1 are judgements**, not measurements. They rank relative
    effort and nothing in this report should be read as a time estimate.
14. **`codegraph_explore` was unavailable** in this worktree, so the inventory in section 1 is a read of the files
    the brief named plus a grep sweep, not a full call-graph blast radius. A caller this report missed is possible,
    particularly for `TIME_ADJUSTMENTS` and the Extras derivations.

---

## 9. Sources

### 9.1 This repository (measured, read in this worktree)

| Path | What was read |
| --- | --- |
| `shared/constants.ts` | `PRAYERS_ENGLISH:9`, `EXTRAS_ENGLISH:26`, `NIGHT_PRAYER_NAMES:39`, `MIDNIGHT_CROSSING_PRAYERS:47`, `EXTRAS_EXPLANATIONS:54`, `NOTIFICATION_REQUEST_BUDGET:75`, `TIME_ADJUSTMENTS:225`, `ISLAMIC_DAY:247`, `PRAYER_TIMEZONE:258`, `UNAVAILABLE_TIME:268` |
| `shared/time.ts` | `prayerClockFormatter:25`, `readOffsetByIntl:51`, the offset caches `:67-68`, `prayerTimezoneOffset:75`, `readPrayerClock:101`, `createPrayerDatetime:151`, `formatPrayerTime:175`, `formatHijriDateLong:241`, `formatDateShort:265`, `isRamadan:310`, `getNightTimes:406`, `adjustTime:432` |
| `shared/prayer.ts` | `filterApiData:39`, `transformApiData:70`, `magribCrossesIntoNextDay:115`, `getIstijabaTime:130`, `getNightTimesForDay:159`, `calculateBelongsToDate:234`, `createPrayersForSingleDay:376`, `createPrayerSequence:446`, `canonicalDisplayOrder:569` |
| `shared/types.ts` | `IApiSingleTime:12-39` including the five `*_jamat` fields and the Asr comments at `:25-28`, `IApiResponse:66`, `RequiredTimeName:74`, `ISingleApiResponseTransformed:108-122`, `ScheduleType:148`, `AlertType:195` |
| `api/client.ts` | `buildApiUrl:19`, `validateApiResponse:39`, `REQUIRED_TIMES:48`, `TIME_PATTERN:51`, `validateApiTimes:78`, `fetchYear:158`, `fetchDay:191` and the `city: 'london'` at `:199` |
| `api/config.ts` | The whole file, 7 lines |
| `stores/sync.ts` | `isTodayGapInStoredYear:67`, `reopenNotificationGate:83`, `saveDownloadedDays:126`, `needsDataUpdate:275`, `replacePrayerCache:338` and its whitelist `:358-372`, `storeNextYear:412`, `updatePrayerData:431`, `sync:522` |
| `stores/database.ts` | `DATABASE_ID:32`, `clearAllExcept:106`, `saveAllPrayers:136`, `getPrayerByDateString:152`, `markYearAsFetched:176`, the notification and reminder key schemes `:193,212,258,304` |
| `stores/version.ts` | `wasAppUpgraded:82`, `CACHE_SCHEMA_VERSION:135`, `UPGRADE_KEEP_PREFIXES:144-156`, `cacheSchemaChanged:166`, `forceNotificationReschedule:194`, `clearUpgradeCache:208` |
| `stores/notifications.ts` | `createPrayerAlertAtom:203-208` |
| `device/notifications.ts` | `prayerNotificationIdentifier:49-50`, `reminderNotificationIdentifier:61-66` |
| `shared/notifications.ts` | `prayerNameSlug:147`, the reminder filename `:161-162`, the channel id `:388-389` |
| `components/day/Day.tsx` | `London, UK` at `:48` |
| `widgets/PrayerWidget.tsx` | `Prayer times for London` at `:318` and `:524` |
| `device/updates.ts` | The iTunes lookup `:15` and the store URL `:17` |
| `device/tls13.ts`, `modules/tls13/android/.../Tls13InitProvider.kt` | The whole of both, for the TLS 1.3 rationale |
| `assets/audio/reminders/` | 67 files, counted |
| `__tests__/harness.ts`, `hooks/__tests__/londonDays.ts` | The London fixture days and the shared component harness |
| `package.json` | `adhan: 4.4.6` at `:38`, version `1.29.140` at `:3` |
| `ai/AGENTS.md` | The Extras order invariant `:821`, the polar sweep entry of 2026-09-27, the notification budget entry of 2026-09-27 |
| `ai/features/uat-2/AUDIT-FINDINGS.md` | Finding 70, the never-substitute ruling and its reasoning |
| `ai/plans/39-localisation/MEASURED.md`, `README.md`, `ASSUMPTIONS.md` | The identifier blast radius, the four systems, A1b's explicit-pin migration rule |
| `ai/features/moonsighting/RESEARCH-FINDINGS.md` | Section 4 in full, especially 4.1, 4.2, 4.3, 4.4 and 4.5 |
| `ai/features/global-prayer-times/agent-reports/R1..R4` | As cited throughout |

### 9.2 External (cited, all fetched 2026-09-30 through `tinyfish` unless noted)

| URL | What it supports |
| --- | --- |
| `https://support.muslimpro.com/help/en/articles/manual-adjustment-of-prayer-times-for-more-accurate-times-using-advanced-settings` | Muslim Pro's "App Recommended" toggle, "Fixed Calculation (Advanced)" and the "Manual Corrections" page |
| `https://support.muslimpro.com/help/es/articles/setting-prayer-times-using-different-asr-calculation-method` | Muslim Pro's separate Asr school setting, behind the same toggle |
| `https://support.muslimpro.com/help/en/articles/high-latitude-adjustment` | "relevant for locations above 48 degrees and it should match your local mosque" |
| `https://support.muslimpro.com/help/en/articles/verified-prayer-times-in-muslim-pro` | The "Verified" badge, and that only mosques and religious authorities may submit times |
| `https://support.muslimpro.com/help/en/articles/does-the-muslim-pro-application-use-12-15-or-18-angles-for-prayer-times-in-france` | UOIF 12, GMP 18, "some other Mosques also use 15", and that Fixed Calculation follows UOIF |
| `https://support.muslimpro.com/help/en/articles/disclaimer` | "not intended to replace any official information provided by your local mosque or any other religious authority"; "no representations as to the accuracy" |
| `https://support.muslimpro.com/help/en/categories/knowledge-base` | The article index, used to locate the five articles above |
| `https://www.muslimpro.com/prayer-times-and-adhan-app/` | "Muslim Pro partners with trusted religious authorities"; "syncs directly with trusted religious authorities and official calculation settings based on your exact coordinates" |
| `https://apps.apple.com/us/app/muslim-pro-quran-athan/id388389451` | Store listing, "Accurate Prayer Times & Alerts", 4.8 rating |
| `https://play.google.com/store/apps/details?id=com.bitsmedia.android.muslimpro` | "Verified Prayer Times & Azan", 100M+ downloads, 1.92M reviews |
| `https://quanticapps.zendesk.com/hc/en-us/articles/115003683925-...` | Athan Pro: auto-detection by country, "the largest mosques and Islamic ministries in each country", the manual +/- minute correction, and the note that French mosques use 12, 15 or 18 |
| `https://apps.apple.com/us/app/athan-pro-muslim-prayer-times/id743843090` | "the most accurate prayer times", 4.6 from 81K ratings |
| `https://www.islamicfinder.org/world/united-states/5099836/jersey-city-prayer-times/` | **Read with `agent-browser`** because the table is JavaScript-rendered. The 7-organisation method table with angles and regions, the printed active method line "Islamic Society of North America ... Fajr 15.0 degrees, Isha 15.0 degrees, Hanbali, Maliki, Shafi", and the Hanafi/Shafi Asr FAQ |
| `https://www.islamicfinder.org/` | Page title "Most Accurate Prayer Times, Quran, Athan and Qibla Direction" |
| `https://www.islamicfinder.org/athan-windows/` | "Minutes Adjustment to make Prayer times 100% accurate according to local Masjid"; "Customized calculation methods" |
| `https://apps.apple.com/us/app/athan-prayer-times-dua-azkar/id505858403` | "the most trusted prayer time app for accurate Salah times"; "Enable Auto settings to get the most accurate Islamic Prayer Times for your location" |
| `https://www.thepillarsapp.com/faqs` | Pillars: the two-factor explanation, the auto-default by location with ISNA named for North America, "we will also be giving users the ability to set their own custom angles and fixed adjustments soon", the two high-latitude rules, and "ask your local imam" |
| `https://www.thepillarsapp.com/` | "Multiple calculation methods available including the Moonsighting Committee, ISNA and Muslim World League" |
| `https://apps.apple.com/us/app/pillars-prayer-times-qibla/id1559086853` | Store listing, "Early & Late Asr Time", "Multiple Calculation Methods", 4.8 from 5.5K ratings, and no accuracy superlative |
| `https://www.reddit.com/r/islam/comments/1il7rvo/pillars_app_not_accurate/` | The user quotes in section 4.2, the "Autopilot"/"Auto detect" path, and a commenter printing Pillars' own method line |
| `https://www.reddit.com/r/islam/comments/14n7mak/weird_praying_times/` | The Belgium high-latitude case, the developer's reply about the "!" icon, and "choosing a calculation method as a revert is already confusing enough" |
| `https://www.reddit.com/r/islam/comments/1bdf001/asalamu_alaikum_i_dont_know_which_app_to_trust/` | The 6:58-versus-7:01 thread, the repeated "follow your local mosque" answer, and the "changed the fajr time back 16 minutes... my whole family was freaking out" report |
| `https://guidanceapp.com/` | "Guidance just works - no setup required... automatically find your location and configure the prayer times for your area. But for those who want to customize everything" |
| `https://guidance-prayer-times-qibla-compass-ios.soft112.com/` | Guidance's full version history, including 4.8.2: "Based on the ruling of the Fiqh Council of North America, the default calculation method for users in the US and Canada has been updated to be the 'Islamic Society of North America' method which uses a Fajr and Isha angle of 15 degrees" |
| `https://apps.apple.com/us/app/mawaqit-prayer-times-mosque/id1460522683` | "100% Accurate: Salah and iqamah times as set by your Imam"; "Unlike other apps that provide you with approximations, we provide you with the precise timetables set by your Imam"; "Imsak and Iftar" during Ramadan |
| `https://help.mawaqit.net/en/articles/9047426-why-are-prayer-times-different-from-one-mosque-to-another` | The 10-method list with angles, the two-path model (own calendar or calculation), "There can be a difference of 20 to 30 minutes or even more sometimes", and the two Asr definitions |
| `https://help.mawaqit.net/en/articles/11813326-how-to-manually-adjust-prayer-times-shuruq-in-mawaqit` | The CSV download, hand-edit and re-upload path, and switching the calculation source from "Automatic" to "Calendar" |
| `https://apps.apple.com/tr/app/e-diyanet/id6745179920` | Diyanet's own app: "Accurate and reliable prayer times based on your location", multi-language, no method setting advertised |
| `https://github.com/meypod/al-azan` | Al-Azan: AGPL-3.0, `adhan-js`, "Many options for Adhan calculation", settings for Sunrise, Sunset, Midnight and Night Prayer |
| `https://f-droid.org/en/packages/com.github.meypod.al_azan/` | "No internet permission: the app can never access the internet"; release 2.3.1's polar-condition warning |
| `https://unstar.app/blog/muslim-pro-quran-majeed-athan-pillars-tarteel-quran-prayer-apps-ranked-2026` | The five repeating 1-to-3-star complaints across the category, including "Prayer times that do not match the local mosque" and "Adhan notifications that silently fail". A secondary source, marked as such |
| `https://github.com/batoulapps/adhan-kotlin/issues/25` | An open issue against the `adhan` family questioning fixed angles at high latitude, unanswered since 2021 |
| `https://github.com/batoulapps/Adhan/issues/23` | A Diyanet method request against `adhan`, closed without one being added |
