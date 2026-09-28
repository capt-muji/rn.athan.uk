# R7: The two-language model, surveyed and decided

The owner's deadlock, in his words:

> "Do we make a primary language or do we make a secondary language? Because now we have two
> conflicting languages. We essentially have two primary languages. If a user selects English as a
> secondary, then you'll have English in the first column, then English in the second column, and
> then your notifications will also be in English. But if you select English as a primary and
> Arabic as a secondary, then you will have the notifications be in Arabic, which means you'll
> never actually be able to set English as the notification. It's a deadlock, not a deadlock, but
> it seems wrong. We need a better approach."

This document tests the proposed fix (two independent settings), surveys how real apps model the
same problem, and delivers a recommendation with alternatives costed. Evidence comes from help
centres, app store listings and public source strings, each cited. Where a claim comes from this
repository's own measurements, it names the file.

## 1. Verdict

The deadlock is real and structural. One setting is being asked to do two unrelated jobs: be the
app's interface language, and be the prayer list's second display column. Tying the two together
produces every contradiction the owner listed, plus one he did not: it makes the notification
language depend on a choice the user made for an unrelated visual reason.

The fix the analysis proposes is correct, and the industry agrees on its shape and its naming:

| Setting | Exact label | Controls |
| --- | --- | --- |
| 1 | **App language** | Settings, every sheet, every modal, Help, What's New, notification copy, widget text, Android channel names, and the prayer row's FIRST name |
| 2 | **Prayer names** | The prayer row's SECOND name and the explanation box's second line. Values: any shipped language, or None |

Notifications follow the App language, always, in full. The Prayer names setting never touches
anything outside the prayer list. That single rule dissolves the deadlock: the user who likes
Arabic names on the list keeps English notifications, because the two are no longer connected.

One recommendation in this document goes beyond a standing owner ruling and is flagged as such:
the first name should follow the App language rather than staying English permanently (section
4a). Owner decision D5 stands until the owner moves it, and the model degrades gracefully if he
does not: pinning the first column to English changes nothing else in this recommendation.

## 2. The general pattern: interface language versus content language

This is a known problem class with a settled industry shape. Apps whose main surface is language
content (scripture, film, courses, encyclopaedia articles) all separate the language of the
chrome from the language of the content. The divergence between apps is in naming and in how
many content settings exist, not in whether the split exists.

### 2.1 Quran apps

| App | Interface language setting | Content language setting(s) | Where they live | Notes |
| --- | --- | --- | --- | --- |
| Quran.com | "preferred language" dropdown, per page | Per-surah "Translations" (multiple, side by side), script choice (Uthmani, IndoPak, Tajweed), reading view (Arabic, Translation, Word by Word) | Interface dropdown in the header; content in the reading Settings menu | Server also pre-populates reading defaults from device language and country via a `CountryLanguagePreference` record holding locale, translations, tafsir, reciter and word-by-word language as separate columns |
| Muslim Pro | "Language of the app" | "Prayer names"; "Quran translations" per surah; "Ayah Before Translation" toggle | One Settings screen called Language, under App Settings, holding both the app language row and the Prayer names row | The direct comparator. Their help centre: "Tap on Language under App Settings. Then, tap on Prayer names to change the name of prayers according to your preference." Article title: "Would you like to set the prayer names in your native language?" |
| Tarteel | Interface tied to app/system language | "Translations" chosen in Settings and per-verse in the reader; one visible at a time in Adaptive mode, multiple in Reader mode | Settings, plus a long-press verse menu | Interface language is not offered as an independent picker in-app |
| Ayah | Interface follows the app language list (English, Arabic, German, French) | Page Settings: translation and tafsir choice, shown beside or below Arabic | Page Settings button in the reader | Arabic scripture is permanent content; it is never a "setting" |
| Quran Android (open source) | "Arabic mode (الوضع العربي)" with summary "Use Arabic for application interface" | Translations screen (multi-select); "Show ayah in Arabic above the translation" toggle | Preferences | Source strings verbatim from the public repository. The Arabic-above-translation toggle is this app's second-column concept, named as a display fact, not a language rank |

The Quran app pattern: Arabic scripture is content, present regardless. The interface language
and the translation language are separate settings with separate names, and prayer-adjacent
display toggles are named for what they show.

Muslim Pro matters most here because it is a prayer-times app first, and because its "Fajr or
Subuh?" marketing states the expectation outright: "You can change the Muslim Pro prayer names to
match the names used in your country" (Muslim Pro official Facebook post, retrieved 2026-09-29).
Users expect the displayed prayer name to localise. No major prayer app keeps the primary name
English while the interface is in another language.

### 2.2 Bible apps

| App | Interface language | Content language | Exact labels |
| --- | --- | --- | --- |
| YouVersion Bible App | "App Interface" | "Bible Text"; "Plans Text" | One Language screen holds all three. Help centre: App Interface "will be applied to the App interface, including titles, dialog messages, and other components"; Bible Text "determines the Bible versions displayed"; Plans Text "determines which Plans will appear in search results" |
| Blue Letter Bible | Follows the app language list | "My Bibles" version selector with two scroll wheels (primary translation, secondary parallel translation) | Version Selector in the app drawer |

YouVersion is the strongest structural precedent: one Language screen, three named sub-settings,
each described by the surface it governs. None is called primary or secondary.

### 2.3 Language-learning apps

| App | How it models the pair | Evidence |
| --- | --- | --- |
| Duolingo | Interface language equals the course "base language". Not separated | Duolingo Wiki FAQ: "Changing to a course with a different base language will also change the Duolingo web interface to that language." Community threads titled "How do I change interface language in the app" show users unable to find the option |
| Quranic | Same conflation as Duolingo, by design: the course teaches Quranic Arabic to speakers of a base language, and the interface follows that base | Course listing: "the #1 language learning app for Muslims who want to learn Quranic Arabic", lessons present Arabic words with transliteration and meaning. The Arabic is content; the base language is the interface |
| Anki / AnkiMobile | "User Interface Language" follows iOS system settings, including per-app language | Manual: "AnkiMobile's interface has been translated into a few different languages. Your iOS settings control which language AnkiMobile will appear in." Deck content language is whatever the deck is |
| Memrise | Interface follows device language, no in-app override | Forum complaint: "The memrise app automatically shows hindi as the app language and there is no option to force a language" |

The learning apps are the cautionary tales. Duolingo and Memrise conflate interface with content
and accumulate support complaints for it. Anki, which separates cleanly (system language for
chrome, deck content is data), has no such thread. When your app's content is itself linguistic,
the separation is not optional polish, it is the product.

### 2.4 Media apps

| App | Settings and exact labels | Hierarchy |
| --- | --- | --- |
| Netflix | "Display Language" (profile), "Audio" and "Subtitles" (per title, from the player) | Profile level for chrome, playback level for content. Help: "You can change your Netflix language settings for display text, audio, and subtitles." Audio and subtitle choices save per profile after a title sets them |
| Spotify | "App language" | One setting. Content language is not a setting; music language is discovery, driven by behaviour |
| YouTube | "App Language" then "Preferred languages" | Both live on one screen: "Tap Settings. Tap Languages. Select your App Language. You can also proceed to select the Preferred languages you'd like to watch your videos in." Email language follows the display language. Help also notes "If your app language is not supported, the search keyboard will default to English" |

YouTube is the closest mobile precedent to this app's shape: one Languages screen holding two
adjacent, independent pickers, one for the chrome and one for the content.

### 2.5 Dictionary, translation and reference apps

| App | Model |
| --- | --- |
| Google Translate | Interface follows the device language. Translation direction (From, To, Detect) is primary in-app content, chosen on the main surface, not in Settings |
| Reverso | Interface follows device; dictionary pair chosen on the main surface. Forum complaints centre on the pair defaulting, not the interface |
| Linguee | Interface follows device; the dictionary pair is the main surface |
| Wikipedia | The reference case. Settings holds "Wikipedia languages" (content, add, remove, rearrange; "Your topmost language will be used by default when searching") beside the app language, which follows the system on first run: "When the app is first installed, it defaults to the system language of your device" |

Wikipedia's labels are the cleanest in the survey because they name the noun: the app, and the
Wikipedia languages. Nothing is ranked.

### 2.6 The vocabulary the industry has settled on

| Concept | Netflix | YouTube | Spotify | Wikipedia | YouVersion | Muslim Pro | Quran Android | Anki |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Interface language | Display Language | App Language | App language | (system) App language | App Interface | Language of the app | Arabic mode | User Interface Language |
| Content language | Audio, Subtitles | Preferred languages | none | Wikipedia languages | Bible Text, Plans Text | Prayer names | Translations, Show ayah in Arabic | deck content (unnamed) |

Two rules fall out of the table:

1. The interface setting is named for the APP: "App language" or "Display Language". Six of the
   eight surveyed apps use one of those two exact strings.
2. The content setting is named for the NOUN it governs: Wikipedia languages, Bible Text,
   Preferred languages, Prayer names. No surveyed app names it by rank.

## 3. Why "primary" and "secondary" fail as labels

The owner's instinct was "primary language / secondary language". The survey rejects it, on four
grounds:

1. **The industry already uses the pair for a different concept: fallback order.** Android's
   per-app language list and iOS Preferred Language Order both rank languages by priority.
   Adyen's terminal firmware documents a chain that "checks the secondary language (if toggled),
   card language, primary language, app language, then the device's operating system language".
   Fedora and KDE's CJK font pickers expose "primary language" and "secondary language" for
   fallback rendering. A user who has met the words anywhere else reads "secondary language" as
   "what to fall back to", not "what to print in the second column".
2. **A rank does not say where it applies.** "Prayer names" tells the user which surface moves.
   "Secondary language" does not. The owner's own deadlock came from exactly this: nothing in the
   label said which of the three jobs the setting owned.
3. **It does not survive both slots becoming freely selectable**, which the owner has said is
   possible ("We might end up making both dynamic, I'm not sure"). With both dynamic, "primary"
   and "secondary" describe layout positions, which the words do not mean.
4. **It implies the second is lesser.** For this app the second column is the liturgical name,
   which for many users is the more important one. The label would argue against the design.

## 4. The owner's five sub-questions

### 4a. Should the first name follow the app language, or stay English permanently?

**Recommendation: follow the App language. English is the default value, not a fixed column.**

Evidence:

- Muslim Pro localises the displayed prayer name and markets it: "Fajr or Subuh? You can change
  the Muslim Pro prayer names to match the names used in your country." An Indonesian user of
  Muslim Pro sees Subuh as the primary name. Their expectation carries over.
- YouVersion's reading surface follows "Bible Text", Wikipedia's article follows the content
  language, Netflix's title follows the audio choice. In every surveyed app, the main content
  surface follows a language the user chose, and the chrome follows another. A prayer list that
  says "Fajr" inside an Indonesian interface is the one configuration no comparator ships.
- The engineering objection, that the English name is the storage key, the notification id, the
  audio slug and the ordering key, is an implementation detail, and this repository has already
  solved it: `CONSTRAINTS.md` C3 and `MEASURED.md` section 2 require the English name to remain
  the domain identifier forever, with translation as a presentation-time lookup keyed by it. The
  identifier never appears in the UI by necessity, only by today's habit.
- The width machinery is already per-locale by design: `InitialWidthMeasurement` measures the
  longest name of an array, and `WIDTH-EVIDENCE.md` shows making its input the active catalog is
  a change of input, not of architecture.

The honest cost: this puts the most layout-sensitive surface in the app (width-cached column,
fixed 57pt row height, overlay anchors) under a user-changeable locale, and imports the
width-remediation programme into every non-English user's first launch. `WIDTH-EVIDENCE.md`
measured Indonesian extras names at 2.57x English width. That programme is required for the
feature regardless, because the second column already localises.

This recommendation goes beyond owner decision D5 ("The English prayer names, they will stay").
Per the session's rules the ruling stands until the owner moves it, and the model survives its
loss unchanged: if D5 holds, the first column pins to English, the App language drives chrome and
notifications, and every other conclusion in this document still applies. The owner asked for
exactly this reporting: "If you have other alternatives, just tell me, don't implement them."

### 4b. What should the second slot default to, and may the user turn it off?

**Default matrix:**

| App language | Second name default | Resulting row | Rationale |
| --- | --- | --- | --- |
| English | Arabic | Fajr then الفجر | Preserves today's shipped default exactly. Zero visual change on upgrade |
| Any non-Arabic language | Arabic | Subuh then الفجر | The liturgical name is the app's identity, the same role Arabic plays on a London mosque board. The most likely real configuration for the global audience |
| Arabic | Hidden (stored value Arabic, render collapses) | الفجر once | Showing Arabic twice is noise. The row keeps one name |

The user may always turn the second name off (value None) or point it at any shipped language.
The existing on/off toggle becomes the None value rather than a separate control.

### 4c. Can the user set both slots to the same language?

**Allow it in the picker with one guard, and make the render tolerant.**

- The Prayer names picker shows the row matching the current App language as disabled, with a
  one-line reason beneath it ("Same as app language", translated). This is state, not an error,
  and it is the pattern YouTube's Languages screen uses for adjacent-but-independent pickers.
- The render layer collapses the second column whenever it would duplicate the first, without
  rewriting the stored value. This covers the residual case: the user sets Prayer names to
  Turkish, then later changes the App language to Turkish. The stored preference survives and
  re-expresses itself the moment the two diverge again.

Preventing the choice outright (rewriting the stored value) is rejected because it destroys a
preference the user expressed, and because this repository's own ethos is that silent preference
changes are defects.

### 4d. Should notifications follow the app language or the prayer-name setting?

**The App language, in full, including the prayer name inside the copy.**

A notification is the interface, delivered outside the app. It contains both a prayer name and
interface copy ("now", "in 5 minutes"), and those two halves must agree, which means one
language source. The surveyed apps are unanimous:

- Netflix: email language follows the display language; no separate notification language exists.
- YouTube: "Your emails from YouTube are delivered in the default language for your country. If
  you've changed your YouTube language settings, you can change your email settings to match."
  One setting, one language.
- WhatsApp, Muslim Pro, Athan: notification language follows the app language. None offers a
  per-notification language.
- The only bilingual-notification implementations found are server-side, and they do not put two
  languages in one notification: "The backend sends two separate notifications, one in Arabic to
  the Arabic topic, one in English to the English topic" (engineering write-up on bilingual
  push, medium.com, retrieved 2026-09-29). Per-language delivery at send time, one language per
  message.

This is the rule that breaks the owner's deadlock. The user who selects Arabic prayer names
keeps English notifications, because notifications read the App language and nothing else.

Mechanically, this repo has already established the cost: copy is frozen at schedule time
(`NOTIFICATION-EVIDENCE.md`, verified against the installed expo-notifications source), so a
language change re-runs the scheduling pass under `withSchedulingLock`, modelled on
`commitSoundSelection`, with deterministic identifiers replacing each armed request in place
(`R4-FINDINGS.md` correction 2). Android channel names rename in place with the same ids
(`R4-FINDINGS.md` correction 1).

### 4e. Is a bilingual notification ("Fajr / الفجر now") ever right?

**No. Ship one language per notification.**

The constraints, all verified:

1. **The system takes the first line.** The app sets `interruptionLevel: 'timeSensitive'` with
   the matching entitlement. iOS draws the "Time Sensitive" label itself; it is part of how the
   system presents an alert that breaks through Focus. It cannot be suppressed while keeping the
   level, and dropping the level gives up the breakthrough session 27 existed to win. Platform
   documentation describes the behaviour and its user control ("Delivered immediately even if
   Focus mode is enabled, with a yellow Time-Sensitive banner. Users can disable this
   interruption level", pushwoosh.com, retrieved 2026-09-29).
2. **The app's whole notification design is one title line.** `shared/notifications.ts` ships
   title only, no body, recorded twice. Industry guidance for that line is short: "A title near
   25 to 35 characters and a body near 90 to 120 characters gives the message a strong chance of
   staying readable on the Lock Screen" (engagelab.com notification character limits, retrieved
   2026-09-29). "Fajr / الفجر in 45m" spends the budget on redundancy.
3. **Truncation loses the meaningful end.** A truncated title keeps the names and drops the
   "now" or the interval, which is the actionable part. On narrow devices this is the expected
   outcome, not the edge case.
4. **The slash is a bidi hazard.** `CONSTRAINTS.md` C6 records that neutral characters (colon,
   slash, hyphen) take direction from context and reorder at script boundaries. A Latin-then-
   Arabic-then-Latin title on a pinned-LTR layout is the worst case in that section.
5. **Doubling notifications would halve the buffer.** Arming two notifications per prayer, one
   per language, doubles the request cost of every row against the fixed
   `NOTIFICATION_REQUEST_BUDGET` of 64. Session 28 measured the standard profile at 3 days of
   horizon with both reminders; doubling rows cuts it toward 1.5 days and shortens the silence
   window when the background chain dies. That is a real reliability cost for a cosmetic gain.

No surveyed app ships a bilingual local notification. The household argument (two readers of the
same phone) is real but is served better by the App language that household agrees on. The
owner's own read, "that can become really messy real quick", matches the evidence.

## 5. Naming the settings

Candidates, tested against the four criteria (obvious without a help page, survives translation
into 20 languages, survives both slots becoming dynamic, honest about what it does):

| Candidate pair | Verdict | Reason |
| --- | --- | --- |
| Primary language / Secondary language | Reject | Section 3. Rank words, fallback meaning elsewhere, silent on which surface moves, does not survive both dynamic |
| **App language / Prayer names** | **Recommend** | "App language" is the converged industry string (Wikipedia, YouTube, Spotify, Instagram, Facebook; Netflix's variant is "Display Language"). "Prayer names" is Muslim Pro's exact label in the same domain, it names the surface it governs, and it follows the industry's noun rule. Both are plain noun phrases that translate literally: App-Sprache, لغة التطبيق, Bahasa aplikasi, أسماء الصلوات, Nama sholat, Gebetsnamen. Both stay honest if the second slot becomes fully dynamic |
| Display language / Prayer name script | Partial reject | "Display language" is fine (Netflix) but redundant beside a Display card in this app's settings. "Script" is a font term; Indonesian versus Arabic differs in language, not only script, and no user says script |
| Interface language / Show names in | Reject | "Interface" is developer vocabulary; the surveyed apps that expose a picker label it Language or App language, and reserve "interface language" for support prose. "Show names in" is a sentence fragment that dangles as a row label and breaks when translated |

One residual risk with "Prayer names": a Muslim Pro user's muscle memory expects that setting to
change the primary name. Under this model the primary name follows App language, which is the row
directly above in the same card, and the Prayer names row's value text ("العربية" or "None")
disambiguates. If the owner still finds it ambiguous after seeing it drawn, the runner-up label
is "Second prayer name", which sacrifices brevity for explicitness.

## 6. The settings UI shape

**One Language card, two rows, both chevron rows opening their own sheet.**

- The card sits first in the settings sheet, above Sound. It holds:
  - "App language", value shows the current language's endonym, chevron opens the language sheet.
  - "Prayer names", value shows the endonym or "None", chevron opens the prayer-names sheet.
- The "Show arabic names" toggle is removed from the Display card. Its two states are the two
  most common values of the new picker (Arabic, None), so keeping both controls would offer two
  ways to change one thing, and the toggle's name is already wrong under D4 (`CONSTRAINTS.md`
  C8).
- Both sheets are built like `Sound.tsx`: scrolling selectable rows, radio-style chosen state,
  warmed by the settings sheet's `onFirstPresent` so a 20-plus row list never pops in
  (`CONSTRAINTS.md` C7, owner decision D8).

Why one card rather than splitting across cards:

- Muslim Pro puts "Language of the app" and "Prayer names" on one Language screen. YouVersion
  puts App Interface, Bible Text and Plans Text on one Language screen. YouTube puts App Language
  and Preferred languages on one Languages screen. The grouping is the consensus because a user
  looking for "the language thing" finds every language thing in one place.
- Splitting would put "Prayer names" in the Display card beside toggles that hide and show
  things, which frames a language choice as a visibility preference, which is the exact confusion
  that produced the deadlock.

**Is the second setting a picker or a toggle?** A picker. The toggle cannot express
"Indonesian interface with Arabic names" or "Arabic second name replaced by Urdu", and the model
exists to make those expressible. The picker is the generalisation of the toggle, not a new
concept: same row position, same job, more values.

**Dependent settings without a form.** The payoff of the two-setting model is that the settings
do not depend on each other, so there is no dependent-form problem to solve. The one coupling
that exists (the duplicate guard, 4c) is expressed as a disabled row with a reason inside the
second sheet, not as a wizard or a nested form. This matches the platform guidance: "Use
progressive disclosure to make layouts cleaner and easier to interact with. Use disclosure
triangles, menus, or nested views to reduce how much content is visible at once"
(developer.apple.com/design/human-interface-guidelines/layout, retrieved 2026-09-29). The
chevron row opening a sheet is the app's existing disclosure idiom; no new pattern is introduced.

One platform note for the App language row: on Android 13 and newer, an in-app picker should
call `setApplicationLocales` so the choice also appears in the system's per-app language screen;
the platform documentation states these APIs "automatically sync with system settings" so users
get one consistent experience regardless of where they change it (developer.android.com guide to
per-app language preferences, retrieved 2026-09-29). The prayer-names setting has no system
equivalent and stays app-private.

## 7. Migration

The hard requirement: no existing user's app changes appearance without them asking. Every rule
below follows from it.

| Existing state | Becomes | Visible change on upgrade |
| --- | --- | --- |
| `preference_show_arabic_names` = true | Prayer names = Arabic | None. Row shows Fajr then الفجر as today |
| `preference_show_arabic_names` = false | Prayer names = None | None. Second column hidden as today |
| No App language value (every existing install) | App language = English, written explicitly | None. Chrome stays English, notifications stay English, first name stays Fajr |

Details the plan must carry:

- **App language defaults differently for existing and fresh installs.** Existing installs pin
  to English, even if the device locale is not English, because today's app is English-only and
  following the locale on upgrade would be a silent change. Fresh installs follow the device
  locale per R4's first-run algorithm. The What's New entry (owner decision D13) announces the
  feature in the user's current language and invites the change.
- **The storage migration uses the existing helper.** `stores/notifications.ts` already has
  `migrate(oldKey, newKey, atom)` for exactly this shape (`CONSTRAINTS.md` C8), and the plan
  names the test that proves no preference is dropped.
- **No notification re-arm runs on upgrade itself.** Copy is already English and stays English.
  The re-arm runs only when the user changes the App language, through the commit pattern C1
  specifies.
- **The width cache is untouched on upgrade** (still English) and resets per locale on every
  later change (`CONSTRAINTS.md` C5, the widen-only cache must not pin a wide locale's column
  after the user switches away).

## 8. The recommended model

**The settings, with exact labels and defaults:**

| Setting | Exact label | Default, fresh install | Default, upgrade | Values |
| --- | --- | --- | --- | --- |
| Interface language | App language | Device locale via R4's matcher | English (pinned) | Every shipped language, endonym-labelled |
| Second prayer name | Prayer names | Arabic | From the migrated toggle | Any shipped language, or None |

**What each controls, surface by surface:**

| Surface | Driven by |
| --- | --- |
| Prayer row, first name | App language |
| Prayer row, second name | Prayer names |
| Explanation box, primary line | App language |
| Explanation box, second line | Prayer names |
| Settings sheet, all sheets, all modals, Help, What's New | App language |
| Notification title, prayer name and copy | App language |
| Android notification channel names | App language |
| Widget prayer names, date label, stale card, all widget chrome | App language |
| Widget second name | Never. Widgets show one name today and keep one name |

**Example configurations:**

| User | App language | Prayer names | First name | Second name | Interface | Notification |
| --- | --- | --- | --- | --- | --- | --- |
| English speaker in London | English | Arabic | Fajr | الفجر | English | Fajr now |
| Current default user on upgrade | English (pinned by migration) | Arabic (from toggle true) | Fajr | الفجر | English | Fajr now |
| Current default user, toggle off, on upgrade | English (pinned) | None (from toggle false) | Fajr | hidden | English | Fajr now |
| Arabic speaker | العربية | Arabic, collapsed as duplicate | الفجر | hidden | Arabic | الفجر الآن |
| Indonesian speaker who wants Arabic names | Bahasa Indonesia | Arabic | Subuh | الفجر | Indonesian | Indonesian copy with Subuh |
| Turkish speaker who wants no second name | Türkçe | None | Akşam | hidden | Turkish | Turkish copy with Akşam |
| English speaker learning Urdu | English | اردو | Fajr | فجر | English | Fajr now |

The last row is the configuration the owner's original model could not express without breaking
his notifications. It costs nothing here.

## 9. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Primary language / Secondary language, two pickers, notifications follow the secondary (the D4 framing) | The deadlock itself. Ties interface language to a display choice, so an English speaker who likes Arabic names loses English notifications, and "English in both columns" becomes expressible but useless. The naming also collides with the industry's fallback meaning (section 3) |
| One App language setting only, no second slot | Muslim Pro's simpler half. Cannot express the bilingual row at all, so the existing default user loses الفجر on upgrade unless a toggle is kept, which lands back where the app is today. The Indonesian-with-Arabic row, the most likely global configuration, is unreachable |
| Bilingual notification titles | Section 4e. One title line under a system label, truncation loses the actionable end, the slash is a bidi hazard, and doubling armed rows halves the notification buffer horizon measured by session 28 |
| First name stays English permanently (D5 read literally) | Defensible for a London-only app, incoherent for the global audience of D1: no comparator ships a permanent English primary beside a localised interface, and Muslim Pro markets the opposite. Retained as the graceful degradation if the owner keeps the ruling; everything else in this model survives it |

## 10. The strongest argument against this recommendation

It spends the app's layout stability to buy global coherence. The first column is the most
constrained surface in the product: a width cached in MMKV with a widen-only rule, a fixed 57pt
row height, and overlay boxes positioned from measured absolute coordinates. Putting it under a
user-changeable locale means every non-English user's first launch exercises the width
programme (per-locale measurement, cache reset, authored short names for phrase-length extras
like Indonesian "Sepertiga Malam Terakhir" at 2.57x English width) on day one, while the
majority London audience, the users the app has today, gains nothing from the change. It also
overrides a standing ruling. The counterweight is that the width programme is already required
by the second column's localisation, that the identifier coupling is already solved by C3's
presentation-time lookup, and that a global app whose list says Fajr inside an Indonesian
interface is a defect every comparator has chosen to avoid.

## 11. What this repository still owes if this model is adopted

| Owed by | Item |
| --- | --- |
| C1 | `commitLanguageSelection` under `withSchedulingLock`, values computed once and passed to both halves, inheriting session 33's partial-failure ruling |
| C3 | The branded identifier type so a display name can never reach a storage key, notification id or audio slug |
| C5 | Width cache keyed per locale, reset on language change without the ISSUES #22 reflow |
| C8 | The rename of the second-slot atom, key and `PrayerRow.arabic` field to role names, with the `migrate` helper and its test |
| This document | The None value, the duplicate guard, and the end-of-life of the "Show arabic names" toggle |
| R5 | Delivery-time localisation remains closed, so the re-arm cost stands as measured |

## 12. Sources

Retrieved 2026-09-29 unless noted.

- Muslim Pro help centre, "How to change the 5 daily prayer names in the app":
  https://support.muslimpro.com/help/en/articles/how-to-change-the-5-daily-prayer-names-in-the-app
- Muslim Pro help centre, "How to Change Language settings in App?":
  https://support.muslimpro.com/help/en/articles/how-to-change-language-settings-in-app
- Muslim Pro official Facebook, "Fajr or Subuh?":
  https://www.facebook.com/muslimpro/posts/1441389459290173/
- YouVersion help, "Android: Language Settings" (App Interface, Bible Text, Plans Text):
  https://help.youversion.com/l/en/article/bmzqrxkroh-language-setting-android
- YouVersion help, "iOS: Settings":
  https://help.youversion.com/l/en/article/7fuwheghdi-i-os-account-settings
- Netflix help, "How to change the language on Netflix" (Display Language, Audio and Subtitles):
  https://help.netflix.com/en/node/13245
- YouTube help, "Change language or location settings" (App Language, Preferred languages, email
  language): https://support.google.com/youtube/answer/87604
- Wikimedia Apps FAQ, Android (Wikipedia languages, system default on install):
  https://www.mediawiki.org/wiki/Wikimedia_Apps/FAQ/Android
- AnkiMobile docs, "User Interface Language":
  https://docs.ankimobile.net/interface-language.html
- Quran.com support (preferred language dropdown):
  https://quran.com/support
- Quran.com product update, reading settings (translations, scripts, views):
  https://quran.com/explore/build-your-personalized-quran-experience
- Quran.com API country language preferences (device language populates reading defaults):
  https://deepwiki.com/quran/quran.com-api/14-country-language-preferences
- Quran Android public strings ("Arabic mode", "Show ayah in Arabic above the translation"):
  https://github.com/quran/quran_android/blob/master/app/src/main/res/values/strings.xml
- Tarteel support, "Translations": https://support.tarteel.ai/en/articles/12414411-translations
- Athan by IslamicFinder, App Store release notes ("Switch anytime from Settings > Language"):
  https://apps.apple.com/us/app/athan-prayer-times-dua-azkar/id505858403
- Duolingo Wiki, "Frequently asked questions/Courses" (base language changes interface):
  https://duolingo.fandom.com/wiki/Frequently_asked_questions/Courses
- Memrise forum, interface follows device with no override:
  https://memriseforum.mylittlewordland.com/community.memrise.com/t/how-can-i-switch-to-english-user-interface/9347.html
- Android developers, "Per-app language preferences" (in-app pickers sync with system):
  https://developer.android.com/guide/topics/resources/app-languages
- Apple HIG, Layout (progressive disclosure):
  https://developer.apple.com/design/human-interface-guidelines/layout
- Pushwoosh docs, time-sensitive delivery and its banner:
  https://knowledgebase.pushwoosh.com/product/content/push-presets/
- EngageLab, notification character limits (title 25 to 35 characters):
  https://www.engagelab.com/blog/push-notification-character-limits
- Bilingual push notifications, two-topic approach:
  https://medium.com/@abdelmenem.developer/bilingual-push-notifications-the-killed-app-problem-070a874e6787
- HoldApp, localising iOS notifications (Notification Service Extension):
  https://www.holdapp.com/blog/how-to-send-ios-notifications-in-different-languages
- Adyen release notes, primary and secondary language as fallback chain:
  https://docs.adyen.com/point-of-sale/firmware-release-notes

Repository evidence: `ai/plans/39-localisation/MEASURED.md`, `CONSTRAINTS.md`,
`NOTIFICATION-EVIDENCE.md`, `WIDTH-EVIDENCE.md`, `OWNER-DECISIONS.md`,
`OPEN-DESIGN-QUESTION.md`, `R4-FINDINGS.md`, `R3-FINDINGS.md`; `components/prayer/Prayer.tsx`,
`components/prayer/Explanation.tsx`, `components/sheets/screens/Settings.tsx`,
`components/sheets/screens/Sound.tsx`, `stores/ui.ts`, `shared/notifications.ts`,
`shared/widgetTimeline.ts`.

## 13. Assumptions

1. The launch set ships at least the eight languages R4 recommends, each with an authored
   11-name catalog meeting the width budget, so "any shipped language" is a real list.
2. Owner decision D7 (never mirror, pinned LTR) stands, so no direction flip or reload path is
   modelled here. R3 owns that question.
3. The prayer-name catalog keys off the English identifier, per C3, so no storage, notification
   id or audio slug ever sees a translated name.
4. Notifications keep their current shape: local, scheduled, title only, time-sensitive on iOS.
   Any move to server push changes section 4d's mechanics, not its conclusion.
5. "Prayer names" controls the second slot only. If the owner later rules that it should also
   govern the first name (Muslim Pro semantics), the model becomes three-way and section 5's
   naming needs a second look; that is the one fork this document does not close.
