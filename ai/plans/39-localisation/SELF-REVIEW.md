# Attacking this session's own conclusions

`ai/AGENTS.md` requires attacking your own work from a different angle before anyone else sees it,
and `PLANNER-BRIEF.md` section 3 item 11 requires reading the plan cold as a stranger. This is that
pass, written before the plan itself, so what it finds changes the plan rather than annotating it.

Each section states the conclusion, the strongest attack on it, and the verdict.

---

## 1. "No i18n library" is the recommendation most likely to be wrong

**The attack.** Every large app uses a library. The spike proved 20 lines work for 5 keys, which is
not evidence that a hand-rolled solution survives 113 strings, 8 locales, a settings UI, a
notification re-arm and three years of maintenance. Libraries carry fourteen years of edge cases:
context, nesting, fallback chains, interpolation escaping, missing-key reporting. The moment the
owner wants a translation-management system with a web UI, i18next has integrations and a
hand-rolled catalog has none.

**The counter.** Three things hold the recommendation up, and only the third is really load-bearing:

1. The measured plural surface is zero, which removes the 46 KB polyfill every library needs to be
   correct in Arabic.
2. The repo's 100% coverage bar makes a library's uncovered branches an active cost.
3. **The migration path is cheap and was designed in.** R1's fourth mitigation keeps catalogs
   one-to-one with i18next resources, so adopting i18next later is a dependency install and a `t()`
   swap, not a rewrite.

**Verdict: the recommendation stands, and the reason is reversibility rather than superiority.**
The plan must state the crossover conditions explicitly so a later session knows when to switch:
a real plural string, a language count past roughly 40, or a TMS entering the picture.

**What I got wrong and have fixed:** I initially presented this as "the library is unnecessary". It
is better stated as "the library is not yet necessary, and the catalog shape keeps it one afternoon
away". That is a materially weaker and more honest claim.

---

## 2. The two-setting model may be over-engineering

**The attack.** The owner asked for one language picker. I have proposed two settings, one of which
opens a sub-screen with two more choices inside it. That is three decisions where he asked for one.
Most users will change nothing. The deadlock he found may be an edge case affecting a tiny minority,
and solving it with a second setting taxes everyone.

**The counter.** The deadlock is not an edge case: it is the app's CURRENT default configuration.
Today every user has English interface plus Arabic prayer names. Under one setting, that
configuration becomes unreachable, so shipping one setting would break the default experience for
the entire existing user base. The second setting is what preserves what already ships.

**Verdict: stands.** But the attack sharpens the UI requirement. The second setting must be
invisible to a user who does not care: a single row showing the current pair, with sensible
defaults, that nobody has to open. It must not read as a form.

---

## 3. The width problem may be solved in the wrong layer

**The attack.** I recommend fixing over-long names in the catalog (authoring "Sepertiga Malam
Terakhir" shorter) rather than in the layout. That pushes a layout constraint onto translation data,
which means every future language needs someone to know about a pixel budget, and the "correct"
translation may be rejected for being too long. That is a design smell: data bending to
accommodate a rigid view.

**The counter.** The alternative is worse in this specific app. The row height is fixed at 57, the
overlay anchors boxes off measured absolute coordinates, and row 36 has already shown how delicate
that machinery is. Wrapping changes row height and moves every anchored box.

**Verdict: stands, but the framing was wrong and I have corrected it.** The honest statement is not
"shorten the translations". It is: **the prayer-name column has a width budget, the budget is a
real product constraint, and a name that exceeds it needs a decision** which may be a shorter form,
a smaller font for that locale, or accepting a wider column. The automated guard's job is to
surface the decision, not to force a particular answer.

**A genuine gap this exposes:** I have not established what the budget IS. The plan must derive it
from the narrowest supported screen minus the time column, the bell and the padding, rather than
asserting a number. That is a measurement the execution session can make, and the plan names it.

---

## 4. "Per-glyph font fallback already works" may be over-generalised

**The attack.** The evidence is that Arabic renders today with Roboto requested. That proves
fallback works for **Arabic, on the devices the owner has tested, in the app's current text sizes**.
It does not prove Thai renders on a OnePlus 3T running Android 9, or that Bengali conjuncts shape
correctly, or that a 2016 Chinese ROM carries a Devanagari font. I generalised from one script to
twenty.

**Verdict: the attack is correct and the claim was too strong.** What the evidence supports is:
fallback is the mechanism the app already depends on, so using it for more scripts is not a new
class of risk. It is not proof that every script renders.

**Fixed:** the plan carries a per-locale device check on the 3T as an acceptance criterion, not a
desk assumption, and `ASSUMPTIONS.md` B6 is marked medium confidence for this reason.

---

## 5. The RTL amendment may be me overriding the owner

**The attack.** He said "left align it exactly like English". I have written a plan that
right-aligns RTL text. However well-reasoned, that is a planning session substituting its judgement
for an explicit ruling, which `PLANNER-BRIEF.md` forbids.

**The counter, and why I think this one is defensible:**

1. He explicitly invited it: "If you have other alternatives, just tell me, don't implement them."
   So it is REPORTED in `PROPOSALS.md`, flagged in `ASSUMPTIONS.md` as C1 with CHECK, and nothing
   is built.
2. His stated CONCERN was layout: "it becomes a nightmare to handle the layout", "the app is not
   built in that way". The amendment does not touch layout. Zero of the 63 directional props, 32
   absolute views or 30 measurement sites change.
3. **The app already does the amendment.** `Explanation.tsx` ships `textAlign: 'right'` for its
   Arabic text today. A literal reading would require DELETING that line and making the shipped
   Arabic worse.

**Verdict: reporting it is correct; building it without his word would not be.** The plan is
written so this is a one-line switch either way, and the plan says which line.

---

## 6. I may be understating the total size of this work

**The attack.** The language reads as though this is manageable: 113 strings, a `t()` function, some
catalogs. But the honest inventory is: an identifier refactor touching 26 sites across 4 systems, a
113-string migration across 29 files, a new settings screen, a new sheet, a notification re-arm
path, a widget prop change, per-locale width caching, bidi handling, per-script line heights, a
translation pipeline with CI gates, a sourced glossary, and 8 locales of content. Row 38 alone is
12 to 18 commits.

**Verdict: the attack is right, and it is the most useful finding in this review.** The plan must
not present this as a small feature. Two consequences:

- `SPLIT.md` already says row 38 is "the careful one, not the quick one". That needs to be the
  headline of the plan, not a closing remark.
- The owner should know before execution starts that this is the largest single feature in the
  queue since the widget work, and that it touches notification scheduling, which is the app's most
  safety-critical path.

---

## 7. What I have NOT verified, stated plainly

Honesty requires listing what remains unproven, because several conclusions rest on it:

| Claim | Status |
| --- | --- |
| Hermes lacks `Intl.PluralRules` | R1's claim, corroborated by the RN build flag's framing. **Not verified on device.** A one-line probe settles it |
| An Android channel renames in place | Two documentary sources agree. **Not verified on the 3T.** This repo has been burned by documented-but-untrue Android behaviour before |
| Non-Latin scripts render on the 3T | **Not verified.** See section 4 |
| The translated widget payload fits | Estimated at 6% of the guard from name bytes only. `dateLabel` is excluded from the estimate |
| The prayer names in `WIDTH-EVIDENCE.md` | A working set assembled for the width question, **not a sourced catalog.** R6 is producing the sourced one, and the widths will move |
| Bundle size and startup cost | **Not measured.** No claim is made about either |

None of these blocks the plan. All of them are named experiments in it.

---

## 8. The one thing I would change if I started again

I spent effort on the translation pipeline and the language set, which are interesting and
well-sourced, before I had measured the identifier problem. The identifier split is the finding that
actually decides whether this feature is safe, it was discoverable in the first ten minutes with a
grep, and it is the thing most likely to cause a silent production failure.

The lesson for the plan's ordering is the same one: **do the structural, irreversible, silent-failure
work first**, and treat the content pipeline as the part that can be iterated in public.
