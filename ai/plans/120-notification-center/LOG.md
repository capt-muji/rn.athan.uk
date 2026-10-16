# LOG: ticket 120, the iOS delivered-notification stack

## Ticket 120

Queue row 120, "iOS Notification Center: group or clear the delivered stack
(threadIdentifier)", ordered by the owner at the 111 planning session on 2026-10-16. Lane
`lane/120`, worktree `$HOME/athan-gitree/worktrees/lane-120`, cut from uat `b329d543` (2.0.900) and
rebased onto uat `9dd4eb6a` (2.0.908) before the READY merge, the lane-weather rule for the
version-file conflict the first merge hit (see the re-pin entry below). Deliverable: measurement and writing only. No code, no build, no device contact.

The plan is `PLAN.md`; the findings are `FINDINGS.md`; the protocol is `PLAN.md` section 7.

## Planning (2026-10-16)

### Frontier, agent-ruled (the owner is hands-off)

| ID | Question | Answer | For | Against |
| --- | --- | --- | --- | --- |
| D120.1 | Code, or investigation first? | Investigation only, recorded as the row's own order | Row 120 says "INVESTIGATION FIRST: she rules the shape before any code"; precedent rows 65, 66, 117 to 123 | A code sketch would give the ruling something to see, but every lever touches ask-first scheduling logic |
| D120.2 | Which evidence order? | App code and the pinned package's own source first, the package changelog second, the vendor's published notification documentation third, every device-only claim tagged UNMEASURED | The row's facts are code facts; codegraph and the installed tree answer them at the pinned version | The vendor notes are older than the phone's OS, so they are premises, not readings |
| D120.3 | What is the recommendation? | Clear the delivered stack when the app opens, iOS-gated | The complaint is accumulation; removal is the only lever that shortens it; the moment already exists in the init path; the delivered set is a separate set from the armed schedule | It removes an unread notification when she opens the app next; answered by the app's own screen being the record at that instant, and by Android already being stricter |
| D120.4 | Is thread grouping the answer? | No, as the primary lever: with one thread the app already has one group, and the pinned JS input cannot name a header | WWDC18-710 notes plus `Notifications.types.d.ts:538-631` (input has `threadIdentifier`, no summary field); grouping removes nothing | It is the lever the release note names, and two threads do split the app's notifications visibly; that split is a rider she can take, not the fix |
| D120.5 | Can a notification be replaced in place on iOS? | No: not through the identity the app owns | `device/notifications.ts:46-52` (the identity is the idempotent re-arm key and is date-scoped); one identifier collapses the 64-budget candidate-row arming | An Apple-side same-identifier update of a delivered notification would be a lever, but the app never re-adds a past date, so it cannot be aimed |
| D120.6 | iOS-only, or both platforms? | iOS-only for every lever | `ai/AGENTS.md:98` and `:130-133` freeze the Android face; Android's dismissal routes to `cancelAll()` (`ExpoPresentationDelegate.kt:275-277`) and its group key is an unverified visible change | One shared rule would be simpler to hold in the head; it costs an unmeasured Android face |
| D120.7 | Do reminders need their own thread? | No: they clear with everything else, and join the athan thread if grouping is ever taken | A reminder and the athan it warns about are one event, minutes apart | A separate thread would let her see reminders apart from athans; nothing in the row asks for that split |
| D120.8 | Does a findings file survive DONE? | No: the queue row carries the answer | No shipped code or config would cite one; precedent rows 65, 66, 117 to 123 | A surviving protocol file would save a `git show` later; the deep-clean rule wins |
| D120.9 | Who runs the three docs steps? | The lane itself, recorded here; the grill and the audit reviewers dispatch as workers | The steps are measurement and writing with no red-green loop, and the lane holds the measurements | A dispatch would protect the lane's context; it would also re-measure what planning already measured |

### Measurements taken at planning (device-free)

- The app-tree sweep for the four delivered-notification APIs is empty, at the plan's base:
  `grep -rn "dismissAllNotificationsAsync\|dismissNotificationAsync\|getPresentedNotificationsAsync\|setBadgeCountAsync" app device hooks shared stores plugins --include='*.ts' --include='*.tsx' --include='*.js'`
  prints nothing.
- `node_modules/expo-notifications` resolves to 58.1.4. iOS thread support landed in 58.0.0
  (`CHANGELOG.md:118`, expo/expo#49429) and the field is assigned onto the outgoing content
  (`NotificationRecords.swift:368-369`); Android support landed in 58.1.1 (`CHANGELOG.md:31`,
  expo/expo#43388) and maps to the group key (`ArgumentsNotificationContentBuilder.java:51`).
- The JS content input carries `threadIdentifier` and no `summaryArgument`
  (`Notifications.types.d.ts:538-631`), so a thread's header cannot be named from app code.
- The iOS delivered-set APIs touch delivered notifications only
  (`PresentationModule.swift:12-39`); Android's routes to `cancelAll()`
  (`NotificationsService.kt:175`, `ExpoPresentationDelegate.kt:275-277`).
- The init path runs at cold launch (`app/index.tsx:115-138`) and on every foreground return
  (`device/listeners.ts:46-69`) and never from the background task (`device/tasks.ts:21-49`).
- Row 111's XS ledger records three delivery events for one prayer's evening on her
  configuration: 17:38, 18:03 and 18:08 (`ai/plans/111-sdk58-stable-repin/LOG.md`, "Step 4, R4.2").
- The XS is attached and locked; the refusal signature matches row 111's resume record
  (automation prepare times out, the runner destination fails, the launch fails to allocate the
  device). No reading was taken and none is faked.

### Pre-flight and the gate

`scripts/preflight-120.sh` was run from the worktree root: `PREFLIGHT OK` (branch `lane/120`,
tree clean apart from the plan folder, 8 anchors each counting 1 in its own source, the pin at
58.1.4, all nine installed-package citations present, the app-tree sweep empty). The gate
`bash scripts/check-plan.sh ai/plans/120-notification-center` prints `PLAN OK`.

### The grill (athan-plan-griller, dispatched cold, 2026-10-16)

The griller read the plan folder at its own md5 and ran both gates itself. It raised sixteen
findings, 6 must, 7 should, 3 nice. Every one was adjudicated against the code; none was
rejected. Applied, with the finding number it answers:

- F1, F7 branch choreography: the pre-flight's branch check now names the moment it runs, and
  every step commits on `lane/120` and merges into `uat`, so no step's base is a branch that
  predates the previous step's committed findings.
- F2, F3, F4 counts: ten repository files and nine installed-package files named exactly; eight
  anchors (the tenth anchor is now counted by the pre-flight too); the pre-flight greps all nine
  installed-package citations, so its claim is true.
- F5, F6, F13 acceptance: R4.1 now names each read's tool and bounds the log window; R4.2's event
  is the not-observed record with row 111's resume record cited; R5.1's event is step 3's EXECUTED
  write, and the outcome text keeps its audit verdict for the audit that runs.
- F8 step 2's missing merge line; F14 FINDINGS section 2 moved into step 1, whose subject is the
  current state.
- F9 `shared/types.ts` and `stores/notifications.ts:1836-1876` added to the code map, the second
  being where R1.4's background-task claim is shown.
- F10 the read-side type range corrected to `Notifications.types.d.ts:450-480`, `summaryArgument`
  at `:466`.
- F11 the WWDC18-710 claim now carries the transcription's URL, so a reader can check it.
- F12 the third delivery event is stated as derived from the armed time, never as something the
  ledger says.
- F15 the pre-commit symptom row now names what can actually fail.
- F16 the empty `steps/` directory deleted.

Two candidates the griller saw as already fixed mid-read (the channel-block range and the at-time
arm range in section 4, and `PresentationModule.swift:12-42` in section 4's installed-package
bullet) were corrected before its report and are recorded here so the sequence is not lost. The
same citation stood uncorrected in FINDINGS section 1.4 and in section 8's draft until the audit,
which is where the plan-conformance pass caught it. The plan files changed three times while the griller read; every finding above is
confirmed against the revision it named.

### The re-pin the rebase surfaced (agent-ruled, 2026-10-16)

The lane's first merge attempt conflicted on the version files, so the lane branch was rebased
onto `uat` under the lane-weather rule. The rebased lockfile carries sibling lane 111's SDK 58
re-pin (merged at 2.0.908), and the worktree's reinstall moved `expo-notifications` from 58.1.4
to 58.1.5: the plan's own section 2.2 STOP fired, and re-measuring is the lead's job under that
rule, not a replan's.

Re-verified at 58.1.5, every pinned citation the plan rests on: the iOS thread-identifier
assignment (`NotificationRecords.swift:297,369`), the scheduler's content build
(`SchedulerModule.swift:135`), the JS input's `threadIdentifier` and the read side's
`summaryArgument` (`Notifications.types.d.ts:613`, `:450-480`, `:466`), the Android group-key
mapping (`ArgumentsNotificationContentBuilder.java:51`, `NotificationData.kt:62`), the three
delivered-set routes (`PresentationModule.swift:12,22,33,36-37`), the Android dismissal route
(`NotificationsService.kt:175`, `ExpoPresentationDelegate.kt:277`). All hold. Only the changelog
line numbers moved, with the entries still under the same version headings: the iOS grouping
entry (58.0.0, expo/expo#49429) from :118 to :125, the Android one (58.1.1, expo/expo#43388) from
:31 to :38. 58.1.5 itself carries one dependency bump (`expo-application` 58.1.2) and touches
neither grouping nor dismissal, so no conclusion moves.

Applied: the plan's version references and both changelog citations, FINDINGS section 1.4, and the
pre-flight's pin constant now read 58.1.5, and the pre-flight's greps for the six citations the
grill found unchecked were added and pass at the new pin.

## Ticket 120, execution

### Step 01 — DONE (the current state, the pinned lever surface and the delivered volume)

- Executed by the lane itself (D120.9), not a dispatched executor: the steps are measurement and
  writing with no red-green loop, and the audit's two reviewers reproduce every number cold.
- Anchors: all eight count 1 at the pre-flight's run on `lane/120` (`PREFLIGHT OK`), re-run after
  the rebase onto `uat` at 58.1.5.
- Evidence, saved under `$HOME/athan-gitree/sessions/120/`: `step1-evidence.txt` (the four-API
  sweep, empty; the pinned-source reads at 58.1.5; the Android delegate's shared tag; the three
  open moments) and `step2-evidence.txt` (row 111's delivery entry and recorded configuration;
  the reminder and alert contracts; the 111 evidence index, which holds no center capture).
- FINDINGS sections 1 and 2 refined against that evidence: the entry-point table, the pinned lever
  table at 58.1.5, the delivered volume (seven for the recorded day: five at-time deliveries plus
  the two Magrib reminders, the second derived from the armed time), and the rendering still marked
  `UNMEASURED`. The one edit this step's own commit carries in FINDINGS is
  `PresentationModule.swift:12-42` to `:12-39` (the file is 39 lines); the changelog line numbers
  (`:125` and `:38`) were re-measured in the READY amendment, not here, and the read-side range
  correction was still outstanding until the audit (AUDIT.md, pass 2 finding 1).
- The sweep prints nothing; the volume's inputs are quoted at `shared/types.ts:196-220` and in the
  111 ledger's configuration line.
- Commit: one step commit on `lane/120`, merged `--no-ff` into `uat`, no push (the shas are git history).

session: ses_eba1fe750ffeUVW5hmC6nRcLKY

### Step 02 — DONE (the options, the frozen-rule blast radius and the recommendation)

- FINDINGS section 3 refined: the lever table now carries the status quo as its own row, so every
  option of section 5 has a mechanism, the files a code step would touch and a line in the
  frozen-rule table (R3.1); the recommendation names the rival it beat, option B, and its
  falsifier (R3.2).
- The seven frozen rules each carry a row, including the user's own grouping and summary settings
  and the date-scoped identity contract. Android's two levers are recorded as deliberately unused:
  the group key would change a frozen face, and the dismissal call routes to `cancelAll()`.
- No new measurement: this step reads the pinned sources already cited in section 1.4 and the code
  of section 1.2, and no claim here is device-dependent.

session: ses_eba1fe750ffeUVW5hmC6nRcLKY

### Step 03 — DONE (the XS experiment, the not-observed record and the outcome text)

- FINDINGS section 4 refined: the not-observed record now cites row 111's resume record for the
  locked state and names her unlock as the prerequisite (R4.2), and names the recovery route for
  the protocol after the plan folder dies.
- FINDINGS section 5 unchanged in substance: the residual unknowns and the two waits.
- The queue row set EXECUTED carrying the options, the recommendation, the frozen-rule blast
  radius, the protocol's reading list and the two waits (R5.1). The audit verdict is deliberately
  absent from that text: it is written by the audit's merge, not by this step.
- No device contact: the phone's state is cited, never probed, and nothing is faked.

session: ses_eba1fe750ffeUVW5hmC6nRcLKY
