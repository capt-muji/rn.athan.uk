# What R7 settles: the deadlock, with the industry's own vocabulary

R7 (`research/R7-TWO-LANGUAGE-MODEL.md`, 514 lines) surveyed how apps with the same structure solve
this, then tested the two-setting model against it. The model holds. The naming changes, and R7
found one cost this session had missed.

## The model, confirmed

| Setting | Label | Controls |
| --- | --- | --- |
| 1 | **App language** | Settings, sheets, modals, Help, What's New, notification copy, widget text, Android channel names, and the prayer row's FIRST name |
| 2 | **Prayer names** | The prayer row's SECOND name and the explanation box's second line. Any shipped language, or None |

The rule that dissolves the deadlock, stated in one line: **notifications follow the App language,
always, and the Prayer names setting never touches anything outside the prayer list.**

The owner's objection was that choosing Arabic names forced Arabic notifications on an English
speaker. Under this model the two settings are no longer connected, so that cannot happen.

## The naming: "primary/secondary" is rejected, on four grounds

The owner proposed "primary language / secondary language". R7 rejects it, and the first reason is
the one I had not found:

1. **The industry already uses that pair for a different concept: fallback order.** Android's
   per-app language list and iOS's Preferred Language Order both rank languages by priority. Adyen's
   terminal firmware documents a chain that "checks the secondary language (if toggled), card
   language, primary language, app language, then the device's operating system language". Fedora
   and KDE use the same pair for CJK font fallback. A user who has met the words anywhere else reads
   "secondary language" as "what to fall back to".
2. **A rank does not say where it applies.** "Prayer names" names the surface that moves. The
   owner's deadlock came from exactly this: nothing in the label said which job the setting owned.
3. **It does not survive both slots becoming selectable**, which the owner said is possible.
4. **It implies the second is lesser**, when for many users the Arabic name is the more important
   one.

The survey of eight apps found the vocabulary has converged:

| Concept | Netflix | YouTube | Spotify | Wikipedia | YouVersion | Muslim Pro |
| --- | --- | --- | --- | --- | --- | --- |
| Interface | Display Language | App Language | App language | App language | App Interface | Language of the app |
| Content | Audio, Subtitles | Preferred languages | none | Wikipedia languages | Bible Text | Prayer names |

Six of eight use "App language" or "Display Language" for the interface, and every one names the
content setting after the NOUN it governs, never by rank.

## The cost I had missed: bilingual notifications would halve the buffer

I rejected bilingual notifications on display grounds (the unhideable Time Sensitive label, the
title-only design, truncation, and the bidi hazard of the slash). R7 adds a fifth reason that is
worse than all four:

> Arming two notifications per prayer, one per language, doubles the request cost of every row
> against the fixed `NOTIFICATION_REQUEST_BUDGET` of 64. Session 28 measured the standard profile
> at 3 days of horizon with both reminders; doubling rows cuts it toward 1.5 days.

So a bilingual notification would not just look cramped. It would **halve how long the app keeps
working when the background refresh chain dies**, which is the exact failure `ai/AGENTS.md` records
costing a user their Magrib and Isha on a OnePlus 8T. That converts a cosmetic preference into a
reliability regression, and it settles the question.

No surveyed app ships a bilingual local notification.

## The first-column question, answered with evidence

`PROPOSALS.md` P2 asked whether the first column follows the app language or stays English, and I
recommended following with medium confidence. R7 raises that confidence with a direct comparator:

> Muslim Pro localises the displayed prayer name and markets it: "Fajr or Subuh? You can change the
> Muslim Pro prayer names to match the names used in your country."

So the app's closest competitor treats this as a feature worth advertising. R7 also notes that in
every surveyed app the main content surface follows a user-chosen language while the chrome follows
another, and that "a prayer list that says Fajr inside an Indonesian interface is the one
configuration no comparator ships".

**R7 is careful about the owner's ruling, correctly.** Owner decision D5 says the English names
stay. R7 flags its recommendation as going beyond that ruling, notes the ruling stands until the
owner moves it, and confirms the model degrades gracefully: pin the first column to English and
every other conclusion survives unchanged.

## The default matrix, which answers a question I left open

`PROPOSALS.md` P1 did not say what the second slot defaults to when the app language is not English.
R7's matrix:

| App language | Second name | Row reads | Why |
| --- | --- | --- | --- |
| English | Arabic | Fajr, الفجر | Exactly today's default. Zero change on upgrade |
| Any non-Arabic | Arabic | Subuh, الفجر | The liturgical name, the role Arabic plays on a mosque board |
| Arabic | Hidden | الفجر | Showing Arabic twice is noise |

The existing on/off toggle becomes the **None** value rather than a separate control, which removes
a setting rather than adding one.

## The migration, tightened

R7 adds a rule I had not stated, and it matters:

> **App language defaults differently for existing and fresh installs.** Existing installs pin to
> English, even if the device locale is not English, because today's app is English-only and
> following the locale on upgrade would be a silent change.

That is right and I had it wrong. My migration said "whatever the device locale negotiates, which
for the existing base is English", which is an assumption about the base rather than a guarantee. An
existing user in Jakarta with an Indonesian phone would have had their app silently switch to
Indonesian on upgrade.

The corrected rule: **existing installs pin to English explicitly; only fresh installs negotiate.**
The What's New entry then invites the change, which is what owner decision D13 is for.

## R7's own strongest counter-argument

> It spends the app's layout stability to buy global coherence. The first column is the most
> constrained surface in the product, and putting it under a user-changeable locale means every
> non-English user's first launch exercises the width programme on day one, while the majority
> London audience gains nothing.

The counterweight R7 gives, which I agree with: the width programme is **already required** because
the second column localises regardless, so the first column's localisation adds no new machinery,
only more exposure to machinery that must exist anyway.

## What changes in this session's documents

1. `PROPOSALS.md` P1: labels become **App language** and **Prayer names**, not primary/secondary.
2. `PROPOSALS.md` P1 migration: existing installs pin to English explicitly.
3. `PROPOSALS.md` P3: the bilingual rejection gains the buffer-halving argument, which is the
   strongest of the five.
4. `PROPOSALS.md` P2: confidence rises from medium to high, on the Muslim Pro comparator.
5. `ASSUMPTIONS.md` A1 and A2 keep their CHECK marks, because both still go beyond a ruling.
