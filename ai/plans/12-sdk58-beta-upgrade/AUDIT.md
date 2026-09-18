# Audit: Session 12. SDK 58 beta upgrade + alarmClock + largeIcon

| Field | Value |
| --- | --- |
| Audited by | Audit session on GLM 5.3, 2026-09-18 |
| Scope | Every commit on `origin/uat-2..uat-2` (16 commits: five step commits, their five merges, the owner-ruled tls13 fix and its merge, the executed and progress docs commits and their merges) |
| Scratch worktree | `~/athan-device-sweep/worktrees/audit-12` at `uat-2`, `node_modules` symlinked from the main checkout, removed after the audit |
| Verdict | PASS. Row 6 set DONE. `uat-2` pushed. |

## 1. What I checked, with the proof for each

### 1.1 The range

`git log --oneline origin/uat-2..uat-2` lists 16 commits. Every one belongs to session 12: the five
step commits (`a7cad721`, `3b7ebefd`, `ae92414d`, `2d257511`, `b69db171`), their five `--no-ff`
merges, the owner-ruled `fix(tls13)` commit `8c00a19a` with merge `d394faf9` (see finding F1), and
the `executed` (`94ff5641`, merge `cb08b5d2`) and `progress` (`e853f0e2`, merge `37c1cfe4`) docs
commits. The range holds no planning or audit commit: `origin/uat-2` sits at `3c990bb5`, the
planning merge the planning session pushed. Nothing in the range is foreign to the plan.

`git diff --name-only origin/uat-2..uat-2` lists 18 files, all expected: the plan's step files, the
three plan files (`ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`), the step 5 target
`ai/AGENTS.md`, the records file `ai/features/uat-2/AUDIT-FINDINGS.md` (section 8 allows it), and
the owner-ruled `modules/tls13/android/build.gradle`.

### 1.2 Plan against commits

Read every step file in full, then `git show` of each step commit.

| Step | Commit | What matched |
| --- | --- | --- |
| 1. The wave | `a7cad721` (1.27.222) | `package.json` diff equals the plan's 28-row table plus exactly the five owner-ruled peer packages (`@expo/log-box`, `@expo/metro-runtime`, `@expo/dom-webview`, `react-dom`, `@react-native/metro-config`), all recorded in `LOG.md` with the owner's ruling and re-confirmation. `List.tsx` import, `ViewInstance` ref and the idle-callback pair match the contracts word for word; `RamadanDecorations.tsx` is the 3-tuple; `jest.config.js` maps the three `src/private` requires to file paths; `jest.components.setup.js` carries the idle pair verbatim; the appended `List.test.tsx` block is the plan's verbatim. `app.json` changed by version only. |
| 2. Delivery | `3b7ebefd` (1.27.223) | `ALARM_CLOCK_DELIVERY` in `shared/notifications.ts` exactly as specified, placed after `EXTRAS_NOTIFICATION_SOUND`; both trigger sites in `device/notifications.ts` carry `delivery: NotificationUtils.ALARM_CLOCK_DELIVERY` and nothing else changed; the two appended tests are verbatim, Silent inputs as the plan rows say. |
| 3. Large icon | `ae92414d` (1.27.224) | `app.json` gains exactly the one `largeIcon` line under `icon`. The new `shared/__tests__/nativeConfig.test.ts` is the plan's verbatim content with one deviation: the `pluginProps` find expression is wrapped as Biome demands, tokens identical. That is the owner-ruled line-shape fix, recorded in `LOG.md`; the rest of the file is byte-identical (checked against the plan text and the spike copy the LOG names). |
| 4. Nested widgets | `2d257511` (1.27.225) | All ten widget entries match the plan's table exactly; the lock pair carries no `contentMarginsDisabled`; names, display names and descriptions unchanged; no top-level `supportedFamilies` or `contentMarginsDisabled` remains; the test additions are verbatim. |
| 5. Stack docs | `b69db171` (1.27.226) | Verification line with 1.27.226, the eight version cells, the ahead-pins paragraph now saying SDK 58 and three packages, the reanimated and worklets rows deleted, `@types/node` sentence kept. |
| tls13 | `8c00a19a` (1.27.227) | Out-of-plan by design: the plan's section 10 build-failure stop fired, the owner ruled "Bump tls13 to compileSdk 37", and the one-token change (`compileSdk 36` to `37`) is its own version-bumped, reviewed commit. Recorded in `LOG.md`. |

Commit messages match the plan's texts with the versions filled (steps 1 to 5 checked against the
step files). Versions run in sequence 1.27.221 to 1.27.229; `app.json`, `package.json` and
`android/app/build.gradle` agree at every commit I checked and at head (all three read 1.27.229).

### 1.3 The tests still guard

Saved each step's break script from the plan text to `$TMPDIR` (grep for the main checkout path in
each script prints nothing), ran all five from the scratch worktree root:

```text
breaks-12-1: caught: idle scheduler / cancel stops nothing / mapper to nowhere, caught=3 missed=0, ALL AS EXPECTED: 1
breaks-12-2: caught: constant becomes bestEffort / at-time delivery dropped / reminder delivery dropped, caught=3 missed=0, ALL AS EXPECTED: 1
breaks-12-3: caught: largeIcon swapped / largeIcon dropped, caught=2 missed=0, ALL AS EXPECTED: 1
breaks-12-4: caught: lock widget un-nested / margins alias returns, caught=2 missed=0, ALL AS EXPECTED: 1
breaks-12-5: caught=0 missed=0, ALL AS EXPECTED: 1
```

Red check rerun for the riskiest step (step 2, the delivery change): reverted
`shared/notifications.ts` and `device/notifications.ts` to `3b7ebefd^` in the worktree and ran the
suite. The two delivery tests failed with exactly `Expected: "alarmClock" / Received: undefined`,
the other 23 passed (`Tests: 2 failed, 23 passed, 25 total`). Restored from HEAD; tree clean.

### 1.4 The whole suite

`yarn validate` in the scratch worktree: exit 0, `Statements 100% (3969/3969)`, `Branches 100%
(1712/1712)`, `Functions 100% (826/826)`, `Lines 100% (3566/3566)`, `Test Suites: 160 passed, 160
total`, `Tests: 2 skipped, 4533 passed, 4535 total`. The two skips are the audioMatrix
prebuild-dir pair, which the plan's own spike note predicts for a bare worktree; the main checkout
runs them (the executor's hook lines recorded 4535 passed there).

### 1.5 Reviews

`LOG.md` records a MERGE verdict from Code Reviewer (GLM 5.3) for every step commit, one round
each, no findings. The tls13 fix took two rounds: round 1 asked for the LOG record the commit
message cites; the amended commit satisfied it. I reread both docs commits myself
(`94ff5641` applies the records text, the EXECUTED row and the LOG device-proof record;
`e853f0e2` appends the final report record only) and they match what happened. The one fix a
reviewer prompted (the tls13 LOG record) is recorded in `LOG.md` with its full mishap story, so
the no-LOG-entry rule is satisfied.

### 1.6 Device evidence

Every file the records text cites exists under `~/athan-device-sweep/session12/` and I checked the
numbers myself:

- `alarms-after.txt`: 5 `NOTIFICATION_EVENT` rows (Asr 16:18 and Magrib 19:11 today, Fajr 05:09,
  Asr 16:16 and Magrib 19:09 tomorrow), each with `window=0` and the `Alarm clock:` sub-block
  (triggerTime plus a showIntent into `com.mugtaba.athan`), plus the expected year-2036
  FORCE_STOP_RESCHEDULE row (`when 2105099857150`, no sub-block). The system's "Next alarm clock
  information" slot is our 16:18 alarm. The seventh `com.mugtaba.athan}` line is "Next wake from
  idle", not an alarm row. This is the owner-accepted proof form (their ruling, in `LOG.md`).
- Build logs: `BUILD-PROD OK` (prod APK 68,210,641 bytes, versionName 1.27.227, built from
  `d394faf9`, locally with Gradle, no EAS) and `BUILD-MOCK OK` (mock APK, same source commit).
  `grep -c "Missing class"` on both gradle logs: 0 and 0.
- `runtimeversion.txt`: zero `runtimeversion` lines, as the plan predicts (no policy set).
- The phone, read with read-only adb: `auto_time` prints 1, `com.mugtaba.athan` versionName
  1.27.227 (the mock build of the merged head), Athan's `MainActivity` is the focused window.
- Screenshots: vision (GLM 5.3 Flash) re-read them for this audit. `shade-before-open.png`: the
  Athan notification is text-only, no square image (matches the records' baseline).
  `shade-after-open.png` and `fire-foreground.png`: title "Asr now", a roughly 95x95 mosque-art
  square on the notification's right, absent in the before pair (matches the records, including
  the owner-ruled "where Android places it" wording). `statusbar-armed.png`: no alarm-clock icon
  anywhere in the status bar. `sheet-settings.png`: a clean sheet with title and rows, no glitch.
  `overlay-after-toggle.png`: the overlay is open (huge "4h 40m" hero for Isha), exactly one row
  visible at y 1402 to 1445, which is the row's true post-toggle position (the LOG's comparison
  numbers), so the re-measure ran. See finding F2 for why I re-read this one.

### 1.7 The owner's rules

`git diff origin/uat-2..uat-2 -- releases.json` is empty. `uat` and `origin/uat` both sit at
`86ab4018` (untouched). No EAS build or push appears anywhere; both APKs were built locally and
the build records say so. The range diff contains no API key, gateway address or domain, and no
`biome-ignore`, `istanbul ignore`, `c8 ignore` or `eslint-disable` line was added. Every commit
message carries the hook's `Tests:` line and four 100% coverage lines, so no hook was skipped.
No visual change beyond the owner-chosen large icon; no prayer time was copied, averaged or
invented.

### 1.8 The records

`AUDIT-FINDINGS.md` carries the plan's section 8 text under the heading
`# Session 12 of the queue: the SDK 58 beta wave, alarm-clock delivery and the large icon,
2026-09-18`, with the two owner-ruled phrase adjustments (the `Alarm clock:` sub-block form and
the large icon "where Android places it") and every placeholder filled with the measured values I
verified above. The row in `ai/plans/README.md` read EXECUTED before this audit set it DONE.

## 2. Findings

- **F1, process, disclosed and harmless.** The tls13 review's `git checkout --detach` left the
  shared checkout on a detached HEAD, so the reviewer-approved amend became `8ecc2e35` outside the
  branch and the merge carried `8c00a19a`, which lacks the LOG ruling record. The executor
  disclosed this in `LOG.md` and restored the ruling text by hand in the executed docs commit. I
  verified `git diff 8c00a19a 8ecc2e35` touches only `LOG.md` (+5/-1) and that the final ledger on
  `uat-2` carries everything `8ecc2e35` carried. `8ecc2e35` dangles unreferenced and will be
  garbage-collected; nothing references it.
- **F2, process, claim verified.** Plan 7.7 item 2 asks vision one question about
  `overlay-after-toggle.png`; the executor substituted its own row-position comparison and did not
  record a vision answer. My own vision (GLM 5.3 Flash) read initially found "no highlight box"
  because the overlay shows no literal box: it hides every row but the selected one and draws the
  hero for it. A second, full-screen read confirmed the selected Isha row at y 1402 to 1445, the
  true post-toggle position, with the "4h 40m" hero matching Isha's countdown. The claim in the
  records stands; the proof method deviated from the plan without an owner ruling. Noted, nothing
  to repair.
- **F3, evidence gap, noted.** The records phrase "a prayer fired at the minute in the foreground
  with the banner" rests for its banner clause on the app's foreground handler (which returns
  banner presentation) plus the on-time posting, not on a capture: the LOG records plainly that
  the wait loop keyed on host time and the capture landed at 16:20, after the 16:18 fire. The
  fire, the foreground state, the posting and the no-deferral reading are all backed by files. The
  LOG tells the truth; the findings text keeps the plan's inherited phrase under the owner's
  "everything else verbatim" ruling. Left as written; the owner can order it reworded.
- **F4, records wording, noted.** The parenthetical "(5 rows, 0 logged schedules - the release
  build's logger emits no `Scheduled:` lines, so the logcat cross-count is not measurable in a
  release build)" extends the owner's two-phrase ruling by a clause. It is accurate and necessary:
  a bare "0 logged schedules" would read as the armament not matching. Left as written.
- **F5, outside this session, flagged.** Two stale agent worktrees from the session 5 era sit
  under `.claude/worktrees/` at commits `d160e894` and `f2d48405`, which are NOT ancestors of
  `uat-2`, each holding an untracked `.coverage-scratch/`. They are not session 12's and hold
  unmerged work, so I did not remove them. Reported to the owner for a decision.
- **Owner rulings during execution.** Seven decisions were taken through the question channel
  (the five peer packages, deleting `expo-env.d.ts`, Biome's line shape in the step 3 test, tls13
  compileSdk 37, rebooting the phone, accepting the `Alarm clock:` sub-block as the dumpsys proof,
  and the two records phrase adjustments). All are recorded in `LOG.md`. I copied a summary of
  them into `ai/prompts/README.md`, where the owner's decisions live, in this audit's docs commit.

## 3. Verdict

**PASS.** Every step does what its plan specified and nothing else; every guard still fails when
broken; the whole suite is green at 100% on all four measures; the reviews and the docs commits
check out; the device evidence backs the records; no owner rule was bent. The findings above are
notes and disclosures, none of them a defect in what shipped. Row 6 of `ai/plans/README.md` is set
DONE, the `ai/prompts/README.md` row is applied from the plan's section 8 (with the same
measured-form adjustment the owner ruled for the findings text: the row says `window=0` with the
`Alarm clock:` sub-block, not the Android-12-class `flg=0x9` reading), and `uat-2` is pushed.

## 4. Revert audit, 2026-09-18 (post-DONE): the large-icon revert

| Field | Value |
| --- | --- |
| Audited by | Audit session on GLM 5.3, 2026-09-18 |
| Scope | `e2b1f784..9f385d95` on `uat-2`: the revert `19573d93` (1.27.231) with merge `7a9650bd`, the docs commit `84b2bd4d` (1.27.232) with merge `9f385d95` |
| Reason | The owner reviewed the session 12 shade proof pair on 2026-09-18 and rejected the Android notification large icon introduced by `ae92414d` (step 3) |
| Verdict | PASS, with three records repairs made by this audit. `uat-2` pushed. |

### 4.1 What I checked, with the proof for each

1. **The range.** `git log --oneline e2b1f784..9f385d95` lists exactly the four commits above.
   `git diff --stat e2b1f784..9f385d95` touches five files: `app.json`, `package.json`,
   `shared/__tests__/nativeConfig.test.ts`, this folder's `LOG.md` and `ai/plans/README.md`.
   `git diff 7a9650bd^1 7a9650bd` and `git diff 9f385d95^1 9f385d95` equal their branch
   commits' diffs, so both merges are clean.
2. **Scope of the revert.** `git show 19573d93` changes exactly: the version cells, the one
   `largeIcon` line under `icon` in the expo-notifications plugin, and in `nativeConfig.test.ts`
   the `declares the Android large icon` describe block plus the header sentence that named it.
   No session-12 feature was collateral, verified on the tree at `9f385d95`:
   `modules/tls13/android/build.gradle` still reads `compileSdk 37`; `ALARM_CLOCK_DELIVERY`
   still lives in `shared/notifications.ts` (the constant) and at both trigger sites in
   `device/notifications.ts`; `package.json` still pins `expo` `58.0.0-preview.3`; the widget
   entries stay nested under `ios` in `app.json`.
3. **Completeness.** A repo-wide grep for `largeIcon`, `large icon` and `large-icon` leaves only
   historical records (this folder's `PLAN.md`, `LOG.md` and step file, the session 12 section
   of `ai/features/uat-2/AUDIT-FINDINGS.md`, the programme doc's session 12 brief), an
   unrelated play-button comment in `shared/constants.ts`, and three live documents that still
   asserted the icon adopted (findings FR1 to FR3, fixed below). Red check in the scratch
   worktree `~/athan-device-sweep/worktrees/audit-12r` at `uat-2`: with the `largeIcon` line
   restored in `app.json`, `npx jest shared/__tests__/nativeConfig.test.ts --watchman=false
   --selectProjects=unit` passes 1/1, so no orphan guard pins the removed entry anywhere.
   Worktree removed afterwards.
4. **Gates, rerun by this audit.** `yarn validate` at `9f385d95` in the main checkout: exit 0,
   `Test Suites: 160 passed, 160 total`, `Tests: 4534 passed, 4534 total`, coverage 100% on all
   four measures (3969/3969 statements, 1712/1712 branches, 826/826 functions, 3566/3566
   lines), matching the LOG's claim; the count is the pre-revert 4535 minus the removed
   expectation. `android/app/build.gradle` `versionName` reads 1.27.232 in this checkout, so
   autonomous ruling 1 (the git-ignored lockstep bump) held.
5. **Records.** The LOG revert record names the owner's rejection, the exact revert contents,
   the gates and the three autonomous rulings; I judge each ruling sound. The lockstep bump is
   the ritual `EXECUTOR-BRIEF.md` section 4 item 6 prescribes. The docs-commit shape follows
   section 4b. The row-6 brief reading picked the right cell. The row 6 brief in
   `ai/plans/README.md` no longer names the large icon. `git diff e2b1f784..9f385d95 --
   releases.json` is empty, so `releases.json` is untouched.
6. **Push state.** After `git fetch origin`: `origin/uat-2` sits at `9f385d95`, equal to
   `uat-2`; `uat` still sits at `86ab4018`, untouched.

### 4.2 Findings

- **FR1, records, fixed.** `ai/AGENTS.md`'s SDK 58 programme entry still said "Also adopted: the
  Android notification `largeIcon`", present tense, in the memory every session reads first.
  Annotated with the revert: 1.27.231, owner-rejected on the shade proof.
- **FR2, records, fixed.** `ai/prompts/README.md` (the audit-owned file; the executor is barred
  from it) still titled queue row 12 "+largeIcon", and its planning-decision bullet ended on the
  owner's reserved right to revert without the outcome. The row now mirrors row 6's title, and
  both the row and the bullet carry the revert.
- **FR3, records, fixed.** `ai/plans/SDK58-PROGRAMME.md`'s adoption summary (item 10) and ruling
  log cell still read "Yes, adopt" with no trace of the same-day revert; planners of sessions 13
  to 17 read this file as their brief. Both annotated.
- **FR4, process, noted.** The revert and its docs commit reached `origin/uat-2` without a Code
  Reviewer pass or a prior audit. The executor disclosed this in LOG ruling 2 and kept
  "reviewed" out of the merge messages. This audit is that review: the diff read line by line,
  the gates rerun, completeness proven. No defect in what shipped.
- **FR5, history, left as written.** The session 12 plan, step file, programme brief and
  findings narrative still describe the icon as shipped. They are accurate for their time, and
  the LOG revert record is the arc's continuation. Rewriting them would falsify history.

### 4.3 Verdict

**PASS.** The revert touches exactly what the owner rejected and nothing else; no session-12
feature was collateral; nothing orphaned remains after this audit's three records repairs; the
gates pass at 100% on all four measures; the records tell the truth. The repairs and this
section ride the docs commit 1.27.233, reviewed once by Code Reviewer (GLM 5.3); `uat-2` pushed.
