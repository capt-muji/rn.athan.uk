# Ticket 67: Widget digits follow the app locale, not the device locale

## Planning (2026-10-12)

Session opened after ticket 63's plan was drafted. The owner took D78 (D61
superseded for digit keying only, app locale baked into the props, device-locale
fallback for old blobs) and D79 (static copy stays device-keyed per D44) in the
question round that also ruled 63's formats. The explore fact pack of 2026-10-12
mapped every read, pin and forcing site; it is folded into PLAN.md section 4.

Scratch-worktree proof (deleted): the mixed-script red (`19د` with the device
forced `en` and an `ar` stamp), the green pass after the change, the exact six
re-key sites (three renderer fixtures, two version pins, one stale-entry shape),
`tsc` and Biome clean. Anchors extracted at `fc1e3b89`, all fifteen counting 1.
Gate: `PLAN OK`.

Grill round one (twelve findings, all applied): the new red tests now carry the
Arabic unit words (the English `m` beside Arabic digits would have failed at
green, not red), the fallback case is labelled a green-at-red pin, the
lying-blob case covers R1.5, the green run names the simulation, lock-renderer
and runtime-load suites with corrected paths, and the field union is written
literally so `widgetTypes.ts` gains no i18n import.

Grill round two (four findings, all applied): the commit's add list carries the
three version files, both v1 fixtures strip the stamp, the section 4 pin list
and the proof narrative agree that only the two contract pins and one timeline
shape assertion move, and the proof narrative names the two Android ar-device
tests (the iOS v6 case survives through the fallback). Gate rerun: `PLAN OK`.

### Step 1 — STOPPED (plan defect: three unnamed test sites fail; checkout shared with ticket 63)

Branch `feat/67-widget-locale` off uat (`d6ca9ade`), preflight `PREFLIGHT OK`.
Red verified exactly as planned: the stamped-locale renderer case failed with
`Received array: ["ASR", "19د", "15:20", "Sat"]`, the fallback case passed at
red, both widgetContract pins failed `Expected: 8/4, Received: 7/3`, the two
widgetTimeline locale assertions failed with `undefined`/`false`; 5 failed, 131
passed, no other case. All six change contracts applied verbatim.

Green FAILED, and an isolated rerun (scratch worktree at d6ca9ade plus ONLY the
six-file diff, node_modules symlinked; worktree and branch deleted after)
attributes every failure to this change, not the environment:

- `shared/__tests__/widgetSnapshot.test.ts:175` — `expect(snapshot.v).toBe(3)`,
  a third version pin the plan's enumeration missed.
- `stores/__tests__/widgetAndroid.test.ts:161` — `expect(props.v).toBe(3)`, a
  fourth. Both fail `Expected: 3, Received: 4` after the version bumps.
- `shared/__tests__/widgetSimulation.test.ts:684-724` — `REAL_YEAR_TIMELINES`
  holds 12 golden sha256 digests over
  `JSON.stringify(buildPrayerWidgetTimeline(...))`; the `locale` field changes
  every serialized timeline, so all 12 mismatch. The plan names none of these
  three files in its Files list, its proof narrative, or section 10.
- Biome format: the plan-verbatim `digitLocaleKey` block in
  `widgets/PrayerWidget.tsx:323-325` must collapse to one line, and the
  re-keyed `androidProps({ strings, locale: 'ar' })` render line in
  `widgetRenderer.test.ts:516` must wrap. `npx biome format --write` on resume.

Also: this checkout is shared with the live ticket-63 executor (their in-flight
`shared/time.ts` & co. arrived mid-step; tsc errors under their edits, clean in
isolation). No commit of mine can run the pre-commit hook against a tree they
mutate concurrently.

Nothing committed; no version taken; no lock held. Reverted per the partial-
stop procedure; `feat/67-widget-locale` deleted (0 commits). Evidence:
`$HOME/athan-gitree/sessions/67-exec/` — `step1-sixfiles.patch` (the full
implementation and tests, red-verified), `red-67.log`, `green-67-iso.log` (the
isolated 14-failure attribution), `contaminated-run.log`,
`step1-unfinished-status.txt`. Resume: re-plan the three test sites (pin moves
3→4 twice; regenerate or restructure the 12 digests), then re-apply the patch.

session: ses_ece6cb14bffeFufEL4OKXBWtEi
