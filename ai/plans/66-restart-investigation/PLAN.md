# Ticket 66: language switch always restarts, the investigation

| Field | Value |
| --- | --- |
| Brief | Queue row 66, owner ask 2026-10-12: investigation only, no code changes in this row |
| Planned at | uat `29eb2dee`, version 2.0.179, 2026-10-13 |
| Planned by | Planning session 2026-10-13 (owner away; her rulings are the brief and the queue records) |
| Needs first | nothing: 61 DONE 2026-10-12, 68 DONE 2026-10-13 |
| Parent | none |
| Group | none: produces findings only, touches no code |
| Batch budget | 3 |
| Session budget | 3 |
| Steps count | 3 |
| Device | none |
| Owner decisions still needed | the final ruling on the recommendation; the ruling list closes section 4 of FINDINGS.md |

## 1. Goal

The owner asks for a deep discussion and investigation into ALWAYS restarting the app on any
language change (not only RTL, per D59): clear caches (the per-locale width cache her Somali
wrap report also touches), keep preferences, converge notifications and widgets, restart last
as a force-clean. Weigh pros, cons and side effects, and end with options and a recommendation;
the owner rules. The row may revise D59 (absorbing the RTL-only restart) and D51's timing.

DONE when `FINDINGS.md` in this folder answers the question with a citation under every
load-bearing claim, and the row ends at the option set, the recommendation and the ruling
list. No code changes: the whole ticket's diff on `uat` is docs.

The owner's rules that apply, quoted with their source:

- "INVESTIGATION ONLY: the row ends with options and a recommendation, the owner rules."
  (queue row 66)
- "May revise D59 (absorbing RTL-only restart) and D51's timing." (queue row 66)
- D59, TAKEN 2026-10-11 (queue row 58): restart on RTL switch, because Fabric treats direction
  as launch-time; landed at `stores/language.ts:77-89`.
- D51 (job 39, `OWNER-DECISIONS.md` line 621 in git history at `5130a7de^`;
  `stores/language.ts:27`): the switch's progress face is an in-sheet blocking row; the sheet
  dismisses itself once the surfaces converge.
- "AUDIT 57 CARRIED: the countdown display selectors' one-second old-locale transient after a
  switch (job 57 audit finding 5) joins this row's evidence." (queue row 66)

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D84 | The row is investigation only: the whole ticket's diff on `uat` is docs (queue row 66). | planning | 2026-10-13 | this section |
| D85 | `FINDINGS.md` in this folder is the only deliverable. At DONE the lead folds the cache inventory, the cost table and the recommendation into the row's final queue cell, so any follow-up row carries the findings without the file (the shape row 65 used). | planning | 2026-10-13 | this section |
| D86 | No new device work. Rows 57, 61, 68 and 71 recorded the device evidence this row needs (the relaunch measurement, the teardown exception, the width heal, the transient); their queue cells and audit commits are citable records. A question only a new device run can answer goes to the ruling list instead. | planning | 2026-10-13 | this section |
| D87 | Every load-bearing claim cites file:line at the Planned at sha or a queue record. A claim neither source can carry is marked unverified in `FINDINGS.md` and names the check that would settle it. | planning | 2026-10-13 | this section |

### 2.2 The executor must not decide

- Recommending before the evidence lands: the recommendation cites `FINDINGS.md` sections 1
  to 3 by number.
- Running device work of any kind (D86).
- Revising D59 or D51 in any record: the row proposes; the owner rules.
- Relaying a ruling-list item to the owner mid-run: the stop-and-ask question in every case
  is the ruling list of `FINDINGS.md` section 4, relayed by the lead.

## 3. Pre-flight

`scripts/preflight-66.sh`: uat checkout, clean tree, origin/uat merged, version at or above
the Planned at version, the seven anchors each counting 1. Ends `PREFLIGHT OK`. The executor
saves a copy to `$TMPDIR` and runs it from there.

## 4. Background the executor needs

Planning verified every claim below at uat `29eb2dee` (codegraph reads, then the anchor
extraction under `scripts/anchors/`). The file:line here is the expected content of
`FINDINGS.md` sections 1 and 2; a line that no longer matches is the section 10
contradiction row.

| Group | Files | Role |
| --- | --- | --- |
| The pick | `components/sheets/screens/Language.tsx:44`, `components/sheets/screens/languageSheet.ts:18-31` | The row tap calls `pickLanguage`; a changed locale commits, then the dismiss is unconditional (forward-only, D34 and D47). |
| The commit | `stores/language.ts:65-93` | `commitLanguagePreference`: stores the preference, `setActiveLocale`, awaits `reconcileLanguageSurfaces`, then restarts only on a direction change (D59): `I18nManager.forceRTL` and `Updates.reloadAsync()` at :83. The busy atom brackets the run (:72, :91). |
| The remount | `shared/i18n/locale.ts:48-52`, `app/_layout.tsx:85-92` | `setActiveLocale` bumps `localeVersionAtom`; the layout keys `InitialWidthMeasurement` (:90) and `Slot` (:92) on it, so screens and width measurement remount in place, while `SheetHost` (:93) stays mounted so the D51 face survives the apply. This is the remount the brief calls the status quo. |
| The width cache | `stores/ui.ts:114`, `stores/ui.ts:122-131`, `stores/ui.ts:249-263`, `components/ui/InitialWidthMeasurement.tsx:19-40` | Per-locale keys `prayer_max_name_width_<locale>_<side>` default 0 and widen only (`setNameWidth` rejects narrower writes); hidden Texts measure every name and remount with the key. Row 61 healed the reserve to the widest rendered label. |
| The channel caches | `shared/notifications.ts:430-448` | Three session dedup caches for Android channel creation; `resetAndroidChannelCaches` clears them so the switch re-creates channels under frozen ids. |
| The convergence | `stores/language.ts:37-49`, `stores/notifications.ts:1672-1673` | `reconcileLanguageSurfaces` bails when the stamp matches, clears the channel caches, takes the scheduling lock and runs `rescheduleAllForLanguageChange`, whose `deferWidgetRefresh: false` awaits the widget push inside the pass. The stamp writes only after a real pass (:45), so the next launch or foreground retries. |
| The widget push | `stores/widget.ts:237-256`, `stores/widget.ts:345-389`, `shared/widgetTimeline.ts:62-71`, `shared/widgetTimeline.ts:304-355` | `refreshPrayerWidgets` pushes both schedules and arms the native minute chain (:247); the snapshot bakes `t()` strings, localised digits and the `rtl` stamp (:350, :353). The foreground path (`stores/notifications.ts:1652-1662`) defers the push past a paint instead. |
| The launch path | `app/index.tsx:115-130`, `device/listeners.ts:70-74`, `app/_layout.tsx:7-10` | The init effect latches one pass per process (:117-119), reopens the refresh gate (:124), initializes notifications, then runs the same convergence (:129-130); the foreground listener retries a switch that died mid-apply (:73). This is the reconciliation a restart re-runs for free; the bootstrap import hydrates sequences from MMKV before first render. |
| The transient | `stores/countdown.ts:74-78`, `stores/countdown.ts:90-94`, `stores/countdown.ts:408-438` | Planning's working diagnosis: the countdown name and display selectors derive from the raw countdown atoms, whose next write is the next tick's `writeDisplayCountdown` (one wall-clock second), so the old-locale string survives one tick after `setActiveLocale`. Step 1 confirms the mechanism against the row 57 audit record. |
| The splash | `app/_layout.tsx:49`, `app/index.tsx:78-90`, `app/index.tsx:186`, `app/index.tsx:206` | The splash holds for the Masjid icon bitmap and the Ramadan sprites, then `hideAsync`; every restart pays this gate again. |
| The recorded evidence | queue rows 57, 61, 68, 71 | The relaunch is an in-process JS reload, pid unchanged, the launch line back in about 1.5 s, and every crossing logs the `AppStateModule.onHostPause` soft exception (row 71); row 68 proved the mirror flip on the 3T; row 61 healed the width reserve; row 57's audit found the transient. |

The suites that pin today's behaviour: `stores/__tests__/languageConvergence.test.ts` (the
convergence pass and its stamp), `stores/__tests__/rtlSwitch.test.ts` (the D59 branch),
`components/sheets/__tests__/Language.test.tsx` (the sheet flow), `shared/__tests__/locale.test.ts`
(resolution and the bump). The investigation reads them; none changes.

Why the brief alone cannot answer: its pros and cons are claims, and each needs its citation.
"Kills every stale-cache class at once" needs the inventory of the classes (section 2);
"widget re-push racing process death" needs the await chain and the two restart mechanisms
distinguished (section 3); "splash cost on every switch" needs the measured record
(section 3). The investigation turns each claim into a cited verdict or a ruling-list item.

## 5. Design

Three investigation steps, each writing its sections of `FINDINGS.md` as it lands. Invariant:
the ticket's whole diff on `uat` is docs. The option set the row ends at: the status quo
(in-place remount, D59's RTL-only relaunch), always-restart after convergence through the
in-process reload, always-restart as a full process restart, and a hybrid the evidence names
(restart only when a stale-cache class bites today). The recommendation picks one; the owner
rules.

Alternatives rejected: a device probe step (D86: the recorded evidence answers what the row
asks, and a new build cycle costs a session); one nine-section step (three bounded commits let
the lead audit the map before the judgement rests on it).

Concurrency trace (read, never changed): pick, then commit (`stores/language.ts:65`), then the
`setActiveLocale` bump, the remount, `reconcileLanguageSurfaces` (:76), the lock, the full pass
with the awaited widget push (`stores/notifications.ts:1672`), the stamp (:45), the
direction-change restart inside the commit (:77-89), the commit settling, then the dismiss in
pickLanguage's `.then` (`components/sheets/screens/languageSheet.ts:29-31`). The D51 face
spans commit to dismiss, and dies at the reload on a direction change, not at the dismiss;
the brief's "the restart point moves after convergence" already holds for the landed
D59 branch, and the always-restart question is whether the same point serves every switch.

**Acceptance criteria:**

- [R1.1] WHEN the switch-path map lands in FINDINGS.md section 1 THE SYSTEM SHALL record every hop from a language-sheet pick to a settled UI (the pick, the commit, the locale bump, the remount key, the convergence await chain, the dismiss) with its file and line
- [R1.2] WHEN the cache inventory lands in FINDINGS.md section 2 THE SYSTEM SHALL record every per-locale or per-process cache and selector the switch touches or skips (the width atoms, the module Map, the channel dedup caches, the countdown display selectors, the catalog loader, the baked widget strings), each with its file and line, its reset trigger today, and what an always-restart changes for it, with the transient's confirmed mechanism named. The listed rows are a floor: any per-process or per-locale state the switch path reads, writes or leaves stale joins the inventory; state outside the switch path is out of scope
- [R2.1] WHEN the restart-surface analysis lands in FINDINGS.md section 3 THE SYSTEM SHALL record both restart mechanisms with their costs from the recorded evidence, the launch path's reconciliation a restart re-runs, the D51 face's fate, the widget re-push ordering against each mechanism, the splash cost, and the row 71 teardown exception, every claim citing its file and line or its queue record
- [R3.1] WHEN the recommendation lands in FINDINGS.md section 4 THE SYSTEM SHALL state the option set with what each option heals and costs, one recommendation with its reason, and the rulings only the owner can take, every line citing sections 1 to 3

## 6. Steps

- [x] Step 1: the switch map and the cache inventory (`steps/1-switch-map.md`)
- [ ] Step 2: the restart surface (`steps/2-restart-surface.md`)
- [ ] Step 3: the options and the recommendation (`steps/3-recommendation.md`)

## 7. Device proof

None (D86). The device facts the row rests on are the recorded ones: row 68's relaunch
measurement and mirror proof, row 71's teardown exception, row 61's width heal, row 57's
transient, each cited to its queue cell or audit commit in `FINDINGS.md`.

## 8. Records

`LOG.md` entries under `### Step 0N — done` for each step, the standard fields adapted to docs
steps (no red tests; the "red" is the section absent before the step), each ending with the
`session:` line. Planning's own record sits under `## Planning (2026-10-13)`.

Queue cell text the lead applies on DONE:

`DONE <date>, audited: the always-restart investigation answers in FINDINGS.md (folded here per D85, its folder closed): <one line: the option set, the recommendation, the ruling list, the inventory's cache classes and each option's priced cost>; no code changed`

Docs commit message: `<VERSION> - docs(plans): ticket 66 executed: 3 steps, the language-restart question answered`

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor count is not 1 | The tree moved past the Planned at sha | Stop: `NEEDS_CONTEXT: NEEDS REPLAN, <the anchor and its count>` |
| A PLAN.md section 4 file:line opens at other content | The map drifted from the tree | Re-open the file, correct the row in the same step, record both readings in the LOG entry |
| The transient's mechanism cannot be confirmed from the selectors and the row 57 record | The diagnosis needs a runtime trace | Record the candidate mechanisms and the test that would decide; move the item to the ruling list (D86 blocks a new device run) |
| One section contradicts another | The inventory missed a cache | Correct the earlier section in the same step, record both |

Anticipated review fixes, word for word:

- "Add a device probe" - rejected: D86, the recorded evidence answers what the row asks.
- "Recommend always-restart now" - rejected: D84, the owner rules on reading.
- "Keep FINDINGS.md after DONE" - rejected: D85, the fold lands in the queue cell.

Restore lists: none. The ticket writes docs and deletes nothing.

## 11. Subagents

Planning: codegraph reads and greps, done at `29eb2dee`. Delivery: one `athan-executor`
dispatch (weight 3 total, one session), then `athan-reviewer` blind and plan-conformance on
the findings' accuracy. Every worker may call `vision` for an image it cannot see. Nothing
else, ever.

## 12. Report to the owner

One paragraph: the option set, the recommendation, the rulings left to her. The progress
table, then the four-line handoff.
