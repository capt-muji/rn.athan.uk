# LOG

## Planning (2026-10-16)

Lane 117 planning session, owner away under the standing clear-the-board order. Read in
full: `ai/AGENTS.md`, `ai/plans/README.md` (row 117, the Order section, Status, The queue,
Who changes a status), `ai/plans/TEMPLATE.md`, the athan-lead and athan-planner skills, the
four worker files. Full-file reads at uat `50f96266`: both widget modules, the timeline
builder, the snapshot types, the time formatters, all six catalogs' widget/duration/prayer
keys, `widget-statics.json`, `native-strings.json`, the app config's plugin block and
locales block, the whole `patches/expo-widgets+58.0.14.patch`, the language store, the
widget store, `ai/UPSTREAM-PRS.md`, and the pinning suites. History: row 39's widget commits
(`ed8ce964` 2.0.32, `203fabf0` 2.0.34, `2fc2bc4e` 2.0.46) and row 88's `3c1b620f` 2.0.744.

Frontier worked agent-ruled, eight decisions D117.1 to D117.8 in PLAN.md section 2.1; both
recommendation decisions (D117.7, D117.8) argued twice in their rows.

Anchors extracted and verified, eight files, each counting 1 (the patch anchor across
`patches/expo-widgets+*.patch`). The appjson-gallery anchor was first extracted against a
momentarily reformatted app.json during the skeleton bump and counted 0; re-extracted
against the restored file, counts 1. The skeleton commit carries the earlier bytes; this
READY commit carries the fixed anchor.

Skeleton commit `6b00959f` 2.0.858 (hook green), merged `828b61fa`. READY commit follows the
grill.

session: ses_f7b1678ea6e307a

### Step 01 — done

Fork sha `c7481a20` (lane/117 after a mid-step fast-forward: local uat moved from 2.0.864 to
2.0.870 through ticket 111's merges before this branch committed, so the lane was brought to
uat's tip and the step branch re-created off it; the work tree carried over uncommitted.
R3.2's diff check starts from `c7481a20`). Branch `docs/117-1-inventory`.

Preflight `PREFLIGHT OK` at the session start on `be3f5cd4`; after the fast-forward the eight
anchors re-counted 1 each and the citation check re-ran clean. The patch is
`patches/expo-widgets+58.0.19.patch` (ticket 111's re-pin renamed it from +58.0.14; the
anchor holds across the rebuild as PLAN.md section 10 anticipated, no drift protocol needed).

Red: `FINDINGS.md` did not exist; this commit creates it.

Sections 1 and 2 written per the change contracts: 14 kind rows across 2 groups (8 home kinds
one composition both platforms, `widgets/PrayerWidget.tsx:883-890`; 6 lock kinds three
compositions iOS only, `widgets/LockPrayerWidget.tsx:283-284, 517-518, 767-768`), and 12
surface rows with the locale input and six-language bytes each. The six-language column holds
real catalog bytes (duration.h/m, widget.*, weekdayShort, hijri month keys across
`shared/i18n/{en,ar,ms,so,hi,th}.ts`) and the inline STATIC tables; the iOS countdown row
marks the per-language glyphs `unverified` with the settling read (a simulator per device
language).

Green: the scripted citation check opened 202 file:line citations, 158 needle-verified in the
cited window, 0 mismatches. Five spot-opened citations, pasted verbatim:

- `widgets/PrayerWidget.tsx:383` `const ALabel = (units: { h: string; m: string }, targetEpochMs: number, nowMs: number): string => {`
- `shared/time.ts:337` ``const composed = `${[...month].slice(0, 3).join('')} ${hijriDay}`;``
- `app.json:428` `"prayer_widget_display_name": "الصلاة التالية (فاتح)",`
- `widgets/LockPrayerWidget.tsx:767-768` the two `createWidget('PrayerLockWidget3'/'ExtrasLockWidget3', AthanLockWidgetStacked)` registrations
- `shared/i18n/th.ts:155-156` `'duration.h': 'ชม.',` / `'duration.m': 'น.',`

Review checklist: no file outside the plan folder and the queue changed (the citation script
lives in `$TMPDIR`, uncommitted); all 14 kinds present grouped per D117.5; every surface row
names its locale input and cites file:line; the six-language column carries catalog bytes.

Version 2.0.871 (next after local uat's 2.0.870). First commit attempt: the pre-commit
validate failed in `shared/__tests__/widgetOpenAppPatch.test.ts` (2 failures): the lane
worktree's `node_modules` still held `expo-widgets` 58.0.14 while the ff'd tree pins 58.0.19
(ticket 111's re-pin), so the patch-pinning test found no
`patches/expo-widgets+58.0.14.patch`. Environmental, no code changed: `yarn install
--frozen-lockfile` synced the worktree install to the lockfile, then the commit re-ran.

Version 2.0.871, merged, lane fast-forwarded, main-tree gradle versionName set. Commit
`ad8c07ba`, merge `1fccb570`. Hook: `Tests: 2 skipped, 5706 passed, 5708 total`, coverage
Statements/Branches/Functions/Lines all `100%` (5392/2324/1129/4830).

session: ses_eba9c9710ffeSr0kPQdiXDMu60

### Step 02 — done

Branch `docs/117-2-landed-state` off lane/117 (`1fccb570`). All eight anchors re-counted 1
(patch still `patches/expo-widgets+58.0.19.patch`).

Red: FINDINGS.md sections 3 and 4 did not exist; this commit creates them.

Section 3 written per the change contract: 6 landed-state rows (the row 39 halves: the
precomposed footer `ed8ce964` 2.0.32, the runtime locale patch `203fabf0` 2.0.34 fixed
`2fc2bc4e` 2.0.46 with the D44/D79 device-keyed STATIC tables, the per-locale native
strings, the convergence re-push; row 88's Latin half `3c1b620f` 2.0.744 with the pin at
`shared/__tests__/widgetTimeline.test.ts:224-241`; the patch's two hunk families with PR
`expo/expo#51292` awaiting review and the locale injection carrying no PR), the versions
note (`ai/UPSTREAM-PRS.md:12` names `expo-widgets+58.0.5`, the live file is
`patches/expo-widgets+58.0.19.patch`), and row 69's parked scope quoted verbatim.

Section 4: 6 seams, each with both sides and file:line: the stale-card keying asymmetry,
the localised Android unit letters against rows 83/85/102's fixed-letter law
(`shared/time.ts:646-661` the app side), the system-formatted iOS countdown, the stamped
unread `rtl` field (row 68's P16), the gallery's en fallback outside the six, the
v1-snapshot fallback words. The three live reads named per PLAN section 7: the SwiftUI
glyphs per device language and numbering setting, the gallery on a device outside the six,
the Arabic face in its LTR shell.

Green: the scripted citation check opened 258 file:line citations across all four sections,
212 needle-verified in the cited window, 0 mismatches. Row 69's quote byte-compared against
the queue cell: `awk 'NR==150' ai/plans/README.md | awk -F'|' '{gsub(/^ +| +$/, "", $4);
printf "%s", $4}'` against the FINDINGS quote, `diff` exit 0 (recorded).

Review checklist: the quote is verbatim (diff 0); every landed-state claim carries its
commit sha or its queue record line; each seam names both sides with file:line.

Version 2.0.873 (next after local uat's 2.0.872; uat moved mid-step again through ticket
118's DONE merge, so the lane was fast-forwarded to `09f0ee12` and the step branch re-created
off it before committing, work carried over uncommitted; anchors, citations and the row-69
diff re-verified clean on the new base), merged, lane fast-forwarded, main-tree gradle
versionName set. Commit `054d569c`, merge `8bec5ff8`. Hook: `Tests: 2 skipped, 5706 passed,
5708 total`, coverage Statements/Branches/Functions/Lines all `100%`.

session: ses_eba9c9710ffeSr0kPQdiXDMu60

### Step 03 — done

Branch `docs/117-3-recommendation` off lane/117 (`8bec5ff8`). All eight anchors re-counted 1
(patch still `patches/expo-widgets+58.0.19.patch`).

Red: FINDINGS.md section 5 did not exist and the ticket row read IN PROGRESS; this commit
creates the section and sets the row EXECUTED.

Section 5 written per the change contract: 3 options (1 status quo; 2 the lettered
alignment, the Android `ALabel` on fixed Latin `h`/`m`, the `duration.h`/`duration.m` bake
retired from the label, the `WidgetStrings` unit-field retirement and the v1-fallback
re-test riding the same job, the iOS timer staying system-formatted behind the CPU budget
record at `stores/widget.ts:19-31`; 3 option 2 plus the D79 revisit and the `rtl` field's
fate), the recommendation = option 2 (D117.8, as row 69's resume shape), row 69's fate =
stays parked under her ban with the colon half superseded by rows 85/102 (D117.6, recorded
as the resume-time re-scope), the patch upstreaming recommendation = one PR under row 51's
discipline beside `expo/expo#51292`, the patch staying until a published release carries it
(D117.7), and 4 rulings left to the owner. Every option line cites its sections.

Green: the scripted citation check opened 259 file:line citations across all five sections,
212 needle-verified, 0 mismatches. The committed queue row reads EXECUTED.

R3.2 diff check (fork sha `c7481a20`, recorded at step 1): the raw range stat interleaves
the uat commits tickets 111/118 and the row-70 addendum merged while this lane ran (named
in the range log), so the ticket's own diff is the three step commits plus this step's
staging: `git show --stat ad8c07ba`, `git show --stat 054d569c`, `git diff --cached --stat`,
together listing only `ai/plans/117-widget-language-inventory/` (FINDINGS.md, LOG.md,
PLAN.md), the queue row `ai/plans/README.md`, and `app.json`/`package.json`. Docs only,
R3.2 met.

Review checklist: the recommendation cites sections 1 to 4 and matches D117.8; row 69's
fate matches D117.6 and names the supersession; the rulings list is complete (option pick,
ban, upstream PR, live reads) and asks nothing code already answered; no file outside the
plan folder, the queue and the version files changed across all three steps.

Version 2.0.874, merged, lane fast-forwarded, main-tree gradle versionName set. Commit
`386a939d`, merge `6a622c61`. Hook: `Tests: 2 skipped, 5706 passed, 5708 total`, coverage
Statements/Branches/Functions/Lines all `100%` (5392/2324/1129/4830). This ledger commit
(2.0.875) fills the version and sha fields this entry had carried as placeholders; no
FINDINGS, queue or code change rides it.

session: ses_eba9c9710ffeSr0kPQdiXDMu60
