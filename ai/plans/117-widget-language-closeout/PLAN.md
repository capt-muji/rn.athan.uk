# Ticket 117: Expo widgets and different languages, the closeout

| Field | Value |
| --- | --- |
| Brief | The unparked closeout: the 3T as-found proof of row 135's delivered lettered alignment and mirroring, the gallery's en fallback live read on both platforms, row 69's final disposition, and the upstream PR for the patch's device-locale hunks prepared and held |
| Planned at | `164df7bd`, 2.0.1069, 2026-10-18 |
| Planned by | lane 117 |
| Needs first | nothing (row 135 DONE 2026-10-18 at 2.0.1067; rows 128 and 129 closed with it) |
| Parent | none |
| Group | none (no app code changes; queue edits serialize under the uat merge lock) |
| Batch budget | 3 |
| Session budget | 7 |
| Steps count | 5 |
| Device | OnePlus 3T (`3T_SERIAL`), as-found fleettest build 2.0.1067, app Arabic, widget placed; iOS 18.5 simulator `SIMULATOR_UDID` (the `Athan-77` device), fallback `SIMULATOR_UDID_FALLBACK` (`Athan-76`), both resolved at run time with `xcrun simctl list devices | grep -E "Athan-7[67]"` |
| Owner decisions still needed | Her explicit word to file the prepared upstream PR (publishing is a hard-rule stop, reported never asked); her glass read of the placed widget under Arabic on each phone (row 135's named pending acceptance) |

## 1. Goal

The row is unparked by her 2026-10-18 order ("bring in 117, work it completely"). Options 1 and
3 of the recorded option set are closed by her go on the option-2 line, whose code row 135
delivered and closed DONE at 2.0.1067. What is wrong today: the closeout work she ordered does
not exist yet. What is true when this ticket lands: the delivered lettered alignment is proven
on the 3T's as-found state (the build awaiting her read, untouched), the gallery's fallback
outside the six languages is read live on both platforms and recorded, row 69 carries its final
disposition, the upstream PR for the patch's device-locale hunks is prepared under row 51's
anonymity discipline and held for her word with its location named in the row, and the row sits
OWNER-LED with exactly the two named decisions waiting on her. No app code changes anywhere.

The owner's rules that apply, quoted with source:

- "your proof may read that state but must leave the phone exactly as found: same build,
  Arabic, widget placed" (her order at unpark, transcribed in the dispatch).
- "publishing is a hard-rule stop, you prepare the branch, commits and description, you file
  NOTHING - her explicit word files it" (same).
- "you own widget surfaces' READS and the patch-PR preparation, no app code changes" (same).
- "Never commit a device screenshot or recording. Transcribe what was read."
  (`ai/AGENTS.md`, the repository is public).
- "Upstream security: anonymity always (no personal information, app names, repo links,
  serials, secrets)." (`ai/AGENTS.md`, writing style).

## 2. Decisions

### 2.1 Taken (agent-ruled, 2026-10-18, recorded here)

| ID | Decision | For | Against | Ruling |
| --- | --- | --- | --- | --- |
| D117.1 | The 3T proof reads the as-found state, never a fresh build or install | The scope names the proof of the delivered alignment on the state awaiting her read; the installed 2.0.1067 fleettest build carries exactly 2.0.1066's audited widget code (2.0.1067 and 2.0.1069 are records merges) | A fresh build re-proves from source, but it destroys her acceptance state | Read as-found |
| D117.2 | The Android gallery witness is the 3T, rehearsed on the AVD lane first | The seam was recorded as a live device read and the 3T is the floor device; resource fallback is an OS mechanism, identical on the same API class; the mutable surface (device locale) is restored and verified, the invariant surface (build id, app language, widget placement) cannot move under a locale switch | The AVD alone would answer the resource question at zero 3T risk, and e2e rules allow language-switch exercises there | 3T witness, AVD rehearsal |
| D117.3 | The iOS gallery half runs on the iOS 18.5 simulator with French as the system language, app built from current `uat` | The XS is her phone under read-only discipline and a system-language change is out of bounds; row 135's precedent used the same simulator for the confirmatory iOS read | The simulator is not her hardware; irrelevant to a resource-fallback question whose mechanism is the bundle's localization lookup | Simulator |
| D117.4 | The seventh language is French (`fr-FR`) | Outside the six (en ar ms so hi th), Latin script, distinguishable from English in gallery labels, offered by Android 9's picker with no download | Spanish or German answer equally; no material difference | French |
| D117.5 | The held artefact lives outside the repo: branch `feat/widgets-device-locale` in the local clone `$HOME/athan-gitree/upstream/expo` off fetched `upstream/main`, description at `$HOME/athan-gitree/upstream/pr-descriptions/widgets-device-locale.md`, held state recorded in `ai/UPSTREAM-PRS.md` | Repo documentation dies with the merge; the artefact must outlive the ticket awaiting her word, and `ai/UPSTREAM-PRS.md` is the surviving ledger rows 51 and 132 cite | Committing the description into the repo creates an artefact no shipped code cites, which the records rule forbids | Outside the repo, ledger row inside |
| D117.6 | Row 69's final status is SUPERSEDED, never re-queue, naming rows 135 and 117 | Her option-2 go delivers the lettered face (row 135 shipped, this row proves); the colon format never returns; SUPERSEDED is the queue's exact off-path word for a ticket other rows took the subject of | Leaving "SUPERSEDED IN SUBSTANCE" preserves the interim nuance; the final vocabulary is cleaner and the nuance stays in the kept history text | SUPERSEDED, history kept in the cell |
| D117.7 | The ticket closes OWNER-LED, never DONE | The PR filing waits on her explicit word (publishing is the hard stop), so an action remains that only she can take; DONE means no action remains anywhere | If the reads land clean nothing else remains; the filing bar alone fixes the state regardless | OWNER-LED |
| D117.8 | Steps 1 to 4 run in the lane (the lane lead itself), step 5 dispatches to one `athan-executor` with the lane worktree named; every lane-run phase is recorded in `LOG.md` | Steps 1 to 3 need the device MCP the executor harness does not carry; step 4 works in the upstream clone outside the executor's bound tree; the lane protocol allows lane-run phases so recorded | Maximal delegation is the default; dispatch cannot carry these bounds | Lane-run 1 to 4, dispatch 5 |
| D117.9 | No `yarn check:device` run | It audits armed alarms; this ticket proves widget faces and gallery names, and minimal contact is the rule on the phone awaiting her read | A full audit is cheap on a fleet phone; it answers a question this ticket does not ask | Skip it |
| D117.10 | The audit runs two reviewer passes over a docs-only range plus `check-audit.sh` green | The dispatch names both passes explicitly | Docs-only ranges could argue for one pass; the dispatch's word stands | Two passes |

### 2.2 The executor must not decide

- Anything about filing, pushing or opening the prepared PR: a STOP lands there, it never
  files. The one hard stop in this ticket is publishing.
- Anything that changes the 3T beyond a device-locale switch it restores and verifies: no
  install, no uninstall, no `pm clear`, no app-language switch, no widget re-placement, no
  clock change.
- Any app code change, test change or pixel change: there are none in this ticket.
- The final queue cell wording: section 8 gives the wording and the slots; the executor
  fills the slots with the lane's measured values, and the wording itself is not its choice.

## 3. Pre-flight

`scripts/preflight-117.sh` in this folder, copied to `$TMPDIR` and run from there with the
lane worktree path as its argument. It checks the checkout, the clean tree, the planned-at
sha as an ancestor of HEAD, the version at or above 2.0.1069, row 135 DONE, and every
anchor count exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

No file is changed in the app repository by steps 1 to 4. Step 5 edits only
`ai/plans/README.md` rows and `ai/UPSTREAM-PRS.md`. The map, one line each, anchors under
`scripts/anchors/`:

| File | What it holds for this ticket |
| --- | --- |
| `patches/expo-widgets+58.0.20.patch` | Three features: the `openApp` half (PR `expo/expo#51292`, open), the device-locale injection across four files (this ticket's PR preparation), and the iOS `rtl` layout-direction hunk (row 135's mirroring site, NOT part of the prepared PR) |
| `widgets/PrayerWidget.tsx:309`, `widgets/LockPrayerWidget.tsx:133,377,610` | The four JS read sites of `__expoWidgetDeviceLocale`, each with an empty-string fallback (D44/D79 device-keyed statics) |
| `app.json` widgets config (displayName fields, ~line 224) | The English base gallery names: "Next Prayer (Light)", "Extra Times (Light)", the Dark and Layout 1 variants |
| `app.json` locale map (~line 428) | The six locales' native gallery strings (`prayer_widget_display_name` and neighbours); a device locale outside the six resolves to the English base |
| `plugins/androidLocaleConfig.js` | Writes the Android `values/` and `values-<locale>/` widget strings from the committed config (row 134's lintVital ground) |
| `ai/UPSTREAM-PRS.md` | The surviving patch ledger; its `expo-widgets` row records the openApp PR and the owner's 2026-10-16 ruling that kept the locale hunks local; step 5 appends the held state |
| `e2e/device-atlas-oneplus3t.md` | The 3T picker mechanics: long-press sheet at HOME, WIDGETS tap (539, 1675), the Athan section strip, the strip-scroll warning |
| `ai/plans/README.md` rows 117, 69 | The queue cells step 5 edits; rows 128 and 129 already carry their closures from row 135's DONE |
| `$HOME/athan-gitree/upstream/expo` | The local expo clone, remotes `origin` (the fork) and `upstream` (expo/expo); sibling branches `feat/widgets-button-open-app`, `feat/location-heading-options`, `feat/background-task-requires-network-connectivity`, `fix/widgets-glance-fillmaxwidth-fraction` show the established PR preparation pattern, including the path translation `node_modules/expo-widgets/...` to `packages/expo-widgets/...` |

How the pieces interact: the widget runtime is not React. The app bakes the app locale into
every prop-bearing face at push; the props-less neutral, stale and catch faces key static copy
off the device locale injected as `__expoWidgetDeviceLocale` by the patch; the gallery names
come from the OS resource layer fed by the committed per-locale config. Row 135 delivered the
RTL mirroring (the snapshot `rtl` field consumed by the patched iOS entry view and the Android
composition mirror) and the Android countdown label in the app component's lettered face. The
3T holds the fleettest 2.0.1067 build with app Arabic and a placed widget awaiting her read.

Existing tests: `shared/__tests__/widgetOpenAppPatch.test.ts` pins the patch's exact hunks
(it fails if the patch drifts), `shared/__tests__/widgetRenderer.test.ts` pins the
device-locale read sites. Neither is touched by this ticket; both are the reason no repo file
of the four locale sites may change.

Why the obvious alternative is wrong: upstreaming by rewriting the widget faces to carry the
device locale in props would delete the props-less faces' only locale source and break D44/D79
device keying; the PR keeps the native injection and defaults it to no behaviour change.

## 5. Design

The approach: read and record, prepare and hold. Every 3T contact is bracketed by the
as-found triple (build id from `dumpsys package`, device locale from `getprop` and
`settings get system system_locales`, placed-widget render from a home-screen read) and ends
only after the triple is verified identical. The upstream preparation touches no repository
file and pushes nothing. The invariant one sentence a check can see: after every step, the 3T
reports the same package version, the same device locale and a placed Arabic widget as before
the step, and `git log origin/uat..uat` holds only docs commits from this lane.

Alternatives rejected: proving on a fresh build (destroys her acceptance state, D117.1); the
AVD as gallery witness alone (D117.2); touching her XS (D117.3); committing the PR description
into the repo (D117.5); closing DONE (D117.7).

Concurrency trace: one actor on the 3T at a time under `$HOME/athan-gitree/device-<SERIAL>.lock`;
the iOS simulator work sits under `$HOME/athan-gitree/build.lock`; every repository commit sits
under `$HOME/athan-gitree/commit.lock` and `$HOME/athan-gitree/version.lock`; every merge into
`uat` happens in the main tree under `$HOME/athan-gitree/uat.lock` after
`git fetch -q origin uat` and a green `node scripts/check-version-uniqueness.js`. No code
threads are involved; nothing here races a scheduler.

Design review: the reads answer the recorded seam without changing what they measure; the
preparation is reversible (a local branch and a file, deletable); the records name every
artefact's location. The riskiest step is the 3T locale switch, reduced by the AVD rehearsal
and the bracketed verification.

**Acceptance criteria:**

- [R1.1] WHEN step 1 contacts the 3T THE SYSTEM SHALL read the placed widget's rendered face under app Arabic without any install, state-changing tap, language switch or widget re-placement, and save the transcription and the bracketing dumps under `$HOME/athan-gitree/sessions/117/`
- [R1.2] IF the placed widget renders under app Arabic THEN THE SYSTEM SHALL record in the step 1 transcription, for every prayer row read, which side the time column sits on and which script the name renders in, and record the countdown label's digit script and unit letters, flagging any mismatch against row 135's delivered face (time left of the Arabic names; Latin digits with lowercase Latin h m) as a finding
- [R1.3] WHEN any 3T contact ends THE SYSTEM SHALL verify and record that `dumpsys package` reports the same fleettest versionName as before contact, the device locale equals the value read before contact, and the placed widget still renders, and the step shall not end while any of the three differs
- [R2.1] IF the 3T's device locale is switched to `fr-FR` THEN THE SYSTEM SHALL transcribe the widget picker's Athan entries and record which language each label renders in, with the pre-switch locale recorded before the switch
- [R2.2] WHEN step 2 ends THE SYSTEM SHALL have restored the 3T's device locale to the recorded pre-switch value and verified the restore, with R1.3's triple verified after the restore
- [R3.1] IF the iOS 18.5 simulator's system language is French THEN THE SYSTEM SHALL transcribe the widget gallery's Athan entries from a build of current `uat` and record which language each entry renders in
- [R4.1] WHEN step 4 ends THE SYSTEM SHALL leave in the local expo clone one new branch `feat/widgets-device-locale` based on the fetched `upstream/main`, whose commits change only the four device-locale files, with no push to either remote and nothing filed
- [R4.2] WHEN the description file is written THE SYSTEM SHALL give it What, Why, How, Testing and Anything else sections, the claim that every default preserves today's behaviour, and no app name, repository link, device serial or secret
- [R5.1] WHEN the records commit lands THE SYSTEM SHALL set row 117 to the final OWNER-LED cell of section 8 with measured values filled, set row 69 to section 8's SUPERSEDED cell verbatim, and append the held state to `ai/UPSTREAM-PRS.md`'s expo-widgets row
- [R6.1] WHEN the audit closes THE SYSTEM SHALL record two reviewer passes in `AUDIT.md`, each with a `Range:` and a `Findings:` line whose file exists, and `bash scripts/check-audit.sh ai/plans/117-widget-language-closeout` SHALL print `AUDIT OK`

## 6. Steps

Checklist (copied to `LOG.md` and ticked as each lands):

1. [ ] Step 1: the 3T as-found proof (lane-run, device)
2. [ ] Step 2: the 3T gallery fallback read with AVD rehearsal (lane-run, device)
3. [ ] Step 3: the iOS simulator gallery fallback read (lane-run, device)
4. [ ] Step 4: the upstream PR preparation, held (lane-run, code outside the repo)
5. [ ] Step 5: the records close (executor dispatch, docs)

Each step's file is under `steps/`. Weights: device 3, code 2, docs 1. Batch budget 3: a
device step always dispatches alone; steps 4 and 5 may share one batch.

## 7. Device proof

No build, APK or install is made for the 3T: the proof reads the phone as found, per D117.1.
The iOS half builds the current `uat` content for the simulator in the main tree under
`$HOME/athan-gitree/build.lock` (the lane's commits are records only, so the main tree's
`uat` content is the content under proof).

The 3T bracket, run before and after every contact:

```sh
adb -s 3T_SERIAL shell getprop ro.product.model        # ONEPLUS A3003
adb -s 3T_SERIAL shell dumpsys package com.example.athan.fleettest | grep versionName
# expected: versionName=2.0.1067 (the dispatch's named build; 2.0.1066 is the same audited
# widget-code class per D117.1 and records as such; any other version is the STOP below)
adb -s 3T_SERIAL shell getprop persist.sys.locale      # recorded, must match at the end
adb -s 3T_SERIAL shell settings get system system_locales  # recorded, must match at the end
adb -s 3T_SERIAL shell input keyevent KEYCODE_HOME     # then read the placed widget
```

The placed-widget read: one screenshot saved under `$HOME/athan-gitree/sessions/117/` (never
committed) plus the live accessibility tree read with the `agent-device` MCP snapshot (Android
9 `uiautomator dump` text is stale by `e2e/AGENTS.md`; the live tree is the readable dump).
Transcribe: row order, which side the time column renders on, the name script, the countdown
label's digits and unit letters, the footer language.

No clock change happens anywhere in this ticket, so no alarm dump is owed; the rule "read
`dumpsys alarm` before any clock change" does not engage. No notification, alarm or storage
path is touched.

Evidence: everything the steps read is written to `$HOME/athan-gitree/sessions/117/` and
transcribed into `LOG.md`; the folder dies with the DONE merge. The upstream artefact does
NOT live there (D117.5): it survives under `$HOME/athan-gitree/upstream/`. The 3T
language-picker mechanics this ticket measures stay in the session notes rather than the
atlas: this ticket changes no repository file on the device side (its scope), so the
write-back an executor might reach for is out of bounds here; the ticket that next drives
the 3T's language settings writes them back from the session notes if the notes survive
that long, or measures them again.

## 8. Records

The findings text written into `LOG.md` under `### Step 1 — as-found proof`,
`### Step 2 — gallery read (Android)`, `### Step 3 — gallery read (iOS)`,
`### Step 4 — upstream preparation held`, `### Step 5 — records closed`, each ending with a
`session:` line.

The queue cell the lead applies on close (measured values fill each `<slot>`; step 5's
commit lands the cell with the prefix `EXECUTED, audit owed` and the audit-close commit
fills `<N>`, drops the prefix and sets OWNER-LED):

> OWNER-LED 2026-10-18, investigation and preparation closed, audited (two reviewer passes,
> `<N>` findings adjudicated): the closeout landed clean - the 3T as-found proof confirms row
> 135's delivered face on the installed 2.0.1067 fleettest build (`<the transcription verdict:
> mirrored rows, time left of the Arabic names; the countdown label Latin digits with lowercase
> Latin h m>`; the phone left exactly as found: same build, app Arabic, widget placed, device
> locale unchanged, verified after every contact), the gallery's en fallback read live on both
> platforms (the 3T with device French: `<Android reading>`; the iOS 18.5 simulator with system
> French: `<iOS reading>`; `<one clause on the six-locale map falling back to the English base
> displayNames, the intended-shape record for parked row 130>`), row 69 SUPERSEDED for good,
> rows 128 and 129 closed with row 135's DONE, options 1 and 3 closed by her option-2 go. The
> upstream PR for the patch's device-locale hunks is PREPARED AND HELD: branch
> `feat/widgets-device-locale` off upstream main `<base sha>` in the local expo clone
> (`$HOME/athan-gitree/upstream/expo`), description at
> `$HOME/athan-gitree/upstream/pr-descriptions/widgets-device-locale.md`, the held state in
> `ai/UPSTREAM-PRS.md`; NOTHING filed - publishing is the hard-rule stop, her explicit word
> files it (row 51's discipline). WAITING ON HER: the word to file the PR (or drop it), and
> her glass read of the placed widget under Arabic on each phone (row 135's named pending
> acceptance). No app code changed on `uat`.

Row 69's status cell, verbatim:

> SUPERSEDED 2026-10-18 by rows 135 and 117, never re-queue: her option-2 go names the widget
> countdown's face as the app's lettered Latin design (row 135 delivered it on both platforms,
> row 117 proved it on the 3T), the colon format never returns. Was DEFERRED 2026-10-13 by the
> owner's priority call (the D77 split from row 63)

Row 132 stays PARKED unchanged; her filing word closes it.

The `ai/UPSTREAM-PRS.md` change: in the `expo-widgets+58.0.20` row's Upstream cell, replace
the full stop that closes the openApp PR sentence (the one after `(re-checked 2026-10-17)`)
with the appended text `; the device-locale half is PREPARED AND HELD (row 117, 2026-10-18):
branch feat/widgets-device-locale off upstream main <base sha> in the local clone, description
under $HOME/athan-gitree/upstream/pr-descriptions/, nothing filed, the owner's explicit word
files it.` so the cell ends `files it.`.

Docs commit messages: step 5's executed commit is
`<VERSION> - docs(plans): ticket 117 executed: the closeout reads recorded, the PR prepared and held`;
step 5's records merge is
`<VERSION> - merge docs/117-records-<date>: ticket 117 EXECUTED, the closeout records landed`;
the audit merge is
`<VERSION> - docs(audit): ticket 117 OWNER-LED: the proof, the reads, the held PR, plan folder and evidence dead`.

## LOG.md ledger contract

Every step entry in `LOG.md` opens with `### Step <NN> — <state>` and ends with
`session: <ses_id>`. Planning sections use `## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass; in this lane
the orchestrator pushes `uat`.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| `dumpsys package` shows neither fleettest nor production id at 2.0.1067, and not 2.0.1066 either | The phone is not in the named acceptance class | STOP: report the found versionName, touch nothing |
| The placed widget renders the loading or neutral face at the as-found read | The snapshot is stale or the placement broke before this ticket | Record it as a finding; do not re-place, do not launch the app to refresh; the finding rides the row |
| The countdown label or mirroring mismatches row 135's face | A regression on the final build | Record with the transcription; no code fix in this ticket (the scope forbids app changes); the finding rides the row and the return |
| Android 9 language picker differs from the AVD rehearsal | OEM skin difference | STOP the 3T half and report; the AVD is never the witness (D117.2). The lane then either rules an amendment to D117.2 recorded in `LOG.md`, or leaves the Android half unread with the gap named in the row |
| The 3T locale does not restore to the recorded value | The restore path failed | Repeat the verified restore cycle from the rehearsal; if it fails twice, STOP and report the exact `getprop` and `settings` readings |
| Upstream `main` moved the four files' signatures | The hunks do not apply clean | Port by hand onto the current signatures, record the delta in the description's How; if a file was deleted upstream, record that and prepare the remaining three |
| The iOS build fails in the main tree | Toolchain weather | One retry after `git status --porcelain` confirms a clean tree; a second failure STOPs step 3 with the build log tail recorded |
| A merge conflict on `ai/plans/README.md` or the version files | Lane weather | Abort, rebase the lane branch onto `uat`, resolve keeping both lanes' rows and the higher version, retry once, then STOP if it still conflicts |

Anticipated review fixes, word for word: a reviewer finding the row 69 cell kept its
"Was DEFERRED" tail reads section 8: the tail is kept on purpose (history in the cell). A
reviewer finding no red tests in the steps reads each step's "Red tests: None" line: this
ticket changes no code, so no test can go red; the device steps' failure modes are the
symptom table's STOPs.

Restore lists: step 1 restores nothing (read-only). Step 2 restores the 3T device locale.
Step 3 shuts the simulator down. Step 4 deletes nothing; a redo deletes the branch and the
description file and rebuilds both. Step 5's restore is `git revert` of the docs commit.

## 11. Subagents

Planning: `explore` answered nothing (the facts were read directly); `athan-plan-griller`
grills this draft. Delivery: steps 1 to 4 are lane-run per D117.8 (device MCP, the upstream
clone's bounds), step 5 dispatches one `athan-executor` naming the lane worktree
`$HOME/athan-gitree/worktrees/lane-117`, the lock family and that merges into `uat` happen
only in the main tree under `uat.lock` (the executor commits on `lane/117`; the lane merges).
If that dispatch cannot run, the lane runs step 5 itself and records it in `LOG.md`. Audit:
two `athan-reviewer` dispatches (plan-conformance with the plan folder, blind without it),
each handed the commit range and a findings file. `vision` is available for images; the lane
reads its own screenshots when it can see them.

## 12. Report to the owner

Plain sentences: the proof's verdict, the two gallery readings, row 69's closure, the held
PR's location and the two decisions waiting on her (the filing word, the glass read). Then
the progress table, then the four-line handoff block. Nothing after it but the agent-ruled
decision table.
