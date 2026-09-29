# Where the five reports disagree, and how the plan resolves each

Five independent reports on the same problem produced three real conflicts. Each is resolved here
with the reason, rather than averaged or left for the executor.

## Conflict 1: in-app picker, or the OS language setting only?

| Source | Position |
| --- | --- |
| **Owner, decision D8** | A settings row with an icon and a chevron, opening a language sheet |
| R4 | In-app picker, plus mirroring the choice into the platform per-app setting |
| R5 | **No in-app picker.** Let the OS own the locale, so the process restarts on change and every runtime problem becomes a launch-time problem |

R5's argument is genuinely strong engineering. No picker means no live re-render, no mid-session
notification re-arm, no widget re-push, no RTL restart question, and `t()` becomes a module-level
read of a locale fixed at bootstrap. It calls the picker one of the three most expensive decisions
to reverse.

**Resolution: the owner's ruling stands. Build the picker.**

The reasons are not that the owner said so, though that would be sufficient under this programme's
rules. They are:

1. **R5's premise fails on the floor device.** Per-app language settings are Android 13+ and
   iOS 13+. The app's floor device is a **OnePlus 3T on Android 9**, which has no per-app language
   screen at all. Under an OS-only design, that user can only change the app's language by changing
   their whole phone's language. For an app whose audience includes users whose device language is
   not their reading language, that is a hard failure, not a trade.
2. **R4's counter-argument is about discoverability, and it is decisive for this audience.** A user
   who cannot read English cannot navigate an English OS settings screen to find the app. An
   endonym-labelled in-app list (`العربية`, `বাংলা`) is readable without knowing any English.
3. **The cost R5 fears is much lower here than in general**, because of two findings that landed
   after its brief was written: owner decision D7 pins the layout LTR, so there is **no direction
   flip and therefore no restart** (R3); and the notification re-arm needs **no cancel pass**
   because the identifiers are deterministic and a reschedule replaces in place (R4, R5's own
   section 4.2 agrees).

So the expensive parts of the picker are already paid for by other decisions. What remains is a
Jotai atom and a re-render, which is R5's own option 2 and which it calls "the repo-native pattern
if a switcher ever lands".

**What the plan takes from R5 anyway:** mirror the choice into the platform per-app setting where
the OS supports it, so the two never disagree (R4 recommends the same), and keep the switch path
off the animation path.

## Conflict 2: one grow-only column width, or per-locale widths?

| Source | Position |
| --- | --- |
| R5 | **Keep the single grow-only max.** A locale change is just another late wider measurement, which is what the mechanism is for |
| R3 | Per-locale measured column, ranked first of five strategies |
| This session (`WIDTH-EVIDENCE.md`) | Per-locale, because the widen-only cache can never shrink |

R5's argument: the grow-only cache exists because a first-launch measurement can precede font
registration (ISSUES #22), and per-locale keys would need a reset and remeasure on every language
change, which is a visible reflow plus a new key family in the `clearAllExcept` whitelist, which
`ai/AGENTS.md` records as a known trap.

**Resolution: per-locale, and R5's objection is answered by the measurement it did not have.**

R5 treats the accepted cost as "a user whose locale renders narrower than English keeps the
English-width column". The measured numbers make that cost far larger than it assumed:

| Locale | Extras column vs English |
| --- | --- |
| Swahili | 2.83x |
| Indonesian | 2.57x |
| German | 2.43x |
| Arabic | **0.85x** |
| Chinese standard column | **0.60x** |

Under one global grow-only max, a user who ever renders Swahili keeps a **226pt** column forever.
An Arabic user who briefly tried Indonesian keeps a column 2.4 times wider than their own names
need, permanently, with no way back. On a 360dp phone that is 71% of the row spent on empty space.

That is not a narrow-script user keeping a slightly wide column. It is a permanent, unrecoverable
layout defect triggered by trying a language once.

R5's two concerns are handled rather than dismissed:
- **The reflow**: the measurement already happens in a mounted, invisible `Text` pair
  (`InitialWidthMeasurement`), so a locale change remeasures in the same frame path as launch. The
  ISSUES #22 race is about font registration at first launch, which a later locale change is past.
- **The whitelist trap**: the plan names the new key family explicitly and adds it to both
  `clearAllExcept` keep-prefix lists, with a test, because `stores/__tests__/database.test.ts`
  already pins that list.

## Conflict 3: natural-language keys or structured keys?

| Source | Position |
| --- | --- |
| R5 | **Structured keys** (`settings.sound.changeAthan`) |
| R1 | Hand-rolled catalog, key style left open |
| R2 | Assumes i18next conventions, which default to structured |

**Resolution: structured keys**, on R5's three repo-specific grounds, the second of which is
concrete and decides it:

1. Test stability under a 4,800-test pre-commit suite: an English copy edit should not touch tests.
2. **There is already a collision.** `Alert.tsx` uses `Off`, `Silent` and `Sound`, and those words
   need different translations in other languages depending on what they qualify. A natural-language
   key cannot express that; a structured key can.
3. English copy becomes free to edit, since the key does not change.

## Non-conflicts worth recording, because they look like conflicts

**Library choice.** R1 says no library; R2 and R5 assume i18next. Resolved in `R1-FINDINGS.md` and
`R5-FINDINGS.md`: R5's substantive findings are library-independent, and R2's tooling
(`i18next-cli`) operates on `t()` call sites and i18next-shaped JSON catalogs, which a hand-rolled
`t()` can produce. The plan takes R1's runtime with R2's tooling.

One refinement R5 forces: it shows **TypeScript catalog modules beat JSON on Hermes**, because
precompiled bytecode loads faster than a runtime parse. So the catalogs are `.ts` with `as const`,
and any `i18next-cli` integration works against an exported JSON view rather than the source of
truth. That is a small cost and it buys `keyof typeof` key safety for free.

**Whether notification copy can localise at delivery.** R5 and this session's own source reading
agree: iOS has the mechanism but `expo-notifications` does not expose it, and Android has none for
scheduled local notifications. No conflict, two independent confirmations.

**Plural machinery.** R1 wants a generated table with a canary; `PLURAL-EVIDENCE.md` measured that
the app has **no string that selects a plural form**, because every count-bearing string uses an
abbreviated unit (`in 5m`, `6h 8m`). No conflict once measured: ship no plural machinery, ship the
guard that detects the day one is needed.
