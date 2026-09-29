# Session 39: the owner's rulings, taken 2026-09-28 and 2026-09-29

Every ruling below is the owner's, quoted from the session that planned this row. A planning session
never overrides one of these; where research contradicts a ruling, the research is reported beside it
and the ruling stands until the owner moves it.

## D1. Scope: build for unlimited, launch with at least the top 20

🐋  "We're gonna go global and we need to at least include the top 20 most spoken languages in the
world."

🐋  "I want to provide as many languages as possible to the users because this is going to be a
global, global app."

Adding a language is a data decision, never a code change. The launch set is chosen later; the
architecture never caps the count.

## D2. Nothing is hardcoded

🐋  "I don't want to hard code every language and then have a translation for every single language."

The catalogs are data. A translation is authored, generated or corrected outside the source tree and
loaded as data, so the number of languages does not change the amount of code.

## D3. Offline, always

🐋  "It should be working offline because I don't see why a language would need an online connection
to change the language."

A language switch performs no network call. Catalogs ship with the binary or sit in on-device
storage. A phone in aeroplane mode can change language and see every string.

## D4. Primary and secondary language, not English and Arabic (2026-09-29)

🐋  "English is the default, but as for example, the English names that we're keeping, for example on
the prayer row, we're keeping the English name always, right? Because that's our primary language.
And then we should have a secondary language. Primary language, secondary language. I think we should
maybe have two different atoms at least, to differentiate. Rather than saying Arabic language or
English language. We don't know how to put the language name in because we might end up making both
dynamic."

This supersedes the earlier framing of "English plus a chosen language". The prayer row carries two
name slots, and neither is named for a language in the code:

| Slot | Default | Selectable |
| --- | --- | --- |
| Primary name | English | Owner has not ruled; design for it |
| Secondary name | Arabic | Yes, this is the row the user changes |

Consequences the plan must carry:
- `showArabicNamesAtom` is the wrong name for the toggle that governs the second slot, because the
  second slot stops being Arabic the moment the user changes it.
- `PRAYERS_ARABIC` and `EXTRAS_ARABIC` stop being a hardcoded second language and become the default
  value of the secondary catalog.
- The `arabic` field on `PrayerRow` is named for a language it will not always hold.
- A user may set the secondary language to the same language as the primary, or to none. Both cases
  need a defined behaviour.

## D5. The prayer row keeps its English name; the second column is what changes

🐋  "The English prayer names, they will stay. On the prayer list itself, only the Arabic names will
change to what the user has selected."

🐋  "On the info box, all the Arabic will be changed to what you select."

So the prayer list is bilingual by design and stays bilingual. The language setting changes the
SECOND name, the explanation text and every surface below, never the first name.

## D6. Every sheet, modal and setting is translated

🐋  "It will also change the settings, all the bottom sheets, all the modals."

The chrome of the app follows the selected language in full. The prayer row's primary name does not.

## D7. The layout never mirrors. Left-align every language.

🐋  "I know left to right is going to be an issue, but I think we should always left align it exactly
like English, even if the text is written right to left, such as Arabic. Instead of shifting
everything to the right, which our app shouldn't actually do because then it becomes a really
difficult nightmare to handle the layout... it should work exactly like the English, so it should be
left to right, even if it's a right to left language, we should basically replace it with a left to
right alignment."

🐋  "I am just really afraid of opening a kind of worms if we do shift all the text to a different
alignment because the app is not built in that way."

The ruling stands and the plan is built to it. The owner asked separately for the alternatives to be
REPORTED, never built:

🐋  "If you have other alternatives, just tell me, don't implement them. Follow what I said, but just
tell me at the end what you think might be better or not."

So the plan carries a read-only section comparing the alternatives, with the honest cost of each, and
implements none of them.

## D8. The language setting lives in Settings, behind a chevron, opening its own sheet

🐋  "I want this to be a setting in the settings, and I want the Google Translate icon to be there. I
think it has like English and Chinese icon. I don't know, or a globe, perhaps a globe with lines. And
it will be a drop down option, like a selection of which language they want to choose. If they tap
it, it's like a chevron, and if they tap it, it will go to the language bottom sheet where they can
do a selection, just like the sound bottom sheet."

🐋  "I'm not sure about the language bottom sheet, but I do feel like that's a decent approach. We can
stick to that for now. Might not stick to it forever."

So: a Settings row with an icon, a label and a chevron, opening a selection sheet built on the same
machinery as the sound sheet. The approach is explicitly provisional, so the plan records what would
change if the owner later prefers a full screen or a native picker.

## D9. The prayer-name column width is the owner's named risk

🐋  "My main concern is the width for the English prayer name. We have each row be the length of the
longest prayer name for that schedule. So for example sunrise is the longest one... What if the
translation of sunrise in a different language might be like 20 characters, 30 characters? I think we
might have to run through a bunch of different languages and find out if this will ever break in the
top 20 languages, in any of the 11 prayers that we have."

🐋  "Istijaba, the prayer that appears only on Fridays, doesn't actually have a direct translation."

The plan measures this rather than assuming it, across all 11 names in every candidate language.

## D10. Research depth

🐋  "This is basically a white paper level research thesis, PhD level research. Look at a lot of
alternatives, look at the industry standard, look at how to do it, the best approach."

## D11. Working method

🐋  "Work autonomously and in a loop and make assumptions. Don't ask me any questions."

🐋  "At the end, very clearly list all those assumptions."

🐋  "This is ONLY A RESEARCH TASK. Don't commit anything yet."

So this session plans and does not execute, asks nothing, records every assumption it made, and
leaves the commit to the owner's word.

## D12. Notification copy follows the selected language (2026-09-29)

🐋  "Should we change the notification text language? I think so, yes."

So a notification reads in the user's chosen language. Today `shared/notifications.ts` builds
`${englishName} now` and `${englishName} in ${intervalMinutes}m` at schedule time.

This is the most expensive ruling in the session, and the cost depends on a research answer:

| If the platform can localise at DELIVERY time | If it can only localise at SCHEDULE time |
| --- | --- |
| Copy resolves when the notification fires | Copy is frozen into up to 64 armed requests |
| A language change needs no re-arm | A language change must cancel and re-arm the whole plan |
| Catalogs must exist as native resources, not JS | The JS catalog is enough |

Both halves have a real cost. The native-resource route needs the strings in `InfoPlist.strings`
or `res/values-<locale>/strings.xml`, which means a second catalog format kept in step with the
JS one. The re-arm route reuses `commitSoundSelection`'s proven pattern but inherits session 33's
partial-failure problem.

The plan picks one on R5's evidence and records why. The prayer NAME inside that copy is a
separate question: under D5 the prayer row keeps its English name, and whether a notification
does the same or uses the selected language is an open point the plan must settle explicitly.

## D13. The language feature is announced in What's New (2026-09-29)

🐋  "Because this is a new feature, we do want to add it to the What's New modal."

`shared/whatsNew.ts` holds 13 display strings and `VISIBLE_WHATS_NEW` gates the Settings row.
Two consequences the plan must carry:

- The What's New entry announcing the language feature is itself translated, so a user who
  switches language sees the announcement in that language.
- `ai/AGENTS.md` records that items may declare `flags: []` and that a dark feature can never be
  advertised, so the entry lands in the same release that ships the feature, never before.

## D15. Transliterate, never translate, the prayer names (2026-09-29)

🐋  "I think we should do transliterate, not translate. Transliterate is the best option, especially
for Friday, the extra prayer that we have. Istijaba, there's no word for it in English or in any
other language except Arabic. That's why Istijaba is actually a transliteration of the Arabic word.
So we should be doing transliteration everywhere, I think."

**This answers proposal P5.8 and it is the right call.** Three independent lines of evidence support
it, and the owner's own reasoning from Istijaba is the strongest of them.

### 1. The app already does this. The ruling makes an existing policy explicit.

Classified from `shared/constants.ts`, **8 of the 11 names in the "English" catalog are already
transliterations of Arabic**:

| Catalog | Transliterated | Translated |
| --- | --- | --- |
| `PRAYERS_ENGLISH` | Fajr, Dhuhr, Asr, Magrib, Isha | Sunrise |
| `EXTRAS_ENGLISH` | Suhoor, Duha, Istijaba | Midnight, Last Third |

So there is no policy change here, only a policy that was never written down. The three exceptions
are the three concepts that are astronomical or arithmetic rather than liturgical: a sunrise, a
midpoint and a third of a night. Those are the ones that legitimately translate, and every language
has a word for them.

**The rule, stated precisely:** a name that IS an Arabic term is transliterated into the target
script. A name that describes a time of day or a fraction of the night is translated. The existing
English catalog is the reference implementation of that rule.

### 2. Istijaba proves it, exactly as the owner argued

`Istijaba` is null in **24 of 28** sourced locales, because almost no prayer timetable in any
language publishes it. There is nothing to translate TO. The owner's point is that "Istijaba" in the
English catalog is itself a transliteration, so the app has already answered this question once and
the answer generalises.

The design that makes it work is also already in the app: a transliterated label in the column, with
the explanation string carrying the meaning. So a null in the sourced catalog is not missing work,
it is a signal to transliterate.

### 3. It fixes the width problem

Measured, and this is the practical payoff: German `Nachmittagsgebet` (translated) is **148pt**
against `Asr` (transliterated) at **30pt**, and both are correct German. The launch-set languages
that overflowed the 123pt column were overflowing precisely because they translated.

`CATALOG-EVIDENCE.md` measured this across two shipping apps and `LAUNCH-SET.md` identified it as
the single question holding back French and German.

### What this unblocks immediately

`LAUNCH-SET.md` held `fr` and `de` back for one reason: European languages fork on whether to
transliterate or translate, and R6 would not choose for the owner. That fork is now closed.

| Locale | Was | Now |
| --- | --- | --- |
| French | blocked on the convention | **unblocked**, transliterate |
| German | blocked on the convention | **unblocked**, transliterate |
| Spanish | later, same question | unblocked on the same ruling |
| Dutch | later, same question | unblocked on the same ruling |

So the launch set can return to eight (`en ar id ur bn tr fr de`) if the owner wants it, and
`ASSUMPTIONS.md` A7's revision to six is reversed by this ruling.

### The one limit the plan must respect

Transliteration is into the target SCRIPT, not a copy of the Latin string. Arabic renders `الفجر`,
Urdu `فجر`, Bengali `ফজর`, Hindi `फ़ज्र`, Russian `Фаджр`. A Bengali user must not see Latin
"Fajr" in a Bengali interface. The sourced catalog already carries the correct script per locale, so
this is a constraint on interpretation rather than new work.

The Turkish exception survives unchanged and is not a counter-example: Diyanet prints `İmsak` for
the dawn row, which is a different TERM rather than a translation of Fajr, and it stays.

## D14. Ordering: this row runs after the qibla compass

Taken 2026-09-28, recorded in `ai/plans/README.md` row 37. Qibla is additive (one screen, one sensor)
while localisation is a sweep over the whole finished surface, so every feature built after a
translation sweep would otherwise have to be translated twice.
