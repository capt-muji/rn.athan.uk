# Step 4: simulator proof under Arabic

**Requirements:** R1.1, R2.1
Weight: 3

Device class. This step dispatches alone, fresh session, and no other step runs beside
it.

## Anchor checks

None new: the code anchors were consumed by steps 1 to 3. The proof anchor is the
worktree state: steps 1 to 3 ticked in `LOG.md`, `ticket/75` at 2.0.454, clean tree.

## Goal

One face under `ar` proves her two visual rulings on a rendered screen: the mosque
mark mirrored and facing inwards on both schedule pages, and a scrolling sheet with no
scrollbar. The toggle outline reads in the same screenshots when a toggle is visible
on the scrolled sheet.

## Branch

`ticket/75`, the run's single branch. No step branch, no `uat` merge, no push.

## Files

- `ai/plans/75-visual-polish/LOG.md` (the transcription)
- `app.json`, `package.json` (the record commit's bump)

No app code changes in this step. If a defect surfaces, the step stops with `STOP:`
and the fix becomes a new planned step on the lead's authority, never an inline edit
here.

## Build and run

From the worktree root, in the background against a log file, because the first run
prebuilds `ios/` (gitignored) and installs pods, up to 15 minutes, and a foreground
command dies at the harness timeout:

```bash
npx expo run:ios >"$TMPDIR/t75-build.log" 2>&1 &
```

Poll the log in cycles of 15 seconds or shorter; never one sleep above 15.
- Metro serves on its default port; the dev build carries the mock data path. This is
  the only build class the run order allows: dev or mock, never a production build,
  never EAS.
- Expected end state: the app launches on the booted simulator, the splash clears, the
  Standard schedule renders.

If no simulator is booted, boot one iPhone through the `xcodebuildmcp` simulator
tools before building. If the build fails, read the error, fix nothing outside the
worktree, retry once; a second failure on a distinct cause stops the step.

## Drive

With the `agent-device` MCP:

1. Tap the settings button, then Language, then العربية. The app reloads on the RTL
   crossing (D59); wait for the schedule to render again.
2. Screenshot the Standard page. Read: the date column on the right, the mosque mark
   on the left, mirrored, its face turned inwards toward the text.
3. Swipe to the Extras page. Screenshot. Read: the same mark, the same mirroring.
4. Open Settings. Scroll the sheet's content top to bottom and capture the screenshot
   during the scroll gesture, because an indicator that faded after settling would
   read the same as one that never drew. Read: no scrollbar along the sheet's edge.
   The jest prop test is this ruling's proof; the face read is indicative.
5. Switch the language back to English and screenshot the Standard page. Read: the
   mark sits beside the date text as at 2.0.402, unmirrored, the layout LTR.

Every screenshot is read by the worker itself, or by `vision` with the file path and
one exact question when the worker cannot see it. Never guess an image.

## Transcription

Write into `LOG.md` under `### Step 04 — proof`: what each screenshot showed, the
simulator model and OS, the app version the build ran (2.0.454; the record commit
bumps to 2.0.455), and the two rulings' verdicts. Screenshots
never enter a commit; they live under `$HOME/athan-gitree/sessions/75/` and die with
the ticket's merge. Transcribe what was read, in the repo's words.

## Version and commit

Bump `app.json` then `package.json` to `2.0.455`. Commit:

```
2.0.455 - simulator proof under ar: the mirrored mark on both pages and a sheet scroll
with no indicator, transcribed
```

## Review checklist

- The transcription names the simulator model, the OS and the app version.
- Both rulings carry a verdict read from an image, never inferred.
- No screenshot, no recording, no identifier entered the commit.

## Merge

None this run. The commit stays on `ticket/75`.

## Done when

Both rulings carry a read verdict, the English control face read clean, the record
commit carries 2.0.454, and the session line closes the step in `LOG.md`.
