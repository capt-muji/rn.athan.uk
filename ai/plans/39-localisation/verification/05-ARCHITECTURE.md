# Verification 05: i18n architecture (typed TS catalogs plus bridge)

Independent adversarial verification, with a 2026 best-practice attack, of the design: hand-rolled
typed TS catalogs plus a roughly 20-line `t()`, no i18n library, plus a tested TS-to-JSON
export/import bridge, at 6 languages now (milestone: en, ar, ms, so, hi, th) and up to 50 later.
Branch `verify/39-localisation-deepseek-20261009` at `52109ec0`. No file was modified.

## Findings

### F1. The "tested bridge" is a plan commitment, not an artifact. CONTRADICTED as stated.
There is no `i18n:export`/`i18n:import` in `package.json`, no `shared/locales/`, and no
`ai/plans/39-localisation/steps/`. `PLAN.md:119-120` lists the bridge as step 7 and `PLAN.md:182-186`
states no step file is written yet. R16 frames it as a still-forced change
(`R16-ARCHITECTURE.md:100-103`), not an existing capability. The claim as phrased overstates the
record. The record itself is honest.

### F2. No i18n library and no `expo-localization` are installed. CONFIRMED.
`package.json` contains no i18next, Lingui, FormatJS, i18n-js, or `expo-localization`. Same fact at
`SINGLE-LANGUAGE-PIVOT.md:60`.

### F3. Hermes lacks plural and display-name Intl APIs. CONFIRMED.
`R1-FINDINGS.md:9-11` lists `PluralRules`, `ListFormat`, `RelativeTimeFormat`, `DisplayNames` and
`Locale` as planned, not shipped. Corroborated externally (i18next plurals page, FormatJS
`intl-pluralrules`, a 2026 Hermes-only RN report). A hand-rolled `t()` that never calls `Intl` is
defensible on this axis. `shared/time.ts:25,243,318,329` uses `Intl.DateTimeFormat` only, which ships.

### F4. "There is no industry-standard i18n library for RN in 2026" is overstated. CONTRADICTED.
`R16-ARCHITECTURE.md:13-15` asserts no standard exists, yet its own table (`:87-96`) lists
i18next plus react-i18next, Lingui v6, react-intl/FormatJS and i18n-js. The accurate claim is "no single
dominant one", which is a weaker justification for hand-rolling.

### F5. The polyfill cost that anchors the library rejection is conditional. CONFIRMED, and overweighted.
`R16-ARCHITECTURE.md:27-38,90` prices i18next/Lingui at 46 to 155 KB raw of Intl polyfills.
`Intl.PluralRules` is needed only when a plural message resolves. `PLURAL-EVIDENCE.md:56-72` measures
zero plural-selecting strings, so the polyfill cost only materialises if plurals are adopted. At the
milestone the honest library cost is the runtime (i18next about 24 KB gz, Lingui about 2 KB core).

### F6. The plural guard cannot catch the real plural risk. CONFIRMED.
The guard is a source-syntax scan for ICU plural constructs. The residual risk is a translator who
expands the abbreviated `${n}m` into a full inflected form ("через 5 минут" against "через 1 минуту").
That value contains no ICU construct, passes the guard, and renders wrong on Hermes. Nothing pins the
abbreviation per locale, so the guard does not enforce what its rationale depends on.

### F7. The proposed qibla place-name fix via `Intl.DisplayNames` is wrong twice. CONFIRMED.
`SINGLE-LANGUAGE-PIVOT.md:272-274` closes the `placeName` gap using `Intl.DisplayNames`. First, Hermes
lacks `DisplayNames` (F3). Second, `DisplayNames` localises language, region, script and currency
codes, not arbitrary geocoded strings. `shared/qiblaPlace.ts:36-46` consumes `city`, `district`,
`subregion`, `region`, `country` strings from the geocoder and joins them verbatim, so it cannot render
a city name in another language. The real options are to accept proper nouns as-is or ask the platform
geocoder for the app locale.

### F8. Platform-native resources cannot remove the re-arm. CONFIRMED, and the record is right.
`device/notifications.ts:91,221` builds the title from the row's fields and hands it to
`expo-notifications` at schedule time. iOS local notifications freeze content and Android posts a
resolved `CharSequence` that per-app locale changes do not retranslate. The `withSchedulingLock`
re-arm transaction stays. This is the record's strongest structural call.

### F9. The bundle denominator is unmeasured and mixes units. UNCERTAIN.
`SELF-REVIEW.md:152` states "Bundle size and startup cost: Not measured." No APK or Hermes bytecode
bundle exists in the tree. `R16-ARCHITECTURE.md:36-38` and `R17-SCALE-AND-FONTS.md:56-58` compare
source bytes against a 4.4 to 4.9 MB bundle figure. The conclusion holds at 5.3 KB per locale, but
"byte weight is solved" rests on a number the plan itself lists as unverified.

### F10. The plan's decision block is stale against the final milestone. CONFIRMED.
`PLAN.md:11` lists the Q20 launch set as still needed and `PLAN.md:50-54` treats it as open, while Q20
is ruled six (`SINGLE-LANGUAGE-PIVOT.md:318`) and D32 finalises en, ar, ms, so, hi, th
(`OWNER-DECISIONS.md:483-494`). PLAN was planned at 1.29.296 and the D32 amendment is 1.29.303.
`PLAN.md:58,69` also name `scripts/preflight-38.sh` and `scripts/anchors/`, neither of which exists.
Executing PLAN as written assumes the superseded eight-language set.

### F11. Headless scheduling needs the catalog and locale, and no document specifies it. UNCERTAIN.
The background reschedule runs without UI init (`device/notifications.ts:99-105`) and calls
`genNotificationContent`, which the migration moves behind `t()`. `LOCALIZATION-API.md:40-41`
prescribes `getLocales()`, but nothing specifies how the active catalog is loaded and the persisted
locale resolved in the TaskManager/background route. This is the integration seam the bridge and `t()`
tests must cover.

### F12. `keyof typeof` gives key safety but not completeness or interpolation safety. UNCERTAIN.
The plan names only an `en` byte-parity test and a prayer-id closure gate (`PLAN.md:117-118`). At 50
locales, missing or extra keys per locale and placeholder mismatches are caught only if catalogs are
typed against the English shape and a completeness gate exists. `R2-FINDINGS.md:88-97` already names
the off-the-shelf equivalent (`i18next-cli status`/`lint`), which the plan does not adopt.

### F13. Tooling reference is internally inconsistent. CONTRADICTED.
`R16-ARCHITECTURE.md:52` names `i18next-parser`; `R2-FINDINGS.md:87` records it archived on 2026-02-22
and succeeded by `i18next-cli`. Meanwhile `PLAN.md:133-134` builds a bespoke Jest source scan that
duplicates `i18next-cli extract`.

## Break attempts

- A library is obviously better at six languages: the runtime overhead argument survives for a
  zero-plural surface, but the "no standard exists" framing does not (F4, F5).
- Native resources remove the re-arm: false, local notification content freezes at schedule time (F8).
- The bridge is tested and delivered: false, it is a named step (F1).
- The plural guard covers the plural risk: false, the real risk is a translated value with no ICU
  construct (F6).
- The bundle claim is measured: unmeasured and unit-mixed (F9).
- The plan matches the final milestone: stale (F10).

## Better alternatives, with real costs

1. Invert the source of truth: author catalogs as JSON/YAML/XLIFF, generate the typed TS. Keeps
   `keyof typeof` safety, deletes the bidirectional bridge and its drift, unlocks every translation
   management editor plus the `extract`/`status`/`lint` gates. Cost: one codegen step and generated
   types. Strongest single upgrade, because the roadmap targets 50 locales and pre-declares a
   crossover at about 40.
2. i18next plus react-i18next plus i18next-cli. About 24 KB gz runtime, no plural polyfill while
   plurals stay at zero. Buys typed keys, off-the-shelf CI gates, JSON as a translation lingua franca.
   Cost: one primary maintainer, an API in flux through v27, and a module-scope `React.createContext`
   that must stay out of the widget runtime.
3. Lingui v6 plus Crowdin (the Bluesky stack). About 2 KB core, `.po` catalogs every TMS ingests,
   built-in pseudolocales. The 155 KB polyfill applies only if plural, date or number helpers are used.
   Cost: an extra Metro transform stage and ESM-only Node coupling. Right endpoint at 50 locales with
   community proofreaders, not at six.
4. Drop `Intl.DisplayNames` for the qibla place and choose accept-as-is or locale-aware geocoding (F7).
5. Reconcile the plan with D32 (F10), pick one extraction tool (F13), and add a per-locale completeness
   gate before the 50-locale stage (F12).
