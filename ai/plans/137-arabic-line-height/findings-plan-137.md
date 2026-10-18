# Plan-conformance review, ticket 137 (Arabic line height parity)

Reviewer pass per D137.9, 2026-10-18. Range `7aeaa85a^..uat` (nine docs commits
plus merges, tip `efaa0271`). The lead's diff file was present (2461 lines,
docs-only); it equals my derived `git diff 7aeaa85a^..uat -- ai/plans/137-arabic-line-height
ai/plans/README.md` byte for byte, with the two version files additionally verified
per commit by hand. Worktree `lane-137` sits clean at `efaa0271` (== uat), checked
out on `step-137/verdict`, not `lane/137` (`lane/137` itself points at `496f41c9`,
one merge behind): state note only, every file reviewed at the uat tip.

## 1. Table script rerun vs EXPECTATIONS.md

PASS. `python3 ai/plans/137-arabic-line-height/scripts/tables-137.py` in the
worktree exits 0. Its output restricted to sizes 13/14/15/22 (39 lines, three
fonts, em sets included) is byte-identical to EXPECTATIONS.md's first fenced
block; its Rubik-only 16/17/18/24 lines (18 lines) are byte-identical to the
second block (`diff` empty both times). The Roboto em sets (hhea 1.1719, typo
1.0498, win 1.2002, bbox 1.3271) reproduce. LOG.md:78-82's four "tail lines"
match EXPECTATIONS.md:44-47 verbatim.

## 2. Em ratios re-derived by arithmetic (height / (nominal x scale))

PASS with one wrong digit. All seventeen recorded cells recompute exactly
(3T @2.625: 1.610, 1.578, 1.633, 1.549, 1.595, 1.587 x3, 0.605, 1.630, 1.500;
XS @3: 1.188, 1.185, 1.196, 1.185, 1.521), pins recompute (23x2.625=60.375,
20x2.625=52.5, 24x2.625=63, 24x3=72, 23/15=1.533, 20/13=1.538), and every
derived distance recomputes (0.407, 0.402, 0.445; 0.369, 0.396). The one
exception:

- [SHOULD] FINDINGS-3T.md:27 (repeated :30, FINDINGS.md:79) - the Help answer's
  em is recorded `1.554`; 53/(13x2.625) = 1.55311, which rounds to `1.553`. Fix:
  change the three occurrences to 1.553. No range or verdict moves (the value
  feeds no summary interval; the 1.578-1.633 band covers unpinned surfaces only).

## 3. "Nearest candidate, gap" cells vs the candidate table

PASS. Every cell checked against EXPECTATIONS.md at the recorded size and face:
3T title 93 vs 68/68/88/91 -> bbox +2; subtitle 58 vs 44/44/56/57 -> bbox +1;
card 60 vs 44/44/56/58 -> bbox +2; location 67 vs 50/50/64/65 -> bbox +2;
date/row/time 75 vs 56/56/72/73 -> bbox +2; word 27 vs 53/53/68/69 -> hhea -26;
overlay title 77 vs 56/56/72/75 -> bbox +2; question 61 vs pin 60.375 -> +1;
answer 53 vs pin 52.5 -> +0.5; XS location 57 vs 57/57/74/75 -> +0; date 64 vs
64/64/83/84 -> +0; word 61 vs 60/60/78/79 -> +1 (unrounded 61.000007 vs 60.435,
inside tolerance, as FINDINGS-XS-HOME.md:29 states); overlay title 64 vs
64/64/83/85 -> +0; bodies 63 vs 63 and 73 vs 72 -> exact and +1. Bounds strings
subtract to the recorded heights everywhere except one corroboration footnote:

- [NICE] FINDINGS-3T-HOME.md:39 - the colon glyph bounds `[520,644][533,715]`
  give 715-644 = 71px; the text records 70px. Corroboration line only, not a
  measured surface. Fix: correct to 71 or drop the example.

## 4. Verdict logic against the step-4 rule

PASS. The rule (steps/4-verdict.md:28-30): SAME only when both platforms' unpinned
surfaces match the same set within tolerance on every surface; otherwise DIFFER
with each set and the em distance named. Surface by surface: location bbox(+2) vs
hhea/typo(+0); date bbox(+2) vs hhea/typo(+0); overlay title bbox(+2) vs
hhea/typo(+0) - no pair shares a set, so DIFFER (FINDINGS.md:3, :51-56). Row
name/time carry the recorded XS AX-merged void; the countdown word is excluded
symmetrically as an instrument void with the pixel evidence (VISION-137.md:117-136);
the sheet surfaces pair by face and set through D137.11, named as 3T-only
(FINDINGS.md:58-68). Sets and distances named: 0.369/0.396 between sets,
0.402-0.445 across pairs, all recomputed. The +2 residual is flagged per R4.1
("no candidate within 1px") and adjudicated per D137.12 without ever claiming a
platform's internal table choice.

## 5. Step contracts vs LOG and findings files

PASS. Step 1: script output verbatim (section 1), the four RN greps re-run here
and print (CustomLineHeightSpan 45/381/617; setIncludePad; setIncludeFontPadding
at 136; enumerateLineFragments 4 hits), EXPECTATIONS.md carries the surface map;
row moved to "IN PROGRESS, step 1" (commit 6ff7364d). Step 2: vehicle recorded
with both package ids and versionNames (LOG.md:102-109), no-switch language
branch recorded (LOG.md:111-114), the uiautomator refusal escalated exactly per
PLAN section 10's ladder to `maestro hierarchy` with two agreeing captures
(LOG.md:116-124), FINDINGS-3T.md holds every contract-6 column, restore with
auto_time=1 (LOG.md:160-163). Step 3: era check, arrival ar, the sheet void in
the full row-120 four-part shape (FINDINGS-XS.md:12-40), restore with devicectl
termination (LOG.md:206-214). Step 2b: ten anchors, same vehicle, five home
surfaces plus word, overlay read with two captures and closed-and-verified
capture, restore (LOG.md:271-342). Step 3b: same on the XS including the
AX-merged row void and the face-flap observation recorded raw
(FINDINGS-XS-HOME.md:45-105). Step 4: FINDINGS.md carries every contract item
(candidates one line each, pairs side by side, pin ratios, both halves answered
in the opening lines, unverified named, options verbatim, voids section); the
row moved to EXECUTED with the findings pointer and no other cell touched
(commit 4b6dfb72); the step never wrote OWNER-LED, as the contract forbids.
Session lines present under all six step headings plus the adjudication and
vision sections. Two nits:

- [NICE] FINDINGS-3T-HOME.md:28 and FINDINGS-XS-HOME.md:31 - the overlay-body
  cells still read `PENDING` for the line count. VISION-137.md:127-130 landed
  the counts (one line each) and FINDINGS.md:82-84 closes both pins, but the
  two source cells were never updated to their resolved values. Fix: one-word
  edits at the close commit, or leave, since FINDINGS.md cites the authority.
- [NICE] steps/3-iphone-xs.md:40 names the fallback screenshot `xs-sheet.png`;
  the file written is `xs-02-settings.png` (FINDINGS-XS.md:32, sessions/137/
  listing). Naming deviation only, recorded consistently everywhere it appears.

## 6. Acceptance criteria R1.1-R5.1

PASS. R1.1: the script prints both Rubik fonts' four sets and candidate heights
at 13/14/15/22 for scales 2.625 and 3 (plus the amended sizes). R2.1/R2.2:
bounds, package id and versionName recorded (FINDINGS-3T.md:14-27), hierarchy
captures in sessions/137/. R3.1: the XS sheet frames are a recorded void with
two instruments agreeing and pixel corroboration (FINDINGS-XS.md, VISION-137
xs-02-settings read); the requirement's hole is named in the verdict, the
plan's own void protocol path. R3.2: already-ar branch, both faces in the LOG.
R2.3/R3.3: all seven surfaces per phone recorded or voided in shape; overlay
closed by the same tap, Standard page verified, app terminated, no setting
touched; one screenshot per screen exists in sessions/137/. R4.1: em and
matched set per surface per platform, no-match surfaces flagged. R5.1: the
verdict cell text sits in FINDINGS.md:211-237 for the lead's close; no app code
changed on the branch (section 7). The two PENDING body pins close through
VISION-137.md's line counts as required (see section 5's nit on the stale
cells).

## 7. Repo hygiene

PASS. Each of the nine docs commits (7aeaa85a 6ff7364d da1b0b7b 896fd998
9de7215d f1b7428e 4431aaa1 680be9ec 4b6dfb72) touches only
ai/plans/137-arabic-line-height/, ai/plans/README.md, app.json and package.json
(`git show --name-status` per commit). The eight step merges carry nothing
beyond their step branches (`git diff m^1 m --stat` per merge). No png or
screenshot committed. No serial or UDID anywhere in the committed files: the
only udid/serial strings are the placeholder forms `<serial>`, `3T_SERIAL`,
`IPHONE_UDID`; the long hex-looking strings in FINDINGS-XS-HOME.md are frame
coordinates. Versions run in sequence 2.0.1018 < 1021 < 1025 < 1027 < 1029 <
1034 < 1043 < 1047 < 1048, both files bumped together at every commit, and all
nine messages carry the version prefix with the plan's wording (READY, steps 1,
2, 3, the D137.11 amendment, 2b, 3b, the vision record, step 4).

## 8. R5.1 verdict cell vs the PLAN section 8 template

PASS. The cell (FINDINGS.md:212-237) follows the template shape: OWNER-LED date,
"investigation closed: NO", "the effective Arabic line box DIFFERS between the
3T and the XS on the same Rubik bytes", per-surface "px = em matching set"
clauses, controls at their pins, the platform-behaviour branch chosen (not the
repo-defect branch), "No code changed.", and the OPTIONS paragraph verbatim
including "no negative pulling" and "She rules." The template's
"Measured on the settings sheet" clause is replaced by the D137.11 same-surface
pairs with the 3T-only sheet readings and the voids folded in, which the
amended plan and step-4 contract direct. Every number in the cell traces:
67/1.595/57/1.188, 75/1.587/64/1.185, 77/1.630/64/1.185 (FINDINGS-3T-HOME.md:22-27,
FINDINGS-XS-HOME.md:25-30), 1.185/1.554/1.581 set ems and 1.578-1.633 band
(section 2 here), 0.369-0.396 (recomputed), 93/1.610, 58/1.578, 60/1.633
(FINDINGS-3T.md:23-25), 61 at 60.375 and 53 at 52.5 (FINDINGS-3T.md:26-27),
63/63 and 73/72 (VISION-137.md:127-129). One number in the cell's ancestry
carries the section-2 rounding slip: the answer's measured em 1.554 appears at
FINDINGS.md:79 (not inside the cell text itself).

## Verdict

The executed work conforms to the plan. One SHOULD (a single wrong third decimal
in a control's em, three sites) and four NICE items; nothing blocks the audit
close.
