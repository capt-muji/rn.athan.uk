# Audit, session 7 — Android: each notification replaces the one before it

🤖  Model: GLM 5.3 (audit session)
Time: 15:57:13 17.09.2026

The owner's directive of 15:36 ("do everything yourself, no subagents") applies to this audit: every
check below was run directly in the main session, and the Code Reviewer step of AUDITOR-BRIEF.md
section 4 was replaced by a direct self-review of the audit commit before merge. The executor work up
to 15:30 was done by execution subagents per the plan; the executed wrap (commit `8ffa7d74`) and this
audit are the main session's own.

## What was checked, and the proof

1. **The range.** `git log --oneline 57a61225..uat-2` lists only this session's commits: docs(plans)
   commits `d47ea94e` (1.27.196) through `8ffa7d74` (1.27.203), their `--no-ff` merges, and the one
   feature commit `dd8330ab` (1.27.198) with its merge `45754e60`. No other commit. Versions run
   196, 197, 198, 199, 200, 201, 202, 203 in strict sequence, `app.json` and `package.json` together
   in every commit.
2. **Plan against commits.** `git show dd8330ab` changes exactly the step's file list: the plugin, its
   test, one line in `app.json` (the plugin entry after `portraitOnlyIpad`, verified in the diff),
   `package.json`, and the plan's own records. `plugins/replacePreviousNotification.js` read in full
   against `steps/1-shared-tag-plugin.md`: `module.exports` is the composer with the eight riding
   properties; `editManifest` performs exactly the guarded surgery (receiver array created, both
   guards, `xmlns:tools` only when absent, the whole document returned) and is idempotent (test 2);
   `writeKotlin` writes both templates at the exact path; `DELEGATE_SOURCE` and `SERVICE_SOURCE` equal
   the step's Kotlin verbatim, `SHARED_NOTIFICATION_TAG` `athan-notification`, the six actions in
   order. The suite (`plugins/__tests__/replacePreviousNotification.test.ts`, 189 lines, 10 tests)
   follows `__tests__/README.md` and pins every contract including the upstream seams. Comments are
   why-only; the line-7 fully-qualified note is a quirk explanation in the same spirit, accepted.
3. **The tests still guard.** `breaks-1.sh` run from the scratch worktree
   (`~/athan-device-sweep/worktrees/audit-7`): five lines `BREAK 1a..1e AS EXPECTED` (1d two failures
   as specified), `ALL AS EXPECTED: 1`. The script is root-relative throughout; the main-repo string
   the brief's grep looks for exists only in its usage comment, which is inert. Red check: deleting
   the plugin in the worktree kills the suite at `Cannot find module '../replacePreviousNotification'`,
   `Tests: 0 total`, exactly the step's red expectation; restored after.
4. **The whole suite.** `yarn validate` in the worktree: tsc clean, Biome `No fixes applied.`, 2
   skipped (pre-existing platform skips), 4509 passed, Statements/Branches/Functions/Lines 100%.
5. **Reviews.** `LOG.md` records a review verdict for every commit: the feature commit two rounds
   (the round-1 fix, the missing guarded-edits why-comment above `const hasOurs`, recorded with the
   three conditions of EXECUTOR-BRIEF.md section 4 item 8 and re-verified green); each docs commit
   records its planner-review verdict and merge. Reread in the commit messages and the LOG.
6. **Device evidence.** The numbers reopened from `~/athan-device-sweep/session7/` with the plan's own
   tools: `posts.py` on `fire-auto.logcat.txt` with the recorded window (`09-17 15:24:41` to
   `15:35:41`) prints `POSTS 5 / MUTED 2 / REFUSED 0`, every line `com.mugtaba.athan,0,athan-notification,0`
   across `reminder_fajr_20`, `extras_at_time`, `athan_1_v2` and the fallback channel; `tray.py` on
   `tray-auto.txt` prints `TRAY 1`, one shared-tag line; the raw `tray-end.txt` dump holds exactly one
   active app record (`tag=athan-notification`, `channel=athan_1_v2`) beside the four cancelled pile
   entries in the archive; `alarms-end.txt` holds every predicted day-1 instant (09-18 03:43, 04:03,
   16:58). Read-only adb now: `versionName=1.27.202` (= `package.json`), `auto_time` 1, keyguard
   `showing=false`: the phone stands as 7.5 item 10 leaves it.
7. **The owner's rules.** No commit in the range touches `releases.json`, `.env`, `eas.json`, `uat` or
   CI paths (`git log --name-only | sort -u` checked). No `biome-ignore` in the new files. No visual
   change (no file under `app/`, `components/`, `hooks/`, `stores/`, `device/`, `shared/` changed).
   No prayer time copied or synthesised (no data file changed). Every commit passed the full hook,
   including the prebuild lockstep catch on the executed wrap, fixed by re-running prebuild per the
   repo ritual before the commit landed.
8. **The records.** The 8.1 findings text matches the evidence above with its placeholders filled by
   the LOG (`ASR_POSTS=1`, `PAIR_POSTS=2`/`PAIR_MUTED=1`, `AUTO_FIRES=5`, `END_ALARMS=5`,
   `PURGE_POSTS=5`, `TRAY 1` throughout). The 15:30 sound question is resolved by the owner's standing
   delegation; the claim's amendment (mechanism and channel record, verified directly in
   `shared/notifications.ts` and `ExpoNotificationBuilder.kt` before writing) is recorded in the plan,
   the LOG wrap-up and `ai/prompts/README.md`.

## Findings

None requiring a fix. Two notes, recorded here only: the break script's usage comment names the main
repo path (inert; the script is root-relative and ran from the worktree), and this audit's review step
was a direct self-review under the owner's no-subagents directive rather than the brief's Code
Reviewer subagent.

## Verdict

**PASS.** The row becomes DONE. `uat-2` is pushed with this audit's commit as its tip.
