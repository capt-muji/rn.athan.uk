# What R3 settles: the owner's ruling survives, with one amendment

R3 (`research/R3-RTL-AND-SCRIPTS.md`) tested owner decision D7 rather than validating it, which is
what it was asked to do. The verdict: **keep the never-mirror decision**, and amend one word of how
it is implemented.

## The amendment, and why it is not a contradiction of the owner

The owner ruled:

🐋  "We should always left align it exactly like English, even if the text is written right to
left... it should work exactly like the English, so it should be left to right."

R3's finding is that this sentence conflates two things that do not have to move together:

| The thing | The owner's concern | R3's verdict |
| --- | --- | --- |
| The BOX: flex direction, padding, absolute coordinates | "A nightmare to handle the layout" | Correct. Pin it LTR. Never mirror |
| The TEXT inside the box: alignment and base direction | Assumed to follow the box | Does not have to, and should not |

Keeping every container LTR does not require left-aligning the contents of those containers. The
proof is already shipping in this app: `components/prayer/Prayer.tsx` draws the Arabic name with
`flex: 1, textAlign: 'right'` inside an LTR row, and nobody reads it as broken.

So the amendment is: **LTR box, RTL text alignment and base direction for RTL content.** That gives
the owner every bit of the layout simplicity he asked for, at no cost to the 155 directional sites
`MEASURED.md` counted, while avoiding a readability defect.

The owner explicitly asked to be told about alternatives:

🐋  "If you have other alternatives, just tell me, don't implement them."

This is that, and it is smaller than an alternative: it is a refinement inside his own ruling, and
it makes the first column behave exactly like the second column already does.

## The evidence that left-aligning RTL is a real defect, not a taste question

R3 found named precedent rather than arguing from principle:

- **Bluesky**, July 2026: "Arabic text in posts/comments is left-aligned and not rendered RTL" was
  filed as a bug and closed as a bug, on exactly the rendering the literal reading would ship
  (`github.com/bluesky-social/social-app/issues/11345`).
- **Reddit**, user report: "It is very hard to read it if the text is aligned left-to-right,
  especially if Arabic and English are mingled."
- **Material Design 3**: applying LTR directionality to RTL content "can create cognitive overload
  and negatively impact user sentiment and trust".
- **Discord and Slack** persisted with it and accumulated years of user resentment and third-party
  patch extensions.

R3 is careful about severity, and the distinction matters for this app:

| Surface | Severity if left-aligned |
| --- | --- |
| Single-word prayer names in a fixed column | Mild |
| `EXTRAS_EXPLANATIONS_ARABIC`, the multi-line explanation overlay | **High** |
| Any future sentence with an interpolated time | High |

So the app's current bilingual list is the mild case, and the explanation box is the bad case. The
explanation box is already Arabic today, which means this is a live issue rather than a future one.

## Why full mirroring is genuinely the wrong choice, confirming the owner

R3 gives a harder reason than "it would be a lot of work", and it is decisive:

**Under Fabric, layout direction is a launch-time constant.** React Native issues #48311 and
#45661 document that changing it at runtime does not fully apply. So a mirroring app would have to
**restart on every language switch**, and R4 independently found the same thing
(`Updates.reloadAsync()` in Expo's own RTL example, plus open issue expo/expo#39752 where
`allowRTL` plus `forceRTL` without a reload leaves layout LTR while text swaps).

The owner's instinct to avoid it was right, and the cost is worse than he assumed.

**Consequence worth stating plainly: pinning LTR removes the restart entirely.** Every language
change becomes a live re-render. That simplifies R4's switch design, which had proposed a reload
path for direction flips, and it is a direct benefit of D7.

## Bidi does not go away, and this is the work the ruling creates

Pinning the layout stops flexbox mirroring. It does not stop the Unicode Bidirectional Algorithm
(UAX #9) running inside every `Text` node. Under an LTR base direction:

- `الفجر 05:42` puts the time on the wrong side.
- A trailing colon, parenthesis or bracket after an RTL run resolves to the paragraph base and
  lands where an Arabic reader starts reading, so the punctuation appears to lead the word.

R3's fix is string-level and cheap: wrap RTL content in Unicode isolates, `RLI` (U+2067) and `PDI`
(U+2069), so the string is self-contained regardless of its container. `\u2067الفجر\u2069`.

This matters more than it looks because of a second R3 finding: **iOS `writingDirection` is
unreliable under the New Architecture** (RN issue #51235), so the one style prop that would set a
base direction on a Text node cannot be depended on. Isolate characters in the string are the
dependable route, and ICU MessageFormat 2 mandates exactly this approach.

`MEASURED.md` already noted Roboto lacks the isolate codepoints; that is harmless, since they are
zero-width formatting controls the shaper consumes rather than glyphs it draws.

## Fonts: R3 confirms the measurement and prices the alternative

R3 independently measured Roboto with fontTools and got the same 896 glyphs this session measured.
Its font strategy recommendation matches `CONSTRAINTS.md` C4:

- Keep Roboto for Latin, Cyrillic, Greek, Vietnamese and Turkish.
- **Drop the explicit `fontFamily` elsewhere** and let the tuned OS font serve the script.
- Bundling all non-CJK Noto scripts costs a measured **3.8 MB** for two weights. CJK is **16.4 MB
  per weight**, which settles that question on its own.

New and important: **line heights must become per-script.** R3 measured the line spans:

| Font | Line span |
| --- | --- |
| Roboto | 1.17em |
| Noto Naskh Arabic | 1.70em |
| Arabic sans | 2.11em |
| Nastaliq (Urdu) | 2.50em |

The app's fixed 22px line height clips Thai, Devanagari and Arabic. `TEXT.lineHeight.arabic`
already exists as a hand-tuned exception, which confirms the problem was met once; the plan
generalises it rather than adding a second exception.

## The digit-mapping finding, which changes existing behaviour

`shared/text.ts` maps Western digits to Arabic-Indic unconditionally. R3 finds that is wrong as a
locale rule: **the Maghreb and the UAE use Western digits**, per CLDR. So the mapping must be
locale-driven rather than applied whenever Arabic is displayed.

This is a live defect in the shipped app, not just a future concern, and it is cheap to fix.

## The highest-risk column finding, which corrects this session's own measurement

`WIDTH-EVIDENCE.md` measured the width-setting name per locale and found Swahili worst at 2.83x.
R3 adds the finding that measurement missed:

**The width-setting NAME changes per language.** In English the extras column is set by "Last
Third". In Arabic it is set by `نصف الليل` (Midnight), not by the translation of "Last Third".

That breaks any design that assumes a fixed index into the name array, and
`components/ui/InitialWidthMeasurement.tsx` does exactly that via `getLongestPrayerNameIndex`. The
function must measure the longest name **in the active locale**, not the longest English name.

R3 also finds a latent defect the plan must fix: **the Arabic second column's `flex: 1` has no
`minWidth`**, so an oversized first column silently starves it toward clipping rather than failing
visibly.

Its ranked column strategies match this session's conclusion, with one addition:

| Strategy | R3 rank |
| --- | --- |
| Per-locale measured column | 1, reuses existing machinery |
| Two-line wrap with a taller row | 2 |
| `adjustsFontSizeToFit` | 3, iOS-only safety net |
| Abbreviation table | 4, poor |
| Truncation | never |

Note R3 ranks two-line wrap second where `WIDTH-EVIDENCE.md` ruled it unavailable, because
`STYLES.prayer.height` is fixed at 57 and the overlay anchors boxes off measured coordinates. The
plan keeps the stricter reading: wrapping is not available without touching row 36's machinery.

## What the plan takes from R3

1. Keep D7. Pin `allowRTL(false)` and `supportsRTL: false` explicitly, never mirror.
2. Amend "left-align everything" to "LTR box, RTL text alignment and base direction for RTL
   content", matching what the Arabic column already does.
3. Set `direction: 'rtl'` on the containers that hold multi-line RTL prose, which is the
   explanation overlay specifically.
4. Isolate-wrap every composed string that mixes a translated name with a number.
5. Tag `accessibilityLanguage` so the screen reader announces in the right language.
6. Per-script line heights, and a per-locale longest-name measurement.
7. Add a `minWidth` to the second column.
8. Make the Arabic-Indic digit mapping locale-driven.
9. No bundled fonts. Drop `fontFamily` for non-Latin scripts.

## R3's own caveat, which the plan must respect

> If the app later adds prose surfaces, a settings sheet with long paragraphs, or an onboarding
> flow, the never-mirror position weakens and should be revisited.

This app is about to translate `shared/help.ts`, which is 27 strings of the longest prose in the
app. So the weakest point of the never-mirror decision is the Help modal, and the plan should
apply `direction: 'rtl'` there as well as on the explanation overlay.
