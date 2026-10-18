# Ticket 138: Semver discipline - a thousand patches, never a minor

| Field | Value |
| --- | --- |
| Brief | Queue row 138, owner order 2026-10-18 (her words transcribed in the row; the supersession is the row's own record) |
| Planned at | `e37a3210` (uat, 2.0.1050), 2026-10-18; the lane's later commits changed only the queue row, the version files and this plan folder, and every anchor still counts 1 at the lane HEAD (the android block inside `app.json` is untouched by the version bumps) |
| Planned by | Lane 138 (agent-ruled; the owner is hands-off) |
| Needs first | nothing |
| Parent | nothing |
| Group | versioning guards and workflow text (`scripts/check-version-discipline.js`, `scripts/version-major-allowlist.json`, `scripts/__tests__/checkVersionDiscipline.test.ts`, `.husky/commit-msg`, `.husky/pre-merge-commit`, `shared/__tests__/versionLockstep.test.ts`, `ai/AGENTS.md`, `.opencode/agents/athan-lane.md`) - no other open lane touches any of these |
| Batch budget | 4 |
| Session budget | 8 |
| Steps count | 4 step files (two code, one test, one docs) |
| Device | none (no device step; every store measurement is a planning-time fact recorded below) |
| Owner decisions still needed | Her veto on the boundary recommendation (grandfather, section 5); anything touching MAJOR-version policy or a store-facing version jump stays hers |

## 1. Goal

The version line is 2.0.1050 and every commit in the 2.0 line took a patch. The standing
rule "patch per commit and minor per completed feature" has never fired its minor half:
no version other than 2.0.x exists after 2.0.0 (verified: `git log -p --all --
app.json | grep -o '"version": "[^"]*"'` yields no non-2.0.x version anywhere after
2.0.0; the pre-history carries 1.0.x through 1.9.3).
The owner called the line disingenuous on 2026-10-18 and ordered the overhaul. Her fixed
division of authority, recorded in the row: SHE DICTATES MAJORS ONLY; the agent owns
patch versus minor. Anything touching major-version policy or a store-facing version
jump is tabled for her ruling, never shipped.

When DONE: every new commit's bump class is machine-checked at commit time (a `feat`
subject requires a minor, every other subject requires a patch, a major requires her
recorded order in an allowlist), a merge into `uat` cannot regress the version, the
workflow text states the split in one place each (`ai/AGENTS.md`, the lane protocol),
the boundary lands as a recorded recommendation she can veto (grandfather: the first
completed user-visible feature after this discipline lands takes 2.1.0 and the 10xx
patch tail dies by the spec's own reset rule), and the store and OTA interaction is
measured and recorded, changing no app code.

## 2. Decisions

### 2.1 Taken (agent-ruled, argued twice)

| ID | Decision | When | Where recorded |
| --- | --- | --- | --- |
| D138.1 | The mechanical trigger for a minor is the commit subject's type token `feat`: a commit whose subject is typed `feat` MUST take a minor (x.Y.0); every other non-merge commit MUST take a patch. For: one token, checkable by a hook, maps to semver's "new functionality"; Against: renames the loose `feat` convention where intermediate feature steps were also typed `feat` - the workflow text (step 4) states the reservation: `feat` marks the completing commit of user-visible functionality, steps take their own type. Survived the challenge. | 2026-10-18 | here, `ai/AGENTS.md`, lane protocol |
| D138.2 | Majors are refused outright by the guard. The only path is `scripts/version-major-allowlist.json`, an entry naming the version and the owner ruling (queue row and date) it rides on. For: makes her authority mechanically true; Against: an agent could still edit the allowlist - same protection class as the releases.json ban: the audit reads the reason field, and a major without her row text is a revertible finding. Survived. | 2026-10-18 | here, step 1 |
| D138.3 | Every commit takes exactly one class-step from its parent: patch+1, or minor+1 with patch 0, or major+1 with minor and patch 0. Equal versions, skipped numbers and mixed deltas fail. For: monotone by construction, no silent gaps; Against: weather renumbering replays each commit one step at a time - that tedium is the discipline's teeth. Survived. | 2026-10-18 | here, step 1 tests |
| D138.4 | Merge commits stay exempt from the class check (they repeat the landed version, the existing convention). The merge into `uat` gains a monotonicity gate: the incoming version must strictly exceed `uat` HEAD's, or the pre-merge check fails and the lane rebases and renumbers. For: closes the one path where a lower line could take `uat` backward; Against: one more refusal a lane can hit in weather - the weather rule already commands the rebase. Survived. | 2026-10-18 | here, step 2 |
| D138.5 | Boundary recommendation for her veto: GRANDFATHER. The discipline applies to commits made after it lands; history is never rewritten; the first completed user-visible feature after landing takes the first free minor (2.1.0), which resets the patch counter by the spec's own rule ("Patch version MUST be reset to 0 when minor version is incremented"), so the 10xx tail dies at that moment with no separate act. For: a jump now would mark this overhaul - workflow text and guards, nothing user-visible - as a feature, the same dishonesty in the other direction; Against: she may want the visible reset immediately - the row and the lane's return carry the one-word upgrade path (her order to jump), and sibling lanes 135 and 116 are user-visible features, so 2.1.0 lands within days either way. Survived. | 2026-10-18 | here, queue row at DONE |
| D138.6 | No app or device code changes: the store and OTA surfaces are measured (section 4.4) and need nothing. For: the iOS comparator already ranks 2.1.0 above 2.0.1050; Play arbitrates on versionCode which the version string does not touch; no OTA channel exists; Against: none measured. Survived. | 2026-10-18 | here, section 4.4 |
| D138.7 | `scripts/check-version-uniqueness.js` stays untouched: uniqueness is class-agnostic and keeps its role (duplicate arbitration across live refs). The new gate is a separate script, `scripts/check-version-discipline.js`, wired into `commit-msg` and `pre-merge-commit`. For: one responsibility per file, mirrors the existing pair (uniqueness + lockstep) instead of rewriting a proven gate; Against: two scripts run at commit time - both are sub-second git reads. Survived. | 2026-10-18 | here, steps 1 and 2 |
| D138.8 | The lockstep test gains one assertion: `app.json`'s version is semver normal form (`/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/`: three numeric parts, no pre-release suffix, no leading zeros). For: the discipline, the store comparator and any future `appVersion` runtime policy all assume the normal form; Against: none - the current value 2.0.1050 already matches. Survived. | 2026-10-18 | here, step 3 |
| D138.9 | Planning, grilling and delivery follow the worker protocol: this plan is drafted by the lane lead, grilled by one `athan-plan-griller` dispatch, executed by `athan-executor` dispatches, audited by two `athan-reviewer` passes. For: the protocol's cold-session rotation is what keeps the lane resumable; Against: solo execution would keep everything in one context - and burn the lane's context on delivery work the workers exist to carry. Survived. | 2026-10-18 | here, section 11 |

### 2.2 The executor must not decide

| Situation | Exact question returned as STOP |
| --- | --- |
| A fixture test fails for a reason the plan does not name (exit code 2, git error text, spawn failure) | `STOP: discipline fixture <name> failed with <output>, the plan names no handling for it` |
| The pre-commit or commit-msg hook on the executor's own step commit refuses a bump the plan prescribed | `STOP: hook refused <version> with <output>, the plan's class rule and the hook disagree` |
| An anchor count is not 1 at execution time | `STOP: anchor <file> counts <n> in <source>, the plan is stale` |

## 3. Pre-flight

`scripts/preflight-138.sh` in this folder (the executor saves a copy to `$TMPDIR` and
runs it from there). It checks the checkout on the lane branch, a clean tree,
`origin/uat` merged in, the version at or above 2.0.1052, both hook files still
byte-identical to `e37a3210` (they are edited by steps 1 and 2, so a clean pre-flight
run must see the pre-edit bytes), and every anchor counting exactly 1. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

### 4.1 The guards as they stand

`scripts/check-version-uniqueness.js` refuses a version another unpushed commit holds
(anchor: `uniqueness-merge-handling.md`). It reads `app.json` per commit
(`JSON.parse(...).expo.version`), skips merge commits, counts the staged bump as a
candidate unless a merge is in flight, and allowlists known collisions from
`scripts/version-collisions-allowlist.json`. It runs in `.husky/pre-commit` and, with
`--no-candidate`, in `.husky/pre-merge-commit`. `.husky/commit-msg` currently runs only
`node scripts/check-identifiers.js --message "$1"` (one line; the pre-flight pins its
bytes by hash because a 1-line file cannot form a 3-line anchor).
`shared/__tests__/versionLockstep.test.ts` keeps `package.json`, `app.json` and the
gitignored `android/app/build.gradle` `versionName` on one version (anchor:
`lockstep-shape.md`); its shape assertion today is the loose `/^\d+\.\d+\.\d+/`.

### 4.2 The version surfaces

`app.json` `expo.version` is the version the app believes it runs
(`stores/version.ts` reads `Constants.expoConfig?.version`); `expo.android.versionCode`
sits fixed at 1000000 (anchor: `appjson-android-block.md`); `package.json` mirrors the
version; the gitignored gradle file carries `versionName` synced in the main tree after
merges. Every commit bumps: verified on the live lanes (lane/116's docs commit
`693f986a` bumped to 2.0.1051 without a version-prefixed subject, lane/135's
`a8220b8e` to 2.0.1038), and the uniqueness gate treats a repeated number as a
collision.

### 4.3 The commit subject convention

Subjects on `uat` start `<version> - <type>(<scope>): <text>` or `<version> - <text>`
(the bare form appears on merge commits and unprefixed docs commits). Types in living
use: `feat`, `fix`, `docs`, `merge`, plus the unprefixed form. The discipline parser
strips an optional leading `<version> - ` and matches `^feat(?=[(:\s])` - only an
explicit `feat` token demands a minor; `feat!`, `featur`, or a bare subject never match.

### 4.4 Store and OTA measurements (planning-time facts, no code change)

- iOS: `device/updates.ts` fetches the iTunes Lookup (`country=gb` is load-bearing)
  and prompts when the store's version string outranks the installed one
  (anchor: `updates-comparator.md`). The comparator is numeric per segment
  (`shared/versionUtils.ts`), so a store 2.1.0 outranks an installed 2.0.1050 with no
  change. Measured live 2026-10-18: the GB storefront publishes `1.5.1` for
  `com.example.athan` - the repo's 2.0.10xx line is not store-facing on iOS today, and
  the prompt compares `installed 2.0.1050 > store 1.5.1` so it never fires. Moving the
  store line is her act (a store-facing version jump is tabled to her).
- Android: Play's in-app updates library, wrapped by `expo-in-app-updates` 0.12.0,
  decides availability from the app's version data (Android docs, In-app updates data
  table: collected "to determine if an update is available"), and Expo maps
  `android.versionCode` to the gradle `versionCode` (Expo docs, App version management:
  `version` is the user-facing store version - `versionName` on Android,
  `CFBundleShortVersionString` on iOS; `versionCode` is the separate developer-facing
  counter). The repo pins `versionCode` at 1000000; a minor bump of the version string
  cannot change the Play flow. The store-facing counter is the owner's release act.
- OTA: `app.json` carries no `updates` block and no `runtimeVersion` (read in full at
  planning), `expo-updates` ~58.0.17 serves only `Updates.reloadAsync`
  (the row 68 language relaunch), EAS is read-only by hard rule and `releases.json` is
  dead by hard rule. Nothing OTA carries a version, so a minor has zero OTA
  interaction. Forward risk recorded in the row: if an OTA channel is ever configured
  with the `appVersion` policy, a minor forks the OTA line - that day's ticket decides.
- Semver spec (semver.org, quoted verbatim): "Minor version Y (x.Y.z | x > 0) MUST be
  incremented if new, backward compatible functionality is introduced to the public
  API. ... It MAY be incremented if substantial new functionality or improvements are
  introduced within the private code. ... Patch version MUST be reset to 0 when minor
  version is incremented." and "Patch version Z (x.y.Z | x > 0) MUST be incremented if
  only backward compatible bug fixes are introduced. A bug fix is defined as an
  internal change that fixes incorrect behavior." For an end-user app the user-visible
  surface is the public API; D138.1 operationalises exactly this.

### 4.5 Why the obvious fixes are wrong

- Making the minor "whenever the committer judges a feature complete" is the status
  quo that never fired a thousand times: judgment at commit time is not a guard.
- Enforcing at merge-only (reading the ticket's DONE text) cannot see semantics: a
  hook parses bytes, and the subject type is the one semantic byte the repo already
  conventions.
- Resetting history or renumbering the 2.0.10xx tail rewrites git records the records
  law keeps, and buys nothing the first minor does not buy naturally.

## 5. Design

The discipline is one invariant, checked at the two moments a version exists: a commit
(one class-step from its parent, class chosen by the subject type, majors allowlisted)
and a merge into `uat` (strictly increasing). Everything else follows: lanes pick the
lowest free number of their required class under the existing uniqueness arbitration;
weather renumbering replays one class-step per commit; the boundary grandfathers
because the guard only judges new commits.

Alternatives rejected: extending `check-version-uniqueness.js` with class logic (D138.7
- one responsibility per file); a Jest-only check (tests do not run at commit time; the
hooks do); conventional-commits tooling (a dependency install against the ask-first
rule, for less than forty lines of node).

Concurrency trace: two lanes completing features concurrently take 2.1.0 and 2.2.0
under uniqueness; if the 2.1.0 lane merges second, the pre-merge monotonicity gate
refuses, the lane rebases onto 2.2.0 and renumbers its remaining commits as 2.2.x
patches (or its completing commit as 2.3.0 if it had not yet taken its minor); a patch
lane that branched before a minor merge renumbers the same way. Rebase replays run the
`commit-msg` hook per replayed commit; a lane resolving weather may run the rebase with
hooks bypassed, then re-runs `node scripts/check-version-discipline.js` by hand over
the range - the same hand-verification law the lane protocol already commands for
unhooked commits.

**Acceptance criteria:**

- [R1.1] WHEN a non-merge commit whose subject carries the type token `feat` is committed THE SYSTEM SHALL exit 0 only when its `app.json` version equals the parent's with the minor incremented and the patch reset to 0
- [R1.2] WHEN a non-merge commit whose subject carries no `feat` type token is committed THE SYSTEM SHALL exit 0 only when its `app.json` version equals the parent's with the patch incremented alone
- [R1.3] WHEN a non-merge commit's version equals its parent's, skips a number, or mixes segments THE SYSTEM SHALL exit 1 naming both versions and the delta it saw
- [R1.4] WHEN a non-merge commit's version increments the major THE SYSTEM SHALL exit 1 unless `scripts/version-major-allowlist.json` holds an entry for that exact version
- [R1.5] WHEN a merge commit is concluded (MERGE_HEAD present) THE SYSTEM SHALL skip the class check
- [R2.1] WHEN a branch merges into `uat` whose merge-result `app.json` version does not strictly exceed `uat` HEAD's version THE SYSTEM SHALL exit 1 from the pre-merge check naming both versions
- [R2.2] WHEN a branch merges into `uat` whose merge-result version strictly exceeds `uat` HEAD's THE SYSTEM SHALL exit 0 printing both versions
- [R3.1] WHEN `app.json`'s version is not three dot-separated integers without leading zeros or suffix THE SYSTEM SHALL fail the version lockstep test
- [R4.1] WHEN this ticket's own commits land THE SYSTEM SHALL keep them patches on the 2.0 line (the row's own rule: every commit keeps the patch-per-commit rule until this row lands, this row's commits included)
- [R4.2] WHEN a later lane commits a `feat` subject from parent 2.0.10xx THE SYSTEM SHALL require the version x.1.0 (proven in fixture form: parent `2.0.1053`, subject typed `feat`, candidate `2.1.0` exits 0; candidate `2.0.1054` exits 1)
- [R5.1] WHEN the executor runs `yarn validate` at any step THE SYSTEM SHALL pass tsc, Biome and Jest with the new suites included

## 6. Steps

Checklist (copied into `LOG.md` and ticked as each step lands):

- [ ] Step 1 - the discipline gate and the major allowlist (`steps/01-discipline-script.md`)
- [ ] Step 2 - the merge monotonicity gate (`steps/02-merge-monotonicity.md`)
- [ ] Step 3 - the lockstep shape assertion (`steps/03-lockstep-shape.md`)
- [ ] Step 4 - the workflow text and the row's consistency sweep (`steps/04-workflow-text.md`)

## 7. Device proof

None. No device step exists: the ticket lands guards and text. The store measurements
(section 4.4) are planning-time facts; the phones prove nothing here. The first
user-visible feature that completes after this landing (a sibling lane's) is the live
proof of R4.2, and its owner read is that ticket's acceptance, not this one's.

## 8. Records

`LOG.md` entries per the ledger contract: `### Step <NN> - <state>` headings ending
`session: <ses_id>`, planning sections `## Planning (2026-10-18)`. The queue cell text
the lead applies on DONE:

> DONE 2026-10-18, audited: the semver discipline landed - every commit's bump class
> is machine-checked at commit time (a `feat`-typed subject requires the minor, every
> other subject the patch, majors only through the owner's recorded order in
> `scripts/version-major-allowlist.json`), a merge into uat can no longer regress the
> version (the pre-merge gate refuses a non-increasing incoming line), the lockstep
> test pins the semver normal form, and `ai/AGENTS.md` plus the lane protocol state the
> split. Boundary recommendation for her veto: GRANDFATHER - history untouched, the
> first completed user-visible feature after this landing takes 2.1.0 and the 10xx
> tail dies by the spec's own patch reset; her one word upgrades it to a jump.
> Measured: the GB storefront publishes 1.5.1 (the repo line is not store-facing on
> iOS today, her act to move), Play arbitrates on the untouched versionCode, no OTA
> channel exists. This row's own commits stayed patches per its own rule.

Docs commit message (the audit merge only; step 4 carries its own subject): `<VERSION> -
docs(workflow): ticket 138 the semver discipline landed, the boundary recommendation
recorded`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass; in this lane
the orchestrator pushes when every unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `DISCIPLINE FAIL` on the executor's own step commit | The plan prescribed a version of the wrong class for the subject type it also prescribed | Re-read the step's `Version and commit` line; it names type and class together; if they disagree with the script's verdict, return `STOP:` (section 2.2) |
| `Cannot find module` in the new test file | Step 1's red run before the script exists | That is the recorded red, not an error: the test file cites the script path, the first run fails on the missing file, then the script lands and the suite goes green |
| Fixture git errors under `jest` | GIT_DIR inheritance (the harness's documented trap) | The test file uses the same `cleanEnv()` the uniqueness suite carries; do not weaken it |
| `check-plan.sh` fails on a step file | A hedge word or a missing Weight line | Fix the file; the gate's message names it |
| Merge into `uat` refused by the monotonicity gate | A sibling merged a higher version while this lane ran | Lane weather: rebase onto `uat`, renumber per D138.3/D138.4, retry once |

Anticipated review fixes, word for word:

- "The `feat` matcher should anchor the token boundary or `featur` matches" - it
  already does: `^feat(?=[(:\s])` after the optional version prefix strip; the test
  `featur is not feat` proves it.
- "The merge check should live in check-version-uniqueness.js" - D138.7 records why it
  does not: one responsibility per file, the existing pair untouched.
- "The allowlist duplicates version-collisions-allowlist.json's shape" - intentional:
  the collision allowlist forgives duplicates, the major allowlist authorises an
  owner-ruled class jump; both are read with the same two-line loader.

Restore lists: step 1 - `git checkout .husky/commit-msg` and delete the three new
files; step 2 - `git checkout .husky/pre-merge-commit` and revert the script's
`--merge-check` arm; step 3 - remove the one assertion; step 4 - `git checkout
ai/AGENTS.md .opencode/agents/athan-lane.md`.

## 11. Subagents

Planning: `explore` for fact questions (none remained: every fact above is measured
and cited); `athan-plan-griller` for the grill. Delivery: the lane lead dispatches
`athan-executor` for steps 1-2 (one batch, weight 4) and steps 3-4 (one batch, weight
2), and two `athan-reviewer` passes (plan-conformance and blind) for the audit. No
image work: `vision` is never needed.

## 12. Report to the owner

Plain sentences at DONE: the discipline and its guards landed, what the first minor
will be and when it fires, the boundary recommendation awaiting her veto, the measured
store and OTA facts, and the decisions table. The four-line handoff block closes the
lane's return, per the lead skill.
