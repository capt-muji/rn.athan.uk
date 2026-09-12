# Next Session: Code audit, the changes (session 4 of 4)

Read `ai/AGENTS.md` first, act as Orchestrator. This is the last session of the owner-ordered
4-session chain: (1) upgrade research, (2) upgrade execution, (3) code-audit findings,
(4) code-audit changes. Sessions 1, 2 and 3 are **closed**.

This is task 20. **One change at a time**, each one validated, and each one that touches times
or the device verified on the 3T before the next one starts.

## Read first, in this order

1. `ai/AGENTS.md` §0 — **and do what §0 says**, which is to load `opencode.json` and
   `.agents/skills/` as well. That is an owner rule for every session, not just this one. The
   four MCP servers and the 24 Expo/EAS skills are already configured; working without them
   means re-deriving things the project has paid for.
2. `ai/features/uat-2/AUDIT-FINDINGS.md` — **authoritative for this session.** 57 findings in
   six tiers, ranked by risk to correctness of times, each with its evidence and its
   confidence. Do not re-derive any of them. Read its "What actually reached users" and "Owner
   rulings" sections before anything else in it.
3. `ai/features/uat-2/AUDIT-BRIEF.md` — the standing constraints and the settled list.
4. `~/.config/opencode/AGENTS.md` — the owner's global tool rules and step discipline.
   `opensrc` and `agent-browser` are on PATH; tinyfish and docs-mcp-server are opencode-only,
   so in Claude Code fall back to WebSearch/WebFetch and the context7 MCP, and say which path
   you used.
5. `e2e/README.md` §Gotchas — **before any build or device work.** Every entry cost real time.
6. `ai/AGENTS.md` §2 (Stack & Versions), §7 (Boundaries), §9 (Loop discipline).

## The bar

Same as session 3. This app is an alarm clock. A prayer time two minutes wrong is a bug; a
notification on the wrong night is a serious one. A change that cannot be shown to reduce that
risk is not worth making this session.

## Break things if you must, but never leave them broken

The owner is explicit that breakage is acceptable and repair is the job: *"this is the perfect
time to break things, but any time you break things and you fix them, make sure the outcome is
always the same, the tests always pass, the behaviour is the same one to one."* That is not
permission to be careless. It is permission to touch real code, on the condition that each
change lands whole.

- **Verify before moving on.** A change you cannot show working is not finished, it is pending.
  Say so and stop rather than stacking a second change on an unverified one.
- **One finding, one branch, one commit.** No commit bundles two findings. Rollback has to be
  surgical.
- **Prefer the smallest fix that closes the finding.** Most of these are one line. Nothing in
  the document asks for a refactor. If a fix starts growing into a restructure, stop and put the
  question to the owner.
- **Never edit a test to make it pass.** A newly failing test is evidence the change was wrong,
  or that the test was pinning the defect. Work out which, say which, and only then act.
- **A finding you would have to guess at stays recorded.** Each carries a confidence word. A
  LATENT or GUESS item that needs a risky change is better left written down than fixed badly,
  and saying so is a complete answer.

The findings document is the record either way. Anything deferred stays written down with its
evidence, and the session closes by saying what was deferred and why.

## The owner has already ruled on three things. Do not reopen them.

All three are recorded in full under "Owner rulings" in the findings document. In short:

1. **The API is the source of truth and the app edits nothing it returns.** No school or method
   selection, no offset, not now and not for v2.0. Finding 45 is withdrawn. This is broader
   than the DST rule AGENTS.md states: **anything that would change a value the API returned is
   out of bounds.** Re-dating a value to the correct calendar day is a different thing and is
   still in scope, which is why finding 44 stands.
2. **`releases.json` stays manual.** The bump after a successful store release is the intended
   mechanism; replacing it with automatic detection is ISSUES #35 and needs its own session. Do
   not touch it. The three stale version strings are the owner's to update, not yours.
3. **The extras preference mis-map gets repaired, and the junk keys get deleted.** The findings
   document sets out the exact approach: pick the name array by the stored version, since the
   pre-1.0.27 array is known precisely, then remove every leftover index key. Two traps are
   written up there and both matter. A `CACHE_SCHEMA_VERSION` bump will **not** clear these,
   because `UPGRADE_KEEP_PREFIXES` keeps `preference_`. And `handleAppUpgrade` destroys the
   discriminator before the migration reads it, so the captured `storedVersion` has to be
   passed in as an argument in the same commit.

## Scope: everything

The owner's instruction, 2026-09-12: *"I want to address everything you found. Otherwise what's
the point of the sweep? Yes, I think we might break some stuff, but that's why you're gonna fix
it, and make sure the behaviour is exactly one to one to what we had before."*

So work the whole document, not a tier of it. Tier 4 (iOS widgets) is still behind a flag that
is off, so judge whether each of those is worth doing before the flag flips; everything else is
in scope. The three withdrawn or re-ranked findings (1, 9, 45) are settled and stay settled.

### The one-to-one rule

Every change closes its finding and changes **nothing else observable**. Same rendered times,
same countdown, same alerts at the same instants, same preferences honoured, same tests passing
with the same assertions. Where a fix genuinely must change behaviour, that is the defect being
removed and nothing beyond it, and the commit message says so in one sentence.

The whole test suite passes before and after every single commit. 42 suites and 1015 tests is
the current baseline; it must never go down, and a test that starts failing is a signal to stop,
not to edit the test.

### This is a good moment to break things

Production is **1.5.2 on both stores and nothing newer has been released**. `uat-2` HEAD is 233
commits ahead of it. Most of what this document describes has never reached a user, so the blast
radius of a mistake on `uat-2` is the owner's own test device, not the userbase. The findings
document's "What actually reached users" section has the probe table showing which findings are
live in 1.5.2 (short answer: 6, 21 and 23) and which are not.

That is the licence to change real things. It is not a licence to skip verification.

## Git workflow

- **A new branch per fix.** Not per tier, not per session. One finding, one branch, so any
  single change can be rolled back on its own without unpicking others.
- Branch off `uat-2`, merge back into `uat-2` with `--no-ff`, then **push `uat-2`**.
- **Never touch `uat`.** Not a commit, not a merge, not a push.
- Version bump in `app.json`, `package.json` **and** `android/app/build.gradle` on every commit,
  prefixed `X.Y.Z - `.
- Git writes are authorised for these autonomous sessions. This is an owner override of
  `ai/AGENTS.md` §7.

## EAS is read-only

**Never build on EAS. Never push anything to it.** The owner's rule: treat EAS purely as a way
to **read** configuration, which is what resolves finding 9. `EXPO_PUBLIC_ENV` and
`EXPO_PUBLIC_API_KEY` are set in the dashboard and may be read; nothing may be written, queued
or submitted. Builds happen on the OnePlus 3T, locally, and nowhere else.

The remote Expo MCP in `opencode.json` is authenticated against the owner's EAS account, so it
is the right tool for reading those values. Reading is the entire permitted use.

## Order of work, and why

The principle: fix the things that make the later fixes reachable and verifiable, first.

**Step 1. The tooling you are about to rely on.** Findings 32, 31, 29, 30 and 33. The alarm
parser counts a restatement line as an armed alarm, the permission check cannot see a denied
grant, and the frame audit's SurfaceFlinger path can never print FAIL. If you verify anything
on the device before fixing these, you will be reading a tool that can return a confident pass
having measured nothing. Re-verify every `(SF latency)` line in `e2e/baselines/android-3t.json`
afterwards.

**Step 2. The `getOnInit` root cause.** Findings 2, 4 and 23, which are one defect in
`stores/storage.ts`. Add a `resetStoredAtom(atom, key)` helper that writes through the atom, make
it the only sanctioned way to change a persisted value from outside React, and fix
`forceNotificationReschedule()` to use it. Until this lands, no change to alert timing reaches a
user for up to twelve hours after their update, which makes every later fix in this session
slower to arrive.

**Step 3. Remove the dead-app class.** Findings 7 and 51 are a null return and a guard, and
then an `ErrorBoundary` export in `app/_layout.tsx`. Do finding 6 immediately after, not
before: the boundary routes more traffic to the error screen, and that screen currently deletes
the prayer cache.

**Step 4. Finding 5, the Android athan channels.** The highest silent-alarm risk in the
document. Device-verified, and the verification needs `yarn check:device` from step 1.

**Step 5. Finding 8, validate the API response shape.** One guard in `validateApiResponse`
closes finding 8 and finding 47 together, and turns a crash into a diagnosable error.

**Step 6. The cheap guards that protect everything above.** Findings 10, 11, 24, 22, 26 and 21.
Each is a small test. Together they are what stops the next session reintroducing any of this.

**Step 7. The rest of Tier 2**, in the document's order. Findings 48 to 57 are at the end of
that tier and are as real as the numbered ones above them.

**Step 8. The rest of Tier 3.** Findings 34, 35 and 36. The measurement harness should end this
session telling the truth in every path, not just the ones step 1 needed.

**Step 9. Tier 5, the global-readiness work that is safe to do now.** Finding 44 is the one that
matters and is fixable today without any endpoint change: Magrib has no midnight-crossing rule,
which puts Islamic Midnight and Last Third on the wrong side of noon at high latitude. Finding
46 is parameterising five test oracles on `PRAYER_TIMEZONE`. Finding 43 is scope for v2.0 and is
a note, not a change. Finding 45 is withdrawn.

**Step 10. Tier 6.** Mechanical, and most of it is deletions: the two dead glow files, the dead
`@env` block, the redundant MMKV mock, the stale doc comments. Finding 52 (no CI, `.husky`
gitignored) and finding 53 (`pino` in the wrong section) are the two with real consequences and
should lead the tier.

**Tier 4, the iOS widgets, needs a judgement call rather than a rule.** The `widgets` flag is
off, so nothing there reaches a user. Findings 37, 38 and 39 are genuine defects that would ship
the moment the flag flips, and 37 in particular is a widget confidently reading "9h 50m" five
minutes before Fajr. Fixing them now is cheap and they are well evidenced. Fixing them later
means re-reading the whole chain. Recommend doing 37, 38, 39 and 41, and leaving 40 and 42 as
recorded. Put it to the owner if you disagree.

## The verification suite from session 3

Nineteen tests back the findings marked `[test]`. They live in the session-3 scratchpad, which
is gone, and the appendix of the findings document has the exact invocation and what each file
covers. Rewrite them from the document rather than hunting for the originals.

Each one asserts the **defective** behaviour, so a green run is the proof of the bug. When you
fix a finding, invert its assertion and move it into the repository as a regression test. That
is the cheapest way to make this audit stick.

## Standing constraints

- **Nothing may assume London.** `PRAYER_TIMEZONE` in `shared/constants.ts` is the setting, but
  findings 43 to 47 record that it is not currently the only one. Do not widen that gap.
- **Package upgrades are out of scope.** The programme is complete; see the session 2 entry in
  `ai/features/upgrades-2026-09/BRIEF.md`. "It is a dependency, we cannot change it" is not a
  valid dismissal: record it and point at that programme.
- **Never run `npx expo install --fix`.** It silently downgrades five packages. The list is in
  `ai/AGENTS.md` §2. `--check` is the safe form.
- **Never commit the API key.**
- Version bump in `app.json`, `package.json` **and** `android/app/build.gradle` on every commit;
  prefix `X.Y.Z - `. Branch off `uat-2`, merge back with `--no-ff`. **Never touch `uat`.** Git
  writes are authorised for these autonomous sessions.

## If you need the device

The OnePlus 3T (`3T_SERIAL`) and nothing else. The iPhone XS stays disconnected. It currently
has **1.25.0** installed while HEAD is further ahead, so the first thing any device check must
do is confirm the installed build.

Any build for verification must be a **prod build** (`EXPO_PUBLIC_ENV=prod`) or it serves
`MOCK_DATA_SIMPLE` and writes mock times into the phone's own MMKV cache, which outlives the
build. Two traps, both hit in session 2:

1. The committed `.env` carries the placeholder `EXPO_PUBLIC_API_KEY=key` from `.env.example`.
   The real key must be passed via shell env (session scratchpad, `.api_key`).
2. A version bump triggers `handleAppUpgrade()`, which **wipes the device's prayer cache**.
   Building without a working key strands the phone with no prayer data and no armed alarms,
   which reads exactly like an upgrade regression and is not one. Have the key in hand *before*
   you bump.

The app's error screen is positive proof the build is `prod`, since a non-prod build returns
mock data instead of attempting a fetch. Delete `index.android.bundle` and verify the new bundle
by md5 before trusting any APK; Gradle marks the bundle task UP-TO-DATE on env-only changes. The
3T has **no root**, so the clock cannot be moved.

## Tools that already exist

`yarn validate` (tsc + biome + jest), `yarn test:tz` (four timezones), `yarn check:device`
(build identity, permissions, channels, every armed alarm — fix step 1 before trusting it),
`e2e/scripts/`, and the runbooks at `ai/RUNBOOK-performance-testing.md` and
`ai/RUNBOOK-background-tasks.md`.

## Deliverable

Each change on its own commit, with the What/Why/How/Testing structure the repository uses, on
a feature branch off `uat-2`, merged back with `--no-ff`. Update the status of each finding in
`ai/features/uat-2/AUDIT-FINDINGS.md` as you close it, so the document stays the record. Close
the session by writing what was taken, what was deferred and why, at the end of that document.

## Out of scope, and not one of the four sessions

**ISSUES #35** (the update prompt, `releases.json`, and moving production Android to Google Play
In-App Updates) is marked `[OPEN, needs its own session]`. It adds a native dependency on the
release path. Finding 1 is the three stale version strings, which is a data edit, not the
redesign. Leave the redesign alone.
