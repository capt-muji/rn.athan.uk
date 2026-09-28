# What R2 settles: the owner can ship 20 languages without a reviewer

R2 (`research/R2-TRANSLATION-PIPELINE.md`, 408 lines) answers the question the owner posed:

🐋  "Do we really have to have a human reviewer review every single language? Because I don't know
any language... I'm just myself, me, myself and I."

The answer is no, with a caveat that turns out to be cheap.

## The central insight: split the catalog in two, and only one half needs care

R2's argument is that this app's copy is not one translation problem but two, with different risk
profiles and different processes:

| Track | Count | Risk | Process |
| --- | --- | --- | --- |
| Religious vocabulary | 16 terms, plus 5 explanations | Doctrinal. A wrong term is a real defect | Sourced from citable authorities, never machine-translated. Data entry with a provenance field |
| Ordinary UI copy | about 178 strings | Cosmetic. A clumsy "Settings" is survivable | Machine translated, guarded mechanically |

The 16 terms never pass through a translation engine at all. They become **data with a cited
source**, which is checkable by someone who does not speak the language, because the check is
"does this match what Diyanet publishes" rather than "does this read well".

That is the whole answer to the owner's problem. The strings that need a native speaker are
reduced to a fixed set of 16 that already have published authorities, and the strings that are
left are the ones where machine translation is normal industry practice.

## The money is not the constraint

- 194 strings is about 4,500 English characters. Twenty languages is 90,000 characters.
- Google list price: **$1.80** for the whole catalog.
- Azure's free tier: 2M characters per month, which covers this catalog **22 times over**, so **$0**.
- Batched LLM translation: **$0.01 to $0.20** total for 20 locales.
- Recurring, at 20 changed strings a month: **under $0.05**.

The earlier worry that 20 languages implies a translation budget is simply wrong at this scale.

## R2's live engine probe: the failure modes are real and specific

R2 ran actual strings through an engine rather than theorising. What it found, and why the
glossary is load-bearing:

| Term | Engine output | Why it matters |
| --- | --- | --- |
| Midnight (Indonesian) | `Tengah malamMidnight` | A duplicated echo artifact. Mechanically detectable |
| Istijaba (German) | unchanged | Correct, but indistinguishable from a failure |
| Duha (French) | unchanged | Same |
| Suhoor (Turkish) | `Sahur` | Correct, and only verifiable against Diyanet |

The third row is the subtle one. An engine that leaves "Istijaba" untouched is behaving correctly,
because there is no German word for it. But a naive "unchanged means the engine failed" heuristic
would flag it, and a naive engine that DID guess would produce something wrong that looks fine.
Only a glossary that says "unchanged is correct here" distinguishes the two.

R2 also names the Suhoor trap precisely: engines conflate **Suhoor** (the meal) with **Imsak** (its
end), and Turkish apps display İmsak where English apps display Fajr. That is an offset by
definition, not a translation choice, and it has to be recorded per locale.

## The licence-checked source for the 16 terms

R2 found real catalogs and checked their licences, which was the single most valuable artefact
asked for:

| Source | Licence | Languages | Covers |
| --- | --- | --- | --- |
| Mihrab (`github.com/MihrabHQ/Mihrab`) | AGPL-3.0 | 13 | 6 prayer names, Midnight, Last Third, Suhoor |
| Al-Azan (`github.com/meypod/al-azan-compose`) | AGPL-3.0 | 14 | adds Tahajjud, Swahili, Korean, Vietnamese, Bosnian |
| Diyanet (Turkey) | State authority | tr | Official Turkish prayer vocabulary |
| Kemenag (Indonesia) | State authority | id | Imsakiyah schema, covers Imsak |
| JAKIM e-Solat (Malaysia) | State authority | ms | Lists Duha as a displayed time |

**The AGPL point matters and R2 handles it correctly.** Copying a catalog wholesale from an AGPL
repository into a closed-source app is inadvisable. R2's resolution: the 16 terms are short
factual vocabulary that each language settles independently, so the AGPL repos are used as a
**cross-check** while the state authority portal is recorded as the source of truth in a
provenance field. That is the conservative reading and it is the one the plan adopts.

`Istijaba` has no standard rendering in most languages, which confirms the owner's own instinct:

🐋  "Istijaba, the prayer that appears only on Fridays, doesn't actually have a direct translation."

R2's answer is the design the app already uses in English: transliterate the label, and let the
explanation string carry the meaning.

## The CI guard exists off the shelf, but not for Biome

`i18next-parser` is **deprecated and its repo was archived on 2026-02-22**. Its successor
`i18next-cli` (1.74.1, MIT, active) gives three failing CI checks:

- `extract --ci` fails when a new string landed with no catalog entry.
- `status` fails when a target locale is missing keys.
- `lint` with `checkConcatenation: 'error'` fails on a concatenated sentence, which is the thing
  that cannot be reordered into Arabic or German word order.

That drops into `yarn validate` and the existing pre-commit hook with no new infrastructure. This
matters because `ai/AGENTS.md` forbids new patterns where an existing one fits, and this is an
existing chain.

**Open question R2 does not close:** this repo uses Biome, not ESLint, so `eslint-plugin-i18next`'s
`no-literal-string` rule is unavailable. R5 was asked to research the Biome equivalent. If there
is none, the guard is `i18next-cli`'s own checks plus a Jest test, which is acceptable.

## Pseudolocalization is the answer to the width problem

R2 independently identifies the same risk `WIDTH-EVIDENCE.md` measured, and names the cheap tool:

- Generate a pseudo-locale at **140% expansion** (Microsoft's documented heuristic for English
  sources) and render every screen against it.
- Generate an **RTL pseudo-locale** to exercise the direction handling before Arabic ships.
- Both run as plain Jest tests against a generated catalog, so they need no device and no
  translator.

This is strictly better than what this session had planned, because it catches layout breakage
**before any real translation exists**, which means the width guard can land in the cheap D4a half
rather than waiting for catalogs.

Lingui 6.7+ ships pseudolocales including an RTL one; `pseudo-localization` 3.1.3 (MIT) is the
standalone.

## Verification without a reader: what actually works

R2 ranks the techniques honestly and draws a line the plan adopts:

**Mechanical checks, which BLOCK a build:**
- placeholder parity (`{{count}}` survives)
- ICU plural categories present per locale, via `Intl.PluralRules`
- length budget per string (this is the width guard)
- glossary exact-match for the 16 terms
- echo-artifact scan (the `Tengah malamMidnight` class)
- bidi scan

**Statistical checks, which ADVISE only:**
- CometKiwi-22, a reference-free quality estimator, laptop-runnable, but **CC-BY-NC licensed**, so
  it can never be part of a shipped or commercial build step. Advisory only, which the licence
  permits.
- A dual-engine round trip with chrF, and an LLM judge on disagreement.

The split is right: a mechanical check has no false confidence, and a statistical one does.

## R2's own strongest counter-argument, which the plan must carry

R2 attacks itself correctly:

> The verification stage measures translation quality with instruments that have the same blind
> spot as the translator. CometKiwi and LLM judges are themselves weak on religious and
> metaphorical language, so the gate can pass a subtly wrong "Last Third" in a low-resource
> language, and no mechanical check catches a wrong-but-well-formed religious term.

Its mitigation is the two-track split: the 16 terms never enter the statistical gate, because they
are sourced data rather than model output.

**But R2 then finds a hole in its own mitigation, and this is the finding the plan must act on:**
the five EXTRAS_EXPLANATIONS strings ("Halfway between Magrib and Fajr", "1 hour before Magrib,
Fridays only") are doctrinally adjacent, so they belong in the glossary track too, not the machine
track. That moves the sourced set from 16 terms to **21 strings**, and it is the right call.

## What this changes in the plan

1. The glossary is a first-class artefact with per-entry provenance (`source`, `date`), not a
   footnote. 21 strings, sourced, cross-checked, and pinned by a test.
2. Pseudolocalization lands in the D4a scaffolding half, before any catalog exists, because it is
   the width guard and the width guard is this session's named risk.
3. `i18next-parser` is dead. Any plan naming it is wrong; `i18next-cli` is the tool.
4. The verification gate is two-tier, and the tiers must not be mixed: mechanical blocks,
   statistical advises.
5. The owner's "report a translation mistake" instinct is confirmed as the correction loop, with
   R2's scope fix: it is the loop, never the initial gate. Both Al-Azan and Mihrab demonstrably run
   translation fixes from GitHub issues, so the pattern is proven at this scale.

## Where R2 and R4 disagree on the launch set

R2 proposes a broad set weighted to raw speaker counts. R4 proposes 8 weighted to Muslim-population
overlap (`en ar id ur bn tr fr de`). R4's reasoning is better for this app and its sourcing (Pew
2025) is stronger. The plan takes R4's set and R2's pipeline.
