# Audit: Session 30. Both stores answer for themselves (ISSUES #35)

Audited on 2026-09-27 against `uat-2` at `182a3e32`, in a scratch worktree at that sha with `node_modules` symlinked
from the main checkout.

## 1. What was checked

| Item | Command or file | Result |
| --- | --- | --- |
| The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` | 6 commits: 3 step commits and their 3 merges, plus the 2 planning commits and their merge already pushed before execution began. Nothing else |
| Step 1 does what the plan specified | `git show fb79a770` | `readPlayListingVersion` exists with the plan's name, signature and both regexes verbatim; `getStoreVersion` keeps `Promise<string \| false>` at this step; `ITUNES_LOOKUP_URL` keeps `country=gb`; no `githubusercontent`, `RELEASES_URL`, `ReleasesConfig` or `isProd` remains |
| Step 2 does what the plan specified | `git show bb281574` | `fetchWithTimeout` uses `AbortController` plus `setTimeout`, clears the timer in a `finally`, and passes `signal` last; `getStoreVersion` widens to `string \| null \| false`; the success stamp is `now` and the failure stamp is `now - ONE_DAY_MS + UPDATE_RETRY_MS`; both constants are in `TIME_CONSTANTS` and `ONE_DAY_MS` is unchanged |
| Step 3 does what the plan specified | `git show 472f734b` | Android tries `market://` then the `https` Play page; iOS makes one attempt and returns; the `logger.error` text is byte-identical to before |
| Every test the plan listed exists | `npx jest device/__tests__/updates.test.ts --watchman=false --selectProjects=unit --listTests` and the run's test names | 33 tests, and each name in the plan's step tables is present |
| The tests still guard | the three break scripts, run from the scratch worktree's root, after `grep -c /Users/muji/repos/rn.athan.uk <script>` printed `0` for each | 13 breaks, every one `BREAK CAUGHT`, each script ending `ALL AS EXPECTED: 1`, and the worktree left clean afterwards |
| The red check reruns | step 2's change reverted in the scratch worktree, putting the stamp back in a `finally` | 4 failed, 29 passed: exactly the four tests that guard it (`stamps a failed check an hour back so the day is not lost`, `retries an hour after a failure and not before`, `abandons a fetch that has not answered in ten seconds`, `logs error when outer catch is triggered`). Restoring the file returned `33 passed` |
| The whole suite | `yarn validate` in the scratch worktree | exit 0. `Test Suites: 173 passed`, `Tests: 2 skipped, 4772 passed, 4774 total`, and 100% on all four measures: statements 4412/4412, branches 1966/1966, functions 917/917, lines 3975/3975 |
| Versions in sequence, all three files in step | `git show <sha>:app.json` against `git show <sha>:package.json` for each step commit | `fb79a770` 1.29.17, `bb281574` 1.29.18, `472f734b` 1.29.19, each with `app.json` equal to `package.json` |
| The live endpoints answer | `~/athan-device-sweep/session30/live-endpoints.txt` | `resultCount 1 version 1.5.1` for iTunes, `key141 1.5.2` for Play |
| The SHIPPED parser reads the live page | `~/athan-device-sweep/session30/parse-live.txt`, a throwaway suite run against the 1.14 MB page as served and then deleted | `1 passed, 1 total`; `git status --porcelain` afterwards showed no leftover test file |
| Reviews recorded | `LOG.md` | A verdict for all three steps, plus the two findings the executor applied under `EXECUTOR-BRIEF.md` section 4, item 8 |
| No owner rule bent | `git show --name-only` over the range | No visual file, no `releases.json`, no `uat`, no EAS, no API key, no ignore comment, no skipped hook |
| `releases.json` unread and unchanged | `grep -c githubusercontent device/updates.ts`, `git diff a265ec1d..uat-2 -- releases.json` | `0`, and no diff |
| Device evidence backs every records claim | the files under `~/athan-device-sweep/session30/`, read here | `live-endpoints.txt` carries both readings; `parse-live.txt` shows `1 passed, 1 total`; `android-update-log.txt` and `ios-update-log.txt` are both **0 lines**, which is what "the device fetched and parsed the listing" means here; `alarms-before.txt` holds 19 lines of healthy armed alarms |
| The phone was left as the plan says | `adb shell settings get global auto_time`, `settings get global verifier_verify_adb_installs`, `dumpsys package` | `auto_time` `1`, `verifier_verify_adb_installs` restored to `1`, `versionName=1.29.19`. Automatic time was never turned off in this session |
| Records accurate | `ai/ISSUES.md`, `ai/AGENTS.md` | #35 moved to FIXED with the measured figures; the open-now line drops #35; the fixed index gains it; the `releases.json` rule gains the sentence the plan gave |

## 2. Findings

### 2.1 Two the executor found and fixed itself, both recorded in `LOG.md`

Both meet all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, and both are judged sound here.

1. **The plan's `timeoutNeverFires` break was wrong.** It enlarged the timeout's delay to `Number.MAX_SAFE_INTEGER`
   expecting the timer never to fire, and `setTimeout` clamps any delay above 2^31-1 to 1 ms, so the timeout fired
   SOONER and the break printed `BREAK NOT CAUGHT`. The executor measured the clamp directly with node
   (`MAX_SAFE_INTEGER fired after 2 ms`, with node's own `Timeout duration was set to 1` warning), replaced the break
   with `timerNeverAborts`, which substitutes `undefined` for `controller.abort()` in the callback, and corrected the
   plan's step file so the plan records what actually shipped (`AUDITOR-BRIEF.md` section 4, FIX IT, item 3). Verified
   here: the corrected break is caught.
2. **One test of the executor's own was flaky and the commit hook caught it.**
   `logs error when outer catch is triggered` read the real clock in both the code and the assertion, so
   `Date.now()` differed by 2 ms between them (`Expected: 1790416458406, Received: 1790416458404`). It passed three
   local runs and failed inside the hook. Fixed by pinning the clock to the same `PINNED_NOW` the other stamp tests
   use, which changes the test's inputs and not what it proves. Verified here over three consecutive runs.

### 2.2 What the audit found

No defect in the shipped code, the tests or the records. Three observations, each recorded rather than fixed:

1. **Step 2's commit was amended** from `89f28ce3` to `bb281574`, to carry a plan tick left uncommitted at the first
   merge attempt. The pre-amend sha is not on `uat-2`, the amend happened before any merge, and `LOG.md` says so, so
   no history was rewritten.
2. **The device proof is narrower than the test proof, deliberately, and the plan said so before it ran.** The prompt
   itself cannot be photographed on either device, because the live store version is 1.5.x while the installed build
   is 1.29.19, so the real comparison correctly answers "no update". What the devices prove is that the new fetch and
   parse run cleanly on real hardware: zero error lines in either log. What the prompt does when a store IS newer is
   proven by the seven tests in `__tests__/app/index.test.tsx`, which render the real modal. `LOG.md` states this
   plainly rather than implying more, which is the honest form.
3. **Play Protect blocked the first Android install for 10 minutes**, and `e2e/device-atlas-oneplus3t.md` already
   carries the remedy from session 15, so the atlas earned its keep. The setting was restored afterwards, which the
   audit verified independently (`verifier_verify_adb_installs` reads `1`).

## 3. Verdict

**PASS.**

Three steps, three commits, three merges, 1.29.17 to 1.29.19. The suite is at 4774 tests and 100% on all four
measures, all 13 breaks are caught, and both defects the executor met were fixed to the plan's own standard with the
plan corrected where it was wrong. `releases.json` is read by nothing and is byte-identical, which is exactly the state
the standing rule requires before the owner deletes it.
