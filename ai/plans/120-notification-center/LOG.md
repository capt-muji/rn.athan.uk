# LOG: ticket 120, the iOS delivered-notification stack

## Ticket 120

Queue row 120, "iOS Notification Center: group or clear the delivered stack
(threadIdentifier)", ordered by the owner at the 111 planning session on 2026-10-16. Lane
`lane/120`, worktree `$HOME/athan-gitree/worktrees/lane-120`, branched from uat `b329d543`
(2.0.900). Deliverable: measurement and writing only. No code, no build, no device contact.

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
  (`PresentationModule.swift:12-42`); Android's routes to `cancelAll()`
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
tree clean apart from the plan folder, 7 anchors each counting 1 in its own source, the pin at
58.1.4, the pinned-source lines present, the app-tree sweep empty).
