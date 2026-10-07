# R2: The translation supply chain for a solo developer (compressed)

Research report for session 39 (D4b, the translation sweep). Written 2026-09-29 at 408 lines.
**Compressed 2026-10-07** to the sections other documents do not carry; the conclusions and
numbers the plan builds on live in `R2-FINDINGS.md` (the two-track 16+5 split and why the 5
explanations join the glossary track, the licence resolution on the AGPL catalogs, the
i18next-cli ruling, pseudo-locale at 140% plus RTL, mechanical-blocks/statistical-advises,
and the report-a-mistake correction loop). Recover the full original from git history (C4).

Question answered: how does one person who speaks only English (and some Arabic) ship 20+
correct translations, keep them correct as copy changes, and never hand-write a catalog?
Cost context carried by R2-FINDINGS: 194 strings ≈ 4,500 English characters ≈ 90,000
characters at 20 languages; Google list price $1.80, Azure F0 free tier covers it 22 times
over, batched LLM $0.01–$0.20. The money is not the constraint; correctness and process are.

What is kept here, because nothing else carries it:

## 1. The ordered pipeline (R2 §7, stages verbatim-essentials)

**Stage 1, extraction and guard.** Adopt `i18next` (26.4.2) as the runtime with typed
catalogs. Extract with `i18next-cli` (`extract` locally, `extract --ci` in CI, `status`
failing on missing target keys, `lint` with concatenation as error). Wire into `yarn
validate` and the existing husky pre-commit. Zero licence friction, MIT.

**Stage 2, pseudo-locale first.** Generate an `en-XA` pseudo catalog at 140% expansion plus
an RTL pseudo-locale (Lingui 6.7's RTL pseudolocale pattern, or `pseudo-localization` 3.1.3
applied to the JSON) and add Jest snapshot tests plus one simulator walkthrough per
pseudo-locale before any real translation exists. This de-risks the fixed-width column and
the RTL flip.

**Stage 3, the glossary.** Build `glossary.json` for the 16 religious terms across the launch
locales: tr/id/ms from Diyanet, Kemenag and JAKIM; ar and ur from the app's existing Arabic
plus the Al-Azan/Mihrab catalogs as cross-check; remaining locales from those catalogs with
the authority portals as arbiter where they exist. Record per-entry provenance. Every
downstream stage reads this file.

**Stage 4, machine translation of the remaining ~178 strings.** One batched LLM call per
locale (gpt-6-sol Batch at $1/$5 per 1M tokens: $0.20 total for 20 locales; gpt-6-luna Batch
if quality holds: $0.01) with the glossary and do-not-translate list in the prompt, plus one
sentence of app context. Azure Translator F0 (2M free characters monthly) as the second
engine for the cross-check pass. Never fetch at runtime; output lands in
`locales/<locale>.json` committed to git.

**Stage 5, verification gate.** Mechanical checks in CI: placeholder parity, ICU plural
categories via `Intl.PluralRules`, length budgets, glossary exact-match, echo-artifact scan,
RTL bidi scan. Statistical checks out-of-band: CometKiwi-22 advisory score per string
(laptop-runnable, CC-BY-NC noted as advisory), dual-engine round-trip with chrF plus LLM
judge on disagreement. Threshold policy: mechanical failures block; statistical flags route
to the owner's attention list, not to automatic blocking.

**Stage 6, correction loop.** Settings row "Report a translation mistake" deep-linking a
pre-filled GitHub issue with locale, key, current text and a suggestion field. Reports land
in the same pipeline as any other change, marked `verifiedBy: user-report`. Store listings:
Play's free machine translation plus the same LLM pass.

Produces: 20 locale catalogs and a provenance sidecar in git, guarded by CI, every string
carrying its engine, verification and date. One-off under $1 plus one glossary session;
recurring under $0.05/month at 20 changed strings. R2's own strongest counter-argument (the
gate's instruments share the translator's blind spot on religious text, so the 16+5 sourced
strings never enter the statistical gate) is carried by R2-FINDINGS.

## 2. The live MyMemory probe (R2 §3.2, 2026-09-29)

The 16 terms run through the free MyMemory translation-memory API — a memory engine, so it
shows what "the community's settled answer" looks like:

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

Readings: (1) prayer names survive as loanwords in Roman-script languages and transliterate
into Cyrillic — they are transliterations, not translations; (2) engines leave `Istijaba` and
`Duha` untouched rather than guessing, so "unchanged" must be a glossary whitelist, not a
failure heuristic; (3) the `Tengah malamMidnight` echo is the concatenation artifact a
placeholder/echo check catches; (4) `Changer athan` lost its article — acceptable for a
button, but "athan" belongs in the glossary as a fixed term. R2-FINDINGS carries the Suhoor/
Imsak offset trap from the same probe.
