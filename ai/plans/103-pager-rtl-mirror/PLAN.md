# 103: The schedule pager under RTL, mirrored swipes and page order

| Field | Value |
| --- | --- |
| Brief | The schedule pager under RTL: mirrored swipes and page order |
| Planned at | `f8884324` (2.0.784), 2026-10-15 |
| Planned by | The planning phase, this session |
| Needs first | nothing |
| Parent | nothing |
| Group | none: `app/Navigation.tsx` and its test are shared with no open ticket (row 106 queues `OverlayInfoBox.tsx` and `Countdown.tsx` surfaces and holds no code) |
| Batch budget | 2 |
| Session budget | 6 |
| Steps | 2 (step 1 code with the simulator probe, weight 3; step 2 owner read, weight 1) |
| Device | iOS simulator for the glass probe inside step 1; the owner's XS read is the acceptance (D103.2). No 3T step |
| Owner decisions still needed | none: D103.1 to D103.3 taken, section 2.1 |

## 1. Goal

Under an Arabic app locale every surface mirrors today except the schedule pager: the
Standard-to-Extras swipe keeps its English direction and page placement. The owner tested it on
the XS dev build (D103.3): the pager stays physical left-to-right while the rest of the tree lays
out right-to-left. When DONE the pager mirrors under every RTL locale: the Standard page sits
where Extras sits in English, the swipe direction reverses, and under every LTR locale rendering
stays byte-identical to today. The owner notices on her read under Arabic.

Owner rules that apply, quoted from their source:

- Row 80: "the layout must follow the SELECTED app language (English means left-to-right, Arabic
  means right-to-left, any language), with the system language only setting the INITIAL default".
- Row 73's lesson: physical transforms misbeaviour under RTL in this RN release candidate; the
  mirror rides layout direction, never transforms.
- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without the
  owner's say." The en face must not move by one pixel.
- Her acceptance ruling (D103.2): her read alone, the row 90 pattern.

## 2. Decisions

### 2.1 Taken

- D103.1 (owner, 2026-10-15, interview round 1): mirror the pager under RTL. Swipe right-to-left
  becomes swipe left-to-right under Arabic; the Extras page sits where the Standard page sits in
  English. Page ORDER is untouched: position 0 stays Standard, position 1 stays Extras, and the
  app still opens on Standard.
- D103.2 (owner, 2026-10-15, interview round 1): the acceptance is her read alone. No 3T device
  proof step. The lane proves en byte-identity in tests and probes the mirror on the iOS
  simulator before her read.
- D103.3 (owner, 2026-10-15, interview round 2): on the XS dev build today the pager stays
  physical left-to-right under Arabic. The lane introduces the mirror; it does not repair one.
- D103.4 (planner, from source at `f8884324`): the mirror rides PagerView's native
  `layoutDirection` prop keyed off the app locale through the same `localeDirection` +
  `currentLocaleId` pair the root reads. No transforms, no child reordering, no reliance on the
  library's `I18nManager.isRTL` deduction.

### 2.2 The executor must not decide

- The simulator probe shows the `layoutDirection` prop does not flip the pager at the pinned
  react-native-pager-view 9.0.4: STOP with the probe evidence and the exact prop traffic. A
  patch-package correction is a planner-and-owner decision, not the executor's.
- The overlay infobox or the catcher geometry drifts under the mirrored pager: STOP with the
  screenshot and the measured drift. No per-side or per-language geometry value may be invented
  (row 102 item 6: locale-uniform spacing is her scalability law).
- Any test outside the named files fails for a reason the plan does not name: STOP with the
  failing name and its first failing line.

## 3. Pre-flight

`scripts/preflight-103.sh`, committed in this folder. The executor saves a copy to `$TMPDIR` and
runs it from there. It checks: the checkout is on `uat`, the tree is clean, `origin/uat` is
merged in, the version is not lower than 2.0.784, Needs first is nothing, and all 5 anchors count
exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

The code map (anchors under `scripts/anchors/`, verbatim at `f8884324`):

- `app/Navigation.tsx` hosts the pager (anchor `pager-block`): `PagerView` from
  react-native-pager-view 9.0.4, `initialPage={0}`, children Standard then Extras,
  `scrollEnabled={!overlayIsOn}` the only dynamic prop. No direction handling today.
- `app/Navigation.tsx` maps page index to schedule (anchor `pageselected-mapping`):
  `position === 0 ? ScheduleType.Standard : ScheduleType.Extra` plus the overlay self-heal. This
  mapping is index-keyed, not side-keyed: a layout-direction flip does not touch it.
- `app/Navigation.tsx` renders the dots (anchor `dots-row`): dot 0 (Standard) first inside
  `styles.dotsRow`, a logical `flexDirection: 'row'`. Under the root RTL direction the row
  mirrors natively, putting dot 0 on the same side as mirrored page 0. Structure unchanged.
- `app/_layout.tsx` (anchor `root-direction`): the root reads
  `localeDirection(currentLocaleId())` into a `direction` style on `GestureHandlerRootView`, and
  `key={localeVersion}` remounts the tree on a language switch. The D59 crossing also reloads the
  whole context, so the pager never re-renders across a direction change mid-session.
- `shared/i18n/locale.ts` (anchor `locale-direction`): `localeDirection`, the shared source both
  the root and this change read.
- `node_modules/react-native-pager-view/src/PagerView.tsx:64-70`: with the prop unset the library
  deduces from `I18nManager.isRTL`, a bridge-start snapshot (row 73's stale-snapshot class; the
  owner's XS read at D103.3 shows it answers left-to-right under Arabic today). The explicit prop
  overrides the deduction. iOS applies the prop on diff
  (`ios/RNCPagerViewComponentView.mm:95-96`); Android applies it through the view manager
  (`android/.../PagerViewViewManager.kt:84-90`, `setLayoutDirection`).
- The three re-verify surfaces from the ticket row, none of them changed by this plan:
  `components/overlay/OverlayInfoBox.tsx:62-69` anchors by row index with logical `start` inside
  the list, so it tracks the mirrored list for free; `components/overlay/Overlay.tsx:90-95`
  rebuilds the press-catchers from live window measurements, so they track whatever physical
  positions the mirrored rows report; `components/countdown/tipGeometry.ts:40-47` keys the tip
  off the app locale and already mirrors; `components/countdown/Countdown.tsx:135-141` pins the
  timer row `direction: 'ltr'` explicitly.

Existing tests and what each proves:

- `__tests__/app/Navigation.test.tsx`: the perf-mark cases, the page-selected measure and the
  overlay close-on-settle rule (lines 42-87). These prove the mapping survives unchanged.
- `components/countdown/__tests__/tipGeometry.test.ts:59-87`: the mirrored tip path.
- `components/overlay/__tests__/overlayPlacement.test.ts`: the infobox's row-index arithmetic.
- `components/overlay/__tests__/catcherGeometry.test.ts`: the window-space catcher regions.
- `shared/__tests__/directionalStyleGate.test.ts`: no physical directional style outside
  `scripts/directional-styles-allowlist.json`. This change adds no style at all.

Why the obvious fixes are wrong: reordering the children under RTL flips the index every consumer
keys on and fights the remount; transform mirroring is row 73's rejected ground; leaving the prop
unset and trusting the library's deduction is the exact mechanism the owner's XS disproved.

## 5. Design

Navigation reads `localeDirection(currentLocaleId())` into a variable and passes it as
PagerView's `layoutDirection`. Invariant, testable in one line: the prop the pager receives
equals the direction the root style carries, in every render, and nothing else in the file
changes. Page order, handlers, styles and children stay byte-identical.

Alternatives rejected: child reordering (breaks the index mapping and the self-heal), transforms
(row 73), the unset-prop deduction (a snapshot that answers wrong on the owner's device today).

Concurrency trace: none new. The prop is render-derived from atom state. A language switch
remounts the tree on `localeVersion` and the D59 crossing reloads the context, so the pager
receives its direction at mount, never mid-flight.

Acceptance criteria:

- [R1.1] WHEN Navigation renders with the app locale set to an RTL locale THE SYSTEM SHALL pass `layoutDirection="rtl"` to PagerView.
- [R1.2] WHEN Navigation renders with the app locale set to an LTR locale THE SYSTEM SHALL pass `layoutDirection="ltr"` to PagerView.
- [R2.1] WHILE the app locale is any locale THE SYSTEM SHALL map pager position 0 to the Standard schedule and position 1 to the Extras schedule with the overlay self-heal unchanged.
- [R3.1] WHEN the app locale is an LTR locale THE SYSTEM SHALL render every schedule, overlay, dot and bar byte-identically to the pre-change build, proven by the full existing suite green with no new styles.
- [R4.1] WHEN the mirrored pager is driven under an RTL locale on the iOS simulator THE SYSTEM SHALL settle on the Extras page after a swipe from the Standard page in the reversed direction, observed by snapshot.

## 6. Steps

Checklist:

- [x] Step 1: the mirror prop, red tests, suites, simulator probe (`steps/1-pager-mirror.md`)
- [ ] Step 2: the owner's read on the XS dev build (`steps/2-owner-read.md`)

Steps carry their own Requirements, Weight, anchor check, goal, branch, files, red tests, change
contracts, green run, break script, version and commit, review checklist, merge and done-when.

## 7. Device proof

The glass probe inside step 1 runs on the iOS simulator through xcodebuildmcp and agent-device:
build or reuse the dev build, switch the in-app language to Arabic (the D59 reload), drive the
reversed swipe on the schedule pager, snapshot the Extras page settling, then switch back to
English and confirm the layout unchanged. Evidence lands under `$HOME/athan-gitree/sessions/103/`
with the screenshots transcribed, never committed. Android is source-verified only
(`PagerViewViewManager.kt:84-90`), recorded here by D103.2: no 3T step, her ruling. No clock
changes, no alarm reads, nothing notification-adjacent runs in this ticket.

## 8. Records

`LOG.md` carries the ledger: every step entry opens `### Step NN - <state>` and ends
`session: <ses_id>`; planning sections use `## Planning (2026-10-15)` and `## Ticket 103`. The
queue cell the lead applies on DONE: "DONE <date>, audited: the schedule pager mirrors under
every RTL locale through the native layoutDirection prop keyed off the app locale (en and every
LTR locale byte-identical, page order and the overlay self-heal unchanged, the dots and the
infobox tracking the mirror natively); simulator-proven under ar; owner-read on the XS". The docs
commit message: "<VERSION> - docs(plans): row 103 READY, the pager mirror plan".

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| The prop is passed but the simulator pager does not flip under ar | The pinned library ignores the prop at mount or on diff on this platform | STOP per 2.2, first row: attach the prop traffic and the snapshot |
| An overlay test fails after the change | The mapping or the geometry changed where it must not have | Revert to the contract: position 0 is Standard; no geometry value moves |
| `directionalStyleGate` flags a file | The change added a style or a physical prop | Remove it: the contract adds one prop and zero styles |
| The dots sit unmirrored under ar while the pages mirror | The dotsRow misses the root direction, a surface the plan does not change | STOP per 2.2, second row, with the snapshot |
| The ar-to-en reload starves on the simulator (row 76's flake) | The known simulator starvation | Terminate and relaunch the app and read English there; a second starve is recorded in `LOG.md` and en identity stands on R3.1's suite |

Anticipated review fixes, word for word:

- "Delete the comment above `layoutDirection`: the ticket row and the root already carry the
  why."

Restore lists: step 1 touches `app/Navigation.tsx` and `__tests__/app/Navigation.test.tsx`;
`git checkout uat -- app/Navigation.tsx __tests__/app/Navigation.test.tsx` restores both.

## 11. Subagents

Planning used `explore` for the ground map. Delivery: the lead dispatches `athan-executor` for
step 1 and the build half of step 2, and `athan-reviewer` twice (plan-conformance and blind). A
worker that cannot see a screenshot calls `vision`. Nothing else, ever.

## 12. Report to the owner

Plain sentences: the pager now mirrors under Arabic and every other right-to-left language, the
English face did not move, the overlay and its info boxes track the mirror natively, and the page
order, dots logic and overlay self-heal are pinned unchanged by tests. Then the progress table,
then the four-line handoff block, nothing after it.
