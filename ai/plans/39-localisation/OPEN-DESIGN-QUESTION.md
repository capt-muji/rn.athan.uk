# The two-language deadlock, raised by the owner 2026-09-29

## The owner's words

🐋  "Do we make a primary language or do we make a secondary language? Because now we have two
conflicting languages. We essentially have two primary languages. If a user selects English as a
secondary, then you'll have English in the first column, then English in the second column, and
then your notifications will also be in English. But if you select English as a primary and Arabic
as a secondary, then you will have the notifications be in Arabic, which means you'll never
actually be able to set English as the notification. It's a deadlock, not a deadlock, but it seems
wrong. We need a better approach."

## Why the model breaks

The owner is right, and the cause is precise: **one setting is being asked to do two unrelated
jobs.**

The earlier framing (owner decision D4) gives the prayer row a primary and a secondary name slot,
then implicitly ties the app's chrome and its notifications to the secondary slot. That ties
together three things that have no reason to move together:

| Surface | What it is | Who it serves |
| --- | --- | --- |
| Prayer row, first name | A bilingual display column | Everyone, always English today |
| Prayer row, second name | A bilingual display column | A reader of that second script |
| Settings, sheets, modals, Help | The app's interface language | The person operating the app |
| Notification copy | Interface language, delivered outside the app | The same person |

The first two are a **display preference about the prayer list**. The last two are the **app's
language**. Making the second column drive the app's language produces exactly the contradictions
the owner listed:

1. Choosing English as the second column makes the row show English twice, which is useless, and
   there is no way to express "I want the interface in English and the second column in Arabic"
   versus "I want both in English" without them colliding.
2. Choosing Arabic as the second column forces the notifications into Arabic, so an English
   speaker who simply likes seeing Arabic prayer names on the list loses English notifications.
   That user is the app's CURRENT default user, so the design breaks the existing behaviour.
3. There is no way to reach "interface in Indonesian, second column in Arabic", which is the most
   likely real configuration for a large part of the audience.

The deadlock is real and it is structural, not a labelling problem.

## The reframing that dissolves it

**These are two settings, not one.** Once separated, every combination above becomes expressible
and nothing contradicts:

- **App language.** One setting. Drives Settings, every sheet, every modal, Help, What's New, the
  notification copy, and the widget chrome. Defaults from the device locale.
- **Prayer-name display.** A separate setting about the prayer list only. Governs whether a second
  name is shown and in which script.

Today's shipped behaviour is then just one point in that space: app language English, second name
Arabic, second name shown. Nothing regresses.

The existing `showArabicNamesAtom` is already the on/off half of the second setting, which is
evidence the split matches how the app is actually built.

## What is still open for the owner

The reframing settles the deadlock. Three sub-questions remain, and they are proposed with a
recommendation in `PROPOSALS.md` rather than decided here, because each is a visible behaviour
choice the owner owns:

1. Does the prayer row's FIRST name follow the app language, or stay English permanently?
2. What is the second name's default when the app language is not English, and may it be "none"?
3. Do notifications name the prayer in the app language, or keep the English name the identifier
   already uses?

Question 3 is the sharpest, because a notification reading "الفجر now" in an otherwise-Arabic
interface is coherent, while "Fajr now" inside Arabic copy is the mixed-script case that section
C6 of `CONSTRAINTS.md` warns about for bidi reasons.

## The bilingual-notification idea, raised by the owner 2026-09-29

🐋  "Or maybe we just include both languages in the notification. I don't know, but that can become
really messy real quick. In the notification text, for example, Fajr now, then in 5 minutes, in
English and in Arabic. But I'm not sure. On an iPhone, where we have time sensitive notifications
enabled, the first line is taken up by the time sensitive text. If we can hide that, that would be
great, but I don't think so. And then below that we have the text that we have, like Asr now, Dhuhr
now. So maybe we can only have one and no body description. Think about it."

The owner is describing a real constraint and reaching the right conclusion. The facts this repo
already holds:

- `shared/notifications.ts` sets `interruptionLevel: 'timeSensitive'`, and session 27 added the
  matching iOS entitlement so it is genuinely in force. iOS draws a "Time Sensitive" label in the
  notification's header. That label is drawn by the system and **an app cannot hide it** while
  asking for the interruption level that makes the alert break through Focus. Removing it means
  giving up the breakthrough, which is the whole point of the feature.
- The app deliberately ships **title only, no body**, recorded twice in that file as "English-only,
  title only (no body)". So the current design already spends its one line carefully.
- The title today is `${englishName} now` or `${englishName} in ${intervalMinutes}m`.

So the space available is one short title line under a system label the app cannot remove. Putting
two languages in that line ("Fajr / الفجر now") spends the app's scarcest display surface on
redundancy, and on a narrow phone it truncates, which loses the end of the string. The owner's own
read, "that can become really messy real quick", matches what the layout allows.

`PROPOSALS.md` carries this as a costed option rather than dismissing it, because the owner raised
it and it has one genuine merit: it serves a household where two people read different languages
off the same phone. The recommendation is still one language per notification, chosen by the app
language setting.
