# Step 3: device proof on the iPhone XS

Requirements: R3.1, R3.2, R3.3, R3.4

Weight: 3

This step runs LAST, after steps 1 and 2 are merged to uat. It must not start before the plan
says so. The OnePlus 3T is another lane's device; nothing here touches it.

## Anchor check

Copy `ai/plans/74-arabic-typography/scripts/preflight-74.sh` to `$TMPDIR`, then run it from the
repository root: `bash "$TMPDIR/preflight-74.sh" 04 05 06 07 08 09 10`. Expected output:
`PREFLIGHT OK` (step 2's landed sweep rewrote every style block the anchors quote; section 10 of
PLAN.md owns the replan that re-pins them).

## Goal

The owner's report, reproduced and then closed on hardware: under ar the pre-change build shows
plain-weight, undersized Arabic text (the red, R3.4); the post-change build shows the medium
weight and the scaled sizes (R3.1, R3.2), with English unchanged to the eye (R3.3).

## Device

iPhone XS, physical, `IPHONE_UDID` placeholder, atlas `e2e/device-atlas-iphone-xs.md` (routes,
signing, traps — read it before touching the phone). Fallback when the XS is unavailable: the iOS
simulator (any iPhone sim, `expo run:ios` default build, no signing); record which vehicle carried
the proof. Screenshots are the reliable read (the atlas traps: snapshots wedge on animated
screens).

## Vehicle

Device build per the atlas Device build row: `EXPO_PUBLIC_IOS_WIDGETS=1` prebuild, plist check,
`DEVELOPMENT_TEAM=<paid team>` Release `run:ios --device $IPHONE_UDID`. Placeholders only, never
committed. Read the ar face twice: once on the PRE-change uat build (the red), once on the
POST-change build.

## Red (pre-change)

The red build comes from the pre-merge uat sha recorded in step 1's LOG.md entry. Detach a
worktree at that sha and build there: `git worktree add --detach
"$HOME/athan-gitree/worktrees/74-red" <sha from step 1's ledger>`, then the device build flow
inside that worktree. Remove the worktree when the red screenshots exist.

1. Install the pre-change build. In-app: Settings sheet, Language, pick العربية.
2. Open the Help modal, expand one question. Screenshot.
3. Screenshot the main prayer list.
4. Transcribe both via the vision subagent into `$HOME/athan-gitree/sessions/74/red-ar.md`:
   expected reading — questions and answer body share one plain weight; the type reads small.
   This is R3.4's record.
5. Switch to English, screenshot the same screens, transcribe into
   `$HOME/athan-gitree/sessions/74/red-en.md`: the English baseline R3.3 compares against.

## Green (post-change)

1. Build and install the merged uat (steps 1 and 2 in).
2. Repeat the two ar screenshots, plus one bottom sheet (Alert) and one expanded Help question.
3. Vision transcriptions into `$HOME/athan-gitree/sessions/74/green-ar.md`: expected readings —
   the question row and step lines visibly heavier than the answer body (R3.1); list names and
   times larger than the red build, no clipped or wrapped row at the 57px height (R3.2).
4. Switch to English, screenshot the same screens, transcribe into
   `$HOME/athan-gitree/sessions/74/green-en.md`: no visible weight or size change against the
   red-en baseline (R3.3; en identity is jest-pinned, this is the device look).
5. Check the width behaviour while under ar: the prayer rows show no wrapped name (the reserve
   re-measured on ar's own key). Note the reading in the transcription.

## Guardrails

- No clock change, no alarm work, no `dumpsys`: pure rendering proof.
- No device screenshot ever enters the repository (`ai/AGENTS.md`); transcriptions only.
- Uninstall both apps the iOS runner installs (atlas Driver row) before ending; remove
  screenshots from the phone. Transcriptions stay under `sessions/74/`.

## Version and commit

The step writes LOG.md's step-3 entry and the sessions transcriptions (outside the repo). The
LOG.md update is a commit: bump `package.json` and `app.json` to the next patch after uat's
`package.json`, commit `<VERSION> - docs(74): device proof transcriptions, ticket 74 executed`.

## Done when

R3.1 to R3.4 each carry a transcription in `sessions/74/`, the phone is clean, and the queue cell
text of PLAN.md section 8 is ready for the lead's DONE edit.
