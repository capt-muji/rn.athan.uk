# LOG

## Planning (2026-10-18)

## Ticket 117

Session: ses_eb107ebc1ffe2rOoS7HME222Ga (lane 117, planning).

Cold start verified: `uat` HEAD `164df7bd` (2.0.1069), `origin/uat` synced, no lane locks
held, no `lane/117` branch or sibling session on this ticket before the worktree was
created (lane 116's worktree exists beside it; the queue rows it edits are not rows 117 or
69, and merge weather on the queue file is governed by the symptom table).

The frontier worked agent-ruled, ten decisions, recorded in PLAN.md section 2.1
(D117.1 as-found proof, D117.2 3T gallery witness with AVD rehearsal, D117.3 iOS
simulator half, D117.4 French, D117.5 artefact outside the repo, D117.6 row 69 SUPERSEDED,
D117.7 OWNER-LED close, D117.8 lane-run steps 1 to 4, D117.9 no alarm audit,
D117.10 two audit passes).

Facts measured at planning, not ruled: the patch's three features and the four locale
files; the four JS read sites of `__expoWidgetDeviceLocale`; the six-locale native-string
map in `app.json` beside the English base displayNames; the picker mechanics in the 3T
atlas; the local expo clone's remotes and sibling PR branches; the iOS 18.5 simulators
`Athan-76` and `Athan-77`; the version guards' outputs (`VERSIONS OK`, the merge-check
arm being the pre-merge hook's); 2.0.1067 and 2.0.1069 being records merges over 2.0.1066's
audited widget code.

Checklist:

1. [ ] Step 1: the 3T as-found proof (lane-run, device)
2. [ ] Step 2: the 3T gallery fallback read with AVD rehearsal (lane-run, device)
3. [ ] Step 3: the iOS simulator gallery fallback read (lane-run, device)
4. [ ] Step 4: the upstream PR preparation, held (lane-run, code outside the repo)
5. [ ] Step 5: the records close (executor dispatch, docs)
