# Next Session: Code audit, the changes (session 4 of 4)

Read `ai/AGENTS.md` first, act as Orchestrator. This is the last session of the owner-ordered
4-session chain: (1) upgrade research, (2) upgrade execution, (3) code-audit findings,
(4) code-audit changes. Sessions 1, 2 and 3 are **closed**.

This is task 20. **One change at a time**, each one validated, and each one that touches times
or the device verified on the 3T before the next one starts.

## Read first, in this order

1. `ai/features/uat-2/AUDIT-FINDINGS.md` — **authoritative for this session.** 57 findings in
   six tiers, ranked by risk to correctness of times, each with its evidence and its
   confidence. Do not re-derive any of them.
2. `ai/features/uat-2/AUDIT-BRIEF.md` — the standing constraints and the settled list.
3. `~/.config/opencode/AGENTS.md` — the owner's global tool rules and step discipline.
   `opensrc` and `agent-browser` are on PATH; tinyfish and docs-mcp-server are opencode-only,
   so in Claude Code fall back to WebSearch/WebFetch and the context7 MCP, and say which path
   you used.
4. `e2e/README.md` §Gotchas — **before any build or device work.** Every entry cost real time.
5. `ai/AGENTS.md` §2 (Stack & Versions), §7 (Boundaries), §9 (Loop discipline).

## The bar

Same as session 3. This app is an alarm clock. A prayer time two minutes wrong is a bug; a
notification on the wrong night is a serious one. A change that cannot be shown to reduce that
risk is not worth making this session.

## Three things need the owner before any code moves

Raise these first, in one message, and carry on with the code while waiting.

1. **`releases.json` on `main` still says `1.0.0`** (finding 1). The update prompt is dead on
   production Android and on both UAT channels, and has been since the feature shipped. This is
   a data edit on `main`, which only the owner touches. It gates every other fix reaching a
   user. The redesign is ISSUES #35 and is still out of scope.
2. **Finding 3, the extras preference migration.** It maps pre-January-2026 index keys onto the
   wrong prayers. The migration also deletes the old keys as it goes, so any install that has
   already launched since 1.5.3 is past the point where a fix can help. Ask whether a repair is
   wanted for the installs that have not migrated yet, and accept the answer.
3. **Finding 45, Asr is Hanafi-only.** A product decision, not a code one. Record the answer in
   the findings document and move on.

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

**Step 7. The rest of Tier 2**, in the document's order.

Tiers 4, 5 and 6 are not this session unless the owner says otherwise. Tier 4 is gated behind
the `widgets` flag, which is off. Tier 5 costs nothing today.

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
