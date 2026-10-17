# Lane 131 log: expo-location, the six named unverified readings

Resume from: nothing owed at the planning stage; next action is the grill, then READY.

## Ticket 131 (2026-10-17)

Lane worktree `$HOME/athan-gitree/worktrees/lane-131` off `ca73f5a9` (2.0.984).
Scratch worktree for the probe builds: `$HOME/athan-gitree/worktrees/plan-131`
(detached at `ca73f5a9`, never committed, removed at the lane's end).

## Planning (2026-10-17)

- Row 121's DONE cell re-read in full from the queue; its UNVERIFIED list is the
  six readings, re-derived one to one. RD6 is void by row 121's adopt-nothing
  ruling (D131.1).
- /next API surface verified from `node_modules/expo-location` 58.0.17 source:
  `getPosition` options and the `Position` fields, `enableLocationServices`
  (Android-only, GMS in-app dialog claim), `RequestPermissionsAccuracyOption.FULL`
  (the iOS temporary prompt under a reduced grant), the package exports map.
- Classic side verified: `getLastKnownPositionAsync` exists with no JS platform
  guard.
- Build recipes: `$HOME/athan-gitree/BUILD.md` (mock recipe, fleettest suffix,
  aapt2 gate, TMPDIR and env discipline), the XS atlas build rows, the 3T atlas
  dialog rows, e2e/AGENTS.md traps, `shared/logger.ts` (Pino off in prod, on in
  local; devcheck reads tag `ReactNativeJS`).
- Frontier answered agent-ruled: D131.1 to D131.7, PLAN.md section 2.1.
- PLAN.md, steps 1 to 3, `scripts/probe-131.txt`, `scripts/preflight-131.sh`
  and five anchors (each counts 1) written.
- `yarn install` in the lane worktree under `commit.lock` (8.9 s, cached); hooks
  active from the first commit.

session: self (the lane runs every phase itself per D131.5; the grill and the two
review passes are dispatched workers, named below when they run)

### Step 01 — 3T readings captured (RD4, RD1, RD5, RD2)

- Pre-flight clean (SERIAL_3T/IPHONE_UDID exported; the plan text's `3T_SERIAL`
  placeholder is prose, the shell variable is `SERIAL_3T`; the preflight and steps
  were corrected in the READY commit's aftermath and ride the step-3 commit).
- Scratch build at ca73f5a9: first gradle run failed lintVitalRelease
  (ExtraTranslation: the per-locale widget strings generate from committed config but
  the default-locale strings only under EXPO_PUBLIC_ANDROID_WIDGETS=1; grill finding
  11's strip was wrong for Android and was reverted for the ANDROID flag alone).
  Second run BUILD SUCCESSFUL in 5m51s; aapt2 gate: com.mugtaba.athan.fleettest.
- All four readings captured; verbatim lines and verdicts in READINGS.md. Two
  unplanned-but-recorded behaviours: the pm revoke restarts the app (readings
  resumed on relaunch), and GMS's own LocationOffWarningActivity freezes the probe's
  loop while it holds focus (RD2's side observations).
- Phone as found: services on (gps,network), fleettest uninstalled, the owner's
  package untouched (grants rode the fleettest package).
- Honest-check pass: every quoted [RD line verified present verbatim in
  sessions/131/3t-rd.log (script in the step transcript, 0 missing).
session: self (lane-run device step per D131.5)
