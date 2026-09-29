# Every assumption this session made, and what would overturn it

The owner asked for these in one place:

🐋  "Make assumptions and list them at the very end. The reason I'm telling you to make assumptions
is because I don't want you to ask me any questions and then you stop working while I'm sleeping."

So nothing below was asked. Each row records what was assumed, why, how confident the session is,
and what would change the answer. The ones marked **CHECK** are where the owner is most likely to
disagree, and they are the rows to read first.

## A. Product and design assumptions

| # | Assumption | Why | Confidence | What would overturn it |
| --- | --- | --- | --- | --- |
| A1 | **REVISED 2026-09-29: ONE setting (App language) plus the EXISTING toggle. The second name is DERIVED: Arabic, unless the app language is Arabic.** See `ONE-OR-TWO-LANGUAGES.md` | The only model where every configuration the owner listed is expressible. R7 confirmed the shape and the labels against eight apps: six of eight use "App language" or "Display Language", and all name the content setting after its noun. "Primary/secondary" is rejected because the industry uses that pair for fallback order | High | The owner prefers one setting and accepts that some combinations are unreachable |
| A1b | On upgrade, existing installs pin the app language to **English explicitly**; only fresh installs negotiate from the device locale | R7's correction. Negotiating on upgrade would silently switch an existing user in Jakarta with an Indonesian phone | Very high | |
| A2 | **CHECK** The prayer row's FIRST name follows the app language, rather than staying English forever | An Indonesian user with an Indonesian app wants "Subuh" first. R7 found Muslim Pro markets exactly this: "Fajr or Subuh? You can change the prayer names to match the names used in your country." No surveyed app ships an English primary beside a localised interface | High on evidence, but it goes beyond D5 | The owner's D5 says "the English prayer names will stay". If he means permanently and literally, the first slot pins to English and every other conclusion survives unchanged |
| A3 | Notification copy follows the APP language, not the prayer-name setting | D12 says notifications follow the selected language; the app language is the one that governs interface copy, and "now" and "in 5m" are interface copy | High | The owner wants notifications to track the prayer-name setting instead |
| A4 | Notifications carry ONE language, not two | Five reasons, the strongest found by R7: two notifications per prayer would double the request cost against the fixed 64 budget and **halve the notification buffer** from 3 days to about 1.5. The display reasons (unhideable Time Sensitive label, title-only design, truncation, bidi hazard) come second | Very high | Nothing reasonable. This became a reliability question rather than a taste one |
| A5 | No language picker on first launch | First launch already gates on a network sync and a notification permission; a third question before any prayer time renders costs completion. R4 found this is the industry default | High | The owner wants an onboarding language step |
| A6 | The Google Translate icon is replaced with Material Symbols `translate` | Google's brand guidance forbids imitating its product icons; the owner's own second suggestion was a globe | High | The owner has a licence or accepts the risk |
| A7 | The launch set is **eight**: `en ar id ur bn tr fr de` | R4's audience ranking (Pew 2025). R6 graded `fr` and `de` as needing a speaker, but only over the transliterate-versus-translate fork, which owner decision D15 closed on 2026-09-29 | High | |
| A7b | A locale ships when its **six standard names** are non-null and fit the budget; the extras may transliterate | `Istijaba` is null in **24 of 28** locales because almost no timetable in any language publishes it. Requiring all 11 would block every locale. The app already pairs a transliterated label with an explanatory string, which is the established answer | High | |
| A8 | The second name is Arabic, derived rather than chosen, and the existing toggle still hides it | Preserves today's behaviour exactly and needs no migration at all. The Arabic name is the liturgical constant, the thing every local name is a rendering of, so it is what the column is FOR rather than a preference | High | A user asks for a second name in a third language, which the second picker can add later without breaking anything |
| A9 | The Hijri and Gregorian date FORMATS are not touched, but month NAMES become locale-aware | Row 39's entry says dates are not touched, which reads as a format ruling. An English month name inside an Arabic interface is a visible defect | **Low** | This is the assumption most likely to be wrong. Raised as a proposal rather than built |

## B. Technical assumptions

| # | Assumption | Why | Confidence | What would overturn it |
| --- | --- | --- | --- | --- |
| B1 | The English prayer name stays the domain identifier permanently | Measured: 27 storage keys, 67 audio filenames, the notification ids and the display order all key on it. R5 reached the same conclusion independently | Very high | Nothing. This is the session's firmest finding |
| B2 | No i18n library ships. A hand-rolled typed catalog plus `t()` | R1's recommendation, and `PLURAL-EVIDENCE.md` removes its main objection by measuring that no string needs plural rules | Medium | The plural surface grows, or the language count passes ~40, at which point i18next's tooling earns its 24 KB |
| B3 | No plural machinery ships in the first pass | Measured: all four count-bearing strings use abbreviated units (`in 5m`, `6h 8m`) which do not inflect in any language | High | A future string like "3 prayers remaining". A guard test detects the day this changes |
| B4 | Catalogs are TypeScript modules, not JSON | R5's Hermes finding: precompiled bytecode beats a runtime parse, and `as const` gives free key safety | High | A catalog grows large enough to trip the Hermes literal-size compiler bug, which is composition-dependent and undocumented |
| B5 | Structured keys (`settings.sound.changeAthan`), not natural-language keys | R5's three grounds, decisively the existing `Off`/`Silent`/`Sound` collision in `Alert.tsx` | High | |
| B6 | No fonts are bundled. OS per-glyph fallback serves non-Latin scripts | Measured: Roboto has 896 codepoints and no Arabic, yet the app renders Arabic today, so fallback is already load-bearing in production | Medium | A device check finds a script the OS cannot serve. The 3T on Android 9 is the risk |
| B7 | Hermes lacks `Intl.PluralRules` | R1's claim, corroborated by the RN build flag's own framing. Not independently verified here, since Hermes source is not vendored | Medium | A one-line device probe settles it. The plan carries it as a named pre-flight |
| B8 | An Android channel can be renamed in place | Two independent sources (R4, R5) plus Microsoft's API docs stating the intended use is exactly a locale change | High | A 3T check. This repo has been burned by documented-but-untrue Android behaviour before |
| B9 | The notification re-arm needs no cancel pass | Identifiers are deterministic, so a reschedule replaces in place. R4 and R5 agree | High | |
| B10 | The width cache becomes per-locale | Measured: Swahili is 2.83x English and Arabic 0.85x, so one grow-only max would pin a 226pt column forever for a user who tried one language once | High | R5 argued for one global max, on a cost estimate the measurement shows is far too low |
| B11 | `expo-localization` is pinned to `58.0.1` from the `next` tag | Confirmed on the day: `latest` is 57.0.2. Same trap row 37 hit | Very high | |
| B12 | The hardcoded-string guard is a Jest source-scan test, not a lint rule | Biome has no `no-literal-string` equivalent; the repo already uses source-reading contract tests (`widgetContract.test.ts`, `flags.test.ts`) | High | |
| B13 | Widget text is resolved in the app and baked into timeline props | The widget runtime's React is a five-name stub; a module-scope library call blanks every card, which has already happened once | Very high | |
| B14 | Translated widget payloads fit the guard | Measured: worst case (Thai) is 6% of the 200KB guard, 20x headroom | High | |
| B15 | No app restart is needed on a language change | Owner decision D7 pins the layout LTR, so there is no direction flip, which is the only thing that required a reload | High | The owner later allows mirroring, which reintroduces the restart |

## C. Layout and rendering assumptions

| # | Assumption | Why | Confidence | What would overturn it |
| --- | --- | --- | --- | --- |
| C1 | **CHECK** "Left-align everything" is implemented as "LTR box, RTL text alignment for RTL content" | R3 found the literal reading ships a real defect, with named precedent (Bluesky filed and fixed exactly this). The app's own Arabic column already does the correct thing | Medium | The owner meant the literal reading. He asked for alternatives to be reported, so this is reported rather than assumed silently |
| C2 | Row height stays 57 and names never wrap | `STYLES.prayer.height` is fixed and the overlay anchors boxes off measured coordinates, which is row 36's machinery | High | |
| C3b | The three TRANSLATED terms (Sunrise, Midnight, Last Third) are ONE WORD where the language allows it | Owner ruling D16. Translate the TERM, never the DEFINITION, because the explanation string already carries the definition. Corrected after the owner caught a bad shortening: only TWO launch terms are actually over budget (French `Minuit islamique` 132pt, German `Sonnenaufgang` 126pt), the rule governs the SOURCE rather than a post-hoc trim, and a term that fits is never touched | High | A language where no short real word exists, in which case the long form stays and the locale is flagged |
| C3 | Over-long names are fixed in the CATALOG, not by shrinking text | A catalog is authored, so a shorter local form can be chosen. Measured against Al-Azan's shipped catalogs, **18 of 20 names already fit the 123pt budget**, so the width problem is largely an artefact of bad source data rather than a real layout limit | High | The sourced names in R6 have no acceptable short form in some language |
| C6 | Prayer names are TRANSLITERATED, not translated, wherever the language allows | Measured: German "Nachmittagsgebet" (translated) is 148pt where "Asr" (transliterated) is 30pt, and both are correct German. Muslim-majority languages transliterate naturally | High | A language where the transliteration is genuinely unused |
| C4 | Arabic-Indic digits become locale-driven rather than unconditional | R3: the Maghreb and UAE use Western digits per CLDR. The app maps unconditionally today | High | |
| C5 | The explanation overlay and Help modal get `direction: 'rtl'` for RTL locales | These are the app's only prose surfaces, and R3 says prose is where unmirrored RTL is badly wrong rather than mildly | Medium | |

## D. Process assumptions

| # | Assumption | Why | Confidence |
| --- | --- | --- | --- |
| D1 | This session plans only and ships no code | 🐋 "This is ONLY A RESEARCH TASK. Don't commit anything yet" | Very high |
| D2 | Work is isolated on `plan/39-localisation` in a worktree | Another session is executing row 37 in the main checkout | Very high |
| D3 | The identifier/label split lands in row 38, not 39 | R5: it is the prerequisite for everything else and costs an afternoon before catalogs exist, versus a storage migration after | High |
| D4 | Row 39 still waits on row 37 and row 36 | `ai/plans/README.md` records both. Row 36 is now CANCELLED, so only 37 remains | High |
| D5 | The 16 religious terms plus 5 explanations are sourced, never machine-translated | R2's two-track split, which is what makes a solo owner able to ship without a reviewer | High |
| D6 | The What's New entry ships in the same release as the feature | `ai/AGENTS.md`: a dark feature can never be advertised | High |

## The five rows to read first

If the owner reads nothing else, these are where his answer would most change the plan:

1. **A1**, two settings rather than one. Everything else in the design follows from it.
2. **A2**, whether the first column follows the app language or stays English forever.
3. **C1**, the RTL alignment amendment, which is a refinement of his own ruling rather than a
   departure from it, but he should judge that himself.
4. **A9**, month names, the lowest-confidence assumption in the list.
5. **A7**, the launch set of eight.
