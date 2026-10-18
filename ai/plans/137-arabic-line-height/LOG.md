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

### Step 02 — oneplus3t

Worktree lane-137, branch `step-137/oneplus3t` off uat b1f16011 (2.0.1021, the
step-1 merge; uat had not moved past it). Preflight copied to `$TMPDIR`, run
from the worktree root on `lane/137`: `PREFLIGHT OK`, 3T attached, XS
attached, all six anchors counting 1. Device lock
`device-3T_SERIAL.lock` held 02:12 to 02:19, released after the last evidence
file landed.

Vehicle (contract 1): `pm list packages | grep the owner` prints
`package:com.example.athan` and `package:com.example.athan.fleettest`;
`dumpsys package com.example.athan` versionName=2.0.908, `dumpsys package
com.example.athan.fleettest` versionName=2.0.996. Both at or past 2.0.811, so
per the lead's ruling (either package form is the FleetTest vehicle family) no
fresh build was taken. Driven: the dock icon at (540, 1747) launches
`com.example.athan` 2.0.908, the production-id mock; the sibling's fleettest
2.0.996 stayed installed, undriven.

Route and face (contracts 2, 3): WAKEUP, keyguard swipe, HOME, dock icon,
2s, settings button (540, 1830); `wm size` 1080x1920. The sheet's live text
read Arabic on arrival (title `الإعدادات`), so the language branch took the
no-switch path: no `اللغة` round trip, nothing to restore.

Reads (contracts 4, 5): `uiautomator dump` refused both screens (7 tries:
`could not get idle state` 5, `null root node returned by
UiTestAutomationBridge` 2; the countdown strip animates each second behind the
sheet and the modal). Per PLAN.md section 10's symptom table the record came
from `maestro --udid <serial> hierarchy`, rung two of the ladder: sheet
captured twice (02:14, 02:16), every bound identical; Help modal captured at
02:18 after tapping the first question. Help reached by one scroll inside the
sheet then the `المساعدة` row at [96,1574][984,1674], inside the `أخرى` card;
first question tapped at (540, 510).

Transcription of the sheet (live structured text, both captures): title
`الإعدادات` [743,453][986,546]; subtitle `اضبط تفضيلاتك` [743,561][986,619];
card titles `الصلاة` [96,742][986,802], `العرض` [96,1183][986,1243], `شريط
العد التنازلي` [96,1760][986,1820] clipped, after scroll `أخرى`
[96,1219][986,1279]; rows `تغيير الأذان`, `القبلة`, toggles `إظهار التاريخ
الهجري`, `إظهار الثواني`, `إظهار الوقت المنقضي`, `إظهار شريط العد
التنازلي`, `لون شريط العد التنازلي`, `اللغة` [96,1311][984,1411], `ما
الجديد` [96,1442][984,1542], `المساعدة` [96,1574][984,1674]; behind the
sheet the countdown `3h 39m 28s` ticking, `لندن، المملكة المتحدة`, `جمادى
الأولى 7، 1448`, prayer rows الفجر 05:54 through العشاء 19:27.

Transcription of the Help modal (live structured text): title `المساعدة`
with the `?` mark; seven questions, first `لماذا لا تصلني أي إشعارات؟`
[242,358][975,419] opened, answer three lines `بدون إذن، لا يمكن إظهار
الإشعارات.` [158,457][975,510], `شغّل الإشعارات في إعدادات التطبيق`
[158,536][938,589], `اترك فئات الأذان مشغّلة` [158,600][938,653]; `إغلاق`
button [329,1607][749,1737].

Void, pixel read, the row 120 form: attempted the Read tool on
`3t-sheet.png` (answer: this model has no image input) and the `vision`
subagent with one exact question per image (answer: harness refused, subagent
depth limit 2); the phone itself answered every structured read, so the hole
removes only pixel-level corroboration of the bounds, not the bounds, which
two independent live captures serve identically. The pngs
(`3t-sheet-check.png`, `3t-sheet.png`, `3t-help.png`, `3t-restore-home.png`)
sit in `$HOME/athan-gitree/sessions/137/` for the audit's image-capable read;
no measurement in FINDINGS-3T.md comes from pixels.

Numbers are in FINDINGS-3T.md: title 93px, subtitle 58px (matches Regular
bbox, +1), card title 60px, question 61px at pin 60.375 (+1 after rounding),
answer 53px at pin 52.5 (+0.5). Title and card title match no candidate
within 1px (both nearest bbox, +2): recorded raw with every candidate px per
the symptom table's last row, for the lead's adjudication before step 4.

Restore (contract 7): `إغلاق` tapped, BACK dismissed the sheet, HOME;
foreground `net.oneplus.launcher`; screen on; build as found (no install was
ever made); language untouched (arrived ar); `settings get global auto_time`
prints 1. Device lock removed 02:19.

session: ses_eb36fcec7ffe62FsPtjLYU25hl


### Step 03 — iphone-xs

Worktree lane-137, branch `step-137/iphone-xs` cut off uat b1f16011 (2.0.1021),
pre-flight `PREFLIGHT OK` run from `$TMPDIR` with both phones attached, all six
anchors counting 1 (the TEMPLATE python count). The cut was re-based onto the uat
that carries step 2's merge before any record was written, the step-1 precedent,
because both lanes append to this LOG and edit row 137's cell.

Era check, D137.5: `xcrun devicectl device info apps` prints `com.example.athan`
`2.0.939` on iOS 18.7.10, past 2.0.811, so the leg proceeds. Launched by the plan's
`devicectl device process launch` command. A popup sheet presented at launch; its
backdrop was tapped once to reach the home screen (navigation only, the app's own
display state, no athan storage and no setting touched).

Arrival language: ar. The home tree read `الإعدادات` (the settings button, ref
frame 43x42 at 166.3,711), `لندن، المملكة المتحدة`, `الظهر`, `جمادى الأولى 7، 1448`
and the six prayer rows, all Arabic. No round trip was made: the app was already ar,
so no switch happened (D137.4's already-ar branch), and the face was verified Arabic
again from the same tree after the sheet closed, before termination.

The read, and the void (row 120 form, the full shape in FINDINGS-XS.md): the settings
sheet opened from the settings button and settled, but its accessibility tree ends at
the chrome (`Bottom sheet backdrop`, `Bottom sheet handle` 375x24 at y 136.8, `Bottom
Sheet` 375x651.2 at y 160.8) with zero content nodes, at every depth, on both
presentations, and `wait text اللغة` timed out after 8 s. `pymobiledevice3 developer
accessibility list-items`, independent of the runner, agrees: 12 items, the 9
home-screen elements behind the backdrop plus the same 3 chrome elements, no sheet
content. The app's sheet content publishes no accessibility elements to iOS itself.
The pixel fallback screenshot was taken (`xs-02-settings.png`) but could not be read:
this executor's model has no image input and the `vision` subagent refuses to spawn at
this nesting depth, so no image-capable reader was reachable this session. With no
label-matched refs inside the sheet, the Help modal was never opened (blind taps on
her settings were forbidden), so the pinned controls were not read either. The XS half
of the measurement is a void; the lead adjudicates before the verdict step runs.

The sheet-chrome frames above are the only layout numbers the phone vouchsafed; no
surface height, em or candidate match was read on the XS, and nothing was extrapolated.

Restore as found: language ar unchanged and verified; the app terminated through
devicectl (pid resolved, signal sent, `process-id-for-bundle-id` then printed 0); no
system setting touched; automatic time untouched. One process note: the device lock
was released once between the failed first terminate (which needs a pid, not a bundle
id) and the successful one, and retaken within seconds; the app was foreground and
untouched in that window. Evidence: `sessions/137/xs-01-arrival.png`,
`xs-02-settings.png` (unread this session, kept for a reader that can),
`xs-02-sheet-axitems.json`, `xs-02-sheet-runner-tree.json`. No UDID or serial was
written to any file.

session: ses_eb370a695ffeSIhy7jlHP2aB28

## Lead adjudication (2026-10-18)

Step 3's void reached the lead per the symptom table's last row: the XS
settings sheet publishes zero accessibility content nodes (two presentations,
two instruments agreeing), so the D137.1 sheet surfaces are unreachable on the
XS and the verdict's XS half was empty. The 3T sheet title and card title also
sat at the raw-record row, +2px past their nearest candidate.

Two decisions, agent-ruled, argued twice, recorded as PLAN.md D137.11 and
D137.12:

- D137.11: the measurement extends to surfaces the XS tree does publish, on
  BOTH phones so the verdict carries same-surface pairs: the home page's day
  location (16 R unpinned), day date (18 R unpinned), one prayer row name
  (18 R unpinned), one row time (18 R unpinned) and the countdown word
  (17 R unpinned), plus the Extras overlay's explanation box (title 18 M
  unpinned, body 16 R pinned 24, the instrument control), reached by one pager
  swipe and one row tap, both in-memory display state, closed by the same tap
  and the swipe back. The unread screenshots go to the `vision` reader as
  pixel corroboration, D137.2's corroboration rung; the lead dispatches vision
  and records its transcription here. Argued twice in PLAN.md; survives.
- D137.12: the 3T +2px residual (title 93 vs bbox 91, card 60 vs 58) reads as a
  systematic per-face view-bound residual (Medium +2, Regular +1 at 14), not a
  metric-set miss. The readings stay raw, the verdict language stays
  measured-match, and no finding names a platform's internal derivation. Steps
  2b and 3b add five Regular points and one Medium point per phone; a residual
  that stays per-face-consistent keeps the nearest-set call, one that scatters
  flags the surface.

Amendment commit on `step-137/adjudication` off uat `ae4e84fa`: D137.11 and
D137.12 in PLAN.md, R2.3 and R3.3 in section 5, the home and overlay code map
in section 4, the two step contracts, `tables-137.py` SIZES extended to 16,
17, 18 and 24, four new anchors, the preflight anchor map extended, the
EXPECTATIONS.md extended table and surface map, the step-4 contract citing the
home findings files. Vision dispatched for the pixel corroboration of the step
2 and 3 screenshots plus the new ones as they land.

session: ses_eb2f135bfffe1QvZUjA1rHhHZ1 (the lead's own session for this lane)

## Vision corroboration (2026-10-18)

Steps 2b and 3b landed (their own headings below). The lead then dispatched
the vision reader over all nine screenshots; its transcription and the lead's
reading are recorded in `VISION-137.md`. The two facts that close pendings:
both overlay bodies render ONE line (3T pin 63/63 exact, XS 73/72 +1), and
the countdown word's full-width node is a band artefact on BOTH phones (the
pixels show a centered body-scale word), so that surface is excluded from the
node-bounds set symmetrically. The pixel layer corroborates the void shapes
(step 3's sheet content visible to pixels, absent from AX) and nothing
contradicts an engine number.

session: ses_eb295b70fffeBCw475WYrD6tjk (the lead's own session for this lane)

### Step 02b — oneplus3t home

Worktree lane-137, branch `step-137/3t-home` cut off uat 1d69959c (2.0.1031;
uat had moved past lane/137's 90855dc6 with ticket 135's merge, so the cut
followed the step-2/3 precedent). Preflight copied to `$TMPDIR`, run from
the worktree root on `lane/137`: `PREFLIGHT OK`, 3T attached, XS attached,
all ten anchors counting 1; all ten re-counted at 1 on the new branch HEAD
after the cut (app.json had moved between the bases, its fonts anchor held).
Device lock `device-3T_SERIAL.lock` taken 06:18, before the first adb
command, removed 06:25 after the last evidence file landed.

Vehicle (contract 2): `pm list packages | grep the owner` prints
`package:com.example.athan` and `package:com.example.athan.fleettest`;
`dumpsys package com.example.athan` versionName=2.0.908, at or past 2.0.811,
matching step 2's vehicle, so no fresh build and no install. `wm size`
`Physical size: 1080x1920`. `settings get global auto_time` printed 1 before
and after.

Route (contract 3): WAKEUP, keyguard swipe, HOME (launcher focused), dock
icon (540, 1747), 2s. The home screen showed the Standard page, six prayer
rows. Arrival language ar from the face (`الإعدادات` settings button ax
label, `لندن، المملكة المتحدة` location label): the no-switch path, nothing
to restore.

Home reads (contract 4): the step-2 instrument, `maestro --udid <serial>
hierarchy`, two independent captures agreeing byte for byte on every bound;
`uiautomator dump` not re-attempted (the refused rung, step 2's 7 refusals
stand). Read: location `لندن، المملكة المتحدة` [602,391][1038,458] 67px;
date `جمادى الأولى 7، 1448` [602,479][1038,554] 75px; row name `الفجر`
[844,644][1049,719] 75px; row time digit `05` [453,644][512,719] 75px inside
the ax `05:54` container [210,644][844,719]; countdown word `الشروق`
[0,123][1080,150] 27px, the Text above the digits naming the countdown
target (the digits `1h 7m 2s` counting to الشروق 07:27). Screencap
`3t-home.png` taken.

The countdown word is the raw outlier: 27px against candidates 53/53/68/69 at
nominal 17, full node width, identical bounds in every capture on both pages
under two different words. Recorded raw per the symptom table's last row; no
adjudication here. The five other new unpinned surfaces all read +2 above
their Regular or Medium bbox, against step 2's Regular +1 at 14, so the
D137.12 residual question (consistent or scattered) carries both facts to the
lead.

Overlay (contract 5): the first pager swipe (rightward drag, `input swipe
300 974 840 974 300`) reached Extras directly, RTL order confirmed; the tree
confirmed the page by the extras row labels before any tap: `نصف الليل`
00:00, `آخر ثلث` 01:58, `السحور` 05:34, `الضحى` 07:47. No Istijaba row
rendered (Friday-only), so the tapped row `الضحى`, upcoming and the countdown
target, is not a passed Istijaba. Tap (540, 1130), 1s settle, two captures
agreeing byte for byte: title `الضحى` [743,762][884,839] 77px; body
`20 دقيقة بعد الشروق` [196,924][884,987] 63px, the whole node, per-line pin
line pending the lead's vision line count (63px equals exactly one 24dp pin
line at 2.625). Screencap `3t-overlay.png` taken. The same row tapped again:
the closing capture shows zero explanation and zero `إغلاق تفاصيل الصلاة`
catcher nodes, the overlay closed and verified. Swipe back (leftward, 840 to
300), the Standard six-row face verified at its original bounds (`الفجر`
through `العشاء`, location and date unchanged).

Voids: none in the structured reads. The pixel-corroboration void stands as
in step 2: this model has no image input, so `3t-home.png` and
`3t-overlay.png` sit unread in `$HOME/athan-gitree/sessions/137/` for the
lead's dispatched vision reader (D137.11). No measurement in
FINDINGS-3T-HOME.md comes from pixels.

Restore (contract 7): overlay closed and verified, Standard page shown and
verified, HOME (launcher focused), screen on, build as found (2.0.908, no
install ever made), language as found (arrived ar, untouched), `settings get
global auto_time` prints 1. Evidence: `3t-home-hierarchy-a/b.json`,
`3t-extras-hierarchy.json`, `3t-overlay-hierarchy-a/b.json`,
`3t-overlay-closed-hierarchy.json`, `3t-restore-standard-hierarchy.json`,
`3t-home.png`, `3t-overlay.png`, all under `$HOME/athan-gitree/sessions/137/`.
No serial was written to any file.

session: ses_eb28fd6b4ffeaebOUPrp39HTL1

### Step 03b — iphone-xs home

Worktree lane-137, branch `step-137/xs-home` cut off uat 6ac3ff85 (2.0.1035;
local uat sits ahead of origin/uat with the board's unpushed records commits,
the planned sha cd171855 still an ancestor). Preflight copied to `$TMPDIR`,
run from the worktree root on `lane/137`: `PREFLIGHT OK`, 3T attached, XS
attached, all ten anchors counting 1; all ten re-counted at 1 on the new
branch HEAD after the cut. Device lock `device-IPHONE_UDID.lock` taken 06:36,
before the first device-contact devicectl command (the UDID resolved at
runtime from `devicectl list devices`), removed 06:55 after the app was
verified gone.

Era check, D137.5: `devicectl device info apps` prints `com.example.athan`
2.0.939 on iOS 18.7.10, past 2.0.811 and matching step 3, so the leg
proceeds; the runner app pair the atlas names was already installed from
step 3 and the app list at release is byte-identical to the list at arrival
(only the xctrunner 1.0 beside Athan 2.0.939; nothing installed, nothing
removed, no setting touched). Launched by the plan's `devicectl device
process launch` command. No launch popup presented this launch, so no
backdrop tap happened (step 3 needed one; this launch did not).

Runner note: the first snapshot dispatch failed on signing, the atlas trap
(the MCP server lacks the team env; the stale team-less daemon also mistook
the boot iPhone 18 Pro simulator for the target once before the explicit
UDID pin). Reading the team off the cached runner's code signature and
re-preparing the runner through the atlas's `prepare ios-runner` route with
that team in the env reused the team-signed cached build (exit 0, no rebuild,
no new install). The team value appears in no file; the placeholder stands.

Arrival language: ar, from the home tree (`الإعدادات` button 43x42 pt,
`لندن، المملكة المتحدة`, Arabic row labels). The no-switch path: nothing
to restore, and the Arabic face was verified again from the tree after the
overlay closed, before termination.

Home reads (contract 4): location 19pt = 57px, exact hhea/typo at 16
Regular; date 21.333328pt = 64px, exact hhea/typo at 18 Regular; countdown
word 20.333336pt = 61px, +1 over hhea/typo 60 at 17 Regular, inside the 1px
tolerance. Prayer row name and row time: VOID on the AX rung, the row 120
form, the full shape in FINDINGS-XS-HOME.md (every row merges to one Other
container carrying `الفجر, 04:03, إشعار الفجر: إيقاف`, no StaticText
children at any depth, both pages, every capture healthy). Screenshots taken
by the atlas route (`pymobiledevice3 developer dvt screenshot`), 1125x2436
each: `xs-home.png` unread this session for the lead's vision dispatch, per
D137.11; no measurement comes from pixels.

Overlay (contract 5): the first rightward swipe reached Extras directly (RTL
order confirmed, the 3T direction; the tree confirmed the page by the Extras
labels before any tap). No Istijaba row renders today (Sunday, Friday-only),
so the tapped row الضحى, upcoming and the countdown target, satisfies the
contract. Frames: title 21.333313pt = 64px, exact hhea/typo at 18 Medium;
body whole node 24.333313pt = 73px against the 72px pin line, +1 if one
line, per-line pending the lead's vision line count of `xs-overlay.png`.
`xs-overlay.png` taken. The SAME row tapped again: the closing capture shows
zero explanation and zero `إغلاق تفاصيل الصلاة` catcher nodes, the overlay
closed and verified. Swipe back, the Standard six-row face verified at its
original frames (الفجر through العشاء).

Face observation, raw, no adjudication: the arrival and restore faces show
the cached-day schedule (الفجر 04:03 through العشاء 21:31, date 8), the
mid-contact Extras face showed the live morning schedule (date 7, countdown
9m 10s to الضحى 06:53), and every recorded frame is identical under both
labels. The app flapped once between its own display states; nothing but the
الضحى row and its reverse was tapped, and the restore face equals the
arrival face. Full shape in FINDINGS-XS-HOME.md.

Restore (contract 7): overlay closed and verified, Standard page shown and
verified, language ar as arrived and verified from the face, the app
terminated through devicectl (pid 11195 resolved from `info processes`,
SIGTERM sent, `pymobiledevice3 developer dvt process-id-for-bundle-id
com.example.athan` then printed 0), no system setting touched, automatic
lock untouched (the XS never auto-locks while tethered, the atlas trap, and
none was needed), the agent-device session closed, the device lock removed
06:55. Evidence: `xs3b-home-tree.json`, `xs3b-overlay-tree.json`,
`xs3b-restore-standard-tree.json`, `xs-home.png`, `xs-overlay.png`, all
under `$HOME/athan-gitree/sessions/137/`. No UDID, serial or team value was
written to any file.

session: ses_eb27f5964ffesqvUuSGSjolr1r

