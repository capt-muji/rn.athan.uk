# Next Session: Code audit, findings only (session 3 of 4)

Read `ai/AGENTS.md` first, act as Orchestrator. This is session 3 of an owner-ordered
4-session chain: (1) upgrade research, (2) upgrade execution, (3) code-audit findings,
(4) code-audit changes. Sessions 1 and 2 are **closed**. **At session end, hand the owner
the paste-block for session 4.**

**This session writes ONE document and changes no application code.** This is task 19.
Do not fix anything you find, do not open a fix branch, do not refactor on the way past.
Task 20, the changes, is session 4 and is deliberately a different session: a session
that starts fixing things stops auditing. If you are editing a file outside
`ai/`, you are in the wrong session.

## Read first, in this order

1. `ai/features/uat-2/AUDIT-BRIEF.md` — **authoritative for this session.** The scope,
   the settled list, the open leads, and the deliverables.
2. `~/.config/opencode/AGENTS.md` — the owner's global tool-selection rules and step
   discipline. `opensrc` (package source) and `agent-browser` are on PATH; tinyfish and
   docs-mcp-server are opencode-only, so in Claude Code fall back to WebSearch/WebFetch
   and the context7 MCP, and say which path you used.
3. `e2e/README.md` §Gotchas — **before any build or device work.** Every entry cost real
   time on a previous run.
4. `ai/AGENTS.md` §2 (Stack & Versions, current as of 1.25.1), §7 (Boundaries; the owner's
   git override lives in `ai/features/upgrades-2026-09/BRIEF.md`), §9 (Loop discipline).

## The bar

This app is an alarm clock. A prayer time two minutes wrong is a bug; a notification on
the wrong night is a serious one. **Rank every finding by risk to the correctness of
times.** Performance, tidiness and style rank far below that, and a stylistic nit
presented alongside a scheduling defect devalues the document.

## Where to look, in priority order

Straight from AUDIT-BRIEF.md §"Where to look":

1. **Times and scheduling** — `shared/time.ts`, `shared/prayer.ts`,
   `shared/notifications.ts`, `stores/notifications.ts`, `stores/schedule.ts`,
   `stores/sync.ts`. Anything that can make a row and its alert disagree, or land a day
   boundary differently in two places, is the highest-value finding available.
2. **State that survives restarts** — `stores/database.ts`, `stores/version.ts`, the
   upgrade and wipe paths. Note the trap from #29: a version *decrease* does not trigger
   `handleAppUpgrade`, so the cache is not wiped.
3. **The background and notification chain** — `device/tasks.ts`,
   `device/notifications.ts`, and the 2-day rolling window.
4. **Everything else** — presentation, widgets, sheets. Real, but lower stakes.

## Do not re-litigate

AUDIT-BRIEF.md §"Already settled" lists five things that are device-verified or
test-pinned: night times (#29), the timezone model (#30), the API being source of truth
on DST, the TLS provider (#21/#32), and the launch-time work. Re-deriving any of them
wastes the session.

## Confirm the open leads, do not assume them

Five leads are already recorded in AUDIT-BRIEF.md §"Leads already found". Some may be
acceptable as they stand, so confirm each before treating it as a finding:

1. Four of six hook test files do not exercise their hook.
2. Three suites seed fake timers from the real clock, then assert on
   `advanceTimersByTime`.
3. `js_to_content` is mislabelled and any reading of it is wrong by roughly 800 ms.
4. R8 is off, untested as a lever.
5. `date-fns-tz` is now used only by three test files.

## Standing constraints

- **Nothing may assume London.** v2.0 goes global and `PRAYER_TIMEZONE` in
  `shared/constants.ts` is the single setting. Anything hardcoding London elsewhere is a
  finding.
- **Package upgrades are out of scope here**, but "it is a dependency, we cannot change
  it" is no longer a valid dismissal. Record the finding and point at the upgrades
  programme, which is **complete** — see the session 2 entry in
  `ai/features/upgrades-2026-09/BRIEF.md`. Expo SDK 57 is fully patched; reanimated 4.6.0,
  worklets 0.12.2, jest 30, typescript 7, pino 10, biome 2.5.13.
- **Never run `npx expo install --fix`.** It silently downgrades five packages. The list
  is in `ai/AGENTS.md` §2. `--check` is the safe form.
- **Never commit the API key.**
- Version bump in `app.json`, `package.json` **and** `android/app/build.gradle` on every
  commit; prefix `X.Y.Z - `. Branch off `uat-2`, merge back with `--no-ff`. **Never touch
  `uat`.** Git writes are authorised for these autonomous sessions.

## Evidence rules

Every finding carries what proves it: a failing test, a device capture, or a source
citation with file and line. **Say plainly when something is a guess** rather than
dressing it up as a conclusion. A claim with no evidence is a lead, and must be labelled
one. AUDIT-BRIEF.md asks for this explicitly, and session 2 showed the value of testing a
stated assumption rather than repeating it: the claim that "empty changelogs are not
proof" was checked by comparing shipped binaries, which turned a worry into a fact.

## If you need the device

The OnePlus 3T (`3T_SERIAL`) and nothing else. The iPhone XS stays disconnected.

Any build for verification must be a **prod build** (`EXPO_PUBLIC_ENV=prod`) or it serves
`MOCK_DATA_SIMPLE` and writes mock times into the phone's own MMKV cache, which outlives
the build. **Two traps, both hit in session 2:**

1. The committed `.env` carries the placeholder `EXPO_PUBLIC_API_KEY=key` from
   `.env.example`. The real key must be passed via shell env (session scratchpad,
   `.api_key`).
2. A version bump triggers `handleAppUpgrade()`, which **wipes the device's prayer
   cache**. Building without a working key therefore strands the phone with no prayer data
   and no armed alarms, which reads exactly like an upgrade regression and is not one.
   Have the key in hand *before* you bump.

Useful corollary: the app's error screen is positive proof the build is `prod`, since a
non-prod build returns mock data instead of attempting a fetch.

Delete `index.android.bundle` and verify the new bundle by md5 before trusting any APK;
Gradle marks the bundle task UP-TO-DATE on env-only changes. The 3T has **no root**, so
the clock cannot be moved (`date` returns `Operation not permitted`).

## Tools that already exist

`yarn validate` (tsc + biome + jest), `yarn test:tz` (four timezones), `yarn check:device`
(build identity, permissions, channels, every armed alarm), `e2e/scripts/` (idle CPU,
frame audit, baseline compare), and the runbooks at `ai/RUNBOOK-performance-testing.md`
and `ai/RUNBOOK-background-tasks.md`.

## Deliverable

A findings document under `ai/features/uat-2/`, ranked by risk to correctness of times,
each finding carrying its evidence and its confidence. Committed on a docs branch off
`uat-2` and merged back with `--no-ff`.

Then write the session 4 paste-block, which will work through the findings one change at
a time.

## Out of scope, and not one of the four sessions

**ISSUES #35** (the update prompt, `releases.json`, and moving production Android to
Google Play In-App Updates) is marked `[OPEN, needs its own session]`. The research is
already recorded in that entry so the decision session does not start cold. It adds a
native dependency on the release path, so it is **not** part of sessions 3 or 4. Leave it
alone; if you touch on it, record a pointer and move on.
