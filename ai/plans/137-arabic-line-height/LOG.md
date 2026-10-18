# LOG 137

## Planning (2026-10-18)

Frontier closed agent-ruled; decisions D137.1 to D137.10 in PLAN.md section 2.1, dated
2026-10-18. Facts measured at planning, worktree at uat cd171855:

- Rubik-Regular.ttf (upm 1000): hhea 935/-250 gap 0 = 1.185em; typo 935/-250/0 =
  1.185em; usWin 1066/466 = 1.532em; head bbox 1076/-478 = 1.554em; fsSelection bit 7
  (USE_TYPO_METRICS) set. Rubik-Medium.ttf: same hhea, typo and win; bbox 1088/-493 =
  1.581em.
- Roboto-Regular.ttf (upm 2048, named `assets/fonts/Roboto-Regular.ttf`): hhea 1.172em
  and win 1.200em sit close, typo 1.050em and bbox 1.327em sit farther out, and it sets
  no USE_TYPO_METRICS bit where Rubik sets one: Latin never showed the divergence.
- RN 0.88.0 citations verified by read at planning: TextLayoutManager.kt 381 and 617
  (CustomLineHeightSpan only with a lineHeight), 856 to 859 (StaticLayout.Builder
  setIncludePad), 809 to 817 (BoringLayout with the same flag); ReactTextView.java 136
  (includeFontPadding defaults true); RCTTextLayoutManager.mm 530 to 566 (TextKit line
  fragments) and 585 to 588 (pixel-grid rounding).

## Ticket 137

Row set PLANNING at planning commit; the grill and gate notes append below.

## Grill (2026-10-18)

First pass: 6 must, 8 should, 1 nice. All applied: the preflight sha compare takes the
7-char prefix; the Help question pin corrected to 23 (`Math.round(22.5)` rounds up, both
PLAN sites and the control expectations inherit it); the anchor name `help-question.txt`;
the section 7 route now names the four ar labels (`اللغة`, `المساعدة`, `أخرى`,
`العربية`, `الإعدادات`) and the locate-by-screenshot method on the 3T, label-matched
refs on the XS, and warns the WhatsNew row hides on silent releases; D137.3 and step 2
contract 1 and the symptom table now agree (absent or pre-2.0.811 builds fresh under
build.lock with the aapt2 gate on `name='com.example.athan'`, a foreign package id
STOPs); the steps bump the two committed version files only, the gradle sync is the
lead's main-tree action; R5.1 re-scoped to the verdict cell text produced in FINDINGS.md
and applied by the lead at the audit close, cited by step 4 honestly; the Roboto
sentence scoped to hhea against usWin with typo, bbox and the bit-7 difference named;
the sweep count corrected to nine non-test files; the OWNER-LED quote re-attributed to
`ai/plans/README.md`; the iOS citation split 530 to 566 and 585 to 588 here and in
PLAN; the preflight text matches the script's checks; `build-mock.zsh` carries its full
path and the literal fleettest id; the XS launch command written out; the dump success
line no longer bets on Android's spelling of hierarchy, the pulled file is the check.
Grill finding 2 changed a number the executor would have trusted: the pin is 23, not 22.

## Grill round two (2026-10-18)

Round one's fixes verified: 12 of 15 correct; 3 landed wrong and are now fixed (the
preflight sha slice is 8 characters against the 8-char constant; step 2 carries the ar
label pointers and the screenshot-locate method; the duplicated R5.1 citation reads
once). Cold-read findings applied: the steps' bump instruction names only `app.json` and
`package.json`; preflight runs from the worktree root with the copy saved to `$TMPDIR`;
D137.8 lets screenshots sit in `sessions/137/` as corroboration, never committed;
`tables-137.py` now covers `assets/fonts/Roboto-Regular.ttf` so the audit re-derivation
reproduces every Roboto number; the bounds-live claim stands on the screenshot
corroboration, not on `e2e/AGENTS.md`; the refused devicectl list route is a void per
the protocol, not an atlas route; the two greps carry predicted outputs; the 2.8px
usWin-against-bbox split names both scales; preflight counts `adb devices` lines instead
of the bare `adb get-state`. Gate re-run after every fix.

## Consolidation (2026-10-18)

The lane's two planning commits were consolidated into one READY commit on top of
uat 65a88291 (2.0.1016) after the board's records commit moved uat ahead: a soft reset
kept every file, the intermediate commits left the branch, and the READY commit takes
2.0.1017, keeping version uniqueness clean for `scripts/check-version-uniqueness.js`.
Nothing on `uat` was rewritten.

### Step 01 — tables

Worktree lane-137, branch `step-137/tables` off uat b26b5715, re-cut uncommitted
after ticket 136's planning merge took 2.0.1020 mid-flight (the trunk repair 070fe95f
was already in the base), preflight `PREFLIGHT OK` with both phones attached,
all six anchors counting 1. `tables-137.py` exit 0, three font blocks, full output
verbatim in `EXPECTATIONS.md`. Tail lines:

```
  size 15 3T scale 2.625: hhea=46.14/46px typo=41.34/41px win=47.26/47px bbox=52.26/52px
  size 15 XS scale 3.0: hhea=52.73/53px typo=47.24/47px win=54.01/54px bbox=59.72/60px
  size 22 3T scale 2.625: hhea=67.68/68px typo=60.63/61px win=69.31/69px bbox=76.64/77px
  size 22 XS scale 3.0: hhea=77.34/77px typo=69.29/69px win=79.21/79px bbox=87.59/88px
```

RN citation re-checks, all four greps printing: `CustomLineHeightSpan` at 45, 381,
617; `setIncludePad` at 859; `setIncludeFontPadding(true)` at 136;
`enumerateLineFragmentsForGlyphRange` at 213, 332, 383, 543. Expectation surfaces:
sheet title 22 Rubik-Medium unpinned; sheet subtitle 14 Rubik-Regular unpinned;
settings card title 14 Rubik-Medium unpinned; help question 15 Rubik-Medium pinned 23;
help answer 13 Rubik-Regular pinned 20.

session: ses_eb3792cc0ffetY7Cu1OPrC5yJ2


