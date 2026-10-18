# Blind review 137 - Arabic line height parity (docs-only investigation)

Range: 7aeaa85a^..uat (49 commits, ticket 137's eight docs commits among them).
Diff file: audit-137.diff was present and matches `git diff 7aeaa85a^..uat --
ai/plans/137-arabic-line-height ai/plans/README.md` exactly (it omits only the
app.json/package.json hunks, which I derived from git myself). Worktree
$HOME/athan-gitree/worktrees/lane-137 sits on `step-137/verdict` (= uat tip
efaa0271), not `lane/137` as the dispatch said; same content, no consequence.

## 1. Script against EXPECTATIONS.md - PASS

`python3 ai/plans/137-arabic-line-height/scripts/tables-137.py` run in the
worktree: both fenced blocks in EXPECTATIONS.md reproduce verbatim (39 + 18
lines, mechanical compare, zero mismatches). LOG.md's step-1 tail lines match
too.

## 2. Font tables from the shipped TTFs - PASS

My own fontTools reads (independent of the script):
- Rubik-Regular.ttf (upm 1000): hhea 935/-250/0 = 1.1850em, typo 935/-250/0 =
  1.1850em, win 1066/466 = 1.5320em, bbox 1076/-478 = 1.5540em, fsSelection
  192, bit 7 USE_TYPO_METRICS set.
- Rubik-Medium.ttf: hhea/typo/win identical, bbox 1088/-493 = 1.5810em, bit 7 set.
- Roboto-Regular.ttf (upm 2048): hhea 1.1719em, typo 1.0498em, win 1.2002em,
  bbox 1.3271em, bit 7 clear.
Every em ratio in EXPECTATIONS.md, FINDINGS.md and LOG.md agrees with the fonts.

## 3. Arithmetic re-derivation - three slips (findings 1, 2, 3, 5 below)

Verified from the recorded raw heights, scales 2.625 and 3, and the candidate
table: all bounds-to-height subtractions (93, 58, 60, 61, 53, 67, 75, 75, 27,
77, 63 on the 3T; 57, 64, 61, 64, 73 on the XS), every em ratio except one, every
nearest-candidate gap, the pair distances 0.407/0.402/0.445em, the set gaps
0.369/0.396em, the "+5 above win 88" claim, and every candidates column against
EXPECTATIONS.md. The a/b capture pairs in sessions/137 differ only in volatile
nodes (countdown digits, status bar); every bound quoted in the findings files
is identical across the pair, as claimed. Evidence JSONs corroborate every
recorded bound byte for byte (sheet, help, home, overlay).

## 4. Code facts at uat - PASS

Every recorded size/face/pin matches the code: sheet title ty.size(22) Medium
unpinned and subtitle ty.size(14) Regular unpinned (Header.tsx:63-75), cardTitle
ty.size(14) Medium unpinned (Settings.tsx:226), Help question ty.size(15) Medium
lineHeight ty.scriptLineHeight(15) = 23 and answer (`cause`) ty.size(13)
Regular lineHeight ty.lineHeight(20) = 20 (Help.tsx:211-219, 236-240, render at
:80), Day location ty.size(TEXT.sizeSmall)=16 and date ty.size(TEXT.size)=18
Regular unpinned (Day.tsx:73-83), row name 18 Regular (Prayer.tsx:108-111), row
time familyRowTime 18 (Time.tsx:100-109), countdown word ty.size(16)+1 = 17
Regular with wordFace, digits countdownSize = 26-2 = 24 Medium
(Countdown.tsx:114-153), overlay title 18 Medium unpinned and body 16 Regular
pinned ty.scriptLineHeight(16) = 24 (Explanation.tsx:133-143). ARABIC record in
shared/typography.ts:31-42 matches its anchor byte for byte. RN 0.88.0
citations hold (setIncludePad TextLayoutManager.kt:859;
setIncludeFontPadding(true) ReactTextView.java:136;
enumerateLineFragmentsForGlyphRange x4 in RCTTextLayoutManager.mm).

## 5. Internal consistency - one count wrong (finding 4)

Same-surface pair table matches the four findings files; the eight 3T unpinned
surfaces are each counted once (word excluded symmetrically); the voids are not
contradicted anywhere (the 56px xs-home row ink is used only as labelled pixel
corroboration); the tolerance rule (1px after scale rounding) is applied evenly
(3T subtitle +1 match, XS word +1 within tolerance before exclusion, controls
within 1px); both overlay bodies carry the one-line authority consistently
through FINDINGS.md and the verdict cell. No number in FINDINGS.md or the
verdict cell fails to trace to a findings file or EXPECTATIONS.md.

## 6. House rules - PASS, one scope note (finding 7)

- Prose: no emoji, arrows or ellipses in the ticket's committed prose; em dashes
  appear only in `### Step NN - <state>` LOG headings, the exact shape
  ai/plans/TEMPLATE.md:44 mandates. Shebang `!` in scripts is code, exempt.
- Identifiers: no serial, UDID, address or device identifier in any ticket file;
  only the placeholders 3T_SERIAL/IPHONE_UDID and git shas; iPhone11,2 is a
  model id, not a device identifier; the Arabic labels are the app's own fixture
  face.
- No screenshot or binary committed anywhere in the range (name-only and
  binary-numstat both empty; the ten pngs live only under sessions/137/).
- Version discipline: all 27 non-merge commits in the range move app.json and
  package.json together; android/ is untracked in this repo, so no third file
  exists to move.

## 7. Queue row 137 - PASS with one nit (finding 6)

Status cell reads "EXECUTED, findings in ai/plans/137-arabic-line-height/
(FINDINGS.md), awaiting audit", matching the record (step 4 wrote EXECUTED and
the verdict cell text; OWNER-LED is the lead's audit-close write). The row's
starting usWin hypothesis is properly corrected inside FINDINGS.md as
unverified, not contradicted.

## FINDINGS

1. [should] ai/plans/137-arabic-line-height/FINDINGS-XS-HOME.md:42 - "The 3T
   read the same body at 63px against its 62.625 pin" is wrong arithmetic:
   24 x 2.625 = 63.0, and FINDINGS-3T-HOME.md's pin note, FINDINGS.md's controls
   table and the verdict cell all record the 3T pin line as 63 - fix: "against
   its 63 pin, exact", deleting 62.625.
2. [should] ai/plans/137-arabic-line-height/FINDINGS-3T.md:27 and :30, and
   FINDINGS.md:79 - the Help answer's measured em is recorded 1.554, but
   53 / (13 x 2.625) = 1.5531, so 1.553 - fix the digit in all three places
   (no verdict changes; the pin comparison "+0.5" is unaffected).
3. [should] ai/plans/137-arabic-line-height/FINDINGS-3T-HOME.md:54-56 - the
   residual sentence miscounts: "the five new unpinned points read +2" (four of
   the five do; the countdown word scatters, as the same paragraph's next
   sentence says) and "75 vs 73 at 18, four surfaces" (three surfaces: date,
   row name, row time). FINDINGS.md's "seven at +2 and one at +1" over eight
   surfaces is the correct count - fix: "four of the five" and "three surfaces".
4. [should] ai/plans/137-arabic-line-height/VISION-137.md:4 - "One vision
   dispatch read the nine screenshots" overstates coverage: eight images are
   transcribed (the sections at lines 16, 28, 38, 53, 63, 81, 94, 108) while ten
   pngs sit in sessions/137/ (3t-restore-home.png and 3t-sheet-check.png have no
   section), and LOG.md repeats "covered all nine" - fix: name the actual count
   and the two unread duplicates, or transcribe them.
5. [nice] ai/plans/137-arabic-line-height/FINDINGS-3T-HOME.md:39 - the colon
   "read 70px" contradicts its own quoted bounds [520,644][533,715], which give
   71px in both captures - fix: 71px (corroboration only, no surface depends on
   it).
6. [nice] ai/plans/README.md row 137 (problem cell) - the cell still names "the
   FleetTest mock 2.0.996 on the 3T" while the record drove com.example.athan
   2.0.908 under the recorded vehicle ruling (FINDINGS-3T.md build line) - fix:
   the lead already edits this row at the audit close; have that edit name
   2.0.908 or drop the version.
7. [nice] audit range scope - `git diff --stat 7aeaa85a^..uat` names 79 files,
   not only the four 137 paths: the range interleaves lanes 135/136/138, whose
   merges are inside it. Ticket 137's own eight commits touch only
   ai/plans/137-arabic-line-height/, ai/plans/README.md, app.json and
   package.json (verified per commit). Inside that shared range other lanes
   broke README table rows: row 136 went from 6 to 5 pipes (status cell run
   into column 2, "Acceptance: her read on the 3T DONE 2026-10-18",
   ai/plans/README.md:271) and row 117 from 6 to 7 - not 137's defect; route it
   to those lanes.
