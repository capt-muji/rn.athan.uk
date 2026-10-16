# AUDIT - ticket 122

Range audited: `cf754b25..4d76ecc5` (the ticket's six commits d9a238d3, 6db0e5f0, dc15fc16,
ca1370ae, 3dbf3267, 58bf70ff and their five merges; tickets 111 and 123 interleave and are
file-disjoint). Reviewers dispatched 2026-10-16: one blind (the six-commit diff, the worktree
and `ai/AGENTS.md`; it never read `PLAN.md` and reproduced every number, including live fetches
of the two external sources) and one plan-conformance (the plan folder, the ledger and the
diff).

## What the audit verified

- The blind reviewer reproduced the whole measurement independently: the versions (58.1.10,
  58.0.12), the four added modules, the zero-hit logcat grep, the two server-lifecycle greps
  (0 and 1, the second at `ADBServer.js:35`), every line cite in FINDINGS section 2 down to
  `adbProcess.js:158` and `env.js:205`, the 36-hit harness sweep file by file, the flows' zero
  adb hits, the four build scripts' single comment hit each, both `npx expo` help surfaces, and
  the whole toolchain line. It also confirmed the launch path pre-checks the installed package
  (`AndroidPlatformManager.js:67`, `PlatformManager.js:129`) before `am start -n`, which is the
  ground for question 1's option B.
- Both external sources were re-fetched live and confirmed: the changelog's `## 58.0.0 —
  2026-09-10` line and the pull request's 28-file list with its per-file counts.
- Plan-conformance verified the six commits, their branch names, their messages and versions,
  the row's progression PLANNING to EXECUTED, the five merges as two-parent merges, D122.7
  (nothing outside the plan folder, the queue row and the two tracked version files changed;
  the four build scripts and every `e2e/` path untouched), D122.8, and the criteria it could
  resolve.
- `bash scripts/check-plan.sh ai/plans/122-avd-adb` printed `PLAN OK` again after execution, and
  all thirteen anchors still count exactly 1 inside the 3-to-15 line band.

## Findings and verdicts

| Finding | Verdict | Action |
| --- | --- | --- |
| blind 1 / conformance 4: "twelve command names" in the ledger; `npx expo --help` prints thirteen (`start`, `export`, `run:ios`, `run:android`, `prebuild`, `install`, `customize`, `config`, `serve`, `login`, `logout`, `whoami`, `register`) | confirmed, count | fixed: "thirteen" in both ledger entries. The conformance finding also named `FINDINGS.md:99`; that file carries no count, so no change there |
| blind 2: "Twelve test files and fixtures" does not match the pull request's file list (ten test files and five fixtures) | confirmed, count | fixed to "Ten test files and five fixtures" |
| blind 3 / conformance 7: "both Android build scripts cut arm64-v8a only" against the four scripts named in section 3 (all four default `ARCHS` to arm64-v8a) | confirmed, count | fixed to "all four build scripts" |
| conformance 1: [R1.1] unmet - the four added modules were named without their exported names or a path-and-line cite | confirmed, criterion | fixed: FINDINGS section 1 now carries an export table (`adbProcess.js:5-15`, `adbDeviceList.js:5-8`, `adbEndpoint.js:5-11`, `adbDiagnostics.js:5-11`) |
| conformance 2: no step entry records a review verdict or its merge, and the plan's ledger contract omits both | confirmed, the plan was wrong | fixed: a review line and a merge line (branch, `--no-ff`, sha) added to all four entries, and PLAN.md section 8's ledger contract now names them |
| conformance 3: the `session:` line carried prose where the contract requires `session: <ses_id>` | confirmed, ledger shape | fixed: all four entries end `session: ses_eba43e588ffesMciSNvZDmZ8ih`, the lane's own session |
| blind 4: the stale `--device` line is `e2e/AGENTS.md:17`; `:18` is the build-then-install advice | confirmed, cite | fixed in both places |
| blind 5: a home path written `~/Library/Android/sdk` against the placeholder rule | confirmed, rule | fixed to `$HOME/Library/Android/sdk` |
| blind 7: `adbEndpoint` "(four)" undercounts the module (four functions plus the probe-limit constant) | confirmed, count | fixed to "four functions and the probe-limit constant" |
| conformance 5: the version ladder carries 2.0.890 twice (and 2.0.886 twice) with no record, and the tie-break rule cannot see equal versions | confirmed, records gap | fixed: a "Lane notes" paragraph in `LOG.md` records both collisions and the reason the later steps took the next free patch |
| conformance 6: "a pre-check and a post-check" is wrong on timing - both user-number checks run after the command (`ADBServer.js:89-91`, `:103-111`) | confirmed, wording | fixed to "two post-execution checks" |
| conformance 8: the `getDevices` sentence inverted the two cases - an AVD listing failure is swallowed with no text while a device is attached, and throws `ANDROID_AVD_DISCOVERY` carrying the cause with none attached | confirmed, wording | fixed: the sentence now states both cases |
| blind 6: four em dashes in the ledger's step headings against the writing style | rejected | the ledger contract these records answer to mandates the heading `### Step <NN> — <state>`; the dash is the contract's, not the prose's |

## Result

PASS. Twelve findings fixed in this merge, one rejected with its reason. No number moved: every
measurement the blind reviewer re-ran printed what the record carries. The recommendation stands
as executed - question 1 option B and question 2 option B, no repo change before the owner's
ruling - and the row carries both, their measured grounds, the five named experiments and the
six unverified claims.
