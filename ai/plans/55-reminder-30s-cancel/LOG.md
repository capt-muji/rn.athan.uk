# LOG

## Planning (2026-10-11)

Planned at `uat` `95e5a12e` (2.0.3). Scratch-worktree proof: the suite failed red exactly as
predicted (`cancelsOf` expected 0 received 1, twice), green after the branch (5 passed; unit
project 153 suites, 4701 passed, 2 skipped; tsc and Biome clean; worktree deleted, nothing
committed from it). Grill round 1: 12 findings, all applied (build-mock argument shape and
package expectation, preflight READY match, docblock anchor precision, blank-line edit, log-line
assertion, validate and test:tz in green, poll loop, tombstone phrasing, unfiltered dump,
concrete commands). Grill round 2: 6 findings, all applied (break script `--verbose` for the
per-test listing, structural alarm identification per `e2e/scripts/device_checks.py`, the clock
call's expected reply and denial row, tomorrow's-row arm instruction, unique-timestamp judge,
install-varying tombstone epoch). `bash scripts/check-plan.sh` prints `PLAN OK`. Row set READY.

## Job 55

### Step 01 — STOPPED at the Biome gate (2026-10-11, executor session)

Preflight `PREFLIGHT OK` (anchors all 1). Branch `fix/reminder-imminent-keep-alive` off `uat`
`56579e46`. Red exactly as predicted: both keep-alive tests failed at
`expect(cancelsOf(imminentId)).toBe(0)` with `Expected: 0, Received: 1`; the other three passed.
All four contract edits applied; the suite went 5 passed; the full unit project passed
(153 suites, 4703 passed, 0 failed); `npx tsc --noEmit` exit 0.

`npx biome check . --error-on-warnings` exit 1, both errors in plan-verbatim code:

1. `stores/__tests__/reminderImminentKeepAlive.test.ts` (byte-identical to the step's code
   block, verified mechanically against the fenced text; only the trailing newline differs).
   Biome's line width is 120 and its canonical form joins the `schedulesOf` continuation to
   exactly 120 chars: it wants
   `  scheduleMock.mock.calls.filter(([request]) => (request as { identifier?: string })?.identifier === identifier).length;`
   on one line. No plan text sanctions any change to the test file, and the step's green gate
   demands Biome exit 0: contradiction. `lint-staged` runs `biome check --write` on staged
   files, so committing the verbatim file would have the hook silently reformat it.
2. `stores/notifications.ts`: the contract's nested
   `Database.getAllScheduledRemindersForPrayer(...).map(...).includes(identifier)` inside the
   condition; Biome splits the chain. Resolved by the plan's own anticipated fix (section 10:
   hoist `const records = ...` above the `if`), verified: `biome check
   stores/notifications.ts` exit 0 with the hoist, and the suite stays 5 passed.

Nothing committed; tree restored to clean `uat`; branch deleted; no version lock taken.
Evidence: `$HOME/athan-gitree/sessions/55/step1-unfinished.patch` (hoisted variant, 51 lines),
`step1-unfinished-status.txt`, `step1-reminderImminentKeepAlive.test.ts` (192 lines).
Question for the lead: re-wrap the `schedulesOf` helper in the step's code block to Biome's
canonical single line (or otherwise rule how the test file passes its own gate), then re-dispatch.

### Owner ruling on the STOP (2026-10-11, lead session)

The owner ruled: re-wrap the helper. `stores/__tests__/reminderImminentKeepAlive.test.ts` is
written with the `schedulesOf` helper in Biome's canonical form, and every other byte of the
step's code block stays verbatim:

```ts
const schedulesOf = (identifier: string) =>
  scheduleMock.mock.calls.filter(([request]) => (request as { identifier?: string })?.identifier === identifier).length;
```

Verified from `biome format` on the transcription: this join is the only hunk in the whole file.
The `stores/notifications.ts` half of the Biome failure needs no ruling: the plan's section 10
anticipated fix (hoist `const records = Database.getAllScheduledRemindersForPrayer(...)` above
the `if`, then `records.map((each) => each.id).includes(identifier)`) applies where the green
gate hits it. Step 1 resumes in the same executor session under this amendment.

### Step 01 — resumed, green all passing, STOPPED at the break script (2026-10-11, executor session)

Rebuilt under the ruling (branch `fix/reminder-imminent-keep-alive` off `uat` `56579e46`):
the plan's code block with the ruled `schedulesOf` join, the four contract edits with the
section 10 hoisted-`records` form. Green gate all passing: suite 5/5; unit project 153 suites,
4703 passed; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0;
`yarn validate` exit 0 (195 suites, 5297 passed); `yarn test:tz` exit 0 (5297 passed). Row 55
set to `IN PROGRESS, step 1` in the working tree (restored on stop).

Break script verdict: `BREAK NOT APPLIED: expected 2 failing tests and a restored 5-pass run,
saw 0 and 1`, exit 1. The break's substance behaved exactly as the plan predicts: the
substitution found exactly one `return { identifier, refused: false };`, the broken run failed
`Tests: 2 failed, 3 passed` with both failures at the `expect(cancelsOf(imminentId)).toBe(0)`
lines (`Expected: 0, Received: 1`), the file was restored from the backup, and the restore run
printed `Tests: 5 passed`. What fails is the script's counter: `grep -c "✕"` counts Jest's
verbose per-test glyph listing, which Jest 30.5.2 writes only to a TTY. The script redirects
Jest's output into `$TMPDIR/break-55.log` itself, so no outer invocation (pty, `FORCE_COLOR=1`,
both tried) can make the glyphs appear; the count is 0 on every run on this machine. The repo's
`jest.config.js` has no custom reporter suppressing the listing. The script as written can
never end `ALL AS EXPECTED: 1` here. It is plan-owned tooling, so the executor does not edit
it. The flaw entered at grill round 2 (`--verbose` "for the per-test listing") and the planning
worktree never executed the script.

Nothing committed; tree restored (row back to READY); branch deleted; no version lock taken.
Evidence: `$HOME/athan-gitree/sessions/55/step1-break-55.log` (41 lines, zero glyph lines),
`step1-break-55-restore.log`, `step1-unfinished.patch`, `step1-unfinished-status.txt`,
`step1-reminderImminentKeepAlive.test.ts`. Question for the lead: amend the break script's
failing-test counter to something Jest 30 writes into the redirected log (count `●` blocks, or
read the `Tests: 2 failed, 3 passed` summary line) and re-dispatch from the break stage; every
green stage already stands.

### Step 01 — DONE (2026-10-11, executor session, resumed after the counter amendment)

Resumed on the new tip `b7644b42`: anchors all 1, branch `fix/reminder-imminent-keep-alive`
recreated, the change re-applied from `$HOME/athan-gitree/sessions/55/step1-unfinished.patch`
(code and row hunks) and the saved test file. Cheap gates re-run: suite 5 passed, `tsc` exit 0,
Biome exit 0. Amended break script: `ALL AS EXPECTED: 1` (exit 0), tree listing only the step's
files plus plan files.

Version 2.0.6 (next patch after `uat`'s 2.0.5, fetched under the version lock, taken with no
waits): `app.json` first, then `package.json`, then `android/app/build.gradle` `versionName`.
Commit `6dc9125b` on `fix/reminder-imminent-keep-alive`, 5 files (the two step files, the row,
`app.json`, `package.json`), hook green: `Tests:       5297 passed, 5297 total`, coverage
`Statements 100% (5002/5002)`, `Branches 100% (2170/2170)`, `Functions 100% (1038/1038)`,
`Lines 100% (4480/4480)`. Merged `--no-ff` into `uat` as `09c13e46`; lock released.

Review verdict: clean. Exactly the four edits in `stores/notifications.ts` (the inserted branch
in the section 10 hoisted-`records` form, pre-sanctioned by the owner ruling); keep-alive return
`{ identifier, refused: false }`, skip return `SKIPPED_DAY` untouched; condition order
`reminderDateTime > now &&` then record membership; the log line with its five fields; the
comment explains why only; the suite stays at the mocked OS boundary in the house pattern.
Shipped classes: no lifecycle, thread, residue or rule exposure. The plan's second anticipated
fix is a Reject as written. Nothing amended after the read-back.


### Lead amendment: break script counter (2026-10-11, lead session)

Plan tooling, no owner ruling needed (no behaviour, assertion or scheduling logic changes; the
plan's own words, "expecting exactly the two red failures", stay the spec). `break-01.sh`'s
counter counted the `✕` glyph Jest 30.5.2 writes only to a TTY, never into the redirected log
the script itself creates. The counter now reads the summary line
`Tests:       2 failed, 3 passed, 5 total`, symmetric with the restore check's existing
`Tests: +5 passed` pattern, compared to 1. Verified against the saved evidence before editing:
`grep -cE "Tests: +2 failed, 3 passed"` returns 1 on `step1-break-55.log` (zero `✕` lines, two
`●` blocks, summary at line 38) and the restore pattern returns 1 on
`step1-break-55-restore.log`. Committed as the docs commit that follows this note; the executor
resumes from the break stage on the new tip, branch recreated, patch and test file re-applied
from `$HOME/athan-gitree/sessions/55/`.

### Step 02 — STOPPED at the inside-window dump (2026-10-11, executor session)

Branch `docs/device-55-proof` off `09c13e46` (no commits; deleted on stop). Build
`BUILD-MOCK OK` (609s), `.apk` outside `/tmp` and the repo, `aapt2 dump badging`:
`package: name='com.mugtaba.athan' versionCode='1000000' versionName='2.0.6'`. Installed,
throwaway launch seeded the mock (today's rows 02:39-02:47 around the 02:42 download). Arming
through the Fajr alert sheet (screenshots read by the `vision` worker; coordinates measured
once): at-time Silent (540,929), Reminder 1 toggle on (926,1165), Sound (834,1375), interval
default 5 min; BACK committed — logcat `REMINDER SYSTEM: Scheduled:` for
`reminder_standard_fajr_2026-10-12_5` through `_2026-10-21_5`, `alertType: 2`,
`NOTIFICATION: Alert menu changes settled: committed: true`.

Reading recorded for the ledger: the step's arming sentence ("at-time bell for one prayer ...
reminder on another prayer") is unsatisfiable in the shipped code — `applyPrayerAlerts`
(`stores/notifications.ts:1198`) drops every reminder whose prayer's own at-time bell is Off,
so the Silent bell and the reminder both sit on Fajr, matching PLAN section 7's arming
description (reminder only). Not a behavioural choice; the only arming the code permits.

`alarms-before.md` (918 lines, unfiltered): 20 app `NOTIFICATION_EVENT` entries, ten
reminder+at-time pairs matching the mock's day1-day10 fajr rows, plus the tombstone
(`ACTION_FORCE_STOP_RESCHEDULE`, 2036-10-06, epoch 2106885990618). Target T = 2026-10-12
03:58:00, epoch 1791773880000 (exactly 300000 ms before the 04:03:00 at-time). Expected-fire
list for the jump: empty of firing entries (no app `NOTIFICATION_EVENT` entry sits before T);
the tombstone named as present-but-after.

Drive: `auto_time 0`; `service call alarm 2 i64 1791773860000` — the reply line scrolled past
the captured tail, but the clock state proves the call took (`date` read `Mon Oct 12 03:57:46
BST 2026`, exactly T minus 14s after the launch roundtrips; a denial would have left the clock
on Oct 11). HOME, `am kill`, `monkey` cold launch; inside-window dump captured ~03:57:45.

STOP condition met, exactly the step's named row ("The target's `when=` line is missing or
moved"): the target epoch 1791773880000 is ABSENT from `alarms-inside-window.md`, and the
window re-armed one day later — entries now 2026-10-13 through 10-22, whose 10-13 pair reads
03:58:00/04:03:00, matching `buildTimes(Oct 12 ~03:57)` exactly (fresh download: its day1 is
Oct 13, static fajr 04:03). The only `when=2026-10-12 03:58:00` line in the dump belongs to
the widget-refresh receiver (epoch 1791773880500), not the reminder. Fire polls (3 of the
allowed 6, at 03:58:06/17/27, buffer cleared at ~03:57:52): no posting; `fire.md` holds two
irrelevant Google Chimera lines. The last 40 logcat lines (`stop-logcat-last40.md`) are system
noise, no posting; the launch's ReactNativeJS pass lines had already rotated out of the ring
buffer, so the dumps carry the proof.

Why: the mock re-seeds TODAY's six rows on every download relative to the download minute
(`mocks/simple.ts` `buildTimes`, documented in `e2e/README.md`). The cold launch at T minus
20s downloads afresh: the armed date (Oct 12) is now the launch's "today", its fajr moves to
three minutes before the launch minute (03:54, past), the row's computed reminder moment
(03:49) is past, the pass returns `SKIPPED_DAY` for it, the record
`reminder_standard_fajr_2026-10-12_5` counts as unattempted, and the per-prayer stale sweep
removes the record and cancels the 03:58 alarm — ten seconds before it fires. The keep-alive
branch never engages: it requires `reminderDateTime > now` against the row the fresh download
gave, not the moment the alarm was armed with. The proof is structurally impossible on this
mock whenever the clock jumps into the armed reminder's date: the re-seed invalidates the row
before the imminent guard runs. The step-01 fix itself is not implicated — nothing in the
inside dump contradicts the unit-proven branch; the row it would keep no longer exists in the
fresh data.

Automatic time restored (`settings get global auto_time` reads `1`, clock resynced to
`Sun Oct 11 03:02 BST 2026`). The 3T stays on the mock build per the plan. The owner's
`athan-storage` was never opened; his preferences re-arm on his next production launch.

Evidence: `$HOME/athan-gitree/sessions/55/` — `alarms-before.md`, `alarms-inside-window.md`,
`fire.md`, `stop-logcat-last40.md`, `stop-logcat-pass.md` (empty, ring rotated), `mock.apk`,
`logs/mock.{prebuild,gradle}.log`. Question for the lead: the proof needs a ruling — (a) keep
the design but block the re-download (airplane mode after arming, so the cold launch's pass
reads the cached rows and the keep branch engages — the step names no such step), (b) re-plan
the device proof against a timetable that does not re-seed, or (c) accept the Jest proof alone
for R5.1's device half. Nothing committed; tree back to plan files only.

### Lead amendment: network cut for the device proof (2026-10-11, lead session)

Option (a) is taken, code-verified this session. Options (b) and (c) change owner-ruled design
and stay parked for the owner. The mock's per-download re-seed (`mocks/simple.ts` `buildTimes`,
documented in `e2e/README.md`) is harness behaviour, not the system under test: it re-dates the
armed row into the past before the imminent guard runs, so the ruled proof cannot construct its
window while the network is up.

Amendment to step 02's procedure, everything else unchanged: after the `alarms-before.md` dump
and before `auto_time 0`, cut the network — `settings put global airplane_mode_on 1` plus the
`android.intent.action.AIRPLANE_MODE` broadcast, verified by `settings get global airplane_mode_on`
reading 1; if the broadcast is denied, `svc wifi disable` and `svc data disable` instead and
treat a denied or failed cut as STOP. The cold launch then runs its pass offline against the
cached rows. Code-verified path: `app/index.tsx:107` reopens the refresh gate on every Android
cold launch; `initializeNotifications` (`shared/notifications.ts:561`) gates the refresh on
notification permission only, never network; `refreshNotifications` (`stores/notifications.ts:1760`)
reschedules from stored days and its armed-day-change guard (`:1797`) cannot fire with no
download. The offline launch is the product's own invariant: fully offline after first sync.

Restore is mandatory on every exit path, exactly like automatic time: airplane off (or
`svc wifi enable` and `svc data enable`), read back, record. Never leave the phone offline or
with automatic time off.

The build stands: reuse `$HOME/athan-gitree/sessions/55/mock.apk` (`BUILD-MOCK OK`, badging
recorded), re-verify the badging line before install. Arming per the step (the sheet state
persisted in `athan-storage-dev`; re-arm through the sheet only if the before-dump lacks the
armed entries). The expected-fire list rule already covers the jump passing the re-seeded
day-one entries; apply it as written from the fresh `alarms-before.md`.

### Lead note: the job parks on the owner; audit started (2026-10-11, lead session)

The re-run disproved the amendment's premise: the mock "download" is in-process
(`api/client.ts:124`), so no network cut can suppress the re-seed. Both attempts are clean
STOPs by the plan's own table, the phone is fully restored, and the fix is not implicated.
Every remaining road to R5.1's device half is the owner's, so the row parks until her morning.

The menu, verified this session: (b1') a pinned-date mock fixture handed to `build-mock.zsh` as
its mocks-file argument (the script copies it over `mocks/simple.ts` inside its own detached
worktree; needs only the `MOCK_DATA_SIMPLE` and `addMinutes` exports; the repo's mock and every
e2e consumer stay untouched) — recommended, it removes the clock dependence the proof cannot
live with; (b2) preview tier against a controlled endpoint (config changes, ask-first); (c)
waive the device half, R5.1 standing on the Jest proof; (e) a production build on the 3T,
which opens `athan-storage` on a phone the owner uses and conflicts with the fleettest rule —
listed for completeness, not recommended.

Meanwhile the audit runs early: step 02 is docs-only by design, so the code diff
(`origin/uat..uat`, plans excluded) is final. Three reviewers dispatched on it:
plan-conformance, blind, and a second blind pass focused on threading and lifecycle
(notifications scheduling earns the third pass). Adjudication lands in `AUDIT.md`; the formal
close (PASS, DONE, folder delete, push) still waits for the row's EXECUTED state, so nothing
irreversible happens before the owner rules.

### Lead note: audit fixes merged (2026-10-11, lead session)

All three reviewers returned. Plan-conformance: clean, mechanical verification of every
contract and criterion. Blind: two findings, both confirmed by the lead and fixed — the
record-membership guard had no pinning test (deleting `.includes(identifier)` left the suite
green; fixed in `bb747947`, red-green proven by mutation: one test failed with the mutation
applied, five passed after the revert) and the rewritten `@returns` had dropped "or imminent"
from the null-return list (restored in `097a7bcd`, comment-only). Threading and lifecycle
blind pass: clean; its one nuance (a blessed ghost record costs no fire and the next pass
cleans it) is accepted as a non-defect. Both fix commits merged as `504452d6`; versions
2.0.8 and 2.0.9; the formal audit close (PASS, row DONE, folder deletion, push) still waits
on the owner's proof-vehicle ruling and step 02's completion. `uat` holds the unpushed set;
every commit in it was made or checked by this session's audit.

### Owner ruling and lead amendment: the proof runs on a production build (2026-10-11)

The owner ruled option (e): a production build on the 3T, consent recorded here, so the
fleettest stop-rule yields by her explicit word. Deltas from `steps/02-device-proof.md`,
everything else unchanged:

- Build: `zsh $HOME/athan-gitree/bin/build-prod.zsh uat $HOME/athan-gitree/sessions/55/prod.apk`
  (`<commit-or-branch> <out.apk>`; `EXPO_PUBLIC_ENV=prod`, real London timetable, the owner's
  `athan-storage`, versionCode 1000000, debug keystore, install `-r` keeps app data). Success
  ends `BUILD-PROD OK`; never two builds at once. The badging check expects
  `package: name='com.mugtaba.athan'` with `versionCode='1000000'` and the built versionName.
- Storage is `athan-storage`, the owner's: his real bells re-arm on first launch, and the
  before-dump's expected-fire list rule applies to whatever is armed, as written.
- Arming through the sheet: set one prayer's at-time bell and its 5-minute Sound reminder on
  tomorrow's row. Transcribe that prayer's bell state from the sheet before changing it and
  restore it after the proof unless the owner said otherwise.
- No network cut, no mock notes apply, and the airplane amendment above is void: the real
  timetable is date-stable (the API is the source of truth), so the inside-window pass reads
  the same row the reminder was armed from.
- The clock jump passes the owner's real armed alarms and they fire on the test phone; the
  step's expected-fire list rule covers them, as written.
- Ending: automatic time on, the 3T left on the production build.
- Evidence under `$HOME/athan-gitree/sessions/55/`, new files prefixed `prod-` where a mock
  namesake exists.


### Step 02 re-run — STOPPED at the inside-window dump with the network cut verified (2026-10-11, executor session)

Branch `docs/device-55-proof` off `09c13e46` (no commits; deleted on stop). Amendment followed
exactly. Badging re-verified before install:
`package: name='com.mugtaba.athan' versionCode='1000000' versionName='2.0.6'`. `install -r`
plus throwaway launch at 03:14:59 (network up): pass re-armed from the persisted sheet state,
`staleCancelled: 1` (the old Oct 22 entry swept); no sheet interaction needed — the fresh
before-dump carried the armed set. Reading recorded before any clock change: the expected-fire
list was constructed from the fresh `alarms-before.md` exactly as the step writes it (app
`NOTIFICATION_EVENT` entries before T, plus the tombstone named), and every pending app alarm
was transcribed besides; a pending non-NOTIFICATION_EVENT app alarm before T would have been a
STOP under the step's own row. None existed.

`alarms-before.md` (924 lines, unfiltered): 20 unique app `NOTIFICATION_EVENT` entries, ten
reminder+at-time pairs each exactly 300000 ms apart on Oct 12..Oct 21 (mock day1-day10 fajr
rows), plus the tombstone (`ACTION_FORCE_STOP_RESCHEDULE`, epoch 2106885990618, 2036-10-06,
after T). T = 1791773880000 = 2026-10-12 03:58:00 BST (exactly 300000 ms before the 04:03:00
at-time), also the dump's "Next wake from idle". Expected-fire list: empty of firing entries;
tombstone named as present-but-after. No pending widget alarm in the before dump (the receiver
appears only in the stats section).

Network cut (amendment): `airplane_mode_on 1` set; the `AIRPLANE_MODE` broadcast was DENIED
(`Permission Denial: not allowed to send broadcast ... uid=2000`), so the amendment's svc
fallback ran (`svc wifi disable`, `svc data disable`). Cut verified and recorded
(`network-cut.md`): setting reads 1, `Wi-Fi is disabling`, `Active default network: none`.

Drive: `auto_time 0` (reads 0); `service call alarm 2 i64 1791773860000` answered
`Result: Parcel(00000000 00000000   '........')` (the expected prefix, captured in full this
time); `date` read `Mon Oct 12 03:57:40 BST 2026`. HOME, `am kill`, `monkey` cold launch;
inside dump captured ~03:57:55 (`date` after capture: 03:57:59).

STOP condition met, the step's named row again ("The target's `when=` line is missing or
moved"): the target epoch 1791773880000 is ABSENT from `alarms-inside-window.md` (0
occurrences), and the window re-armed one day later — 20 entries on Oct 13..Oct 22, the 10-13
pair at 03:58:00/04:03:00, matching `buildTimes(Oct 12 03:57:56)` (fresh download: day1 is
Oct 13, static fajr 04:03). The pending widget-refresh receiver sits at epoch 1791773880500
(T+500ms, scheduled by the launch), tombstone unchanged. No posting at the moment: an
immediate check at T+16s shows no notification lines (only the background-task registration
and an unrelated Google Chimera line).

The cancel itself is in the captured launch log (`cold-launch-pass.md`), two seconds before
the moment: `03:57:58.478 NOTIFICATION SYSTEM: Cancelled: { data:
'reminder_standard_fajr_2026-10-12_5' }` and `03:57:58.479 NOTIFICATION: Cancelled stale
notifications: { count: 1, ids: [ 'reminder_standard_fajr_2026-10-12_5' ] }`.

Why the amendment cannot work on this mock — the premise "the cold launch then runs its pass
offline against the cached rows / with no download" is false, and this session verified it in
the code before driving and on the device while driving:

1. `mocks/simple.ts:258-265` — `MOCK_DATA_SIMPLE.times` is a getter calling
   `buildTimes(new Date())`, so every download re-dates TODAY's rows around the read moment,
   in-process.
2. `api/client.ts:123-124` — `fetchRawData` does `if (!isProd() && !isPreview()) return
   MOCK_DATA_SIMPLE;`. The mock "download" never calls `fetch`; no network is involved, so no
   network cut can suppress it.
3. `stores/sync.ts:274-275` — `needsDataUpdate` opens with `if (APP_CONFIG.isDev) return
   true;`, and `shared/config.ts:2` defines isDev as "env neither prod nor preview", which the
   mock build is. The download is therefore unconditional on every sync, cached days or not.
4. No connectivity gate exists anywhere on the path
   `syncLoadable -> sync -> needsDataUpdate -> updatePrayerData -> Api.fetchYear ->
   fetchRawData` (call graph verified this session).
5. Device proof of 1-4: the offline cold launch logged `SYNC: Starting data refresh` at
   03:57:56.587 and `API: Data fetched` at 03:57:56.607 — a 20 ms "fetch" with
   `Active default network: none` — then `MMKV DELETE: prayer_2026-10-12` +
   `MMKV WRITE: prayer_2026-10-12` (the re-seed), then the reopened-gate pass at 03:57:57.164
   (`NOTIFICATION: Never scheduled before, needs refresh` is the reset atom the reopen wrote),
   which skipped the re-seeded Oct 12 row (its computed reminder moment 03:49 is past) and
   stale-cancelled the armed 03:58 alarm. The first attempt's own evidence already implied
   this: that launch re-seeded although Oct 12 was stored, which only the isDev short-circuit
   explains.

The step-01 fix is not implicated: nothing in the inside dump contradicts the unit-proven
branch; the row it would keep is re-dated out from under it before the imminent guard runs
(`reminderDateTime > now` is tested against the row the fresh getter built, not the moment the
alarm was armed with). The proof remains structurally impossible on this mock whenever the
clock jumps into the armed reminder's date, online or offline.

Restore recorded (`restore.md`): `airplane_mode_on 0` (the off broadcast was denied the same
way; the setting and `svc wifi enable` + `svc data enable` carry the restore), `auto_time`
reads 1, clock resynced to `Sun Oct 11 03:21:15 BST 2026`, `Wi-Fi is enabled`. The 3T stays on
the mock build. The mock opened `athan-storage-dev` throughout; the owner's `athan-storage`
was never touched and his preferences re-arm on his next production launch.

Evidence: `$HOME/athan-gitree/sessions/55/` — this run added `network-cut.md`, `clock-drive.md`,
`restore.md`, `cold-launch-pass.md` (full ReactNativeJS log of the offline launch, so the ring
rotation that ate the first attempt's lines cannot eat this one), `stop2-pass-lines.md`,
`stop2-logcat-last40.md` (the step's named transcription), and replaced `alarms-before.md` and
`alarms-inside-window.md` with the fresh dumps; `step2-unfinished.patch` and
`step2-unfinished-status.txt` hold the tree state. Nothing committed; branch deleted; tree back
to the plan files only. Question for the lead: option (a) is disproven on device — the device
proof needs (b) a timetable that does not re-seed per download (a pinned-date mock, or a
preview-tier build against a controlled endpoint), or (c) the Jest proof accepted for R5.1's
device half, or a new ruling; the owner is away until morning.



