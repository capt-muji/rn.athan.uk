# Assumptions made unattended, session 41

The owner asked for these explicitly: 🐋  "Work autonomously and in a loop, do not ask me any questions, make
assumptions... list me your assumptions that you've made."

Every judgement this session took without asking is here. The five most likely to need correction are flagged
**REVIEW**, because they are where an owner ruling would change what gets built.

## A. Scope and sequencing

| # | Assumption | Why | Risk |
| --- | --- | --- | --- |
| A1 | **This session is row 41, not row 38.** | The owner named the subject: 🐋  "something to do about maps and tiles". Row 41 is the map row and its dependency (row 40) is DONE. Row 38 was next by queue order. | Low. The owner named it. |
| A2 | **This session is PLANNING only, and stops before execution.** | The owner said 🐋  "Begin the next session, which is a planning session". | Low |
| A3 | **No device work happens this session.** | The owner confirmed the Samsung Galaxy S23, the OnePlus 3T and the OPPO Find X8 builds are already done, and only the iPhone XS is connected. No Android device is on `adb`. | Low |
| A4 | **Row 41 is researched as "how does the user verify the direction", not "how do we ship a map".** | The map is the owner's proposed MEANS. The END is a direction the user can trust. Narrowing to the means this early is how sessions 37 and 40 each shipped correct code that missed the goal. **REVIEW** | Medium. If the owner wants a map specifically and nothing else, the research is wider than asked. It is not wasted either way, because the map is still one of the options under study. |

## B. Constraints, as I have applied them

| # | Assumption | Why | Risk |
| --- | --- | --- | --- |
| B1 | **Bundle size is recorded but never a reason to reject an option.** | The owner's ruling mid-session: 🐋  "stop worrying about the size... Let's just try to get something working." | Low. Quoted verbatim in `BRIEF.md`. |
| B2 | **"No API key, no tile server, no network" still binds, and was not relaxed with size.** | The two are separate rulings. The offline rule is about what the app IS (🐋  "a completely on the phone app"); size was about how big it may be. | Low |
| B3 | **A ONE-TIME download, at install or first run, is worth researching but is an owner decision.** | It satisfies "works offline in use" while breaking "works offline always". R1 analyses it and flags it rather than assuming an answer. **REVIEW** | Medium. This may be the difference between a feature that fits and one that does not. |
| B4 | **The 60fps ruling from row 37 does not bind a static map the way it binds a turning dial.** | A dial redraws while the needle moves. A map that draws once and does not animate pays its cost once. The distinction is real but it is mine, not the owner's. **REVIEW** | Medium. If the map rotates with the phone, the ruling binds fully again. |
| B5 | **Adding a native dependency is permitted if it is the only thing that works.** | `ai/AGENTS.md` says no new dependencies without approval, and the owner is unavailable. Research proceeds on all options; the PLAN will name the dependency as an owner decision rather than assuming consent. | Low, because it defers rather than decides. |

## C. Technical judgements

| # | Assumption | Why | Risk |
| --- | --- | --- | --- |
| C1 | **The human error terms in `P0-error-budget.md` (0.5, 2, 3, 5 degrees) are engineering estimates, not measurements.** | No published figure was found for "transferring a screen angle to your own body". Flagged in the report itself. The comparison it feeds survives all four terms doubling. **REVIEW** | Medium. R4 is tasked with replacing them from the literature. |
| C2 | **Everything session 37 and 40 settled stands and is not re-derived.** | The bearing maths, the position tolerance, great-circle over rhumb-line, the permission requirement, the field-strength check, the iOS reference frame. R5's settled-findings register makes this checkable. | Low |
| C3 | **The existing dial is not deleted by this row.** | It is a working presentation with a measured 16.7 ms frame gap. A second presentation can be added beside it. Whether the dial survives to release is an owner decision. | Low |
| C4 | **`readPosition` and the permission flow are reused unchanged.** | They work, they are tested, and `device/qibla.ts:65` already reads at Balanced accuracy for the documented reason. A map needs the same position the dial needs. | Low |
| C5 | **A magnetometer-free presentation is the target, not a better magnetometer.** | Session 40 already used the best heading the OS offers and the room still won. Another sensor pass repeats it. | Low. This is the row's own premise. |

## D. Process

| # | Assumption | Why |
| --- | --- | --- |
| D1 | **Five research subagents on GLM 5.3 Max, despite the standing ban.** | The owner overrode it for this session: 🐋  "I want you to deploy 5 subagents, simultaneously, alongside your own research... using the GLM 5.3 max model." The ban in `ai/AGENTS.md` and the three briefs is otherwise unchanged and returns next session. |
| D2 | **I research alongside them rather than only coordinating.** | The owner asked for both: 🐋  "do your own heavy, heavy research, okay? And I want you to deploy 5 sub-research agents". `P0-error-budget.md` is my own work. |
| D3 | **An honest negative verdict is an acceptable outcome of this session.** | The owner's standing ruling on the feature: 🐋  "I would rather not offer this feature at all" than point people wrong. R5 is explicitly authorised to recommend cancelling the row. |
| D4 | **The research lands as committed documents before any PLAN.md is written.** | Row 39 set the precedent: research complete, `PLAN.md` deliberately unwritten until the owner's rulings land. Rulings this row is likely to need are collected in `PROPOSALS.md`. |
