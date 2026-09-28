# What R4 changes, and the two corrections it forces

R4 (`research/R4-LOCALE-DETECTION-AND-UX.md`, 453 lines) answers the first-run locale question, the
picker's shape and the language set. It is sourced throughout. Two of its findings correct
positions this session held before it landed.

## Correction 1: an Android notification channel CAN be renamed in place

`CONSTRAINTS.md` C9 listed this as unknown and `NOTIFICATION-EVIDENCE.md` called it the one
question the installed source does not settle. R4 settles it from the platform documentation:

> "After you create a notification channel, you can't change the notification behaviors... However,
> you can still change a channel's name and description."
> (developer.android.com/develop/ui/compose/notifications/channels, updated 2026-09-11)

Microsoft's API documentation for the same call states the intended use outright: "The name and
description should only be changed if the locale changes."

This is consistent with session 27's lesson rather than contradicting it. Session 27 found that
**sound, audio attributes and importance** are frozen, which is why the ids carry a `_v4`
generation. The NAME was never the frozen part.

**So the language change re-runs channel creation with the same ids and new localised names.** It
must never mint new ids, because new ids would orphan every channel a user has hand-tuned, and
`ai/AGENTS.md` records that a user's manual choice sets `mUserLockedFields` and is then honoured
over the app's forever. Minting ids on a language change would silently discard that.

This removes a whole category of cost from owner decision D12. Still worth a 3T confirmation,
because this repo has been burned by documented-but-untrue Android behaviour before, but the
default assumption flips from "probably needs a new generation" to "rename in place".

## Correction 2: the notification re-arm needs no cancel pass

`NOTIFICATION-EVIDENCE.md` assumed a language change must "cancel and re-arm". R4 points out that
`device/notifications.ts` builds **deterministic identifiers**
(`athan_${scheduleType}_${englishName.toLowerCase()}_${date}`), and that both platforms replace a
pending request when a new one is scheduled with an identifier that already exists.

So the correct sequence is: re-run the scheduling pass with the new string table and let identifier
equality replace each request in place. No cancel pass, no window where the phone holds nothing.

This depends on the English name staying in the identifier, which `CONSTRAINTS.md` C3 already
requires for four other reasons. The two requirements reinforce each other: because the identifier
is built from the untranslated name, it is stable across a language change, which is exactly what
makes the in-place replace work.

## What R4 confirms that this session had already concluded

- **Location for language is rejected**, on three independent grounds: Apple review guideline 5.1.1,
  Play's sensitive-permissions policy (which requires a permission be necessary for a feature
  promoted in the listing), and accuracy (location guesses at what the locale states outright).
  R4 costs the Philippines example the owner raised and finds that Philippine phones usually carry
  `fil-PH` in the locale list anyway, so the locale route serves that user better than location would.
- **No first-run picker.** The first launch already gates on a network sync and a notification
  permission; a language question would be the third thing asked before a prayer time renders.
- **The settings-row-plus-sheet shape the owner sketched is the industry consensus**, confirmed
  across 18 surveyed apps including Muslim Pro and Athan by IslamicFinder.

## The icon: the owner's first choice is not usable

Owner decision D8 asked for the Google Translate icon. R4 quotes Google's brand guidance directly:

> "Don't imitate our logo or visual identity (distinctive color combinations, graphic designs,
> product icons, or imagery associated with Google)" (about.google/brand-resource-center/guidance/)

A settings row for choosing this app's language is not an association with Google Translate and
would imply a relationship that does not exist. R4 also flags that Material Icons ships a
`g_translate` glyph which is Apache 2.0 as artwork but is still the Google-Translate-specific mark,
so shipping it from the open icon set does not cure the problem.

**The safe replacement the owner's second instinct already named:** Material Symbols `translate`
(the generic A plus 文 glyph) or `language` (the plain globe), both Apache 2.0. The owner said "or a
globe, perhaps a globe with lines", so the fallback was already acceptable to him. This goes in
`PROPOSALS.md` rather than being decided here, because it is a visual choice and `ai/AGENTS.md`
makes visuals the owner's alone.

## Where R4 and this session's own measurements disagree, and who wins

R4 recommends a launch set of 8: `en ar id ur bn tr fr de`.

`WIDTH-EVIDENCE.md` measured the prayer-name column against 15 locales and found that the extras
column breaks worst in exactly the Latin-script languages R4 puts in the launch set:

| R4 launch language | Extras column vs English |
| --- | --- |
| Indonesian | 2.57x |
| German | 2.43x |
| French | 2.18x |
| Turkish | 2.15x |
| Bengali | 1.79x |
| Urdu | 1.50x |
| Arabic | 0.85x |

So the launch set is not the cheap set. Five of its eight members need the name-width remedy on day
one. That is an argument for solving the width problem properly in this session rather than
deferring it, not an argument against R4's set: the set is chosen by audience and the audience is
right.

## What R4 leaves open

- It recommends `@formatjs/intl-localematcher` for RFC 4647 lookup. That is a dependency decision
  that belongs with R1's library verdict, since R1 may already pull in a matcher.
- It recommends live switching for same-direction languages and `Updates.reloadAsync()` only for a
  direction flip. Under owner decision D7 the layout never flips, so the reload path may be
  unnecessary entirely. R3 settles whether pinned-LTR removes the restart requirement, which would
  be a real simplification.
- Its `CFBundleLocalizations` and localised permission-string recommendations are native-config work
  that interacts with this project's CNG prebuild ritual. The plan must check it against
  `ai/AGENTS.md`'s native version sync rules rather than adopting it blind.
