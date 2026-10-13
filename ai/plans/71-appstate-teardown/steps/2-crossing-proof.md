# Step 2: the crossing pinned on the 3T

Weight: 3
Requirements: R2.1, R2.2, R2.3

## Anchor check

Run step 1's anchor check again: nineteen lines, every line `1`. Then confirm step 1 landed:

```bash
test -f ai/plans/71-appstate-teardown/FINDINGS.md && echo STEP1-OK
grep -q "## 6. The verdict" ai/plans/71-appstate-teardown/FINDINGS.md && echo VERDICT-OK
```

Expected: `STEP1-OK` and `VERDICT-OK`. Anything else: STOP.

## Goal

Reproduce the relaunch teardown on the 3T mock build, capture the exception line verbatim,
measure the span and the pid, prove the app healthy across two boundary crossings, and append
section 7 to FINDINGS.md. This step pins the record; it judges nothing (D90).

## Branch

```bash
git fetch origin
git checkout -b docs/71-2-crossing-proof uat
```

Expected: `Switched to a new branch 'docs/71-2-crossing-proof'`.

## Device and build

The device is the OnePlus 3T (`3T_SERIAL`), Android 9, the floor test device. The dispatcher
replaces the `3T_SERIAL` placeholder with the connected device's real serial, and every
command below reads it from `$SERIAL`. Confirm the
serial before anything else:

```bash
adb devices | grep -F "$SERIAL"
```

Expected: one line naming the serial with `device` state. A different serial or none: STOP
(section 2.2, item 3 of PLAN.md).

Version first (this step's commit needs it): take the next patch as in step 1, under the
version lock, set in `app.json` first, then `package.json`, then the gradle `versionName`.
The mock build reads the committed `uat` `app.json`, so the build artefact's versionName
carries uat's version, not this step's bump.

Build the mock:

```bash
zsh "$HOME/athan-gitree/bin/build-mock.zsh" uat "$HOME/repos/rn.athan.uk/mocks/simple.ts" "$HOME/athan-gitree/sessions/71/app-mock.apk"
```

Expected: a `BUILD-MOCK OK` line, then the report block (also saved at
`app-mock.apk.build.txt` beside the apk); `BUILD-MOCK FAILED` otherwise. The `.apk` sits
outside the repo. The script copies the mocks argument over its worktree's `mocks/simple.ts`
and requires that file's `MOCK_DATA_SIMPLE` and `addMinutes` exports. Any other mocks path:
STOP. BUILD.md's recorded mocks path predates the athan-gitree move. Never two builds at once
(`ai/AGENTS.md`).

Package gate, before any install:

```bash
AAPT2="$(ls -d "$HOME/Library/Android/sdk/build-tools/"* 2>/dev/null | sort | tail -1)/aapt2"
test -x "$AAPT2"
"$AAPT2" dump badging "$HOME/athan-gitree/sessions/71/app-mock.apk" | grep '^package'
```

Expected: `test -x` prints nothing and exits 0; a non-zero exit: STOP with `$AAPT2` and the
`ls` result printed. The grep prints one line starting
`package: name='com.mugtaba.athan' versionCode=` (the script builds the production package id;
the 3T is the test device; the versionName in the line carries the committed `uat` version,
per the note above). Any other package: STOP with the line printed (PLAN.md section 2.2,
item 2).

Install, then one discarded launch (dexopt-inflated, per `e2e/README.md`):

```bash
adb -s "$SERIAL" install -r "$HOME/athan-gitree/sessions/71/app-mock.apk"
```

Expected: `Success`. Then launch the app and wait for the schedule face before continuing;
discard this launch's timings. The launch: open `com.mugtaba.athan` in the foreground with
agent-device, then wait for the text `London, UK` (ceiling 15 s); readings from this launch
are discarded (e2e/README.md's dev-env confound).

## The capture

Baseline readings, before the crossings:

```bash
mkdir -p "$HOME/athan-gitree/sessions/71"
adb -s "$SERIAL" shell pidof com.mugtaba.athan | tee "$HOME/athan-gitree/sessions/71/pid-before.txt"
adb -s "$SERIAL" shell dumpsys alarm > "$HOME/athan-gitree/sessions/71/alarm-before.txt"
adb -s "$SERIAL" logcat -c
```

Expected: `pid-before.txt` holds one number; the dump file is non-empty.

Drive crossing 1 (en to ar) with agent-device: foreground `com.mugtaba.athan`; tap the
Settings control at the atlas point `540,1830` (`e2e/device-atlas-oneplus3t.md`, the same
point `e2e/flows/language-switch-x1.yaml:17` uses); tap the `Language` row; tap `العربية`;
wait for the Arabic face (text `الفجر` visible, ceiling 60 s; the applying line
`جارٍ التطبيق…` appears and clears at the reload). Verify with the wait, never a bare
screenshot.

Drive crossing 2 (ar to en): Settings at `540,1830`; tap `اللغة`; tap `English`; wait for
`Fajr` (ceiling 60 s).

Capture:

```bash
adb -s "$SERIAL" logcat -d -v threadtime > "$HOME/athan-gitree/sessions/71/logcat-crossing.txt"
adb -s "$SERIAL" shell pidof com.mugtaba.athan | tee "$HOME/athan-gitree/sessions/71/pid-after.txt"
adb -s "$SERIAL" shell dumpsys alarm > "$HOME/athan-gitree/sessions/71/alarm-after.txt"
```

## Red

FINDINGS.md section 7 does not exist before this step's change; the capture files do not
exist. Record `Red: section 7 and the captures absent` in LOG.md. No test runs red: the step
is a device transcription.

## Change contracts

Append section 7 to `ai/plans/71-appstate-teardown/FINDINGS.md`:

```markdown
## 7. The crossing pinned on the 3T

Measured on the mock build (production package id, floor test device), two crossings in one
capture, <date>.

### The exception block, verbatim

<the complete logcat block for crossing 1, from the threadtime line through the blank line
that closes the stack>

### The second crossing

<the same shape for crossing 2, or the note that the block is byte-identical except its
timestamps, with the differing lines quoted>

### Counts and readings

- Exception blocks naming AppStateModule.onHostPause: <n> (expected 2, one per crossing)
- pid before / after: <a> / <a> (unchanged)
- Marker lines `APP: feature flags resolved`: <n> (expected 2, one per crossing's relaunched
  tree; the capture starts after the discarded launch was cleared)
- Exception-to-marker span, crossing 1: <s> s; crossing 2: <s> s (the row 68 record: about
  1.5 s)
- FATAL EXCEPTION lines: 0
- Alarm dumps: alarm-before.txt and alarm-after.txt under sessions/71/; trigger-time movement
  across the reload is the mock's per-download re-seed (row 55's record) and not a finding
- Unrelated soft exceptions in the capture, if any: <their categories, or the line none>
```

The reading commands, each with its expected output:

```bash
C="$HOME/athan-gitree/sessions/71/logcat-crossing.txt"
grep -cF 'reactInstance is null. Dropping work.' "$C"
```

Expected: `2`. Any other count: NEEDS REPLAN (D90).

```bash
grep -A30 -F 'Dropping work.' "$C" | grep -cF 'AppStateModule.onHostPause'
```

Expected: `2` (the stack frames under each block). Any other count, or a block whose stack
lacks the frame: NEEDS REPLAN.

```bash
diff "$HOME/athan-gitree/sessions/71/pid-before.txt" "$HOME/athan-gitree/sessions/71/pid-after.txt"
```

Expected: no output (the pid unchanged). A difference: NEEDS REPLAN (the reload left the
process; the in-process premise broke).

```bash
grep -cF 'APP: feature flags resolved' "$C"
```

Expected: `2`, one per crossing's relaunched tree; the baseline block's `logcat -c` cleared
the discarded launch's marker before the capture. Zero: NEEDS REPLAN (PLAN.md section 2.2,
item 4).

```bash
grep -cF 'FATAL EXCEPTION' "$C"
```

Expected: `0`. Any other count: STOP with the block.

The span: read the threadtime timestamps of each `Dropping work.` line and of the next
`APP: feature flags resolved` line after it; the difference in seconds goes into the reading
list, two values.

## Green run

```bash
grep -q "## 7. The crossing pinned" ai/plans/71-appstate-teardown/FINDINGS.md && echo GREEN
```

Expected: `GREEN`. Then the readings above all hold.

## Break script

None. The step transcribes a device capture; there is no guarded logic to mutate.

## Version and commit

The version was bumped before the build. Commit:

```bash
V=<the version this step took>
printf '%s\n' "$V - docs(plans): 71 step 2, the crossing pinned on the 3T" > "$TMPDIR/msg-71-2.txt"
git add ai/plans/71-appstate-teardown/FINDINGS.md ai/plans/71-appstate-teardown/LOG.md ai/plans/README.md app.json package.json
git commit -F "$TMPDIR/msg-71-2.txt"
```

Expected: the hook passes as in step 1. Then:

```bash
git checkout uat && git merge --no-ff docs/71-2-crossing-proof -m "$V - merge docs/71-2-crossing-proof: ticket 71 step 2"
rmdir "$HOME/athan-gitree/version.lock" 2>/dev/null; true
```

Expected: the merge lands on `uat`.

## Device teardown

Press HOME, then `adb -s "$SERIAL" shell am kill com.mugtaba.athan`, then relaunch the app
from the launcher and confirm the English face. Teardown uses `am kill` after HOME, never `am force-stop` (the frame-audit script's
practice), never `pm clear`, never uninstall; automatic time stays on (no clock change happened). The mock
install stays on the phone, the rows 39, 63 and 68 precedent. Report the install in the final
report.

## Review checklist

1. `git show <sha>` cold: section 7 carries the verbatim block, the counts and the two spans.
2. The block's stack names `AppStateModule.onHostPause`; the transcription is complete through
   the closing blank line.
3. The evidence files exist and are non-empty: `logcat-crossing.txt`, `pid-before.txt`,
   `pid-after.txt`, `alarm-before.txt`, `alarm-after.txt` under `$HOME/athan-gitree/sessions/71/`.
4. The queue row reads `IN PROGRESS, step 2`; the version bumped in all three places.
5. No code file, no test file touched.

## Done when

- [ ] Two crossings driven, the capture saved, every reading holds.
- [ ] FINDINGS.md section 7 lands with the contracts' shape.
- [ ] The commit and merge land with the version bumped.
- [ ] LOG.md carries the step entry ending `session: <ses_id>`.
- [ ] The phone is left reachable, the app on the English face, the evidence paths reported.
