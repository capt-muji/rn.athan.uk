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
validate failed in `shared/__tests__/widgetOpenAppPatch.test.ts` (2 failures) — the lane
worktree's `node_modules` still held `expo-widgets` 58.0.14 while the ff'd tree pins 58.0.19
(ticket 111's re-pin), so the patch-pinning test found no
`patches/expo-widgets+58.0.14.patch`. Environmental, no code changed: `yarn install
--frozen-lockfile` synced the worktree install to the lockfile, then the commit re-ran.

Version 2.0.871, merged, lane fast-forwarded, main-tree gradle versionName set.

session: ses_eba9c9710ffeSr0kPQdiXDMu60
