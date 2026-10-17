### Step 5 - the lane's rules into the two harness docs, gated on lane 122

Requirements: R6.1
Weight: 1

Anchor check: before editing, re-anchor both files at the post-122 `uat` sha
(D9): save fresh anchor excerpts beside the originals with the sha in the
filename, verify each counts exactly 1, and record the sha in LOG.md. The
gate: `grep -c -- "--binary" e2e/README.md` prints at least 1 (lane 122's
landed correction). While it prints 0, hold in 15-second cycles re-reading
`uat`; when lane 122's landed text contradicts this plan's rules, `STOP:` for
replan.

Goal: the adopted lane's rules live in the harness docs, disjoint from lane
122's landed correction.

Branch: `lane/133`; this step's commit is the only harness-docs commit.

Files: `e2e/README.md`, `e2e/AGENTS.md`, `ai/plans/README.md` (row 133 to
EXECUTED), the three version files, LOG.md.

Red tests (executor-greppable): before the edit, all of these print 0:
`grep -c "athan-smoke-28" e2e/README.md`,
`grep -c "never a measurement witness" e2e/README.md`,
`grep -c "athan-smoke-28" e2e/AGENTS.md`. After the edit each prints 1.

Change contracts: two pasted passages, verbatim, nothing else in either file.

1. Into `e2e/README.md`, a new section between the end of `## Run` (the
   closing code fence of its block) and the `## The 30fps floor` heading:

```markdown
## The AVD lane: smoke only, never a witness

One emulator serves the harness: `athan-smoke-28` (android-28 google_apis
arm64-v8a, 1080x1920 at 420 density, the 3T's measured panel class). It
exists for flow smoke and disposable destructive checks: replaying
`e2e/flows/*.yaml`, install and uninstall cycles, day-roll and
language-switch exercises, dialog mechanics. The flows' tap points are 3T
panel coordinates, so they replay unchanged.

Boot it headless and kill it when done (never leave it resident: it is real
CPU load beside sibling builds):

```sh
emulator -avd athan-smoke-28 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect
adb -s emulator-5554 shell getprop sys.boot_completed   # 1 = ready; the serial increments per instance
adb -s emulator-5554 emu kill
```

- Never a measurement witness: `baseline-compare.sh`, `frame-audit.sh` and
  every perf number name a physical device, and no measurement claim cites
  the emulator.
- Disposable by design: destructive checks that would never touch a fleet
  phone (uninstall storms, clock jumps, day rolls) run here; recreate the
  AVD with `avdmanager delete avd -n athan-smoke-28` and the create command
  (image android-28 google_apis arm64-v8a, panel 1080x1920, density 420)
  when a clean slate is wanted.
- Further system images (any other API level) are ask-first ground; this one
  image was ruled in by the owner, 2026-10-17.
- The emulator's adb serial is `emulator-5554` on the first instance: pass it
  to adb with `-s` and to Maestro with `maestro --device emulator-5554 test
  <flow>`.
- The 3T atlas's app rows transfer only because panel, density and OS class
  match; its OEM rows (launcher, widget picker) are OxygenOS and never apply.
```

2. Into `e2e/AGENTS.md`, one bullet directly after the bullet lane 122 lands
   (the `--binary` install-and-launch bullet), before the force-stop bullet:

```markdown
- The AVD `athan-smoke-28` is smoke and disposable destructive checks only
  (boot headless, kill it after): it is never a measurement witness, every
  perf claim names a physical device, and any further system image is
  ask-first.
```

Green run: the three red greps print 1; `bash scripts/check-plan.sh` is not
needed here; `yarn validate` gates the commit (docs changes, tsc and Biome
pass over untouched code; the full suite runs in the hook as always).

Break script: delete the new section and the bullet, rerun the three greps,
each must print 0 (this proves the greps bind to this step's text); restore
the passages, each must print 1 again. The break never lands in a commit.

Version and commit: union max plus 1, message
`<VERSION> - docs(e2e): the AVD lane rules (133): smoke and disposable checks only, never a measurement witness`.
The same commit sets row 133 to EXECUTED.

Review checklist: the passages carry no phone serial (the placeholder rule),
no em dash, and no measurement claim that names the emulator.

Merge: as step 1, with the build.gradle versionName sync.

Done when: R6.1 holds, the queue row reads EXECUTED, and the commit is merged.
