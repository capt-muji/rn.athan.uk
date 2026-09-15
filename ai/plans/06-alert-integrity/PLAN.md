# Plan: Session 6. An alert always does what its bell shows (findings 79 to 82)

**Resume from:** section 2.2 onward. Sections 1 and 2.1 hold every owner decision. The design draft for findings 81
and 82, which still needs its independent review before their steps are written, is at
`/Users/muji/athan-device-sweep/session6/planning/DESIGN-81-82.md`. The scratch worktree is
`~/athan-device-sweep/worktrees/plan-6` at `b5159305`.

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/alert-integrity.md` |
| Planned at | not yet (planning in progress) |
| Planned by | Claude, planning session on 2026-09-15 |
| Needs first | nothing |
| Steps | 4, each one branch, one commit, one version (in progress) |
| Device | OnePlus 3T: Ramadan mock builds, a local production build, then the latest mock build |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Today five rare failures can leave a prayer's alert out of step with its bell, or leave the app stuck. Four are
findings 79 to 82; the fifth joins finding 81's step (decision 4).

- **79:** tapping an Off bell while notifications are refused can do nothing, because the "Open Settings" path never
  answers when Settings cannot open.
- **80:** in Ramadan, a start-up error can leave the splash over the error screen.
- **81:** switching a prayer Off when Android refuses one cancel puts the bell back to on while every other alarm,
  possibly the refused one too, and every reminder are already gone.
- **81, turning on:** switching a prayer on when the phone refuses one arm puts the bell back to its old setting while
  the alarms that did arm stay armed.
- **82:** one refused cancel frees the scheduling lock while other prayers are still arming, so a later change can land
  in the middle of them.

When this plan is DONE:
- every alert sheet change is all or nothing (bell and alarms together);
- the lock is held until every piece of scheduling work has ended;
- any start-up error lifts the splash onto the error page;
- the "Open Settings" path always answers, reading the permission once the user is back.

The owner notices only when one of these rare failures happens: a change the phone refuses puts the bell back where it
was, with its alarms matching it; a start-up error shows the error page and its Refresh button instead of a stuck
splash; and "Open Settings" always returns an answer.

The owner's rules that apply, quoted:
- `ai/prompts/alert-integrity.md`, 2026-09-15: "If I, as a user, see that the alert is the bell icon with a slash, then
  I know I'm not going to get notifications. If I have the bell icon, then I'm going to get notifications. If I have
  the sound icon, then I'm going to get notifications. It's as simple as that. If I turn it off, I expect it to turn
  off."
- The same brief: "Waiting for 'the next refresh' to heal a wrong state is not acceptable."
- Planning session, 2026-09-15: "If the alert fail to schedule, then I shouldn't have sound on. It should be sound off."
- `ai/prompts/alert-integrity.md`, the owner's decisions after session 5, item 80: "if there's an app error, we should
  always show the error page so that the user can actually reset, click the reset button".

## 2. Decisions

### 2.1 Taken

1. **79 is fixed with the small fix:** a failure to open Settings, or to read the permission, answers "no"; the
   permission is read when the user comes back. Owner, 2026-09-15 (after session 5), `ai/prompts/README.md`.
2. **80: any start-up error shows the error page.** Owner, 2026-09-15, `ai/prompts/README.md`.
3. **An alert sheet change (every at-time, reminder and interval change) is all or nothing, in both directions.** A
   failed arm when turning on and a refused cancel when turning off both undo the whole change, bell and alarms
   together. A refused Off change therefore shows the bell on again, with that setting's alarms re-armed: the owner put
   a truthful bell above the Off tap taking effect. If the phone refuses the undo too, the app tries again at the next
   launch, return to the app or background run. This was explained to the owner as a limit of the phone, the one case
   where the state waits for a later event, and the owner confirmed the all-or-nothing rule. Owner, 2026-09-15 (this
   planning session), `ai/prompts/README.md`.
4. **Both directions are fixed in session 6, inside finding 81's step.** Owner, 2026-09-15, `ai/prompts/README.md`.
5. **The athan sound change's matching gap becomes its own session later, not fixed here.** Owner, 2026-09-15,
   `ai/prompts/README.md` and `ai/plans/README.md`.
6. **79 is proven on the 3T with the owner's hands:** the owner unlocks the phone and flips Athan's notification switch
   when asked. Owner, 2026-09-15, `ai/prompts/README.md`.
7. **The 3T ends on the latest `uat-2` as a mock build with the Asr-next mock data.** Owner, 2026-09-15,
   `ai/prompts/README.md`.

### 2.2 The executor must not decide

In progress.

## 3. Pre-flight

In progress.

## 4. Background the executor needs

In progress.

## 5. Design

In progress.

## 6. Steps

In progress.

## 7. Device proof

In progress.

## 8. Records

In progress.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

In progress.

## 11. Subagents in this plan

In progress.

## 12. Report to the owner

In progress.
