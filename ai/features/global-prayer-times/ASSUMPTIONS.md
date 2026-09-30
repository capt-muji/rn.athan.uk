# Assumptions: every judgement made without the owner

The owner asked for autonomous work and for the assumptions to be listed clearly at the end. This is that list.
Each entry says what was assumed, why, what it would cost if wrong, and how to overturn it. The five most likely
to need correction are flagged **LIKELIEST TO BE WRONG**.

Nothing here is a decision the owner has taken. `RECOMMENDATION.md` is a recommendation, not a ruling.

---

## About the research itself

**A1. The research was widened from "which method" to "which source".** The owner asked which calculation method
is most accurate worldwide. The research found that framing does not survive contact with the evidence, because
national authorities publish timetables rather than methods, and the timetable is what their populations actually
pray by. So the research answered "where should a time come from" instead. If the owner wanted only a method
comparison, sections 5 and 6 of `FINDINGS.md` are surplus, though they are also where the most useful results are.

**A2. Moon sighting and the Hijri calendar were treated as out of scope.** Wave 1 studied the Moonsighting
Committee's *prayer-time* method; this wave is the prayer-time extension of it. The lunar calendar is a separate
subject. If the owner meant this wave to cover Hijri date determination too, it does not.

**A3. Qibla was treated as out of scope**, since rows 37, 40 and 41 own it.

**A4. Eight reports at 7,238 lines was judged the right depth.** The owner asked for deep research and for
multiple waves. Two waves of four agents were run, wave 2 shaped entirely by wave 1's gaps. A third wave was
judged to have diminishing returns against the open items, which are now mostly owner decisions rather than
research questions. The open items are listed in section "What a third wave would do" below.

**A5. Agents were pinned to Claude Opus 5 throughout, on the owner's instruction**, and after the owner's
intervention nested delegation was forbidden outright and the ban written into `BRIEF.md`. Wave 1's country agent
had delegated its regional tables to sub-agents and shipped a report with `(cluster tables inserted below)` where
53 countries should have been. R5 repaired it.

---

## About accuracy and what the app can claim

**A6. "Absolute accuracy" was interpreted as "provably faithful to a named authority", not as "correct in an
absolute sense".** The owner's stated thesis is accuracy. The research establishes that absolute accuracy does not
exist for Fajr and Isha, on the authorities' own testimony. Rather than report that as a failure, the research
reframed the goal as reproduction fidelity, which is measurable, verifiable and honest. **If the owner rejects
this reframing the whole recommendation changes**, because there would be no defensible source at all.

**A7. It was assumed the app should name its source to the user.** No competitor does this prominently. It is a
product judgement, made on the grounds that a reproduction claim is meaningless if the user cannot see what is
being reproduced. The owner may consider it clutter.

**A8. LIKELIEST TO BE WRONG. It was assumed per-prayer manual offsets are acceptable, despite the standing rule
that the app never invents a prayer time.** The reasoning is that a user-typed offset is the user's own choice
rather than the app's invention, and every serious competitor ships them as the answer to "my mosque differs".
**This is an owner ruling, not a research finding.** The owner has previously been strict about this rule, and
could reasonably say no. If the answer is no, the app has no answer for a user whose mosque differs, which is a
large share of users.

**A9. It was assumed the app should never claim to match a user's mosque.** Measured: nine central London mosques
disagree by 26 minutes on Fajr and 48 on Asr. No architecture bridges that.

---

## About the architecture

**A10. LIKELIEST TO BE WRONG. It was assumed that "offline" means "no network at prayer time", not "no network
ever".** The app already fetches a year and caches it, and the owner explicitly offered that shape ("if we can
follow the same approach of fetching the whole year and caching it and only doing it once a year, that'll be
great"). The recommendation rests on that reading. **But the owner also said "completely offline" and "I would
love it if there's no API involved at all".** R6 measured that a purely offline correction table expires: carrying
one year's residual to the next reproduces only 55.1% of values exactly. So a genuinely zero-network app must
either ship computed times (accurate to the library's presets, not to any authority) or ship a table that goes
stale. **If the owner wants literally zero network, the answer changes to "computed only, with the authority's
parameters", and fidelity to national timetables is lost.**

**A11. It was assumed a yearly fetch of an authority's own published times is compatible with "offline first".**
Same evidence as A10, and it is the interpretation under which the recommendation is strongest.

**A12. It was assumed `adhan@4.4.6` should be the computation engine.** R3 measured it and R7 attacked it. The
main risk is not accuracy but maintenance: three releases in 2026 after a three-year gap. R7 measured that the gap
changed 0 of 135,239 outputs, so the risk is future rather than present.

**A13. It was assumed shipping data derived from an authority's published timetable needs permission, and that
silence is not permission.** Eight of eleven authorities publish no terms. This is a legal judgement made without
a lawyer. A more aggressive reading would be that publicly published prayer times are facts and not copyrightable,
which is plausible in some jurisdictions and not others. **This alone could block the correction-table
architecture and it needs a real answer before any of it ships.**

**A14. It was assumed the six-constant model must never reach the screen.** It leaves up to 2 minutes of error,
which means displaying a number the authority never printed. Under the never-invent rule that is synthesis. The
model is still recommended as an offline integrity check. An owner who reads the rule more loosely would get a
much cheaper architecture, at 6 bytes per city instead of 282.

**A15. It was assumed Malaysia is the right second source to build against**, because it exercises zones, Imsak,
Duha, a documented Fajr policy and a keyless whole-year feed simultaneously. Singapore would be easier and would
prove less. This is a sequencing judgement and the owner may prefer to start where his users are.

**A16. It was assumed the computed library source should come LAST, not first.** This is the least intuitive
recommendation in the research. The reasoning is that library presets are the least authoritative option
(section 2 of `FINDINGS.md`), so building the architecture around them would bake in the weakest evidence.

---

## About the measurements

**A17. Angles were recovered by inverting authorities' published tables**, using an independently implemented USNO
solar algorithm validated against Egypt's own Cairo row to the minute. A recovered angle is what the table
implies, which is not necessarily the angle the authority believes it uses. JAKIM is the proof: its journal says
20 degrees and its own API implies 17.4 to 17.6.

**A18. Where R1 and R7 disagree, R7's figure is used**, because it inverted 22 cities where R1 inverted one. R1's
Egyptian 19.59/17.43 is superseded by R7's 19.51/17.49.

**A19. Where R1 and R2 disagreed on the Diyanet temkin, R5 resolved it by measurement and R2 was wrong.** The
7-minute offset is exactly 7 minutes at both 0 m and 1,900 m elevation, so it cannot be an elevation correction.

**A20. LIKELIEST TO BE WRONG. Population figures are compiled from mixed sources**, cross-checked against Pew's
own "1.3 billion, 65%" anchor to within a percentage point. The 38.5% / 29.9% coverage split is computed from that
compilation and is a planning figure, not a precise one.

**A21. It was assumed a 2-minute tolerance is the right bar for "reproduces the authority".** Chosen because
authorities publish to the minute and apply their own rounding. A stricter bar changes several category
classifications.

**A22. The OnePlus 3T performance figures are scaled estimates from an M1, marked UNVERIFIED in R3.** The
conclusion that performance is a non-issue survives any plausible multiplier, but the number needs one device run.

**A23. Azerbaijan's angles come from OCR of a WebP image.** The board publishes no machine-readable table. The
values are internally consistent across 30 days, but OCR is a weaker source than a parsed feed.

---

## What a third wave would do, if the owner wants one

Ordered by value. None of these blocks a decision; they sharpen one.

1. **Licensing: CLOSED by the owner, 2026-09-30.** R4 and R6 both stopped at the same wall, with one authority of
   eleven permitting commercial use and eight silent. The owner has since confirmed he corresponded with the
   authorities himself and has permission to use their data. **No session contacts anyone, drafts any letter, or
   gathers contact details, ever, without the owner asking for it first** (owner, 2026-09-30). The item is
   recorded as settled and is not re-opened.
2. **Close Pakistan and Afghanistan**, the largest NULLs. Pakistan is the second-largest Muslim population and its
   convention rests on a university with no findable publication.
3. **Measure the remaining tier-D states** the way Oman and Qatar were measured: Kuwait, Bahrain, Jordan, Algeria,
   Tunisia, Libya, Portugal. Two of the four Gulf constants measured so far were wrong.
4. **Test the correction model on a second category-4 candidate.** Only London is category 4, and it is the app's
   own source. One more would show whether hand-edited timetables are rare or merely rarely visible.
5. **Verify the residual-expiry result on a third authority year.** It is the decisive negative in the whole
   research and it rests on Singapore, Oman and the UAE.
6. **Resolve the JAKIM contradiction**, where the authority's journal and its own API disagree by 10 minutes.

---

## The decisions that are the owner's alone

Listed plainly, because none of them is a research question and each changes the build.

1. Does "completely offline" permit a yearly fetch? (A10, A11)
2. Are per-prayer user offsets allowed under the never-invent rule? (A8)
3. Is the app willing to ship data derived from authorities that publish no terms? (A13)
4. Is the reproduction claim, rather than an accuracy claim, acceptable as the product's promise? (A6, A7)
5. Which countries are in the launch set, and is Malaysia the right first non-London source? (A15)
6. What happens to existing London users, who would see different times under any computed source? (R8 section 6)
7. Which Asr does a user see by default, given that the app currently shows the Shafi one and documents it as
   Hanafi?
