# Plan — ticket 80: the layout direction follows the app language

| | |
| --- | --- |
| Brief | Queue row 80: her XS ruling (2026-10-13) — the layout follows the SELECTED app language; the system language sets only the initial default. Scope the notification-language path |
| Planned at | `1b0d5229` (uat, 2.0.402), 2026-10-14 |
| Planned by | The lead, owner-delegated (the owner's run order, 2026-10-14) |
| Needs first | nothing (73 and 78 are DONE) |
| Parent | none |
| Group | the direction bootstrap (stores/language.ts, stores/bootstrap.ts, app/index.tsx, app/_layout.tsx); no open ticket shares it |
| Batch budget | 4 |
| Session budget | 8 |
| Steps | 4 (all code or docs; no device step) |
| Device | None. Waived by the owner's run order 2026-10-14; her device test is the acceptance bar |
| Owner decisions still needed | none this run; the run order delegates them, recorded in section 2 |

## 1. Goal

The layout direction is wrong in one state and one cost is unbounded:

- Her XS test (2026-10-13, system Arabic + app English, confirmed on 74's green build
  the same hour): the layout stayed RTL while the content was English. She ruled the
  layout follows the SELECTED app language (en left-to-right, ar right-to-left, every
  language), and the system language sets only the INITIAL default on first launch.
- The cause is pinned at the installed RN source: `I18nManager` cannot force LTR on
  either platform. iOS `RCTI18nUtil.isRTL` answers `forced OR (allowed AND
  application-preferred-RTL)`; Android `I18nUtil.isRTL` answers `supportsRtl && (forced
  OR (allowed AND device-locale-RTL))`. `forceRTL(false)` only un-forces, so a
  system-RTL device keeps an RTL layout whatever the app picks. The bootstrap
  (`stores/bootstrap.ts`) and the crossing (`stores/language.ts`) call `forceRTL`
  believing it sets the direction; it sets it in one direction only.
- The same pass observed a Maghrib notification fire in English (row 72's en unit word)
  while the app language was Arabic. Notification copy is baked at arm time; the switch's
  convergence pass re-bakes it. The English fire means the pass had not landed when the
  reminder fired: row 78 bounded the starved wait at 10 s, but every in-process relaunch
  also re-runs the launch init, whose unconditional Android refresh-gate reopen costs a
  full reschedule ahead of the next crossing (row 78's recorded aggravator, left to this
  row).

When DONE: the layout direction reads the app locale at the React root, so every launch
state (cold start, post-crossing relaunch, starved crossing) renders the selected
language's direction; the system locale decides only when no preference is stored; a
crossing's relaunch context no longer re-runs the cold-launch gate reopen; QiblaWave's
mirror reads the locale's own direction. She notices on her device: system Arabic + app
English lays out left-to-right with English content.

The owner's rules that apply, with source:

- "the layout must follow the SELECTED app language (English means left-to-right, Arabic
  means right-to-left, any language), with the system language only setting the INITIAL
  default on first launch" (her XS ruling, queue row 80).
- "scope the notification-language path here" (queue row 80).
- "change only timing/keying, never what converges" (the owner's run order, 2026-10-14).
- Device work waived; "NEVER a production build, NEVER a physical phone, NEVER EAS"; unit
  and component tests prove the changed lines (the owner's run order, 2026-10-14).
- Visuals are settled; fixes change behaviour only. This change moves no pixel in the
  states that render right today: under system-RTL + app-ar and system-LTR + app-en the
  resolved direction is the value the native side already resolves.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D1 | The layout direction keys on the app locale at the React tree's root through the `direction` style prop, because RN's I18nManager has no force-LTR on either platform (verified at the pinned sources, section 4). The native forceRTL bootstrap and the D59 crossing relaunch stay | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | section 5, step 1 |
| D2 | The notification-language diagnosis is recorded, not re-converged differently: the English fire was convergence not yet landed (row 78's starvation, now bounded); the repo-side residue is the relaunch context re-running the cold-launch gate reopen, which this row removes by a relaunch handoff marker. What converges (the full pass, the stamp, forward-only healing) does not change | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | section 5, step 2 |
| D3 | New MMKV key `preference_language_relaunch_handoff` (the handoff marker). MMKV keys are ask-first; the owner's run order delegates this run | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | section 5, step 2 |
| D4 | QiblaWave's mirror re-keys on the locale's own direction, the pattern rows 73 landed for the pill and the thumb, folding in the sibling read 73's audit reported here | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | section 5, step 3 |
| D5 | The colour picker keeps its bridge-snapshot keying (the library's geometry is snapshot-written; 73's D4 swatch-ring ruling holds: the ring's `left: 0` sits in a cell the ring exactly fills, direction-independent). The comment whose premise this row changes is updated | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | section 5, step 3 |
| D6 | The en-countdown colon observation is superseded: row 82 ruled one colon design in every language (row 84 carries it; row 85 would restore en letters only when she says go). No fix | The lead, from the queue records | 2026-10-14 | section 8 |
| D7 | Device work waived; her device test is the acceptance bar. Proof is unit and component tests, full coverage of touched lines, red before green, mutation passes on guarded logic | The owner's run order, 2026-10-14 | 2026-10-14 | sections 6, 7 |
| D8 | One continuous run on branch `ticket/80` in the worktree `$HOME/athan-gitree/run-80`: no merge to uat, no push, no DONE. Version ladder starts at 2.0.403, patch +1 per commit, `app.json` and `package.json` together (the gitignored gradle file is absent in the worktree; the lockstep test skips a missing file) | The owner's run order, 2026-10-14 | 2026-10-14 | sections 3, 6 |

### 2.2 The executor must not decide

None. Every decision the code needs is in section 5. A reality the plan does not
predict stops work with `STOP:` and the exact question; the lead holds the owner's
delegation.

## 3. Pre-flight

`scripts/preflight-80.sh` in this folder. The executor saves a copy to `$TMPDIR` and
runs it from there against the worktree `$HOME/athan-gitree/run-80`. It checks the
branch is `ticket/80`, the tree is clean, HEAD sits at or past `1b0d5229`, the version is
at least 2.0.403, `app.json` and `package.json` agree, rows 73 and 78 are DONE, and every
anchor counts 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### 4.1 The code map

Files read, one line each (anchors under `scripts/anchors/`):

- `stores/bootstrap.ts` — the import-time direction bootstrap: `allowRTL(true)`, then `forceRTL` on the stored preference's direction; the half of the ruling that works (it forces RTL under system-LTR) and the half that cannot work (it cannot force LTR under system-RTL).
- `stores/language.ts` — `commitLanguagePreference` (the pick: persist, switch, converge, cap, force, relaunch), `reconcileLanguageSurfaces` (the stamp-keyed re-arm), `RELOAD_CONVERGENCE_CAP_MS` (row 78's 10 s bound), `launchDirection` (the bridge-start snapshot for the no-preference case).
- `shared/i18n/locale.ts` — `LOCALE_IDS`, `localeDirection` (the locale's own direction), `currentLocaleId`, `setActiveLocale`, `localeVersionAtom` (the remount bump), `readStoredLanguagePreference`.
- `app/_layout.tsx` — `Layout`: the React tree's root (`GestureHandlerRootView`), the localeVersion-keyed remount, the sheet layer that survives a switch.
- `app/index.tsx` — `Index`: the launch init inside a 1500 ms timeout behind `launchInitRan` (a per-JS-context latch), `reopenRefreshGateOnColdLaunch` (Android-only), `initializeNotifications(...).then(reconcileLanguageSurfaces)`.
- `device/listeners.ts` — the foreground path: `refreshNotifications`, `reconcileLanguageSurfaces` (the forward-only healing at every foreground).
- `stores/notifications.ts` — `withSchedulingLock` (the serial queue), `_rescheduleAllNotifications` (the full pass that bakes notification copy at arm time), `rescheduleAllForLanguageChange` (the convergence driver), `refreshNotifications` (the 2-hour gate), `reopenRefreshGateOnColdLaunch`.
- `components/sheets/screens/QiblaWave.tsx` — line 54 reads the bridge snapshot into the wave worklets; the sibling read 73 reported.
- `shared/qiblaWave.ts` — the wave arithmetic; `isRTL` is a boolean parameter end to end, so the re-key changes one read site.
- `components/sheets/screens/ColorPicker.tsx` — lines 102-106: the picker's direction keyed on the same bridge snapshot the library snapshotted (row 73's fix, stays by D5); the comment's premise this row changes.
- `components/ui/Error.tsx` — the app's other `Updates.reloadAsync` caller (the error screen's reload); it keeps today's behavior.
- Existing tests: `stores/__tests__/bootstrap.test.ts` (the launch direction block), `stores/__tests__/rtlSwitch.test.ts` (crossing order), `stores/__tests__/rtlReloadBound.test.ts` (row 78's cap), `stores/__tests__/languageConvergence.test.ts` (the stamp), `__tests__/app/_layout.test.tsx` (renders `Layout`), `__tests__/app/index.test.tsx` (the launch init), `shared/__mocks__/react-native.ts` (the stateful I18nManager mock).

### 4.2 How the pieces interact, and why the obvious fix is wrong

The direction flows from two sources today. The native side resolves at process start:
system locale, unless forceRTL was previously forced. The JS side forces at import
(`stores/bootstrap.ts`) and at a crossing (`stores/language.ts`), then relaunches so the
native side re-reads. That loop is sound in one direction only: `forceRTL(true)` flips a
system-LTR device to RTL (proven on the 3T, row 68), but `forceRTL(false)` un-forces and
leaves the system locale in charge, so a system-RTL device renders RTL under an English
app. The obvious fix — force LTR at the bootstrap the way RTL is forced — does not
exist as an API call on either platform (section 4.3). The second obvious fix — strip the
app's localizations so iOS resolves the development region — touches `app.json`
(ask-first) and changes native permission strings, and Android still follows the device
locale. The ruled fix is the third: the layout direction is a Yoga property, the
`direction` style prop sets it per subtree, and the React root is the one subtree every
screen inherits. Keying it on `localeDirection(currentLocaleId())` makes the layout read
the app locale in every state, and the native forceRTL keeps doing what it can (the RTL
direction, the snapshot consumers) behind it.

The notification path: copy is baked at arm time inside `_rescheduleAllNotifications`;
the switch's convergence re-bakes under the new locale and stamps
`preference_language_last_armed` only after a real pass. A fire in the old language means
the pass had not landed: pre-78 the wait starved unbounded; post-78 the cap relaunches
and the next context's launch init reconciles. The residue this row owns: the launch
init's `reopenRefreshGateOnColdLaunch()` runs on every JS context, so every crossing's
relaunch reopens the Android refresh gate and buys a full reschedule that converges
nothing new (the convergence pass or the relaunch's own reconcile just armed
everything). An in-process relaunch cancels no alarms (the process lives), so the reopen
is a cold-launch concern wearing a per-context latch. The handoff marker splits the two.

### 4.3 Pinned library facts (verified at the installed sources)

- `node_modules/react-native/Libraries/ReactNative/I18nManager.js` — `forceRTL(shouldForce: boolean)`, "Takes effect on the next app reload"; no LTR counterpart exists in the export.
- `node_modules/react-native/React/Modules/RCTI18nUtil.m:32-41` — `isRTL` answers forced, else `isRTLAllowed && isApplicationPreferredLanguageRTL` (the app's own preferred localization, set by the system's language order over the shipped localizations).
- `node_modules/react-native/ReactAndroid/.../i18nmanager/I18nUtil.kt:23-27` — `isRTL` answers `applicationHasRtlSupport && (isRTLForced || (isRTLAllowed && isDevicePreferredLanguageRTL))`; `isDevicePreferredLanguageRTL` reads the configuration's first locale.
- The `direction` style prop on views: row 73's exploration pinned it at the installed rc (`propsConversions.h` converts it into the node's Yoga style; Yoga's left/right swap gates on the node's resolved direction). Step 1's anchor re-verifies the type accepts it.

### 4.4 The concurrency table

| Path | Reads | Writes | Order |
| --- | --- | --- | --- |
| Import: `stores/bootstrap.ts` | MMKV `preference_language` | native forceRTL pref | before first render |
| Pick: `commitLanguagePreference` | `languagePreferenceAtom`, `launchDirection` | `languagePreferenceAtom`, active locale, `languageCommitBusyAtom`, the stamp | persist, switch, converge (capped 10 s), force, relaunch |
| Relaunch context: `stores/bootstrap.ts` then `app/index.tsx` launch init | the stored preference, the handoff marker (new) | native forceRTL pref, the stamp when dirty | import forces; the init reconciles at ~1500 ms |
| Foreground: `device/listeners.ts` | the gate, the stamp | the stamp when dirty | after every foreground transition |
| Scheduling: `withSchedulingLock` | the queue | the queue | every pass serialises; row 78's cap only races the switch's wait, never the queue |

## 5. Design

The layout direction reads the app locale at the React root; the relaunch context stops
paying the cold-launch gate reopen; the wave mirrors on the locale's own direction.

Invariant, one sentence a test can check: the React root's `direction` style equals
`localeDirection(currentLocaleId())` under every locale, and the launch init calls
`reopenRefreshGateOnColdLaunch` only when no relaunch handoff marker was consumed.

Alternatives rejected:

- Force LTR at the bootstrap: no such API on either platform (section 4.3).
- Strip the shipped localizations so iOS resolves the development region: touches
  `app.json` (ask-first), changes native permission strings, and Android still follows
  the device locale.
- Key the root on the bridge snapshot instead of the locale: that is the defect row 73
  diagnosed in the travel family — the snapshot lags the live locale in a starved
  crossing.
- Drop the D59 relaunch now that the layout no longer needs it: the relaunch still
  re-reads the native side and every bridge-snapshot consumer (the picker library,
  `I18nManager.getConstants()`), and removing it is a behaviour change outside this row's
  delegation.
- Detect a relaunch context by reading a process start time from JS: no API in the
  installed tree carries it; the marker is the one honest handoff.

Concurrency trace: the pick persists, switches the active locale (the remount bumps
`localeVersionAtom`; `Layout` re-renders and the root's `direction` re-computes in the
same render), converges behind the lock with the 10 s cap, forces the native direction,
writes the handoff marker, relaunches. The new context's import forces the same direction
again, the launch init at ~1500 ms consumes the marker, skips the gate reopen (the gate
then answers within its 2-hour window on both platforms), and reconciles the surfaces
when the stamp is dirty. The marker is cleared in the same two places its write can fail
to matter: consumed by the next launch init, and cleared by the refused-relaunch catch so
a genuine later cold launch reopens the gate as it does today.

Design review: the one risk a unit test cannot see is the native honouring of the
`direction` prop at the root on each platform; that is her device test (D7). The repo's
own history carries the prop working per-subtree (row 73 keyed the picker's panel through
it), and step 1's proof rides the same mechanism one level up. The second risk is a
React root outside `Layout` (a modal host) inheriting the system direction; the root
inventory in step 1 names every one and the same style lands there.

**Acceptance criteria:**

- [R1.1] WHEN `Layout` renders THE SYSTEM SHALL set the tree root's `direction` style to `localeDirection(currentLocaleId())`.
- [R1.2] WHEN no language preference is stored THE SYSTEM SHALL resolve the initial locale from the device and lay out in that locale's direction.
- [R1.3] WHEN the active locale switches between LTR and RTL THE SYSTEM SHALL re-render the tree root with the new locale's direction in the same render that remounts the content.
- [R1.4] WHEN the picker modal's overlay renders THE SYSTEM SHALL carry `direction: localeDirection(currentLocaleId())` on the overlay root inside the native Modal host.
- [R2.1] WHEN a language crossing relaunches the app THE SYSTEM SHALL leave a handoff marker that the next launch init consumes exactly once.
- [R2.2] WHEN the launch init runs in a context that consumed a handoff marker THE SYSTEM SHALL NOT reopen the notification refresh gate.
- [R2.3] WHEN the launch init runs in a context that consumed no handoff marker THE SYSTEM SHALL reopen the notification refresh gate exactly as it does at 2.0.402.
- [R2.4] WHEN the relaunch is refused THE SYSTEM SHALL clear the handoff marker so a later cold launch reopens the gate.
- [R2.5] WHILE the app language differs from the language a notification was armed in THE SYSTEM SHALL re-arm notification copy under the active locale at the next launch init or foreground, unchanged from 2.0.402.
- [R3.1] WHEN the Qibla calibration wave renders THE SYSTEM SHALL mirror the figure on `localeDirection(currentLocaleId())` rather than the bridge snapshot.
- [R3.2] WHEN the colour picker renders THE SYSTEM SHALL keep its panel direction keyed on the bridge snapshot the library snapshotted, with its comment stating that premise.

## 6. Steps

Checklist:

- [x] Step 1 — the layout direction at the React roots
- [x] Step 2 — the relaunch handoff
- [x] Step 3 — the wave's own direction and the picker's comment
- [x] Step 4 — the executed records

One subsection per step lives in `steps/`. Every step: one branch, one commit, one
version, `app.json` and `package.json` bumped together, red before green, full coverage
of touched lines, a mutation pass on guarded logic, `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` at 0. Steps run in the worktree
`$HOME/athan-gitree/run-80` on branch `ticket/80`; nothing merges to `uat`, nothing
pushes, no step checks out `uat`. The version ladder: 2.0.403 the planning skeleton,
2.0.404 the lead's ready-plan commit, then 2.0.405 to 2.0.408 for steps 1 to 4.

## 7. Device proof

None. Waived by the owner's run order 2026-10-14; her device test is the acceptance bar.
The unit and component proofs live in the steps. The simulator route stays available to
the auditor if a dev build is already installed (agent-device, dev/mock only, never a
production build); the plan requires nothing of it.

## 8. Records

The findings text the executor writes into `LOG.md` under `## Findings (executed)` is
pinned in `steps/4-records.md` with its measured-value placeholders. The queue cell the
lead applies on DONE:

```md
DONE 2026-10-14, audited: the layout direction reads the app locale at the React tree's root and the picker modal's host (the direction style keying row 73 established, one level up), so every launch state renders the selected language's direction - her XS ruling lands: system Arabic + app English lays out left-to-right, the system locale deciding only the initial default; forceRTL keeps the native half it can reach and the D59 crossing relaunch stays. The crossing's relaunch context stops paying the cold-launch refresh-gate reopen through a one-shot relaunch handoff marker (an in-process reload cancels no alarm), closing row 78's recorded aggravator; the notification-language path scoped and diagnosed - the English Maghrib was convergence not yet landed (copy is baked at arm time), now bounded by 78's cap, the relaunch, and the relaunch context's own reconcile, with what converges unchanged. QiblaWave's mirror re-keys on the locale's own direction (73's reported sibling read folded in), the picker keeps its snapshot keying with its premise restated, and the en-countdown colon observation is superseded by row 82's one-design ruling (row 85 would restore the en letters only when she says go). Device work waived by her run order; her device test is the acceptance bar
```

The docs commit message for the DONE cell (the orchestrator's merge carries it):
`<VERSION> - docs(plans): ticket 80 DONE: the layout follows the app language; folder and evidence die with the merge`

## 9. Push

None. The executor never pushes. This run ends at the audit; the orchestrator owns the
merge and the push.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A red test passes | the behaviour already exists | `STOP:` with the test name; the plan re-derives the step |
| `direction` is rejected by the style types | the installed rc differs from the pinned read | `STOP:` with the tsc error; the plan re-keys on `Platform`-free equivalent |
| The app suite's launch-init tests fail after step 2's marker | a test inherited a marker from a prior case | clear the marker in the suite's `beforeEach` through the same store helper the step exports |
| Coverage under 100 on a touched file | an untested branch | add the case the contract names; never an ignore pragma |
| A break script prints `BREAK NOT APPLIED` | the substitution missed the code | `STOP:` with the break's output |

Anticipated review fixes, word for word:

- Step 1: "the root also needs the direction on the modal hosts" — the inventory in the step file already names them; if the reviewer names one the inventory missed, the fix is the same one-line style add plus the same test shape, as a fix-up commit.
- Step 2: "the marker leaks across a refused relaunch" — the refused-relaunch catch clears it (R2.4); the reviewer's leak is a second write path the plan does not carry: confirm from the code, then reject with the catch's line.
- Step 3: "the comment still names the live locale" — the step's contract carries the replacement text verbatim.

Restore lists: each step's files restore with `git checkout -- <file>` from the branch
head before it; the one new suite (step 3's `QiblaWave.test.tsx`) deletes with `rm`.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the
draft. Delivery: the lead dispatches `athan-executor` for the steps and `athan-reviewer`
for the audit passes. Every worker may call `vision` for an image it cannot see. Nothing
else.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, the decisions
taken under her delegation, and the four-line handoff. The full report lives in
`LOG.md`; the queue view closes it.
