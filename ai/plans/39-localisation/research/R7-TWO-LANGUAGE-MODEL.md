# R7: The two-language model, surveyed and decided (compressed)

> **SUPERSEDED 2026-10-07.** The two-setting model in this document is superseded by
> `ASSUMPTIONS.md` A1 REVISED and `ONE-OR-TWO-LANGUAGES.md` as current: ONE setting (App
> language) plus the EXISTING toggle, the second name DERIVED (Arabic, unless the app language
> is Arabic). The survey evidence survives in A1 (shape and labels), A1b (upgrade pin), A2
> (Muslim Pro) and A4 (buffer halving).

The owner's deadlock, in his words:

> "Do we make a primary language or do we make a secondary language? Because now we have two
> conflicting languages. We essentially have two primary languages. If a user selects English as a
> secondary, then you'll have English in the first column, then English in the second column, and
> then your notifications will also be in English. But if you select English as a primary and
> Arabic as a secondary, then you will have the notifications be in Arabic, which means you'll
> never actually be able to set English as the notification. It's a deadlock, not a deadlock, but
> it seems wrong. We need a better approach."

Written 2026-09-29 at 516 lines. **Compressed 2026-10-07** to the sections other documents do
not carry. Dropped with the supersession: the §1 verdict table and the §4b default matrix (both
superseded by A1 REVISED's derived second name), §4c and §4d (carried by ASSUMPTIONS A3 and the
`R4-FINDINGS.md` corrections), §11's owed table (carried by `CONSTRAINTS.md` C1/C3/C5/C8), the
per-category survey tables §2.1-2.5 and the full source list. Recover the full original from
git history (C4).

What is kept here, because nothing else carries it:

## 1. Naming grounds: why "primary"/"secondary" fail (R7 §3)

The owner's instinct was "primary language / secondary language". The survey rejects it, on
four grounds:

1. **The industry already uses the pair for a different concept: fallback order.** Android's
   per-app language list and iOS Preferred Language Order both rank languages by priority.
   Adyen's terminal firmware documents a chain that "checks the secondary language (if toggled),
   card language, primary language, app language, then the device's operating system language".
   Fedora and KDE's CJK font pickers expose "primary language" and "secondary language" for
   fallback rendering. A user who has met the words anywhere else reads "secondary language" as
   "what to fall back to", not "what to print in the second column".
2. **A rank does not say where it applies.** "Prayer names" tells the user which surface moves.
   "Secondary language" does not. The owner's own deadlock came from exactly this: nothing in
   the label said which of the three jobs the setting owned.
3. **It does not survive both slots becoming freely selectable**, which the owner has said is
   possible ("We might end up making both dynamic, I'm not sure"). With both dynamic, "primary"
   and "secondary" describe layout positions, which the words do not mean.
4. **It implies the second is lesser.** For this app the second column is the liturgical name,
   which for many users is the more important one. The label would argue against the design.

## 2. The vocabulary the industry settled on (R7 §2.6)

| Concept | Netflix | YouTube | Spotify | Wikipedia | YouVersion | Muslim Pro | Quran Android | Anki |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Interface language | Display Language | App Language | App language | (system) App language | App Interface | Language of the app | Arabic mode | User Interface Language |
| Content language | Audio, Subtitles | Preferred languages | none | Wikipedia languages | Bible Text, Plans Text | Prayer names | Translations, Show ayah in Arabic | deck content (unnamed) |

Two rules fall out of the table:

1. The interface setting is named for the APP: "App language" or "Display Language". Six of the
   eight surveyed apps use one of those two exact strings.
2. The content setting is named for the NOUN it governs: Wikipedia languages, Bible Text,
   Preferred languages, Prayer names. No surveyed app names it by rank.

## 3. The Muslim Pro expectation (R7 §2.1, §4a)

Muslim Pro, the direct comparator, localises the displayed prayer name and markets it: "Fajr or
Subuh? You can change the Muslim Pro prayer names to match the names used in your country"
(Muslim Pro official Facebook post, retrieved 2026-09-29). An Indonesian user of Muslim Pro
sees Subuh as the primary name; their expectation carries over. No major prayer app keeps the
primary name English while the interface is in another language.

The engineering objection (the English name is the storage key, notification id, audio slug
and ordering key) is an implementation detail this repository already solved: `CONSTRAINTS.md`
C3 and `MEASURED.md` §2 require the English name to remain the domain identifier forever, with
translation as a presentation-time lookup keyed by it.

R7's recommendation that the first name follow the App language goes beyond owner decision D5
("The English prayer names, they will stay"). D5 stands until the owner moves it, and the model
degrades gracefully if he does not: pinning the first column to English changes nothing else.

## 4. Why a bilingual notification is rejected (R7 §4e)

Five verified constraints:

1. **The system takes the first line.** `interruptionLevel: 'timeSensitive'` plus its
   entitlement means iOS draws the "Time Sensitive" label itself; it cannot be suppressed while
   keeping the level, and dropping it gives up the breakthrough session 27 won.
2. **The app's whole notification design is one title line** (`shared/notifications.ts`, title
   only, no body), so the display budget is one short line beneath a system label.
3. **Truncation loses the meaningful end.** A truncated title keeps the names and drops the
   "now" or the interval, which is the actionable part.
4. **The slash is a bidi hazard.** `CONSTRAINTS.md` C6: neutral characters take direction from
   context and reorder at script boundaries. A Latin-then-Arabic-then-Latin title on a
   pinned-LTR layout is the worst case in that section.
5. **Doubling notifications would halve the buffer.** Two notifications per prayer double the
   request cost of every row against the fixed `NOTIFICATION_REQUEST_BUDGET` of 64. Session 28
   measured the standard profile at 3 days of horizon with both reminders; doubling rows cuts
   it toward 1.5 days and shortens the silence window when the background chain dies.

**No surveyed app ships a bilingual local notification.** The household argument (two readers
of the same phone) is real but is served better by the App language that household agrees on.
The owner's own read, "that can become really messy real quick", matches the evidence.

## 5. Migration (R7 §7)

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
  following the locale on upgrade would be a silent change (A1b). Fresh installs follow the
  device locale per R4's first-run algorithm. The What's New entry (D13) announces the feature
  in the user's current language and invites the change.
- **The storage migration uses the existing helper.** `stores/notifications.ts` already has
  `migrate(oldKey, newKey, atom)` for exactly this shape (`CONSTRAINTS.md` C8).
- **No notification re-arm runs on upgrade itself.** Copy is already English and stays English;
  the re-arm runs only when the user changes the App language, through the commit pattern C1
  specifies.
- **The width cache is untouched on upgrade** (still English) and resets per locale on every
  later change (`CONSTRAINTS.md` C5).

## 6. The two-setting model as surveyed (R7 §8)

| Setting | Exact label | Default, fresh install | Default, upgrade | Values |
| --- | --- | --- | --- | --- |
| Interface language | App language | Device locale via R4's matcher | English (pinned) | Every shipped language, endonym-labelled |
| Second prayer name | Prayer names | Arabic | From the migrated toggle | Any shipped language, or None |

What each controls, surface by surface:

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

Example configurations:

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

## 7. Rejected alternatives (R7 §9)

| Alternative | Why rejected |
| --- | --- |
| Primary language / Secondary language, two pickers, notifications follow the secondary (the D4 framing) | The deadlock itself. Ties interface language to a display choice, so an English speaker who likes Arabic names loses English notifications, and "English in both columns" becomes expressible but useless. The naming also collides with the industry's fallback meaning (section 1) |
| One App language setting only, no second slot | Muslim Pro's simpler half. Cannot express the bilingual row at all, so the existing default user loses الفجر on upgrade unless a toggle is kept, which lands back where the app is today. The Indonesian-with-Arabic row, the most likely global configuration, is unreachable |
| Bilingual notification titles | Section 4. One title line under a system label, truncation loses the actionable end, the slash is a bidi hazard, and doubling armed rows halves the notification buffer horizon measured by session 28 |
| First name stays English permanently (D5 read literally) | Defensible for a London-only app, incoherent for the global audience of D1: no comparator ships a permanent English primary beside a localised interface, and Muslim Pro markets the opposite. Retained as the graceful degradation if the owner keeps the ruling; everything else in this model survives it |

The strongest argument against putting the first name under the App language (R7 §10): it
spends the app's layout stability to buy global coherence: every non-English user's first
launch exercises the width programme (Indonesian "Sepertiga Malam Terakhir" at 2.57x English
width) while the majority London audience gains nothing, and it overrides a standing ruling.
Counterweight: the width programme is already required by the second column's localisation, and
the identifier coupling is already solved by C3's presentation-time lookup.

## 8. Assumptions (R7 §13)

1. The launch set ships at least the eight languages R4 recommends, each with an authored
   11-name catalog meeting the width budget, so "any shipped language" is a real list.
2. Owner decision D7 (never mirror, pinned LTR) stands, so no direction flip or reload path is
   modelled here. R3 owns that question.
3. The prayer-name catalog keys off the English identifier, per C3, so no storage, notification
   id or audio slug ever sees a translated name.
4. Notifications keep their current shape: local, scheduled, title only, time-sensitive on iOS.
   Any move to server push changes the notification mechanics, not its conclusion.
5. "Prayer names" controls the second slot only. If the owner later rules that it should also
   govern the first name (Muslim Pro semantics), the model becomes three-way and the naming
   needs a second look; that is the one fork this document does not close.

The full source list (23 web sources retrieved 2026-09-29 plus repository evidence) survives in
git history (C4); inline citations above carry the kept quotes.
