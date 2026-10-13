# Step 2 (re-planned): the crossing recorded from the captured evidence

Weight: 3
Requirements: R2.1, R2.2, R2.3

The device work of the original contract ran to completion on 2026-10-13 (build, aapt2
gate, install, the crossings, the captures) and was stopped at the readings by D90: the
reload fired on three of six crossings, not on every crossing as the record models. D91
rules the replan: the verdict needs one pinned cycle, which drive 1 captured; the
starvation is recorded evidence and queue row 78, not a repair here. This step records
what the device produced. No device is needed; no code changes anywhere.

## Anchor check

Run step 1's anchor check again: nineteen lines, every line `1`. Then confirm step 1 landed:

```bash
test -f ai/plans/71-appstate-teardown/FINDINGS.md && echo STEP1-OK
grep -q "## 6. The verdict" ai/plans/71-appstate-teardown/FINDINGS.md && echo VERDICT-OK
```

Expected: `STEP1-OK` and `VERDICT-OK`. Anything else: STOP.

## The captured evidence (all under `$HOME/athan-gitree/sessions/71/`)

- `NOTES.md` — the drive table and the transcription of the textbook block.
- `logcat-drive1-full.txt` — the complete drive 1 buffer: the verbatim exception block
  (08:45:33.305-306, the `AppStateModule.onHostPause` stack frame), the marker at
  08:45:34.702 (span 1.397 s).
- `logcat-drive2-window.txt`, `logcat-drive3-en-ar-starved.txt` — the starved crossings'
  buffers.
- `pid-after-drive1.txt`, `alarm-after-drive1.txt`, `pid-before-drive3.txt`,
  `alarm-before-drive3.txt` — the pid and alarm dumps.
- `app-mock.apk.build.txt`, `build-mock.log` — the `BUILD-MOCK OK` build report; the
  aapt2 gate line is transcribed in NOTES.md.

## Red

FINDINGS.md sections 7 and 8 do not exist before this step's change. Record
`Red: sections 7 and 8 absent` in LOG.md. No test runs red: the step is a transcription.

## Branch

```bash
git fetch origin
git checkout -b docs/71-2-crossing-proof uat
```

## Change contracts

Append section 7 to `ai/plans/71-appstate-teardown/FINDINGS.md`:

```markdown
## 7. The crossing pinned on the 3T

Measured on the mock build (production package id com.mugtaba.athan, versionName 2.0.190,
floor test device), 2026-10-13: one RTL boundary crossing, en to ar, captured in one
process. The verbatim block below is transcribed from logcat-drive1-full.txt and
cross-checked against NOTES.md.

### The exception block, verbatim

<the complete logcat block from the threadtime line through the blank line that closes
the stack, exactly as NOTES.md transcribes it>

### Counts and readings

- Exception blocks naming AppStateModule.onHostPause in the capture: 1
- pid before / after: 21009 / 21009 (unchanged)
- Marker line `APP: feature flags resolved` after the block: 1, at 08:45:34.702
- Exception-to-marker span: 1.397 s (the row 68 record: about 1.5 s)
- FATAL EXCEPTION lines: 0
- Alarm dumps: alarm-after-drive1.txt under sessions/71/; trigger-time movement across the
  reload is the mock's per-download re-seed (row 55's record) and not a finding
- Unrelated soft exceptions in the capture: <their categories, or the line none>

One cycle, one drive, one session: this section pins the line and the span; it states no
rate. The rate is section 8's subject.
```

Append section 8 to FINDINGS.md:

```markdown
## 8. The starvation: the reload is not the modeled constant

The same session's other crossings did not reload. Recorded evidence, one session, one
build (mock 2.0.190), one device; transcribed from NOTES.md's drive table:

<the drive table, row for row: drive, crossing, face flipped, exception block, marker,
reloaded>

Every starved crossing carries the same silent signature: the UI locale flips within
about 0.9 s, the preference stores, and then nothing — no convergence dequeue line, no
`LANGUAGE:` warn, no `Updates state change: Restart`, no exception, no marker, no FATAL;
the app keeps ticking on the old tree in the new locale (observed past four minutes). The
drive 3 post-mortem adds the once-per-process deferred launch init (`app/index.tsx`,
1.5 s timeout, the `launchInitRan` latch) firing over four minutes after process start,
so mount and timer timing around the language commits is not what the model assumes.

What this section does not claim: a rate, a cause, or a production-build generalisation.
What it changes: nothing in section 6's verdict — the drop is ordered and log-only
whenever the reload fires, and the starved crossings log no exception at all. The
investigation lives in queue row 78 (added from this evidence, 2026-10-13); the owner
rules on its priority.
```

If FINDINGS.md carries a ruling list, it gains one line: the reload-reliability question,
row 78, owner rules on priority.

## Green run

A scripted check: every NOTES.md drive-table row appears in section 8's table; the
verbatim block in section 7 matches the NOTES.md transcription byte for byte
(`diff <(sed -n '/<block start>/,/<block end>/p' ...)`) or five line-level spot-opens per
row; `grep -c 'Dropping work' FINDINGS.md` counts only the section 7 transcription.

## Break script

None for a docs step; the LOG entry records the row counts instead.

## Version and commit

Fetch `origin uat` first. Next patch after uat's `package.json`, the three places,
`app.json` first.

```
<VERSION> - docs(plans): 71 step 2, the crossing pinned and the starvation recorded
```

## Review checklist

- The verbatim block is complete through the closing blank line and names
  `AppStateModule.onHostPause`.
- Section 8's table matches NOTES.md row for row; no rate or cause is claimed.
- The verdict (section 6) is quoted nowhere as amended; sections 7 and 8 state no repair.
- No file outside the plan folder and `sessions/71/` changed; no code changed.

## Merge

`git checkout uat && git merge --no-ff docs/71-2-crossing-proof -m "<VERSION> - merge docs/71-2-crossing-proof: the crossing recorded (71 step 2)"`

## Done when

Checklist ticked, LOG.md entry under `### Step 2 — done` with the `session:` line.
