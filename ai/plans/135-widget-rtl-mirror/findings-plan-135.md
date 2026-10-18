# Findings — ticket 135 plan-conformance review (2026-10-18)

Range reviewed: b5bee6a9..a1c6347a, worktree at uat (a1c6347a, clean). The named
diff file existed; a diff derived from the range over the same file surface
matches it exactly (modulo index lines).

## What was verified against the repository

- Lane code commits: a3c55999 (step 1, 2.0.1031), 13a85b22 (step 2, 2.0.1036),
  6c506952 (step 3, 2.0.1042), 8efd0b91 (D135.13, 2.0.1054). Each touches only
  the plan's Files list plus LOG/README/version mechanics. Commit messages match
  the plan's scripts for steps 1 to 3.
- R1.1: every row of the step-2 mirror table is in widgets/PrayerWidget.tsx
  (row order 593-594, box alignments 581/588, wrapper 611, inner box 613, pill
  and rows insets 614/622, textAlign spread 340-348) and pinned by the three red
  renderer tests.
- R1.2/R1.3: the falsy guard and the small/stale neutrality guard exist and the
  whole falsy path is value-identical to the pre-change composition.
- R2.1/R2.2/R2.3: the installed EntryView.swift carries the plan's Swift block
  verbatim (no return, explicit .leftToRight falsy default, one law comment);
  the patch holds exactly six diff --git headers, all under
  node_modules/expo-widgets/, no absolute paths; the patch test pins the
  byte-for-byte ?? false default.
- R3.1: ALabelParts (PrayerWidget.tsx:404-423) matches the app component's HEAD
  face verified in components/countdown/Countdown.tsx (UNIT_SIZE_SHARE 0.95,
  tight nested letter, marginHorizontal 6 per group side = 12 between groups);
  digit size stays 26, letters 26 x 0.95 unrounded, clamp and zero-drop intact.
- R3.2: shared/widgetTimeline.ts:63-66 bakes literals; the en catalog's
  duration.h/m/s are the same bytes, so en snapshot bytes are unchanged (R5.1).
- R4.1: no hunk of the range touches the iOS composition (all PrayerWidget.tsx
  hunks sit at old lines 106-583, the iOS region starts ~649) or any formatter;
  LockPrayerWidget.tsx and stores/widget.ts are untouched (R5.2, no new wiring).
- Props contract: versions stay 8 and 4 (widgetTypes.ts:23,36), rtl is a
  JSON-safe boolean, props==null guards intact (PrayerWidget.tsx:90,693),
  expo-widgets and @expo/ui pinned exact 58.0.20.
- D135.1 to D135.14 all land as ruled; D135.13's wrapper width pin
  (PrayerWidget.tsx:612) carries its red test and the falsy-fill guard;
  D135.14's waiver is recorded in LOG.md:138-153 and in the live queue row.
- All ten widget test suites green at HEAD (107 + 95 tests), run cache- and
  coverage-off; worktree stayed clean.

## Findings

### 1. SHOULD — duplicate stale row 135 in the queue

ai/plans/README.md:274 carries a second row 135 reading "IN PROGRESS, step 3"
beside the live "EXECUTED, step 4 done" row at :272, and a duplicate row 138 at
:275. Blame: the stale copies came in with lane 138's 1a7ebffe (12:19) and
survived this lane's merge a1c6347a; fb21627d added the current row without
removing the stale one. A future queue run can route 135 back to execution off
the stale cell.

Fix: in the audit's docs commit, delete the stale duplicate rows at :274 and
:275, keeping the live rows at :272 and :273.

### 2. SHOULD — the DONE queue-cell text overstates the XS proof

records-135.md:32 (the cell text the lead applies on DONE) says "Device-proven
on the 3T fleettest build and the XS Release build under app Arabic and
English". D135.14 (LOG.md:138-153) waived the XS English re-read on evidence:
the XS was read under app Arabic only, zero language switches on her phone. The
3T alone was read both directions.

Fix: name the D135.14 waiver in the cell before applying it on DONE; the live
queue row (README.md:272) already carries it and the step-4 commit message
(fb21627d) already reflects it.

### 3. SHOULD — stale pre-amendment veto section in the records

records-135.md:50-56 duplicates the "What the owner is asked to veto" heading
(lines 38-44) with the pre-amendment D135.5/D135.6 text, including "Her order
said letters on both platforms" — the opposite of her 2026-10-18 amendment,
which made the iOS countdown's untouched face her own ruling. A reader hitting
the second section first gets the superseded ask.

Fix: delete the stale section at records-135.md:50-56.

### 4. NICE — Step 01 ledger misses its session and version lines

LOG.md:312-364 (Step 01) carries the reds, green run and mutation pass but no
session: line and no version line of its own; the 2.0.1031/a3c55999/1d69959c
facts live only in the resume-record section (LOG.md:289-300).
records-135.md:5-6 names both as part of the ledger shape, and PLAN.md section
10 lists exactly this defect among the anticipated review fixes. Step 00's
"session: pending" stub (LOG.md:272) was never backfilled.

Fix: backfill the session id and the 2.0.1031 version line under the Step 01
heading in the audit's docs commit; fill or drop the Step 00 stub.

## Verdict

PASS
