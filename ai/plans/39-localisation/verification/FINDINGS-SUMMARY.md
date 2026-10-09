# Verification findings summary: session 39 localisation record

Independent adversarial verification, run blind from a separate worktree
(`/Users/muji/athan-gitree/worktrees/verify-39-deepseek`, branch
`verify/39-localisation-deepseek-20261009`, off `uat` at `52109ec0`). Seven theme verifications, one
file each in this folder. No plan, research or source file was modified. The seven strongest claims in
the record were verified against the code, then attacked.

## Verdict in one paragraph

The record's spine holds. The space-form identifier union is byte-correct on every stored key and
armed identifier. The no-wipe, no-bump upgrade is right because no stored family changes shape. The
no-bundle font decision stands at the milestone. The schedule-first re-arm has no zero-alarm window.
The strong findings below are accuracy and completeness defects at the edges, not collapse of the
core.

## Contradictions, strongest first

Every item names the file where the full evidence sits.

### C1. Fresh installs would be pinned to English. (UPGRADE, 03 F8)
`R18-UPGRADE-PATH.md:77-82` guards the language stamp on `preference_language` absence, but that key is
also absent on fresh installs, and `handleAppUpgrade` runs on fresh installs
(`stores/version.ts:82-90,279,289`). The nullable pivot (`SINGLE-LANGUAGE-PIVOT.md:236-239`, Q5 `:303`)
requires null to follow the device locale. A key-absence guard stamps `'en'` for every new 2.0.0 user,
and on upgrading installs the stamp lands after the first paint, so a non-English device renders in
its locale then snaps to English. Fix: stamp only when the captured `storedVersion` is non-null
(`stores/version.ts:242`), or move the stamp beside the width seed before first paint.

### C2. The copied commit shape cannot report "full success". (TRANSACTION, 04 F2)
`commitSoundSelection`'s `armEverything` discards the boolean from `_rescheduleAllNotifications`
(`stores/notifications.ts:1720,1732`), which returns false on the empty-cache bail (`:1604-1610`), and
refused days do not throw (`:871-881`). Copied for the language commit, it would report success and
clear the intent marker while nothing re-armed. Fix: propagate the bail and refusal counts, and clear
the marker only on a real pass.

### C3. The language-wide intent marker has no repair path. (TRANSACTION, 04 F6)
`markedPrayers()` (`stores/notifications.ts:449-456`) sees only per-prayer marks, and the repair pass
at `:1796-1809` ignores a language marker. A crash between the marker write and the atom move would not
be repaired by the launch, foreground or background cycle R11 relies on. Fix: implement the marker as a
gate reopener beside the per-prayer marks.

### C4. A late-landing native call is not healed by the sweep. (TRANSACTION, 04 F7)
`R11-LANGUAGE-COMMIT.md:101` says the sweep removes strays from a timed-out native call.
`findStaleScheduledNotificationIds` filters only identifiers absent from records
(`shared/notifications.ts:214-221`), and a late-landing call reuses the deterministic identifier the
failure path already recorded (`stores/notifications.ts:877,1071`). Same-identifier strays are
invisible. Not a zero-alarm window, but the healing claim is false.

### C5. `expo-localization` is not installed or configured. (RTL, 06 F1)
`package.json` has no `expo-localization`, and `app.json` has no `supportsRTL`/`supportedLocales`
entry. The claim that the layout "is pinned LTR via the plugin" is a ruling, not a fact. Nothing pins
LTR today, so Android mirrors on an Arabic-locale device (`SINGLE-LANGUAGE-PIVOT.md:58`). The plugin
mechanism itself is real, confirmed against the published `expo-localization@58.0.3` tarball
(`plugin/build/withExpoLocalization.js:83-171`, `ios/LocalizationModule.swift:52-59`,
`android/.../LocalizationModule.kt:38,55-61`).

### C6. "Everything is left-aligned" is wrong. (RTL, 06 F4)
The rulings keep the time cell centred and icons right (`SINGLE-LANGUAGE-PIVOT.md:301`,
`OWNER-DECISIONS.md:458-464`). The tree has 14 `textAlign` declarations, 12 `center`, 2 `right` on the
removed Arabic surfaces, and zero `textAlign: 'left'`. If literal left alignment is wanted for Arabic
prose, the work is missing and iOS natural alignment can anchor a pure-Arabic paragraph right.

### C7. The RTL-trap interaction is asserted, not verified. (RTL, 06 F6)
`SINGLE-LANGUAGE-PIVOT.md:272` says the declared-locale interaction was "verified ... in the plan's
pre-flight", but no pre-flight artifact exists. `supportedLocales` writes `CFBundleLocalizations`
(`withExpoLocalization.js:103`), which opts iOS native surfaces into RTL for an Arabic locale. The
trade is real (`R3-RTL-AND-SCRIPTS.md:104-108`) and unverified.

### C8. R14's headline counts are wrong. (TEST CENSUS, 07 F4-F6)
`R14-TEST-CENSUS.md:3,111` says 171 test files scanned and 74 affected suites. The tree holds 189
test files, and R14's own table lists 85 distinct suites. The per-category subtotals are stated as
62/38/24/18/7 but the table yields 62/38/28/17/8. The individual file:line citations are accurate.

### C9. The "tested bridge" is not an artifact. (ARCHITECTURE, 05 F1)
No `i18n:export`/`i18n:import`, no `shared/locales/`, no `steps/`. The bridge is `PLAN.md:119-120`, step
7, not written (`PLAN.md:182-186`). The claim overstates the record, which is itself honest.

### C10. "No industry-standard i18n library for RN in 2026" is overstated. (ARCHITECTURE, 05 F4)
`R16-ARCHITECTURE.md:13-15` asserts no standard, while its own table lists i18next plus react-i18next,
Lingui v6, react-intl/FormatJS and i18n-js. The accurate claim is "no single dominant one".

### C11. The polyfill cost that anchors the library rejection is conditional and overweighted. (ARCHITECTURE, 05 F5)
`R16-ARCHITECTURE.md:27-38,90` prices i18next/Lingui at 46 to 155 KB raw of Intl polyfills, but
`PluralRules` is touched only when a plural resolves and `PLURAL-EVIDENCE.md:56-72` measures zero
plural-selecting strings. At the milestone the honest library cost is the runtime (about 24 KB gz for
i18next, about 2 KB core for Lingui).

### C12. The plural guard cannot catch the real plural risk. (ARCHITECTURE, 05 F6)
The guard scans for ICU plural syntax. The residual risk is a translator expanding the abbreviated
`${n}m` into a full inflected form, which contains no ICU construct, passes the guard, and renders
wrong on Hermes. Nothing pins the abbreviation per locale.

### C13. `Intl.DisplayNames` is the wrong tool for the qibla place name. (ARCHITECTURE, 05 F7)
`SINGLE-LANGUAGE-PIVOT.md:272-274` proposes it. Hermes lacks `DisplayNames` (`R1-FINDINGS.md:11`), and
`DisplayNames` maps language/region/script/currency codes, not arbitrary geocoder strings
(`shared/qiblaPlace.ts:36-46` joins `city`/`district`/`subregion`/`region`/`country` verbatim). Fix:
accept proper nouns or request locale-aware geocoding.

### C14. The bundle denominator is unmeasured and mixes units. (ARCHITECTURE, 05 F9)
`SELF-REVIEW.md:152` records bundle size as not measured, yet `R16-ARCHITECTURE.md:36-38` and
`R17-SCALE-AND-FONTS.md:56-58` compare source bytes against a 4.4 to 4.9 MB bundle figure. The
conclusion holds at 5.3 KB per locale, but "byte weight is solved" rests on an unverified number.

### C15. PLAN.md is stale against the final milestone. (ARCHITECTURE, 05 F10)
`PLAN.md:11,50-54` treats the Q20 launch set as open and assumes the superseded eight-language set,
while Q20 rules six (`SINGLE-LANGUAGE-PIVOT.md:318`) and D32 finalises en, ar, ms, so, hi, th
(`OWNER-DECISIONS.md:483-494`). `PLAN.md:58,69` also name `scripts/preflight-38.sh` and
`scripts/anchors/`, which do not exist.

### C16. Internal tooling reference is inconsistent. (ARCHITECTURE, 05 F13)
`R16-ARCHITECTURE.md:52` names `i18next-parser`; `R2-FINDINGS.md:87` records it archived and succeeded
by `i18next-cli`. `PLAN.md:133-134` builds a bespoke source scan that duplicates `i18next-cli extract`.

### C17. The 1.4em Arabic line-height floor is stale. (FONTS, 01 F5)
`R17-SCALE-AND-FONTS.md:28,91` and `R3-RTL-AND-SCRIPTS.md:83` say 1.4em, but the record's own synthesis
supersedes it with 1.70em (`SINGLE-LANGUAGE-PIVOT.md:249-251`, `R3-FINDINGS.md:110-116`), and the
shipped constant is 1.6em (`shared/constants.ts:305`).

### C18. "The fixed 57px row clips tall scripts" is mis-located. (FONTS, 01 F6)
The row name Text sets no line height (`Prayer.tsx:106-109`), so one 18px line fits at 1.7em (about
31px) in the 57px row. The explicit 22px line height lands on prose surfaces (`Explanation.tsx:156`,
`Help.tsx:179-249`). The clipping risk is real, the named mechanism is not.

### C19. "No bundled fonts are needed, ever" outruns the record's own confidence. (FONTS, 01 F11)
The milestone includes Hindi (Devanagari) and Thai, which the record itself calls the hard scripts and
rates Medium confidence (`ASSUMPTIONS.md:37`), with the device check still pending
(`SELF-REVIEW.md:89-94`). Proven for Arabic, plausible for Thai and Devanagari, device-unproven.

### C20. "The only real per-locale font work is line-height constants" understates the plan. (FONTS, 01 F12)
The record also requires dropping the explicit `fontFamily` for non-Latin scripts
(`R3-FINDINGS.md:103,170`), plus per-locale width measurement and device checks
(`R17-SCALE-AND-FONTS.md:99-106`).

### C21. The underscore form is not only the audio/res-raw slug. (IDENTIFIERS, 02 F4)
It is also the Android reminder channel id `reminder_last_third_15_v3`
(`shared/notifications.ts:387-390`). The design conclusion is unaffected, the wording is wrong.

## Better alternatives, with real costs

1. **Fonts.** Keep the no-bundle default but run the named 3T check for `hi` and `th` first, and bundle
   only a script that shows tofu or a clipped row. Fetched sizes: NotoSansDevanagari 243,520 B,
   NotoSansThai 37,780 B, so about 281 KB for one weight of both. Bundling makes metrics deterministic
   but does not remove the line-height work and adds SIL OFL licensing and an `expo-font` entry.
2. **Upgrade stamp.** Stamp the language only when the captured `storedVersion` is non-null
   (`stores/version.ts:242`), or move it beside the width seed before first paint. Cost: one guard
   change plus a fresh-install crash-window test.
3. **Transaction.** Make `_rescheduleAllNotifications` report the empty-cache bail and refusals, and
   add the language marker as a gate reopener beside the per-prayer marks. Cost: one return-type change
   at `stores/notifications.ts:1585`, one marker atom, one repair branch, one suite.
4. **Architecture, strongest.** Invert the source of truth: author catalogs as JSON/YAML/XLIFF and
   generate the typed TS. Keeps `keyof typeof` safety, deletes the bidirectional bridge and its drift,
   and unlocks `extract`/`status`/`lint` and every TMS editor. Cost: one codegen step and generated
   types. This is the standard 2026 shape and matches the roadmap's declared crossover at about 40
   locales.
5. **Architecture, full library.** i18next plus react-i18next plus i18next-cli at about 24 KB gz, with
   no plural polyfill while plurals stay at zero. Buys typed keys and off-the-shelf CI gates. Cost: one
   primary maintainer, an API in flux through v27, and a module-scope `React.createContext` that must
   stay out of the widget runtime. Lingui v6 plus Crowdin is the right endpoint at 50 locales with
   community proofreaders, not at six.
6. **Qibla place name.** Drop `Intl.DisplayNames`. Either accept proper nouns as-is or ask the platform
   geocoder for the app locale. Cost: one code path, no dependency.
7. **RTL.** Install `expo-localization` at the pinned 58.x line, add
   `["expo-localization", { "supportsRTL": false, "supportedLocales": [...] }]`, prebuild, and prove
   the iOS first frame on a fresh install. Cost: one dependency, one prebuild, one device check. The
   cheaper variant is not to declare `ar` in `supportedLocales`, avoiding the native UIKit RTL opt-in.
8. **Plan freshness.** Reconcile `PLAN.md` with D32's six-language milestone, name one extraction tool,
   add a per-locale completeness gate before the 50-locale stage, and correct R14's three headline
   counts (189 test files, 85 affected suites, subtotals 62/38/28/17/8). Cost: documentation edits only.

## Confirmed core, not to be reopened

- Identifier space-form union: every key family and OS builder byte-exact (02 F1-F3, F5-F9).
- No-wipe, no-bump upgrade: every stored family name-free or tolerant (03 F1-F7, F9).
- No-bundle fonts for Arabic in production (01 F1-F4, F7, F8).
- Schedule-first re-arm with no zero-alarm window (04 F1, F3, F4).
- Native resources cannot remove the re-arm (05 F8).
- R13's blast-radius citations exact with zero drift (07 F2, F3).

## Residual uncertainty (stated, not resolved)

- iOS 18 font coverage for Devanagari and Thai is not repo- or device-verifiable here (01 F10).
- The iOS first-frame determinism of the plugin rests on the module `OnCreate` ordering (06 F6).
- Android same-id notification replace is asserted in a comment, not device-verified (04 F4).
- The bundle size is unmeasured (05 F9).

| Task | Status |
| --- | --- |
| Read the governing record and research R1-R18 | done |
| Seven theme verifications against the code | done |
| Independent reproduction of the contradictions | done |
| Findings written to verification/, one file per theme | done |
| Summary with contradictions and alternatives | done |
| Push the branch | pending |
