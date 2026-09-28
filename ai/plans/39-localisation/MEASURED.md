# Session 39: what this repository actually contains

Everything here was measured on `uat-2` at `77eb52fe` on 2026-09-29, by the scripts in
`scripts/`, which are committed so any later session can reproduce the numbers rather than
trust them. No figure below is an estimate unless it says so.

## 1. The string surface: 194 literals, and only 113 of them are copy

`scripts/inventory-strings.py` finds every capitalised string literal in production source,
excluding tests, mocks, logger calls and directories that ship no copy.
`scripts/classify-strings.py` then splits them by what they ARE.

| Class | Count | What happens to it |
| --- | --- | --- |
| Display copy | 113 | Translated. This is the real migration surface |
| Widget copy | 25 | Translated in the APP, then baked into timeline props |
| Identifier, never translated | 23 | Wire keys, enum values, font names, `Europe/London` |
| Prayer name used as identifier | 22 | The hard case, see section 2 |
| Doc example or type comment | 11 | Not user-visible, no action |

**The headline correction: the row's "193 user-facing literals" overstates the work by 42%.**
Only 113 are copy a translator ever sees. The count that matters for cost is 113 plus the 25
widget strings, and the 16 religious terms inside those.

Display copy by file, which is also the migration order:

| Count | File |
| --- | --- |
| 27 | `shared/help.ts` |
| 13 | `shared/whatsNew.ts` |
| 11 | `components/sheets/screens/Settings.tsx` |
| 10 | `components/sheets/screens/Alert.tsx` |
| 6 | `shared/constants.ts` |
| 4 | `components/sheets/screens/ColorPicker.tsx`, `components/prayer/Explanation.tsx` |
| 3 | `Sheet.tsx`, `Update.tsx`, `WhatsNew.tsx`, `useNotification.ts` |
| 1 to 2 | 19 further files |

## 2. The English prayer name is an IDENTIFIER, and this is the session's central risk

`scripts/identifier-blast-radius.py` counts every site where an English prayer name is used
for something other than drawing. These are not labels. Translating them corrupts user data.

| Use | Production sites | Example |
| --- | --- | --- |
| Storage key built from the name | 27 | `preference_alert_${type}_${prayerName.toLowerCase()}` |
| Name lowercased into a slug | 11 | `prayerNameSlug('Last Third')` gives `last_third` |
| Compared against a literal | 24 | `name === 'Istijaba'`, `prayerName === 'Midnight'` |
| `includes` on a name array | 4 | `NIGHT_PRAYER_NAMES.includes(prayerEnglish)` |
| `indexOf` on a name array | 2 | `EXTRAS_ENGLISH.indexOf(english)` sets display rank |
| Compared with `===` in a component | 1 | `english === 'Istijaba' && isPassed` |

Four independent systems key on that string, and each one breaks differently:

1. **MMKV preference keys.** `preference_alert_standard_fajr`, `preference_reminder_alert_*`,
   `preference_reminder_interval_*`, `preference_notification_repair_*`. If the name that
   builds the key ever becomes the translated name, every user loses every alert preference on
   the language switch, silently, and the app re-reads defaults.
2. **Notification identifiers.** `device/notifications.ts` builds
   `athan_${scheduleType}_${englishName.toLowerCase()}_${date}` and
   `reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}`. These
   identify armed OS alarms. A changed name orphans up to 64 armed requests that nothing can
   then cancel.
3. **Audio filenames.** 67 files named `reminder_<slug>_<interval>.mp3`, plus the Android
   `res/raw` constraint that a resource name matches `[a-z0-9_]` only. A translated slug
   resolves to no file, so the reminder plays nothing.
4. **Ordering and behaviour.** `EXTRAS_ENGLISH.indexOf` sets the canonical display order that
   `ai/AGENTS.md` records as an owner invariant, and `NIGHT_PRAYER_NAMES` /
   `MIDNIGHT_CROSSING_PRAYERS` decide which Islamic day a row belongs to. A translated name
   matches nothing in those arrays, so rows file to the wrong day.

**The rule this forces:** the English name stays as the domain identifier everywhere, forever,
and translation is a presentation-time lookup keyed by it. The plan needs a type-level guard so
a later session cannot pass a display name where an identifier is required, because every one of
these failures is silent.

This also happens to match owner decision D5: the prayer row keeps its English name on screen.
The identifier and the primary label are the same string today, which is exactly why the danger
is invisible.

### The four systems, enumerated

`scripts/identifier-contract.py` lists every site, so step 38.1 is specified rather than described:

| System | File | Sites |
| --- | --- | --- |
| MMKV preference keys | `stores/notifications.ts` | 8 |
| OS notification identifiers | `device/notifications.ts` | 2 |
| Audio resource slugs | `shared/notifications.ts` | 11 |
| Ordering and Islamic-day rules | `shared/prayer.ts` | 5 |

**The hardest constraint is on disk.** `assets/audio/reminders/` holds **67 mp3 files** whose names
are built from the English prayer name, one per prayer and interval, with these 11 prayer slugs:

```
asr, dhuhr, duha, fajr, isha, istijaba, last_third, magrib, midnight, suhoor, sunrise
```

Android's `res/raw` accepts `[a-z0-9_]` only, so a slug can never carry a translated name in any
non-Latin script, and renaming 67 shipped audio files is not a change anyone would make to add a
language. The audio layer physically cannot be localised.

That settles the question rather than merely arguing it: the English name is the identifier,
permanently, and no design that translates it is viable.

## 3. Roboto cannot draw any of the scripts this feature is for

`scripts/font-coverage.py` reads the bundled fonts' cmap tables directly.

`assets/fonts/Roboto-Regular.ttf` and `Roboto-Medium.ttf` each cover **896 codepoints**. The app
sets `fontFamily: 'Roboto-Regular'` or `Roboto-Medium` on essentially every `Text` node.

| Script | Sample | Codepoints Roboto lacks |
| --- | --- | --- |
| Arabic, Urdu, Persian | `الفجر` | every letter |
| Devanagari, Bengali, Telugu, Tamil, Gujarati, Gurmukhi | `नमाज़` | every letter |
| Han, Kana, Hangul | `晨礼` | every letter |
| Thai | `ละหมาด` | every letter |
| Hebrew, Amharic | `תפילה` | every letter |
| Arabic-Indic digits | `٠١٢٣٤٥٦٧٨٩` | all ten |
| Bidi isolates FSI, PDI, LRM, RLM | `U+2068 U+2069 U+200E U+200F` | all four |
| Cyrillic, Greek, Vietnamese, Turkish, Latin | `Фаджр`, `Bình minh`, `İmsak` | none |

**The finding that changes the risk assessment: the app already ships Arabic and it already
works.** `components/prayer/Prayer.tsx` draws `Prayer.arabic` with `styles.text`, which sets
`fontFamily: TEXT.family.regular`. Roboto has no Arabic glyph, so every Arabic character on
screen today is already being served by per-glyph OS font fallback on both platforms.

Two consequences:

- Per-glyph fallback is **already load-bearing in production**, not a theory. The feature does
  not introduce this risk, it extends it. That materially lowers the cost of the no-bundled-font
  option and is the strongest argument for relying on system fonts.
- What is unmeasured is whether fallback holds for scripts the OS is less likely to carry, and
  what it does to vertical metrics. A `lineHeight` tuned to Roboto clips Devanagari and Thai
  ascenders. `TEXT.lineHeight.arabic` already exists as a separate value, which is evidence the
  problem has been met once and solved by hand for one script.

Bidi isolate characters being absent from Roboto is harmless: they are zero-width formatting
controls the shaper consumes, not glyphs it draws. Worth stating so a later session does not
read the table and try to fix it.

## 4. The prayer-name column, and why the owner's concern is correct

`components/ui/InitialWidthMeasurement.tsx` mounts two invisible `Text` nodes holding the
longest English name per schedule, measures them with `onLayout`, and stores the width in MMKV
under `prayer_max_english_width_standard` and `prayer_max_english_width_extra`.
`components/prayer/Prayer.tsx` then gives every row's first column
`width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.left`.

Three properties of that machinery decide the whole layout question:

1. **The store only accepts a measurement that WIDENS the cached value.** Written for ISSUES #22,
   where a pre-font-load fallback measured narrower. So a longer name in a new language widens
   the column correctly and automatically.
2. **The key is never cleared.** `prayer_max_english_width_` is in both `clearAllExcept`
   keep-prefix whitelists, deliberately, because a wipe forces a visible reflow at launch.
   **This is a defect waiting for this feature:** a user who switches from a wide language to a
   narrow one keeps the wide column forever, and the widen-only rule means nothing can shrink
   it. The plan has to add a reset on language change, and that reset must not reintroduce the
   ISSUES #22 reflow.
3. **The measurement is of the longest name in a hardcoded array**
   (`getLongestPrayerNameIndex`), so it is already per-schedule and can become per-locale at no
   architectural cost.

The second column (`styles.arabic`) is `flex: 1` with `textAlign: 'right'`. Under owner decision
D7 the layout never mirrors, so this stays; what needs deciding is whether `right` remains
correct when the second language is Latin-script.

`STYLES.prayer.height` is a fixed 57. A name that wraps to two lines does not fit, so the
column strategy cannot be "let it wrap" without changing a constant that the overlay's absolute
positioning also reads.

## 5. The RTL-sensitive surface

Counted across `components/`, `app/`, `shared/`, `stores/`, `hooks/`, `widgets/`, excluding tests:

| Measure | Count |
| --- | --- |
| `left`/`right`/`margin*`/`padding*` directional style props | 63 |
| `flexDirection: 'row'` containers | 30 |
| `position: 'absolute'` views | 32 |
| `measureInWindow` / `pageX` / `pageY` call sites | 30 |
| `textAlign` declarations | 11 |
| `I18nManager` references anywhere in the repo | **0** |

Zero `I18nManager` usage is the important one: nothing in this app has ever been built for a
flipped axis, which supports owner decision D7 on cost grounds alone. The 30 measurement call
sites are the overlay and the Extras explanation box, which position by measured absolute
coordinates.

## 6. The two runtimes that cannot call a translation library

**Widgets.** `expo-widgets` serialises a `'widget'`-directive function body to a string and
evaluates it in a runtime whose React is a five-name stub. `ai/AGENTS.md` records that a
module-scope call into `@expo/ui` blanked every card at 58.0.6 and 58.0.7, which is why both
packages are pinned to exactly 58.0.5. A translation library called at module scope in a widget
layout does the same thing. 25 literals live in `widgets/`, so every one must be resolved in the
app and passed as data.

The iOS timeline has a hard entry-count budget: `ai/AGENTS.md` records that roughly 380 entries
blacked out every non-trivial kind, masked by iOS as "Please adopt containerBackground API", and
that the horizon is 3 days for this reason. Adding translated strings to every entry grows the
payload, so the plan must measure the new payload against the 200KB guard in
`widgetTimeline.test.ts` rather than assume it fits.

**Notifications.** `shared/notifications.ts` builds the copy at schedule time:

```
title: `${englishName} now`
title: `${englishName} in ${intervalMinutes}m`
```

Those strings are handed to the OS and frozen. Session 28 arms up to
`NOTIFICATION_REQUEST_BUDGET = 64` requests, whole rows at a time. A language change must cancel
and re-arm the full plan, and `ai/AGENTS.md` records that a partial re-arm is exactly the
failure session 33 was queued to fix. Whether either platform can localise at DELIVERY time
instead is a research question with a real payoff, since it would make the re-arm unnecessary.

Android notification channel names are fixed at creation, and this repo has already learned
(session 27) that sound, audio attributes and importance are all frozen too, which is why the
ids carry a `_v4` generation. Whether the NAME alone can be updated in place decides whether a
language change needs yet another channel generation.

## 7. What the settings sheet gives the language picker for free

`components/sheets/screens/Settings.tsx` already has the exact row shape the owner described: a
circular icon badge, a flex label, and a `›` chevron, used by "Change athan", "What's new" and
"Help". The sound sheet (`Sound.tsx`) is a scrolling list of 32 selectable rows with a chosen
state, warmed by `onFirstPresent={setSoundListReady}` so it never pops in.

So owner decision D8 needs no new pattern: one more row on a card, and one more sheet built like
`Sound.tsx`. The warming trick matters, because a 20-plus row language list has the same
first-open cost the sound list has.

`showArabicNamesAtom` (`preference_show_arabic_names`, default true) already governs whether the
second name is drawn. Under owner decision D4 that atom is misnamed for its new job.

## 8. Reproducing these numbers

```bash
python3 ai/plans/39-localisation/scripts/inventory-strings.py
python3 ai/plans/39-localisation/scripts/classify-strings.py
python3 ai/plans/39-localisation/scripts/identifier-blast-radius.py
python3 ai/plans/39-localisation/scripts/font-coverage.py   # needs fonttools
```

`font-coverage.py` needs `fonttools`, which is not in this project and must not be added to it.
Run it from a throwaway virtualenv.
