# R16. i18n architecture, adversarially reviewed (research agent report, 2026-10-09)

Dispatched by the owner's instruction after his challenge: "is this the best solution in general,
not the best solution for my broken code?" External claims carry URLs.

## (a) Verdict

**Best practice for this shape of app, not a band-aid, with one genuinely weak element.** The weak
element is not the hand-rolled `t()` or the missing library. It is authoring catalogs directly as
TypeScript modules with no tested bridge to a transfer format. Fix that one thing and the design
survives every attack mounted.

1. **There is no industry-standard i18n library for RN in 2026.** Expo's own guide uses
   `expo-localization` plus `i18n-js` as an example and explicitly says "take a look at other
   translation libraries to find one that best suits your needs" (docs.expo.dev/guides/
   localization). Meta's own apps use FBT (facebook.github.io/fbt). The largest
   community-translated Expo consumer app, Bluesky, uses Lingui plus Crowdin
   (github.com/bluesky-social/social-app/blob/main/docs/localization.md). react-i18next dominates
   by volume (1,534 of the top 100,000 websites run i18next, including X, GitLab, Deezer,
   Strava: locize.com/blog/who-uses-i18next; the FormatJS monorepo carries 14.7k stars). "What
   the largest apps use" has four different answers, and the answer correlates with translator
   count, not correctness.
2. **The app's real outage risk lives where no library operates.** The language-switch transaction
   (notification re-arm under `withSchedulingLock`, channel renames, widget re-push, crash-window
   idempotence) and the prayer-name identifier split are 90% of the production-failure surface.
   i18next, Lingui, and react-intl are silent on all of it.
3. **The Hermes plural trap is confirmed by current primary sources.** i18next's own docs: "the
   Hermes engine still does not implement `Intl.PluralRules`. Since i18next v24 there is no
   fallback: without Intl only English-style `_one`/`_other` forms resolve"
   (i18next.com/translation-function/plurals). The native `hermes-intl` project (October 2026,
   RN 0.86+) documents the exact gap: Hermes ships `NumberFormat`, `DateTimeFormat`, `Collator`
   but not `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `Locale`, and replacing the
   FormatJS polyfills saves 399 KB of JS (github.com/magrinj/hermes-intl). Every library path
   either polyfills or ships wrong Arabic plurals. This app has zero plural-selecting strings
   (`PLURAL-EVIDENCE.md`), which the guard test turns into a permanent deliberate decision.
4. **The size math kills the "library is cheap" argument.** Catalogs cost 5,317 B of source per
   language (raw, not gzipped) against a 4.4 MB bundle. Library runtimes cost 13 to 25 KB
   gzipped, more than two to four locale catalogs, for capabilities the app does not call.

## Attack results

- **ICU MessageFormat**: exists to put plurals, gender, select, and nesting inside one message
  (formatjs.github.io/docs/core-concepts/icu-syntax). This app has no gendered UI, no select, no
  nested messages, and a measured plural surface of four strings that all use abbreviated units.
  Adopting ICU now buys 10 KB of runtime (`intl-messageformat` 10,126 B) for zero exercised
  strings. The guard test plus a pre-decided remedy is the correct posture.
- **TMS lock-out**: partially guilty as charged. Crowdin natively supports TypeScript files,
  explicitly including `as const` catalogs (store.crowdin.com/ts, updated 2025-12-11; source
  cannot be edited in Crowdin, TS pluralization unsupported). Every other TMS centers on JSON,
  XLIFF, and Gettext (Tolgee, Lokalise, Weblate docs). Codegen is the standard resolution:
  Bluesky runs `intl:extract` nightly to `.po` and syncs both directions with Crowdin; i18next
  has `i18next-parser`, FormatJS `formatjs extract`, Lingui `lingui extract`. A TS catalog
  narrows the field to "Crowdin plus your own scripts": survivable but unnecessary, and forced
  change 1 removes it.
- **Compile-time safety**: `keyof typeof` on an `as const` catalog gives an exact key union with
  zero ceremony; the spike proved tsc rejects a typo by enumerating every valid key. i18next's
  `CustomTypeOptions` reaches similar safety with compile-time cost and a type story in flux
  (selector API default in v26, string-based key typing deprecation planned for v27:
  i18next.com/overview/typescript). FormatJS historically lacked argument type checking at build
  time (formatjs#3346). This app has four interpolating strings; the ceremony-to-guarantee ratio
  favors the union type decisively.
- **Hermes mechanics**: large literals are a documented Hermes compiler hazard ("depending on
  their composition, may take extremely long time to compile": facebook/hermes#1046) - a 5 KB
  catalog is far from trigger sizes, but flat catalogs and a floor-device measurement are
  mandatory, not optional. Lazy `require()` with `inlineRequires` is the sanctioned Metro
  mechanism (reactnative.dev/docs/optimizing-javascript-loading).
- **OTA delivery**: `expo-updates` can ship JS-only catalog deltas within store policy
  (docs.expo.dev/eas-update/introduction; bitrise.io blog on OTA policy). The library talks to
  any configured update server, so self-hosted OTA exists without EAS. The repo's EAS-read-only
  rule blocks EAS Update specifically, not OTA as a capability. One repo-specific hazard: an OTA
  catalog fix heals UI copy instantly but leaves already-armed notifications in the old language
  until the next re-arm; deterministic identifiers make that re-arm an in-place replace, so the
  fix is to define the behavior, not build new machinery.

## (b) Strongest counter-proposal

**The Bluesky stack: Lingui v6 plus `@lingui/metro-transformer`, `.po` catalogs, Crowdin with
community translators.** Proven at the largest scale this ecosystem demonstrates. Real costs: a
fourth Metro transform stage with SDK-bump coupling every release; ESM-only v6 on Node 22.19+;
roughly 155 KB raw of Intl polyfills on the documented RN path for a plural surface of zero; and
it does nothing for the transaction, the identifier split, the widget bans, or the floor device.
At 20 locales with no human translators it buys ICU headroom and a translator UI this app has no
translators for. At 50 locales with community proofreaders it becomes the right answer.

## (c) Top three candidates compared

| Dimension | Typed TS catalogs + 20-line t() (amended) | i18next + react-i18next + parser + Crowdin | Lingui v6 + metro transformer + Crowdin |
| --- | --- | --- | --- |
| Key safety | Exact union, zero ceremony, spike-proven | CustomTypeOptions, API in flux through v27 | Macro extraction plus codegen types |
| ICU on Hermes | N/A today; guarded; remedy pre-decided | Needs PluralRules polyfill since v24 | Polyfills on documented RN path |
| Bundle cost | ~0 B beyond catalogs | ~24 KB gz runtime plus polyfill | ~2 KB core plus ~155 KB raw polyfills |
| Offline fit | Native | Bundled-resources mode required | Native |
| TMS fit | Crowdin only, unless the JSON bridge ships | Best: i18next JSON is a TMS lingua franca | Strong: .po universally ingested |
| Bus factor | ~20 lines owned forever | One primary maintainer, company-backed | Active team; Bluesky precedent |
| At 8 locales | Best fit | Overhead | Overhead plus build risk |
| At 50 locales | Viable only with bridge plus TMS | Standard | Standard with community translators |

## (d) Changes forced regardless of verdict

1. **A tested TS-to-i18next-JSON bridge, as an acceptance criterion.** `i18n:export` and
   `i18n:import` scripts producing and consuming i18next-shaped flat JSON, with a CI parity test
   asserting round-trip identity. This converts the design from cheapest-fit to best-on-merits:
   `keyof typeof` safety retained, every TMS unlocked, migration past 40 locales mechanical.
2. **Flat catalogs only.** Dot-separated keys in one object per locale (hermes#1046 composition
   caveat plus i18next flat-shape compatibility).
3. **A named pre-flight: first-catalog `require()` timing on the OnePlus 3T, release build, all
   launch locales, with the JSON.parse fallback decision written down before the experiment
   runs.**
4. **The plural-construct guard test ships in the same commit as the first catalog.**
5. **An explicit OTA ruling.** Either catalog fixes ship via self-hosted `expo-updates`, or the
   owner signs off that translation corrections wait for store releases. If OTA ships, define
   whether an update triggers the re-arm transaction, because UI copy and notification copy will
   otherwise diverge silently.
6. **The `Intl.PluralRules` canary rides any future plural machinery.**
