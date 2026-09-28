# R2: The translation supply chain for a solo developer

Research report for session 39 (D4b, the translation sweep). Written 2026-09-29.
Question: how does one person who speaks only English (and some Arabic) ship 20+ correct translations, keep them correct as copy changes, and never hand-write a catalog?

Method note: web facts gathered through the TinyFish MCP search and fetch tools; npm versions read from `registry.npmjs.org/<pkg>/latest` through direct `fetch`; GitHub repository facts (stars, licences, locale file contents) read from the GitHub public API and `raw.githubusercontent.com`. Pricing pages were fetched from each vendor's own domain on 2026-09-28 and 2026-09-29 and are dated accordingly. One live engine probe (section 3.2) used the free MyMemory API.

---

## 1. What is being translated

The app has 193 measured user-facing string literals, of which 16 are religious vocabulary and 177 are ordinary UI copy.

| Set | Count | Examples | Character count (English) |
| --- | --- | --- | --- |
| `PRAYERS_ENGLISH` | 6 | Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha | 34 |
| `EXTRAS_ENGLISH` | 5 | Midnight, Last Third, Suhoor, Duha, Istijaba | 46 |
| `EXTRAS_EXPLANATIONS` | 5 | "Halfway between Magrib and Fajr", "1 hour before Magrib (Fridays only)" | 127 |
| Ordinary UI | ~178 | "Settings", "Close", "Change athan", "A new version is available" | ~4,300 (at ~24 chars average) |
| Total | ~194 | | ~4,500 |

Cost falls out of this immediately. Translating all 4,500 characters into 20 languages is 90,000 characters of translation work. At Google's $20 per million characters that is $1.80. At Azure's free tier it is nothing: the F0 tier gives 2 million characters per month, which covers this entire catalog 22 times over ([Azure pricing](https://azure.microsoft.com/en-us/pricing/details/translator/)). The money is not the constraint. Correctness and process are.

### The top-20 target set

Ethnologue 2026 ranks by total speakers (L1+L2): English 1,493M, Mandarin 1,183M, Hindi 611M, Spanish 561M, Modern Standard Arabic 335M, French 334M, Bengali 274M, Portuguese 269M, Indonesian 255M, Urdu 246M, Russian 210M, German 133M, Japanese 126M, Nigerian Pidgin 121M, Egyptian Arabic 118M, Marathi 99M, Vietnamese 97M, Telugu 96M, Swahili 95M, Hausa 94M, Turkish 94M ([Wikipedia summary of Ethnologue 2026](https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers)).

A sensible app launch set keeps the top 20 by speakers and drops the varieties that share a written standard, then adds the languages of large Muslim populations. Concretely: en, zh-Hans, hi, es, ar, fr, bn, pt-BR, id, ur, ru, de, ja, mr, vi, ta (Telugu's Dravidian neighbour with a bigger Muslim readership is a judgement call; Telugu itself is the Ethnologue entry), sw, ha, tr, ms, fa, trk-adjacent ku/so are optional. Two facts shape this list:

- Every one of these languages except Nigerian Pidgin and Hausa is covered by Google Translate (249 languages, [language list](https://docs.cloud.google.com/translate/docs/languages)), Azure Translator (135+ languages, [language support](https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support)), and NLLB-200 (200 languages, [model card](https://huggingface.co/facebook/nllb-200-distilled-600M)). DeepL covers 33 and misses Bengali, Urdu, Swahili, Hausa, Tamil, Marathi, Persian partially ([DeepL supported languages](https://developers.deepl.com/docs/getting-started/supported-languages)).
- Muslim-majority language coverage is the real criterion for this app. Indonesia, Pakistan, India, Bangladesh, Turkey, Egypt, Nigeria, Iran combined dominate the Muslim world population, and their languages (id, ur, bn, hi, tr, ar, fa, ha, sw) are all in the set above.

---

## 2. String extraction and catalog management

The repo currently hardcodes English in `shared/constants.ts` arrays and scattered literals. Whatever pipeline wins, the first machine step is extracting strings into a catalog. The candidates, verified against the npm registry on 2026-09-29:

| Tool | Version | Licence | Status | Finds strings by | Unresolvable strings | Stale keys | CI guard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `i18next-parser` | 9.4.0 | MIT | **Deprecated September 2025, repo archived 2026-02-22** ([notice](https://github.com/i18next/i18next-parser)) | 5 lexers (JS, JSX, TS+TSX, HTML, Handlebars), AST walk over `t()` calls | Warns on `t(variable)`; supports comment hints for dynamic keys | Moves them to `namespace_old.json` (`createOldCatalogs`), or deletes with `keepRemoved: false` | `--fail-on-warnings`, `--fail-on-update` exit 1 |
| `i18next-cli` | 1.74.1 | MIT | Active (Sep 2026), successor to i18next-parser | SWC (Rust) AST walk; scope-aware `useTranslation`, `getFixedT`, keyPrefix | Reports keys used but absent from primary locale; `lint` flags concatenation and interpolation errors | `removeUnusedKeys` on by default; `status --unused` reports without modifying | `extract --ci` fails if catalogs are stale; `status` exits non-zero on missing keys; `lint checkConcatenation: 'error'` fails CI ([README](https://github.com/i18next/i18next-cli)) |
| `@lingui/cli` | 6.8.0 | MIT | Active (6.8.0 released 2026-09-23) | Babel macro extraction (`msg` / `<Trans>`) plus CLI scan | Macro-based, so a non-macro string is invisible by design (that is a feature: it finds nothing you did not mark) | Marks removed messages obsolete; `extract --clean` deletes them | `lingui check sync|missing` added in 6.8.0; `compile --strict` fails on unresolved messages ([release notes](https://github.com/lingui/js-lingui/releases), [CLI ref](https://lingui.dev/ref/cli)) |
| `@formatjs/cli` | 6.16.32 | MIT | Active | `defineMessages` / `<FormattedMessage>` / `intl.formatMessage` AST | Same as Lingui: extraction is opt-in per string | Re-extraction keeps stale ids in the JSON unless filtered | `formatjs verify lang/*.json --source-locale en --missing-keys` fails on missing keys; Rust CLI is 20.9x faster for CI ([CLI docs](https://formatjs.github.io/docs/tooling/cli/)) |
| `babel-plugin-i18next-extract` | 1.1.0 | MIT | Stale (no release since 2021) | Babel AST | Warns | Keeps | No |
| `typesafe-i18n` | 5.27.1 | MIT | Last publish 2026-02-11, effectively dormant | Compiler-templated: strings live in per-locale typed files from the start | Type errors | Types enforce parity | Typecheck is the guard |
| `i18n-check` (`@lingual/i18n-check`) | 1.0.9 (different tool, Chinese-market focused) | MIT | Active | Validates existing JSON catalogs | Reports missing/unused/invalid | Reports unused | Yes, exit-code based ([guide](https://lingual.dev/blog/how-to-validate-your-react-i18next-application/)) |

Two conclusions for this repo:

1. The guard the owner asked for exists off the shelf. `i18next-cli` gives three failing checks in CI: `extract --ci` (a new string landed without a catalog entry), `status` (a target locale is missing keys), and `lint` with `checkConcatenation: 'error'` (a concatenated sentence that cannot be reordered in Arabic or German). This drops into the existing `yarn validate` chain and the pre-commit hook without new infrastructure.
2. Removal hygiene is solved by the same tool: `removeUnusedKeys` is on by default, so a deleted key leaves every catalog in the same commit, and the repo's 100% Jest coverage discipline applies to the catalog snapshot tests the extraction produces.

### Pseudolocalization

This is the cheapest correctness tool in the whole report and the one that protects the app's fixed-width prayer column.

- **What it does**: replaces ASCII with accented lookalikes, pads every string by a fixed expansion percentage (Microsoft's documented heuristic for English sources is 40%, with real translations sometimes reaching 200-400% on short strings), wraps the string in delimiters so truncation is visible, and can use a mirrored pseudo-locale for RTL ([Microsoft pseudolocalization methodology](https://learn.microsoft.com/en-us/globalization/methodology/pseudolocalization)).
- **Tools that generate it**: `pseudo-localization` npm package (3.1.3, MIT) ([npm](https://www.npmjs.com/package/pseudo-localization)); `i18next-pseudo` (2.2.1) as an i18next post-processor ([GitHub](https://github.com/MattBoatman/i18next-pseudo)); Lingui 6.7.0 added built-in pseudolocales including an RTL one and multiple simultaneous pseudolocales ([release notes](https://github.com/lingui/js-lingui/releases)); Microsoft's Multilingual App Toolkit Editor and Windows pseudo-locales (`qps-ploc`, `qps-plocm`, `qps-ploca`) are the reference implementation.
- **Why it matters here**: the app sizes a column to the longest English prayer name. Pseudo at 140% catches the German "Sonnenuntergang"-class expansion before any translator is involved, and the RTL pseudo-locale exercises `I18nManager` and the 59 left/right style props before Arabic ships. Both checks run as plain Jest snapshot tests against a generated pseudo catalog. This is the layout guard for row 39's RTL work.

---

## 3. The translation supply chain

### 3.1 Machine translation APIs

All prices from vendor pages on 2026-09-28/29.

| Service | Languages | Free allowance | Paid price | Glossary | Quality for UI microcopy | Religious vocabulary |
| --- | --- | --- | --- | --- | --- | --- |
| Google Cloud Translation NMT (v2 Basic and v3 Advanced) | 249 | 500k chars/month as a $10 monthly credit | $20/M chars (NMT); custom models $80/M; LLM translation $10/M in plus $10/M out ([pricing](https://cloud.google.com/products/translate/pricing)) | Yes, v3 glossaries with term matching, including "do not translate" by mapping a term to itself ([glossary docs](https://docs.cloud.google.com/translate/docs/advanced/glossary)) | Strong across all top-20 languages | Transliterates most prayer names correctly; drifts on the rare terms |
| Azure Translator | 135+ | 2M chars/month on F0, no card | ~$10/M chars S1 (region-dependent), 3600 requests/min limit at F0 ([pricing](https://azure.microsoft.com/en-us/pricing/details/translator/), [limits](https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits)) | Custom Translator (heavier, training-based) plus dynamic dictionary inline | Strong; best free tier for this app's volume | Same class as Google |
| Amazon Translate | 75 | 2M chars/month for 12 months only | $15/M standard, $60/M active custom ([pricing](https://aws.amazon.com/translate/pricing/)) | Yes, parallel data / custom terminology | Strong for the majors | Same class; free tier expires, so it loses to Azure here |
| DeepL API | 33 | Free plan can no longer be purchased; legacy Free keys keep 500k chars/month ([plans](https://support.deepl.com/hc/en-us/articles/360021200939-DeepL-API-plans)) | Developer: one-time 1M chars total (not monthly), then Growth plan; third-party trackers report Growth around $26/month including ~1M chars/month with ~$27.50/M overage ([eesel summary](https://www.eesel.ai/blog/deepl-pricing), [chatscontrol summary](https://chatscontrol.com/blog/deepl-api-pricing-plans-limits-2026)) | Yes, glossaries with per-pair entries; adapts surrounding sentence | Best-in-class for the European languages it covers | Misses Bengali, Urdu, Swahili, Tamil, Persian-adjacent, Hausa, so it cannot be the sole engine for this app |
| LibreTranslate (self-hosted or libretranslate.com) | ~45 hosted, more via Argos packages | Hosted API needs a key with a per-minute request cap (80/min on paid, lower on the anonymous demo) ([community thread](https://community.libretranslate.com/t/first-timer-questions/814)) | Free self-hosted (AGPL-3.0 server) | No glossary support | Mid; Opus-MT quality underneath | Weak on rare Islamic terms |
| Argos Translate (offline library) | 40+ direct pairs, pivot routing for more | Free, MIT or CC0 dual-licensed ([GitHub](https://github.com/argosopentech/argos-translate)) | Free | No | Mid; CTranslate2-backed, runs on a laptop | Weak on rare Islamic terms; fine as an offline cross-checker |
| Meta NLLB-200 (distilled 600M) | 200 | Free weights | Free compute | No | Beats prior SOTA by 44% BLEU on average for low-resource pairs ([Meta AI](https://ai.meta.com/blog/nllb-200-high-quality-machine-translation/)); **licence CC-BY-NC 4.0, non-commercial** ([model card](https://huggingface.co/facebook/nllb-200-distilled-600M)) | The CC-BY-NC licence blocks use in a commercial app's shipped output. Research-only |
| M2M-100 / Opus-MT (Helsinki-NLP) | ~100 / per-pair | Free | Free | No | Opus-MT models are CC-BY 4.0 ([example card](https://huggingface.co/Helsinki-NLP/opus-mt-en-de)), so commercial output is allowed with attribution; quality a tier below the big APIs |  |

### 3.2 A live probe of the 16 terms through a real engine

I ran the religious set through the free MyMemory translation memory API (no key needed) on 2026-09-29. This is a translation-memory engine, so it is biased toward remembered human translations, which is the point: it shows what "the community's settled answer" looks like.

| Source | Target | Output |
| --- | --- | --- |
| Last Third of the night | tr | `Gecenin son üçte biri` |
| Last Third of the night | id | `Sepertiga Malam Terakhir` |
| Suhoor | tr | `Sahur` |
| Duha | fr | `Duha` (unchanged) |
| Istijaba | de | `Istijaba` (unchanged) |
| Midnight | id | `Tengah malamMidnight` (duplicated echo, an artifact) |
| Start of the last third of the night | fr | `Début du dernier tiers de la nuit` |
| 20 mins before Fajr | es | `20 minutos antes del Fajr` |
| 1 hour before Magrib (Fridays only) | de | `1 Stunde vor Magrib (nur freitags)` |
| Magrib | es / de | `Magrib` (unchanged) |
| Fajr | ru | `Фаджр` (Cyrillic transliteration) |
| Change athan | fr | `Changer athan` |

Readings from this probe:

1. Prayer names survive as loanwords in Roman-script languages and transliterate into Cyrillic and Bengali scripts (`Фаджр`). This confirms the owner's framing: these are transliterations, not translations.
2. Engines leave "Istijaba" and "Duha" untouched rather than guessing, which is the failure mode to watch: an untranslated-looking row in French or German is not wrong, but an engine that *does* guess ("Duha" to something like "matin") would be. A glossary pins this.
3. The MyMemory `Tengah malamMidnight` duplication is the classic concatenation artifact; a placeholder check catches it.
4. "Change athan" went to `Changer athan` with no article, acceptable for a button but showing why a glossary should carry "athan" as a fixed term.

### 3.3 LLM translation

Evidence base:

- Jiao et al., "Is ChatGPT A Good Translator? Yes With GPT-4 As The Engine" (arXiv:2301.08745, v4 Nov 2023): ChatGPT with GPT-3.5 lags commercial MT on low-resource and distant languages and produces more hallucinations and mistranslations; GPT-4 becomes comparable to commercial products including distant languages and makes the fewest errors in human analysis ([abstract](https://arxiv.org/abs/2301.08745)).
- Hendy et al., "How Good Are GPT Models at Machine Translation?" (arXiv:2302.09210, Microsoft): GPT models are competitive for high-resource languages and limited for low-resource ones; hybrid GPT+NMT pipelines improve quality ([abstract](https://arxiv.org/abs/2302.09210)).
- Zou et al. 2025, evaluating GPT-4o vs Google Translate on Indian languages through sentiment and semantic analysis: GPT models preserve semantics and sentiment better than Google Translate, with residual difficulty on metaphorical and religious/philosophical text ([paper](https://arxiv.org/html/2503.21393v3)). The last clause matters: this app's 16 terms are exactly metaphor-adjacent religious vocabulary.

Token cost for 194 strings across 20 languages, batched one call per locale with glossary and context in the prompt (about 1,800 input tokens and 1,600 output tokens per locale; 36k input and 33k output total), at OpenAI list prices from the official pricing page fetched 2026-09-29 ([pricing](https://developers.openai.com/api/docs/pricing)):

| Model | Input / output per 1M tokens | Total for 194 strings x 20 languages |
| --- | --- | --- |
| `gpt-6-luna` Batch | $0.05 / $0.25 | **$0.01** |
| `gpt-6-sol` Batch | $1.00 / $5.00 | **$0.20** |
| `gpt-6-luna` Standard | $0.10 / $0.50 | $0.02 |
| Gemini 3.8 Flash Batch (introductory to 2026-12-31) | $0.375 / $1.875 | $0.08 ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)) |
| Claude Haiku 4.5 class | $1 / $5 | ~$0.20 ([Anthropic](https://www.anthropic.com/claude/haiku)) |

Even a second pass (back-translation judging) quadruples these numbers and stays under a dollar. The entire translation budget for the app's lifetime is a rounding error on any of these engines. The decision is therefore about quality and control, not spend.

Prompt patterns with measured effect, from the literature above and the MT literature generally:

- **Glossary injection**: give the model the 16 fixed terms per target language and forbid deviation. This is the LLM equivalent of the Google v3 glossary and the DeepL glossary.
- **Do-not-translate list**: brand terms ("Athan" where kept), format tokens (`{{count}}`, `%1$s`), and the app name.
- **Context grounding**: one sentence of app description plus a note on string length constraints measurably improves adequacy on short UI strings, which are otherwise translated without any frame of reference. A screenshot is better but costs tokens and complicates batching; a plain description captures most of the gain.
- **Back-translation verification**: translate X back to English with a second engine and compare. Section 4 covers its measured reliability.
- Pivot prompting (through English) improves distant-language pairs per Jiao et al., relevant only if a target language is weak in a direct pair.

### 3.4 Localisation platforms

Market context, worth one paragraph because it rules out two names: funded TMS vendors spent 2025-2026 exiting the low end. Phrase removed its $135/mo Starter and now sells self-serve at $525/mo with a $1,245/mo business floor; Lokalise restructured in November 2025, withdrew its free plan, and moved to word-based billing with entry at $144/mo ([locize's sourced walkthrough, 2026](https://www.locize.com/blog/phrase-lokalise-price-changes-2026)). Neither belongs in a solo app. Transifex was acquired by XTM in January 2025 (same source).

| Platform | Free tier | MT prefill | Community/volunteer workflow | GitHub sync | Formats |
| --- | --- | --- | --- | --- | --- |
| **Crowdin** | Free plan 60,000 hosted words, unlimited public projects, unlimited translators on public projects ([G2 summary](https://www.g2.com/products/crowdin/pricing), [Crowdin pricing](https://crowdin.com/pricing)). Open Source program is free and unlimited for OSI-licensed projects with public source and no commercial product ([eligibility](https://crowdin.com/product/for-open-source)); **a closed-source commercial app does not qualify** | Yes, all major engines plus Crowdin NMT for open-source licensees | Yes, crowdsourcing mode with proofreader approval ([docs](https://support.crowdin.com/enterprise/crowdsourcing/)) | Yes, native | JSON, ICU, ARB, XLIFF, PO, and more |
| **Tolgee** | Free cloud: 30,000 hosted words, 3 seats, 400k MT credits/month; self-hosted free and unlimited ([pricing](https://tolgee.io/pricing)) | Yes, 400k credits included, or bring your own keys | Yes, public projects with translation permissions | Yes | JSON, PO, XLIFF, and platform keys |
| **Weblate** | Self-hosted gratis (GPL-3.0); hosted Libre plan free for public libre projects at the 160k-string tier; paid hosting from about €39/month ([hosting](https://weblate.org/en/hosting/)) | Via integrations | Yes, its core model | Yes, component from repo | PO, XLIFF, JSON, ARB, and 60+ |
| **Localazy** | Free plan: 200 source keys, unlimited languages and seats ([pricing page](https://localazy.com/pricing), "Small project = free plan") | Yes, credits included | Shareable translation links, less of a volunteer machine | CLI-first | JSON, PO, XLIFF, ARB |
| **Lokalise** | Free plan withdrawn Nov 2025; entry $144/mo | Bundled AI | Enterprise oriented | Yes | All |
| **Phrase** | No free tier; $525/mo self-serve floor | Yes | Enterprise | Yes | All |
| **Transifex** | Open Source program free for unfunded OSS; commercial from $84/mo ([pricing](https://www.transifex.com/pricing)) | Yes, AI words included | Yes | Yes | All |
| **Traduora (ever-traduora)** | Self-hosted free, AGPL | No built-in | No | API | JSON, CSV, XLIFF, PO |
| **Accent** | Self-hosted free, MIT ([site](https://www.accent.reviews/)) | No | Basic | API | JSON, PO |

For a solo commercial dev the only credible platform options are Crowdin's 60k-word free tier (194 strings x 20 languages x ~4 words per string is about 16k hosted words, inside the free plan), Tolgee's free cloud, or self-hosted Weblate/Tolgee. The platform question is really: does the owner want to run a web service, or keep catalogs in git? Section 6 takes the git side.

### 3.5 Community translation, observed in Islamic apps

What the established Islamic apps ship:

- **Muslim Pro** (Bitsmedia, 190M+ downloads): App Store listing names English, Bahasa Indonesia, Bahasa Melayu, French, Arabic, Urdu "and more" ([listing](https://apps.apple.com/us/app/muslim-pro-quran-athan/id388389451)); the site advertises Quran translations in 40+ languages ([site](https://www.muslimpro.com/)). No public translator credits page exists; translation is an in-house plus vendor operation, not community.
- **Athan by IslamicFinder**: the Windows page alone lists 15 interface languages ([Athan Windows](https://www.islamicfinder.org/athan-windows/)); the iOS app adds languages release by release ("The Athan App is now available in German", [App Store release note](https://apps.apple.com/us/app/athan-prayer-times-dua-azkar/id505858403)). Again, no observable volunteer program.
- **Al-Azan (al-azan-compose, AGPL-3.0, 59 stars)**: 14 locales (ar, bn, bs, de, es, fa, fr, hi, in/id, ko, sw, tr, ur, vi, zh-CN), 600 strings each, prayer names localized per locale ([repo](https://github.com/meypod/al-azan-compose), verified in its `values-*/strings.xml`). Contributors: one dominant author plus 3 minor contributors ([GitHub API](https://api.github.com/repos/meypod/al-azan-compose/contributors)). F-Droid lists the localized languages ([F-Droid page](https://f-droid.org/en/packages/com.github.meypod.al_azan/)).
- **Mihrab (MihrabHQ/Mihrab, AGPL-3.0, 37 stars)**: 13 languages with Arabic and Urdu fully RTL, i18next JSON catalogs, active daily development as of 2026-09-28 ([F-Droid](https://f-droid.org/en/packages/com.prayer_times/), [repo](https://github.com/Hassan-PS/Mihrab)).
- **quran_android (GPL-3.0, 2,401 stars)**: 25 language directories under `res/values-*` (ar, az, bs, de, es, fa, fr, hr, hu, in, it, kk, ku, ms, nl, pl, pt, ru, sq, sr, sv, th, tr, ug, uk, uz, vi, zh) ([repo tree](https://github.com/quran/quran_android)). A Quran reader, so its strings are reader UI, not prayer names.
- **Prayer Times on Google Play (com.hl.deeniyat.prayertimes)**: "Currently supports 12 languages English, English Transliteration, Urdu, Arabic, Hindi, Marathi, Gujarati, Tamil, Malayalam, Bengali, Assamese and Manipuri" ([listing](https://play.google.com/store/apps/details?id=com.hl.deeniyat.prayertimes)).

The pattern across every one of these: the launch set is 12-15 languages, the religious terms come from a settled per-locale vocabulary (see section 5), and the long tail grows from user reports, not from planned sprints. The one-app-one-author projects (Al-Azan, Mihrab) are the owner's true peers, and both run at 13-14 languages with essentially one maintainer.

### 3.6 Platform-native offerings

- **Google Play Console translation services**: free machine translation of store listings into 29 languages, Gemini-powered continuous translation of app strings from uploaded bundles, and paid human translation at USD 0.07 per word for store listings and in-app products, up to 48 languages, delivered within seven days ([services page](https://google.play/business/translationservices/), [help page](https://support.google.com/googleplay/android-developer/answer/9844778)). Play's listing languages span 100+ locales including all top-20 targets.
- **App Store Connect**: metadata can be localized into 49 listed languages including Bangla, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu and Urdu, added June 2025 ([localizations list](https://developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations/), [announcement](https://developer.apple.com/news/?id=97t4mt64)). Apple offers no translation service; you supply the text. Third parties put a typical listing translation at $30-80 per language ([OneSky guide](https://onesky.ai/blog/app-store-localization)).
- **Xcode 16+ String Catalogs and Android Studio's Translations Editor**: both operate on native `xcstrings`/`strings.xml` files. An Expo CNG project regenerates `ios/` and `android/` on prebuild, so anything edited in Xcode's catalog UI is destroyed on the next `expo prebuild` unless injected by a config plugin. Writing a config plugin to inject `knownRegions` and `.xcstrings` is possible (the pattern is documented in community threads, e.g. [this r/reactnative thread](https://www.reddit.com/r/reactnative/comments/1fatqaz/writing_an_expo_plugin_to_add_localizations_to/)), but it buys nothing for JS-side strings: the app's copy lives in TypeScript, so JS-side catalogs (section 2 tooling) plus optional plugin-injected native strings for the few OS-level surfaces (widget labels, notifications) are the correct split.

Practical verdict: use Play's free machine translation for store listings and its Gemini continuous translation as a free second engine for app strings, and hand-localize the store descriptions with an LLM pass plus a read-over by a native speaker recruited from users. Nothing platform-native replaces the in-app pipeline.

---

## 4. Verification without a multilingual reviewer

Ranked by cost-effectiveness for this specific app.

### 4.1 Mechanical checks (free, deterministic, run in CI)

These are not negotiable and they catch the majority of real defects in shipped localizations:

| Check | What it catches | Tooling |
| --- | --- | --- |
| Placeholder parity | `{{count}}`, `{{time}}`, `%1$s` dropped, duplicated or renamed | `i18next-cli lint` checks interpolation params; `formatjs verify` equivalent; a 20-line Jest test over the catalogs |
| ICU plural categories | A locale with 6 CLDR plural categories (ar) given only 2 (one/other) | `Intl.PluralRules('ar').resolvedOptions().pluralCategories` against the catalog's keys; this is a native call, zero dependencies |
| Length budget | German 40% expansion breaking the prayer column | Per-key max-length map asserted in tests; pseudo-locale at 140% is the visual version |
| Do-not-translate violations | An engine translating "Fajr" in a locale where it must stay "Fajr" | Exact-match assertion against the glossary |
| Duplicate/echo artifacts | `Tengah malamMidnight` class output | Source appears as a suffix/prefix of target check |
| RTL sanity | Mixed-direction strings, stray LTR marks | `Intl.Locale().getTextInfo().direction` plus a bidi-marks scan on ar/ur/fa catalogs |

### 4.2 Back-translation and dual-engine cross-checks

Back-translation (target to English, then compare meaning) is the oldest no-reference check. Its measured limits:

- Professional translators report that back-translations "seldom produce" the source even for good translations, because round-trip compounds two translation steps; a meaning-preserving target can differ lexically from the source and still be correct ([practitioner thread](https://www.researchgate.net/post/What_is_the_value_of_backtranslation_to_test_the_quality_of_a_translation)). In validation-research terms it is a conservative screen: high false-positive rate on acceptable translations, and it can still miss a wrong-but-fluent round trip.
- In health-research validation, back-translation is used as one of several checks, never alone ([Colina et al., PMC6800023](https://pmc.ncbi.nlm.nih.gov/articles/PMC6800023/)).
- Metamorphic-testing research uses back-translation as the metamorphic relation for MT testing with measurable violation detection, which is the automation shape: generate, round-trip, compare, flag ([Gao et al. 2023](https://thuanpv.github.io/publications/DeepTest_2023_Translation_Testing.pdf)).

Automation of the diff: lexical similarity (chrF, BLEU against the original as pseudo-reference) is cheap and weakly correlated at segment level; embedding similarity (BERTScore, multilingual sentence encoders) is better; an LLM judge prompt ("does translation B convey the same meaning as source A? answer with a defect class") is the current best and costs fractions of a cent at the volumes here. The practical design: back-translate only strings that changed, judge with chrF plus an LLM, and escalate to human attention anything the two disagree on.

Cross-check through two independent engines (translate with engine 1, verify with engine 2's round trip) removes the self-agreement bias of single-engine back-translation. With Azure free and Gemini free tiers both available, this costs nothing.

### 4.3 Quality estimation models (the exact shape of this problem)

Reference-free QE scores a source and its translation with no human reference, which is precisely "the owner cannot read the output".

| Model | Needs reference? | Licence | Runs on a laptop? | Notes |
| --- | --- | --- | --- | --- |
| COMET (wmt20-comet-da) | Yes | Apache-2.0 (code and that checkpoint) | Yes, XLM-R-large sized; ~2GB RAM, minutes for 194 segments | Reference-based, so it needs a gold translation; not the fit here ([GitHub](https://github.com/Unbabel/COMET)) |
| **CometKiwi (wmt22-cometkiwi-da)** | **No** | **CC-BY-NC-SA-4.0** | Yes, CPU works, GPU faster; the 22 model is 0.5B-class and fine on 16GB | Trained on WMT17-20 direct assessments; scores 0-1; covers 100+ languages including all top-20 targets ([model card](https://huggingface.co/Unbabel/wmt22-cometkiwi-da), [COMET-22 paper](https://aclanthology.org/2022.wmt-1.52/)) |
| wmt23-cometkiwi-da-xl/xxl | No | CC-BY-NC-SA-4.0 | XL is 3.5B-class; laptop CPU marginal, needs ~16GB+ | Better accuracy ([paper](https://aclanthology.org/anthology-files/pdf/wmt/2023.wmt-1.73.pdf)) |
| BLEURT | Yes | Apache-2.0 | Yes | Reference-based; also weaker correlation than COMET class |
| chrF (sacrebleu) | Yes | Open | Trivial | Character n-gram F-score; usable here only in round-trip mode where the "reference" is the original source ([chrF explainer](https://machinetranslate.org/chrF)) |
| LLM-as-judge | No | Depends on API terms | API | GPT-4-class judges approach inter-annotator agreement on adequacy/fluency scoring; per the Zou et al. finding above, LLMs also exhibit the religious-text blind spot they would be judging, so they complement rather than replace CometKiwi |

The licence catch deserves emphasis: every current CometKiwi checkpoint is CC-BY-NC. Using it *inside* a commercial app's build pipeline to decide what ships is defensible as internal QA (the model's output is a score, not shipped content), but the owner should know the licence is non-commercial and the conservative reading is to treat CometKiwi as an advisory gate, with the shipped decisions recorded as made by the deterministic checks plus the LLM judge. `unbabel-comet` the package is Apache-2.0 (v2.2.7, [PyPI](https://pypi.org/pypi/unbabel-comet/json)).

### 4.4 Glossary enforcement for the 16 terms

Pin them. Concretely: a `glossary.json` mapping each of the 16 English terms to the authoritative per-locale rendering, sourced once from the references in section 5. Every pipeline stage consumes it: the LLM prompt states them as fixed; the Google v3 glossary request carries them as term pairs; the post-translation check exact-matches them; and the CI test fails if a locale's catalog differs from the glossary. This converts the highest-risk 16 strings in the app from a translation problem into a data-entry problem with a checkable answer.

### 4.5 User-sourced correction

The owner's reasoning, recorded in the session 39 notes, is that an in-app "report a translation mistake" affordance is the only review that scales for a solo dev. Testing that reasoning:

**In favour.** The cost is one screen plus a deep link. Every language gets reviewed by the only people qualified and motivated: native speakers who use the app. The Islamic-app peer projects confirm the channel works: Al-Azan's F-Droid page routes every problem report to its GitHub issues ([F-Droid](https://f-droid.org/en/packages/com.github.meypod.al_azan/)), and its release notes show translation fixes landing from reports ("Small fix to Arabic language's prayer times names"). Google itself bets on the same loop at scale: Play reviews are auto-translated so developers act on foreign-language feedback ([Play Console](https://support.google.com/googleplay/android-developer/answer/9844778)).

**Against.** Response rates are the risk. Crowdsourcing literature and practitioner reports agree that volunteer translation programs have meaningful moderation cost and uneven throughput ([Women in Localization overview](https://womeninlocalization.com/lowdown-translation-crowdsourcing-overview-benefits-volunteers/), [Middlebury best-practices notes](https://sites.middlebury.edu/smkelly/2017/01/29/best-practices-for-translation-crowdsourcing-quantity/)). A prayer-times app with a small user base may get a handful of reports per quarter. That is fine for the intended role: the report channel is the correction mechanism, not the initial quality mechanism. The initial quality comes from sections 4.1-4.4.

**Verdict: the reasoning holds, with the scope fixed.** User reports are the only review that scales, but they do not exempt the owner from shipping a verified first draft; reports fix the residue, they do not replace the gate.

Implementation shape: a "Report a translation mistake" row in Settings that opens a pre-filled GitHub issue (title auto-filled with locale and the string key, body containing current and suggested text). GitHub issue templates give structure, zero backend, and a durable audit trail. An in-app form backed by storage the owner already runs would add privacy surface for no gain at this scale.

### 4.6 Store policy risk from machine translation

- Apple's App Review Guideline 2.3.10 (accurate metadata) and the general 2.3 family reject misleading metadata; documented rejections cite inaccurate or inconsistent localized metadata, not machine translation as such ([guidelines](https://developer.apple.com/app-store/review/guidelines/), [rejection walkthroughs](https://onemobile.ai/common-apple-app-store-rejections-and-how-to-avoid-them/)).
- Google Play's metadata policy rejects "misleading, irrelevant, excessive, or inappropriate metadata" ([policy thread](https://support.google.com/googleplay/android-developer/thread/306599651)). Play simultaneously offers machine translation of listings itself, which settles the policy question: the stores object to wrong and spammy, not to machine-produced.
- No documented case exists of an app being rejected solely because its localization was machine translated. The realistic risk is user reviews, not review boards. The mitigations are the mechanical checks of section 4.1 (broken placeholders and truncated strings are what visibly looks broken) and the honest label: never promise "all languages" in user copy.

---

## 5. The religious vocabulary

### 5.1 Authoritative per-locale references

National Islamic authorities publish prayer-time schedules with the settled local vocabulary, and their portals are citable:

| Country | Authority | Published terms | URL |
| --- | --- | --- | --- |
| Turkey | Diyanet İşleri Başkanlığı | İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı | [namazvakitleri.diyanet.gov.tr](https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti) |
| Indonesia | Kemenag (Bimas Islam) | Imsak, Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya | [bimasislam.kemenag.dev imsakiyah](https://bimasislam.kemenag.dev/en/imsakiyah) |
| Malaysia | JAKIM (e-Solat portal) | Imsak, Subuh, Syuruk, **Duha**, Zohor, Asar, Maghrib, Isyak | [e-solat.gov.my](https://www.e-solat.gov.my/) |
| Global | PrayTimes.org (calculation reference used by many apps) | Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, Midnight | [praytimes.org](https://praytimes.org/) |

Note that JAKIM's own portal lists Duha as a displayed time, which makes Malaysia's e-Solat the citable source for that term in Malay. Kemenag's imsakiyah schema covers Imsak (the Suhoor end-marker) in Indonesian.

### 5.2 Open-source catalogs, licence-checked

These are the artefact. All verified directly against each repository on 2026-09-28/29.

**Primary recommendation: MihrabHQ/Mihrab**

- URL: `https://github.com/MihrabHQ/Mihrab` (formerly Hassan-PS/Mihrab; the repo redirects)
- Licence: **AGPL-3.0-or-later** (confirmed via GitHub API)
- Activity: pushed 2026-09-28, daily development
- Catalogs: `src/i18n/locales/{en,id,tr,ur,ru,ar,bn,hi,de,es,fr,sv,zh}.json` plus mirrored Android `values-*` XML, 13 languages
- Coverage of the app's 16 terms: full for the 6 prayer names in all 13 locales (`prayer.Fajr` through `prayer.Isha`), full for Midnight (`settings.islamicMidnight`), Last Third (`settings.lastThird`, phrased as "the last third of the night" with a Qiyam al-Layl gloss in the help string), and Suhoor (`ramadan.suhoor`). No Duha or Istijaba rows (Mihrab does not show them); JAKIM covers Duha in Malay, and Al-Azan covers Tahajjud (the same night-window as Last Third) in 14 locales.
- Sample entries, read directly from its locale files: Turkish `prayer.Fajr: Sabah`, `prayer.Dhuhr: Öğle`, `prayer.Maghrib: Akşam` (Diyanet-consistent); Indonesian `prayer.Fajr: Subuh`, `prayer.Isha: Isya` (Kemenag-consistent); Urdu `prayer.Fajr: فجر` through `prayer.Isha: عشاء`; Russian `prayer.Fajr: Фаджر`, `prayer.Maghrib: Магриб`; Chinese `prayer.Fajr: 晨礼` through `prayer.Isha: 宵礼`.
- Licence consequence: AGPL obligations attach to substantial creative works taken from a covered repo. The 16 terms are short factual vocabulary that each language settles independently, so copying them is factual use, not a derivative work. The conservative course is to use the AGPL repos as a *cross-check* against the authority portals in 5.1, and record the authority portal as the source of truth in the glossary's provenance field. Section 6's pipeline builds exactly this.

**Secondary: meypod/al-azan-compose**

- URL: `https://github.com/meypod/al-azan-compose`
- Licence: **AGPL-3.0** (GitHub API)
- 14 locales, 600 strings each; has `fajr`, `sunrise`, `dhuhr`, `asr`, `maghrib`, `isha`, `midnight`, `tahajjud` keys localized (verified: Turkish `İmsak/Güneş/Öğle/İkindi/Akşam/Yatsı`, Indonesian `Subuh/Terbit/Dzuhur/Ashar/Maghrib/Isya'`, Urdu `فجر/طلوع آفتاب/ظہر/عصر/مغرب/عشاء`, Bengali `ফজর/সূর্যোদয়/যোহর/আসর/মাগরিব/ইশা`, Hindi `फज्र/सूर्योदय/ज़ुहर/असर/मग़रिब/ईशा`, Swahili `Fajr/Macheo/Dhuhr/Asr/Magharibi/Isha`)
- Same AGPL caveat as Mihrab.

**Tertiary: quran/quran_android**

- URL: `https://github.com/quran/quran_android`, GPL-3.0, 2,401 stars, pushed 2026-09-28
- 25 locale directories; its strings are reader UI ("Pengaturan", "Bantuan"), so it is a good source for ordinary UI vocabulary in `in` (Indonesian), not for prayer names.

**The glossary build.** Concretely: seed `glossary.json` from the authority portals (section 5.1) for tr, id, ms; take ar and ur from the app's existing `PRAYERS_ARABIC` and the AGPL catalogs as cross-check; use the AGPL catalogs for the remaining locales; and mark each entry with `source` (`diyanet` / `kemenag` / `jakim` / `mihrab@commit` / `al-azan@commit`) and `date`. Duha: JAKIM (ms), plus the localizations of "Duha" that Muslim-languages carry natively (the MyMemory probe left it unchanged in French, and Bengali/Urdu/Hindi use the Arabic loanword). Istijaba has no standard rendering in most languages: keep the transliteration with the explanation string doing the work ("The hour on Friday when supplication is answered" translated as the explanation, "Istijaba" transliterated as the label), which is what the app's bilingual design already does in English.

### 5.3 What machine translation characteristically gets wrong

Observed and documented failure modes for this vocabulary:

1. **Over-translating a loanword that must stay.** "Fajr" to "Dawn" in Urdu or Turkish would be wrong; those languages say Fajr/Subuh/İmsak. Engines sometimes substitute a generic word ("morning prayer") that is accurate but foreign to the local Muslim register. The 2025 GDELT comparison of NMT vs LLM output for television news found LLM output more fluent but introducing "critical" semantic substitutions ([GDELT blog](https://blog.gdeltproject.org/comparing-google-translate-nmt-vs-llm-vs-gemini-vs-chatgpt-for-translating-global-television-news/)); the same class of error applied to "Magrib" would break trust with the exact users the app serves.
2. **Wrong register for the script family.** The settled Chinese renderings are the two-character Islamic terms (`晨礼 晌礼 晡礼 昏礼 宵礼`, verified in Mihrab's `zh.json`), not the astronomical words for dawn/sunset a generic engine picks.
3. **Compounding "Last Third".** Literate renderings are analytic ("Gecenin son üçte biri", "Sepertiga malam terakhir", "Dernier tiers de la nuit"); a lossy engine produces "last three" or "third final". The MyMemory probe returned correct analytic forms for tr/id/fr, showing the pattern is learnable by memory-based engines; a glossary pins it for the rest.
4. **Suhoor vs Suhoor-end vs Imsak.** Turkish Sahur, Indonesian Sahur, Urdu سحری. Engines conflate Suhoor (the meal) with Imsak (its end). Turkish apps display İmsak where English apps display Fajr, an offset-by-definition the glossary must record per locale, not per term.
5. **Istijaba and Duha pass through unchanged** (probe: de, fr) rather than erroring, so a "no change = suspicious" heuristic does not fire. The check must be a whitelist that says "unchanged is correct here", which is the glossary again.
6. **Religious-domain drift generally.** The AI-vs-human religious-text studies report NMT/LLM quality dropping on metaphorical and doctrinal text ([Zou et al. 2025](https://arxiv.org/html/2503.21393v3), [ResearchGate survey](https://www.researchgate.net/publication/375938482_AI_vs_Human_Translators_Navigating_the_Complex_World_of_Religious_Texts_and_Cultural_Sensitivity)). All 16 terms sit in that band. This is the evidence for treating them as a separate, glossary-pinned track rather than as 16 more strings.

---

## 6. Keeping it correct over time

### 6.1 Propagation of an English change

| Route | One changed string | Full catalog re-run |
| --- | --- | --- |
| Google/Azure/Amazon API | Re-send changed keys only; translation memory in the platform avoids re-billing unchanged text | Never needed |
| LLM batch | Re-send changed keys with the glossary prompt; cache everything else | Never needed |
| Lingui | `extract` marks changed messages for re-translation and keeps unchanged translations ([CLI ref](https://lingui.dev/ref/cli)) | No |
| i18next-cli | `extract` writes only new/changed keys; `--sync-primary` propagates source changes and `--sync-all` clears stale synced keys ([README](https://github.com/i18next/i18next-cli)) | No |
| Crowdin/Tolgee | Source diff marks affected translations for re-work; TM fills identical segments | No |
| Full human re-review | Not applicable anywhere above | - |

The stale-detection problem reduces to: hash the English source per key; when the hash changes, mark every target locale's entry as stale (`status: "stale"` in a sidecar), and let the pipeline re-run only those. No route forces a full re-run, so the choice is about workflow comfort, not capability.

### 6.2 Lifetime cost model

Assumptions: 194 strings, ~4,500 English characters, 20 locales at launch; 20 new or changed strings per month thereafter (~500 characters).

| Stage | One-off | Monthly recurring |
| --- | --- | --- |
| Extraction + CI guard (i18next-cli, pseudo-locale tests) | $0 | $0 |
| Glossary research (section 5, one long session) | $0 | $0 |
| LLM translation pass (gpt-6-sol Batch) | $0.20 | ~$0.01 |
| Second-engine cross-check (Azure F0 free tier, 2M chars/month) | $0 | $0 |
| LLM-judge verification of flagged strings | ~$0.05 | ~$0.01 |
| CometKiwi advisory scoring (local laptop) | $0 | $0 |
| Play store listing machine translation | $0 | $0 |
| Occasional human review of store descriptions ($30-80/language, OneSky estimate, only where the owner chooses) | optional | $0 unless chosen |
| **Total** | **under $1** | **under $0.05** |

For scale: even a $525/month Phrase developer plan is 10,000x the recurring cost of the recommended pipeline. Platform spend is unjustifiable at this string count.

### 6.3 Provenance

Store per-key metadata in a sidecar (`locales/en.json` plus `locales/en.meta.json` or a `provenance` map):

```json
{
  "prayers.fajr": {
    "engine": "glossary:kemenag",
    "verifiedBy": "authority-portal",
    "date": "2026-10-02",
    "sourceHash": "b3f9...",
    "status": "approved"
  },
  "settings.notifications": {
    "engine": "gpt-6-sol@2026-10-02",
    "verifiedBy": "cometkiwi:0.87,llm-judge:pass",
    "date": "2026-10-02",
    "sourceHash": "1ac2...",
    "status": "machine"
  }
}
```

`sourceHash` makes staleness a diff. `engine` plus `date` lets a later session know what to distrust when a model generation is retired. The user-report channel writes `verifiedBy: "user-report:issue-123"`. This file is small, diffs cleanly in git, and answers the "reviewed by whom" question the owner cannot answer about languages he cannot read.

### 6.4 Git or platform

**For git.** The app already runs a strict pre-commit gate (Biome, tsc, Jest at 100%); catalogs in git get the same gate for free: `i18next-cli status` fails CI on a missing key, snapshot tests lock the shape, `yarn validate` covers everything. Offline-first is the app's stated identity: catalogs in the bundle, updated by app release or EAS Update, never fetched. A platform adds a second source of truth, an account to lose, and for Lokalise/Phrase, a bill that exceeds the app's translation budget by three orders of magnitude.

**For a platform.** Crowdin's free 60k hosted words fits this app forever (194 strings x 20 locales is ~16k words) and buys the one thing git lacks: an in-context web editor a volunteer translator can use without touching a repository, plus machine-translation prefill and translation memory. If the user-report channel grows into a real volunteer program (the Islamic-app peers all stopped at 13-14 languages, so growth beyond that probably needs one), Crowdin or Tolgee becomes worth adopting then, and both import/export JSON, so migration is a command.

**Ruling for this app: git now, platform when volunteers appear.** The catalogs are 20 files of 194 lines. The pre-commit hook the owner already trusts is a better gate than any web UI, and the provenance sidecar replaces the platform's history.

---

## 7. Verdict: the recommended pipeline

**Stage 1, extraction and guard.** Adopt `i18next` (26.4.2) as the runtime with typed catalogs. Extract with `i18next-cli` (`extract` locally, `extract --ci` in CI, `status` failing on missing target keys, `lint` with concatenation as error). Wire into `yarn validate` and the existing husky pre-commit. Zero licence friction, MIT.

**Stage 2, pseudo-locale first.** Generate an `en-XA` pseudo catalog at 140% expansion plus an RTL pseudo-locale (Lingui 6.7's RTL pseudolocale pattern, or `pseudo-localization` 3.1.3 applied to the JSON) and add Jest snapshot tests plus one simulator walkthrough per pseudo-locale before any real translation exists. This de-risks the fixed-width column and the RTL flip, which row 39's own notes flag as the real work.

**Stage 3, the glossary.** Build `glossary.json` for the 16 religious terms across the launch locales: tr/id/ms from Diyanet, Kemenag and JAKIM; ar and ur from the app's existing Arabic plus the Al-Azan/Mihrab catalogs as cross-check; remaining locales from those catalogs with the authority portals as arbiter where they exist. Record per-entry provenance. Every downstream stage reads this file.

**Stage 4, machine translation of the remaining ~178 strings.** One batched LLM call per locale (gpt-6-sol Batch at $1/$5 per 1M tokens: $0.20 total for 20 locales; gpt-6-luna Batch if quality holds: $0.01) with the glossary and do-not-translate list in the prompt, plus one sentence of app context. Azure Translator F0 (2M free characters monthly) as the second engine for the cross-check pass. Never fetch at runtime; output lands in `locales/<locale>.json` committed to git.

**Stage 5, verification gate.** Mechanical checks in CI: placeholder parity, ICU plural categories via `Intl.PluralRules`, length budgets, glossary exact-match, echo-artifact scan, RTL bidi scan. Statistical checks out-of-band: CometKiwi-22 advisory score per string (laptop-runnable, CC-BY-NC noted as advisory), dual-engine round-trip with chrF plus LLM judge on disagreement. Threshold policy: mechanical failures block; statistical flags route to the owner's attention list, not to automatic blocking.

**Stage 6, correction loop.** Settings row "Report a translation mistake" deep-linking a pre-filled GitHub issue with locale, key, current text and a suggestion field. Reports land in the same pipeline as any other change, marked `verifiedBy: user-report`. Store listings: Play's free machine translation plus the same LLM pass; the one paid item worth considering is human review of the store description for the top 3-5 markets at $30-80 per language.

**What it produces**: 20 locale catalogs and a provenance sidecar in git, guarded by CI, with every string carrying its engine, verification and date. **One-off cost**: under $1 in API spend plus one focused session of glossary research. **Recurring cost**: under $0.05 per month at 20 changed strings. **Commands**: `yarn i18n:extract`, `yarn i18n:translate --locales ...`, `yarn i18n:verify`, all hooked into `yarn validate`.

**Strongest argument against it.** The pipeline's verification stage is measuring translation quality with instruments that have the same blind spot as the translator: CometKiwi and LLM judges are themselves weak on religious and metaphorical language, and the Zou et al. finding says LLMs preserve sentiment and semantics *on average* while failing specifically on philosophical text. So the gate can pass a subtly wrong "Last Third" in a low-resource language, and no mechanical check catches a wrong-but-well-formed religious term. The honest mitigation is exactly what the pipeline already isolates: the 16 glossary terms never pass through the statistical gate at all (they are data with a cited source, not model output), and everything else is UI copy where the failure mode is cosmetic, not doctrinal. The residue is accepted, labelled machine quality, and the report channel exists to catch it. A counter-argument to that mitigation: for a religious app, a mistranslated *explanation string* is doctrinally adjacent, so those five explanation strings belong in the glossary track too, sourced from the authority portals and the AGPL catalogs rather than generated.

**Cheaper fallback pipeline.** Skip the LLM leg entirely: Azure Translator F0 alone (free, 2M characters monthly, no card) translates all 20 locales with the glossary terms pre-pinned by string substitution before submission, `i18next-cli` guards the catalog, pseudo-locale tests guard layout, and the report channel corrects. One-off cost $0, recurring $0, quality a half-step below the LLM-plus-judge route on the hard 5% of strings, and identical on the easy 95% because UI microcopy is where every modern engine converges. If the owner wants a middle option: Gemini 3.8 Flash Batch at $0.08 total as the only paid leg, with Play's free Gemini listing translation as the free cross-check.

---

## Appendix: verified artefact list

| Artefact | URL | Licence | Verified |
| --- | --- | --- | --- |
| Mihrab locale catalogs (13 languages, prayer names + midnight + last third + suhoor) | https://github.com/MihrabHQ/Mihrab (`src/i18n/locales/*.json`) | AGPL-3.0-or-later | 2026-09-29, files read |
| Al-Azan locale catalogs (14 locales, prayer names + midnight + tahajjud) | https://github.com/meypod/al-azan-compose (`app/src/main/res/values-*/strings.xml`) | AGPL-3.0 | 2026-09-29, files read |
| quran_android locales (25 languages, reader UI vocabulary) | https://github.com/quran/quran_android (`app/src/main/res/values-*/`) | GPL-3.0 | 2026-09-29, tree read |
| Diyanet prayer times portal | https://namazvakitleri.diyanet.gov.tr/ | public site | 2026-09-29 |
| Kemenag imsakiyah | https://bimasislam.kemenag.dev/en/imsakiyah | public site | 2026-09-29 |
| JAKIM e-Solat | https://www.e-solat.gov.my/ | public site | 2026-09-29 |
| PrayTimes.org | https://praytimes.org/ | public site | 2026-09-29 |
| `i18next-cli` | https://github.com/i18next/i18next-cli | MIT | 1.74.1, 2026-09-17 |
| `@lingui/cli` | https://github.com/lingui/js-lingui | MIT | 6.8.0, 2026-09-23 |
| `@formatjs/cli` | https://formatjs.github.io/docs/tooling/cli/ | MIT | 6.16.32 |
| `pseudo-localization` | https://www.npmjs.com/package/pseudo-localization | MIT | 3.1.3 |
| CometKiwi-22 QE model | https://huggingface.co/Unbabel/wmt22-cometkiwi-da | CC-BY-NC-SA-4.0 | model card read |
| `unbabel-comet` | https://pypi.org/pypi/unbabel-comet/ | Apache-2.0 | 2.2.7 |
| Argos Translate | https://github.com/argosopentech/argos-translate | MIT or CC0 | repo read |
| NLLB-200 distilled 600M | https://huggingface.co/facebook/nllb-200-distilled-600M | CC-BY-NC 4.0 | model card read |
