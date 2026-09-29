# Session 39: the constraints that decide the design

`MEASURED.md` records what the repository contains. This file records what those measurements
MEAN for the design, and it is where the non-obvious findings live. Each section ends with the
rule it forces.

## C1. A language change is a notification re-arm, and the repo already has the pattern

`stores/notifications.ts:1711` holds `commitSoundSelection`, and it is the exact shape a language
change needs:

```
withSchedulingLock(async () => {
  armEverything(selection)              // write the preference, update the channel, reschedule all
  catch -> armEverything(previous)      // put it back
  catch -> setSoundPreference(previous) // at minimum, Settings names something the user can hear
  return false
}, 'commitSoundSelection')
```

Both changes have the same three properties: they alter copy baked into up to 64 armed OS
requests, they must not interleave with another scheduling pass, and a partial failure leaves the
phone disagreeing with the settings screen.

Session 33 was queued specifically because this operation is **not atomic**: a failure part way
through leaves some prayers re-armed with the new value and the rest on the old, while the
rolled-back preference makes Settings disagree with both. Row 33 is DONE, so whatever it decided
is the precedent, and this session inherits it rather than re-litigating it.

**Rule:** the language commit is `commitLanguageSelection`, built on `withSchedulingLock`,
modelled line for line on `commitSoundSelection`, and it inherits session 33's ruling on partial
failure. It is never a plain atom write.

**Corollary the plan must not miss:** session 28 records that `commitPrayerAlertChange` wrote the
preference BEFORE taking the lock, so a second queued commit saw the first's values. A language
commit has the same hazard and must compute what it needs once, from the values it was called
with, and pass them to both halves.

## C2. The widget payload has 20x headroom, so translated widgets are affordable

Measured from the real props shape (`shared/widgetTypes.ts`) against the real guard
(`shared/__tests__/widgetTimeline.test.ts:726`):

| Locale | UTF-8 bytes per name | Name bytes in a 3-day timeline |
| --- | --- | --- |
| English, today | 4.8 | 778 B |
| Indonesian | 5.2 | 832 B |
| Chinese | 6.0 | 966 B |
| Turkish | 6.3 | 1,020 B |
| Russian | 9.0 | 1,449 B |
| Arabic | 11.0 | 1,771 B |
| Bengali | 14.0 | 2,254 B |
| Hindi | 15.5 | 2,496 B |
| Thai | 18.5 | 2,978 B |

The measured whole payload is about 9,800 B for 23 entries and the guard is 200,000 B, so there
is 20.4x headroom. Worst case (Thai) adds about 2,200 B of name bytes, giving roughly 12,000 B,
which is **6.0% of the guard**.

**Rule:** translated widget text is baked into the timeline props, and the payload guard is not
at risk. The plan still re-runs the payload test per locale rather than trusting this estimate,
because the estimate covers name bytes only and not `dateLabel`, which is also translated and
which the estimate deliberately excludes.

**The real widget risk is not size, it is the runtime.** `ai/AGENTS.md` records that a
module-scope call into `@expo/ui` blanked every card at 58.0.6 and 58.0.7, which is why both
packages are pinned to exactly 58.0.5, and that the only honest guard is building the bundle and
loading it (`shared/__tests__/widgetRuntimeLoads.test.ts`). A translation library imported at
module scope inside `widgets/*.tsx` does the same thing.

**Rule:** no widget layout imports or calls the translation library, at module scope or anywhere
else. Every widget string is resolved in the app and passed as a prop.
`widgetContract.test.ts` already pins what a layout may reference, so the guard extends an
existing test rather than adding a new mechanism.

## C3. The English prayer name is an identifier, and the danger is that it is silent

`MEASURED.md` section 2 counts 27 storage keys, 11 slugs, 24 literal comparisons, 4 array
membership tests and 2 index lookups keyed on the English name. Four systems depend on it:
MMKV preferences, OS notification identifiers, 67 audio filenames, and the canonical display
order that `ai/AGENTS.md` records as an owner invariant.

Every one of those failures is silent. A translated key reads a default rather than throwing. A
translated notification identifier orphans an armed alarm rather than erroring. A translated
audio slug resolves to no file and the reminder plays nothing. A translated name fails
`NIGHT_PRAYER_NAMES.includes` and the row files to the wrong Islamic day.

**Rule:** the English name remains the domain identifier everywhere, permanently. Translation is
a lookup performed at the point of display, keyed by that identifier. The plan adds a type-level
separation so the two cannot be confused, because no test catches a silent substitution and no
reviewer reliably spots one in a 100-file diff.

The shape to specify: a branded or nominal type for the identifier, so a function that builds a
storage key, a notification id or an audio slug accepts only the identifier and rejects a display
string at compile time. This costs one type and a handful of signatures, and it is the single
highest-value guard in the session.

## C4. Per-glyph font fallback is already load-bearing in production

Roboto covers 896 codepoints and has no Arabic. The app draws Arabic prayer names today with
`fontFamily: 'Roboto-Regular'` applied. Therefore every Arabic glyph on screen right now is being
served by OS per-glyph fallback, on both platforms, in the shipped app.

This inverts the usual risk assessment. Bundling fonts for 20 languages is normally the safe
default and system fallback the risky one. Here, system fallback is the **proven** path and
bundling is the change.

**Rule:** rely on OS font fallback, matching what already ships. Do not bundle per-script fonts
in this session. What the plan must verify instead, per locale, on a real device: that glyphs
render at all, and that `lineHeight` does not clip taller scripts.

`TEXT.lineHeight.arabic` already exists as a separate value, which is evidence the vertical
metric problem was met once and solved by hand for one script. Devanagari, Thai and Bengali have
taller ascenders and descenders than Latin, so the plan needs a per-script line-height policy
rather than one more hand-tuned constant.

The OnePlus 3T (Android 9) is the floor device and is the one most likely to lack a font for a
less common script. That is a device check, not a desk check.

## C5. The prayer-name column widens forever and can never shrink

`stores/ui.ts` accepts a width measurement only when it WIDENS the cached value, written for
ISSUES #22 where a pre-font-load measurement came back narrower. `prayer_max_english_width_` is
in both `clearAllExcept` keep-prefix whitelists so a cache wipe cannot clear it, deliberately,
because a wipe forces a visible reflow at launch.

For this feature that is a defect. A user who switches to a wide language and back keeps the wide
column permanently, with a large empty gap, and nothing in the app can shrink it.

**Rule:** the width cache is keyed per locale, or reset on a language change. A reset must not
reintroduce the ISSUES #22 reflow, so the measurement has to complete before the first paint
that uses it, exactly as `InitialWidthMeasurement` already arranges.

The good news is that the machinery is already the right shape:
`components/ui/InitialWidthMeasurement.tsx` measures the longest name of a hardcoded array via
`getLongestPrayerNameIndex`, so making it per-locale is a change of input, not of architecture.

**The unmeasurable part is the constraint.** `STYLES.prayer.height` is a fixed 57 and the overlay
positions the Extras explanation box from measured absolute coordinates
(`ai/plans/README.md` row 36). A name that wraps to two lines changes the row height, which moves
every anchored box. So wrapping is not available, and the strategies that survive are: a wider
column, a smaller font for that locale, an abbreviation, or truncation. The plan measures all 11
names in every candidate locale and picks per locale rather than globally.

## C6. Zero I18nManager usage supports the owner's never-mirror ruling on cost grounds

63 directional style props, 30 row containers, 32 absolutely-positioned views, 30 coordinate
measurement call sites, and `I18nManager` appears **zero times** in the entire repository.

Nothing here has ever been built for a flipped axis. Owner decision D7 pins the layout LTR, and
the measurement says that decision avoids touching 155 sites in the most delicate parts of the
app, including the overlay and explanation-box positioning that row 36 already exercised.

**Rule:** `I18nManager.allowRTL(false)` is set explicitly and early, so the app's direction never
depends on the device locale. Setting it explicitly is not optional: without it, an Arabic
device locale can flip the axis on Android by default, which is precisely the outcome the owner
ruled against.

**What the ruling does NOT avoid, and the plan must still handle:** the Unicode bidirectional
algorithm runs inside every `Text` node regardless of layout direction. A time like `05:42` beside
Arabic text, or a `{{count}}` placeholder resolving to a Western numeral, reorders at the
boundary. Neutral characters (colon, parenthesis, slash, hyphen) take their direction from
context and land in the wrong place. This is a string-level problem with a string-level fix
(isolate characters), and no layout decision makes it go away.

## C7. The settings sheet already has the pattern the owner asked for

`components/sheets/screens/Settings.tsx` draws "Change athan", "What's new" and "Help" as a
circular icon badge, a flex label and a `›` chevron. `Sound.tsx` is a scrolling list of 32
selectable rows with a chosen state, warmed by `onFirstPresent={setSoundListReady}` so it never
pops in on first open.

Owner decision D8 therefore needs no new pattern: one row on a card, one sheet built like
`Sound.tsx`, and the same warming trick, which matters because a 20-plus row language list has
the same first-open cost the sound list has.

**Rule:** the language sheet reuses `Sheet`, the sound sheet's list shape and its warming
mechanism. `ai/AGENTS.md` forbids new patterns where an existing one fits.

## C8. `showArabicNamesAtom` is misnamed under owner decision D4

`preference_show_arabic_names` governs whether the prayer row's second name is drawn. Under D4
the second slot stops being Arabic the moment the user changes it, so the atom, its storage key
and the `arabic` field on `PrayerRow` are all named for a language they will not always hold.

**Rule:** the second slot is named for its ROLE, not its language. The plan specifies the rename
and, critically, the storage migration: `stores/notifications.ts:575` shows this repo already has
a `migrate(oldKey, newKey, atom)` helper used for exactly this, so the pattern exists.

A rename that drops a user's existing preference is a regression. The migration is not optional
and the plan names the test that proves it.

## C9. What is still unknown, and who answers it

| Question | Answered by |
| --- | --- |
| Which library, and does it need an Intl polyfill on Hermes | R1 |
| How 20 catalogs are produced and kept correct without a reviewer | R2 |
| Whether pinned-LTR is acceptable, and what bidi rules are needed | R3 |
| Whether notification copy can localise at DELIVERY time | R5 |
| Whether an Android channel NAME can be updated in place | R5 |
| The first-run locale algorithm, and the picker's shape | R4 |
| The 11 prayer names in every candidate locale, with widths | R3 and round 2 |

The last row is the owner's named risk (D9) and the one this repository can measure itself once
the names exist.
