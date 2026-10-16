# Ticket 117: Expo widgets and different languages, the inventory

| Field | Value |
| --- | --- |
| Brief | Queue row 117, owner order 2026-10-16: investigation only, no code before her ruling |
| Planned at | uat `50f96266`, version 2.0.857, 2026-10-16 (anchors verified at that sha; the lane worktree carries the same tree) |
| Planned by | Lane 117 planning session 2026-10-16 (owner away; her standing clear-the-board order is the go) |
| Needs first | nothing: 111 (the re-pin) runs beside this lane file-disjoint and rebuilds `patches/expo-widgets` mid-flight; the drift protocol is section 10's first row |
| Parent | none |
| Group | none: produces findings only, touches no code, no test, no config |
| Batch budget | 3 |
| Session budget | 3 |
| Steps count | 3 |
| Device | none (the dispatch order: no device contact, no builds this wave) |
| Owner decisions still needed | the final ruling on the recommendation, row 69's fate at resume, and the patch upstreaming; the ruling list closes FINDINGS.md section 5 |

## 1. Goal

The owner ordered a ticket of her own for the expo widgets and different languages, saying she
is not familiar with the current state, so this row is the inventory first. DONE when
`FINDINGS.md` in this folder answers, with a citation under every load-bearing claim:

1. what every one of the 14 widget kinds (8 home-screen, 6 iOS lock-screen) shows in each of
   the six languages today;
2. what rows 39 and 88 left behind on these surfaces, and what D44/D79 keep device-keyed;
3. what DEFERRED row 69 wanted, verbatim from its queue cell;
4. what the local-only device-locale injection hunk inside `patches/expo-widgets` does, and
   the upstreaming question planning 111 parked by her word;
5. the option set with one recommendation, row 69's fate (folds here, superseded, or stays
   parked), and the rulings only the owner can take.

No code before her ruling: the whole ticket's diff on `uat` is docs (D117.1).

The owner's rules that apply, quoted with their source:

- "the row is INVESTIGATION ONLY first" (queue row 117).
- "The row ends with her ruling; no code before it, and it names whether row 69 folds here,
  is superseded or stays parked" (queue row 117).
- "No device contact and no builds this wave: the inventory reads code, catalogs, configs and
  patches. Where only a live read would confirm, say so in the findings and name the read"
  (the lane dispatch, 2026-10-16).
- D44 (queue rows 39, 67): the null-props widget card's static strings are keyed by the
  device locale the widget process itself reads.
- D77 (queue row 63): widgets are excluded from the countdown-format job; the widget
  countdown label job split to row 69.
- D79 (queue row 67): static copy (null-props placeholders, stale cards) stays device-keyed
  per D44.
- Row 85 (queue): the countdown TIME display is the lettered design in every language, small
  lowercase letters; row 83 (queue): the ago badge's letters are "lowercase h m letters FIXED
  in every language (they never localise)"; row 102 (queue): the letters ride at 80 percent of
  digit size in the digits' own weight.
- Row 88 (queue): "no native numerals anywhere, ever - every digit on every surface in every
  language is a Latin digit"; its record: "the widget props bake Latin bytes through the
  shared formatters (footers and rows Latin by construction; the iOS SwiftUI ticking countdown
  stays system-formatted, row 69's owner-blocked ground)".
- Row 69 (queue): DEFERRED, "the Android widget's ALabel renders `1h 12m` from the snapshot's
  `strings`; this job moves it to the colon format (`0:42`, `1:12`, `2:00`), decides whether
  the unit fields retire from `WidgetStrings` (shape and fallback work), and re-tests the v1
  fallback words"; waiting on "owner says go".

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D117.1 | Investigation only: the whole ticket's diff on `uat` is docs; no code, no config, no test file changes (queue row 117). | planning, agent-ruled | 2026-10-16 | this section |
| D117.2 | `FINDINGS.md` in this folder is the only deliverable. At DONE the lane folds the inventory, the seams, the option set and the recommendation into the row's final queue cell and the folder dies with the merge. No file survives: nothing in shipped code or config cites a widget-language inventory (row 65's D82 and row 66's D85 shape). | planning, agent-ruled | 2026-10-16 | this section |
| D117.3 | No device work and no builds this wave (the dispatch order). A question only a live read can answer is named in `FINDINGS.md` with the exact read that would settle it; the recorded device evidence (row 39's 3T and S23 proofs, row 68's widget rtl stamp) is citable instead. | planning, agent-ruled | 2026-10-16 | this section |
| D117.4 | Every load-bearing claim in `FINDINGS.md` cites its file:line at the Planned at tree, its queue record, or is marked `unverified` with the settling read named (D87 of row 66, same law). | planning, agent-ruled | 2026-10-16 | this section |
| D117.5 | The inventory groups the 14 kinds by shared composition, naming every kind and what varies per kind (schedule, theme, size): one composition renders all 8 home kinds (`widgets/PrayerWidget.tsx` registers 8 `createWidget` kinds off one layout function), three compositions render the 6 lock kinds (`widgets/LockPrayerWidget.tsx` registers 6). A 14-by-6 cell grid would repeat one composition's bytes six times and hide the seams. | planning, agent-ruled | 2026-10-16 | this section |
| D117.6 | Row 69's fate: STAYS PARKED under her own ban (its waiting-on cell is "owner says go"); its colon-format half is superseded in substance by rows 85/102's lettered-design law, and that supersession is recorded as the resume-time re-scope, not acted on. Nothing folds into this row: no code runs before her ruling. | planning, agent-ruled | 2026-10-16 | this section |
| D117.7 | The patch upstreaming recommendation: file the device-locale injection hunks as one upstream PR under row 51's discipline (additive `__expoWidgetDeviceLocale` global on both platforms, every default unchanged, anonymity per `ai/AGENTS.md`), beside the openApp PR `expo/expo#51292` the same patch file already carries; the patch stays until a published release carries the change. Argued twice: against, the #51292 precedent has sat unreviewed since 2026-10-09 and the hunk is small; for, the hunk spans C++/Kotlin/Swift (the costliest to rebuild at every re-pin, and row 111 rebuilds it now), the global is a general widget-runtime capability no app-side change can replace (props-less gallery placeholders have no app locale to bake from, D44's whole ground), and the repo's own law is "a patch leaves when a published package carries the change" (`ai/UPSTREAM-PRS.md`). The recommendation survives. | planning, agent-ruled | 2026-10-16 | this section |
| D117.8 | The next-ticket recommendation: option 2 of the section 5 option set (align the widget countdown's unit letters with the app's fixed-Latin lettered law and retire the localised unit letters), as the shape row 69 resumes into, when she says go. Argued twice: against, the owner banned widget label work ("not anytime soon", row 69's deferral) and option 1 (status quo) costs nothing; for, her own later rulings (rows 83, 85, 88, 102) made fixed Latin letters and Latin digits the app-wide law on every other surface, which leaves the widget's localised unit letters (`1س 12د` under ar beside an app that renders `1h 12m`) the one surface contradicting the law, and the row ends at her ruling anyway, so the recommendation names the shape, not the timing. The recommendation survives. | planning, agent-ruled | 2026-10-16 | this section |

### 2.2 The executor must not decide

- Recommending before the evidence lands: the recommendation cites `FINDINGS.md` sections 1
  to 4 by number.
- Running device work or builds of any kind (D117.3).
- Editing any file outside this plan folder, the queue row and the three version files.
- Revising D44, D79, D77 or any owner ruling in any record: the row proposes; the owner
  rules.

## 3. Pre-flight

`scripts/preflight-117.sh` (the executor saves a copy to `$TMPDIR` and runs it from the lane
worktree root): the worktree is on `lane/117` with a clean tree, local `uat` is merged into
the branch, `origin/uat` is merged into local `uat`, the version is at or above 2.0.858, and
the eight anchors each count 1 (the patch anchor counted across every
`patches/expo-widgets+*.patch`, because ticket 111's re-pin may rename the versioned file
while the hunk text holds). It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Planning verified every claim below at uat `50f96266` (full-file reads of both widget
modules, the timeline builder, the formatters, the catalogs, the patch, and the app config).
File:line is the expected content of `FINDINGS.md`; a line that no longer matches is the
section 10 contradiction row.

### The 14 kinds and their compositions

| Group | Files | Role |
| --- | --- | --- |
| The 8 home kinds | `widgets/PrayerWidget.tsx:883-890` | One layout function registered under 8 names: PrayerWidget, ExtrasWidget, PrayerWidgetMedium, ExtrasWidgetMedium, PrayerWidgetDark, ExtrasWidgetDark, PrayerWidgetDarkMedium, ExtrasWidgetDarkMedium. `schedule` picks the extras pill palette, `theme` the Light/Dark palette, `environment.widgetFamily` (iOS) or `size` (Android) the small/medium composition. Renders on BOTH platforms: iOS systemSmall/systemMedium and Android home screen. |
| The 6 lock kinds | `widgets/LockPrayerWidget.tsx:283-284, 517-518, 767-768` | Three self-contained compositions, each registered for a standard kind and an extras kind: Layout 1 `AthanLockWidgetCountdownPair` (PrayerLockWidget, ExtrasLockWidget: name plus ticking countdown), Layout 2 `AthanLockWidgetCentred` (PrayerLockWidget2, ExtrasLockWidget2: name plus absolute time, no countdown), Layout 3 `AthanLockWidgetStacked` (PrayerLockWidget3, ExtrasLockWidget3: name plus time, countdown beneath). iOS only (`"android": null` per kind in `app.json:348, 357, 366, 375, 384, 393`). |

### The three locale inputs (the heart of the inventory)

| Input | Source | Reaches |
| --- | --- | --- |
| App locale, baked into props | `shared/widgetTimeline.ts:62-71` (`widgetStrings` reads `t()`), `:212` (`prayerLabel`), `:217` (`footerFor`), `:210/:271/:350` (the `rtl` stamp); pushed by `stores/widget.ts` on data, settings and language-convergence events (`stores/notifications.ts:1616, 1627`; `stores/language.ts:85-97` re-pushes inside the switch's convergence pass) | Every prop-bearing face on both platforms: prayer names (hero and list rows), HH:mm times, the precomposed footer, the Android unit letters and stale-card copy (v2+ snapshots), the unread `rtl` field |
| Device locale, read by the widget process | The patch's `__expoWidgetDeviceLocale` global: Android `LocaleList.getDefault().get(0).language` injected through the Hermes runtime (`patches/expo-widgets+58.0.14.patch`, WidgetsJSRuntime.kt hunk and the cpp hunks), iOS `Locale.current.language.languageCode` (`ios/Widgets/WidgetsJSRuntime.swift` hunk); consumed by the `STATIC` tables at `widgets/PrayerWidget.tsx:312-316` and `widgets/LockPrayerWidget.tsx:133-137, 377-381, 610-614` | The props-less faces: iOS neutral card, iOS home StaleCard and lock stale faces, the render-catch cards, the Android v1-snapshot fallback; keyed by exact-or-prefix match over the six codes, unknown falls to en |
| OS native layer | `app.json:400-681` `locales` block, written from `shared/i18n/native-strings.json` (D43/D46; pinned by `shared/__tests__/nativeLocalesConfig.test.ts`) | The gallery (picker) names and descriptions: iOS `Localizable.strings` keyed by the English literals the generated Swift carries; Android `values-b+<lang>/strings.xml` under plugin-derived resource names. Follows the device's system language; a device outside the six shows the en base strings. Also the SwiftUI countdown format (below). |

### Per-surface state (the findings' section 2 table)

| Surface | Driven by | The six languages |
| --- | --- | --- |
| Gallery display name + description | OS native layer, per kind | Localized in ar, ms, so, hi, th (en base); the ar entry sits at `app.json:427` (`prayer_widget_display_name`) |
| Neutral card (no props: gallery placeholder, jiggle, first add) | Device locale (D44) | `STATIC.subtitle`/`rectSubtitle`/`inline`: six full rows inline in both widget modules; title stays the brand `Athan`/`ATHAN` in every language |
| Stale card, iOS home and lock | Device locale (D44/D79) | `STATIC.staleTitle`, `staleBody`, `staleInline`, `refreshLine`, `refreshLead`, `refreshTail` |
| Stale card, Android | App locale (baked `strings` from `t('widget.stale')` and friends, `shared/widgetTimeline.ts:62-71`); device-locale `STATIC` only as the v1-snapshot fallback baked at `widgets/PrayerWidget.tsx:439-448` | Same bytes as the STATIC rows when app locale equals device locale; diverges when they differ (a seam, findings section 4) |
| Countdown hero, iOS home Layout-family and lock Layouts 1 and 3 | SwiftUI `Text(timerInterval:)`, system-formatted: no format string crosses the `@expo/ui` bridge (`widgets/PrayerWidget.tsx:691-695`, `widgets/LockPrayerWidget.tsx:212-216, 702-706`) | Follows the device's locale and numbering settings, not the app locale; row 88's record names it system-formatted. The exact glyphs under each device language are a live-read item (D117.3) |
| Countdown hero, Android | Render-time `ALabel` from epoch deltas, `widgets/PrayerWidget.tsx:383-390`: Latin digits with the baked unit letters `strings.h`/`strings.m` | en `1h 12m`; ar `1س 12د`; ms `1j 12m`; so `1sa 12da`; hi `1घं 12मि`; th `1ชม. 12น.` (units from `duration.h`/`duration.m` per catalog, `shared/i18n/*.ts`) |
| Prayer names (hero `nextName`, list rows, inline faces) | App locale, baked `prayerLabel(id)` at push | Six catalogs; re-baked on the language switch's convergence re-push |
| Times | The provider's HH:mm bytes, carried verbatim | Latin digits in every language by construction (row 88) |
| Footer | App locale, precomposed: `shared/time.ts:324-349` `footerFor` (Gregorian weekday word alone; Hijri month's first three graphemes plus Latin day) | Localized weekday/month words, Latin digits (row 88's Latin-digits note sits at `shared/time.ts:287-290`); baked at `shared/widgetTimeline.ts:217, 278, 318` |
| The `rtl` field | Stamped `localeDirection(currentLocaleId()) === 'rtl'` (v8 props, v4 snapshot; `shared/widgetTypes.ts:20-23, 34-36`) | Read by nothing in either widget module (row 68's P16: the Host application is blocked on the widget runtime); Arabic content lays out in an LTR shell today |
| Android unit letters and the v1 fallback words | `WidgetStrings` fields (`shared/widgetTypes.ts:181-193`); `s` and `now` ride unread (the countdown is minutes-only) | Row 69's retirement question |

### What rows 39 and 88 left behind, and row 69's parked scope

Row 39 shipped: the precomposed localized footer (props v7, `ed8ce964` 2.0.32), the
widget-runtime locale patch (2.0.34/2.0.46) with the D44 device-keyed STATIC tables, the
per-locale native strings from committed config (`app.json` locales plus
`shared/i18n/native-strings.json`), and the language-switch convergence re-push. Row 88
deleted the native-digit map and made every composed widget byte Latin (`3c1b620f` 2.0.744;
the regression test `shared/__tests__/widgetTimeline.test.ts:224-241` pins no Arabic-Indic
digit in any prop string under ar). Row 69's parked scope is section 1's verbatim quote.

### The suites that pin today's behaviour (read, never changed)

`shared/__tests__/widgetStaticStrings.test.ts` (the STATIC tables against
`shared/i18n/widget-statics.json`), `shared/__tests__/nativeLocalesConfig.test.ts` (the
native strings against app.json), `shared/__tests__/widgetTimeline.test.ts` (the baked props,
the Latin pin), `shared/__tests__/widgetRenderer.test.ts`, `widgetLockRenderer.test.ts`,
`widgetContract.test.ts`, `androidWidgetGrid.test.ts`, `widgetSnapshot.test.ts`,
`widgetOpenAppPatch.test.ts`, `widgetRuntimeLoads.test.ts`.

Why the brief alone cannot answer: "what every widget surface shows in each language" is a
claim per surface, and the widget stack has three different locale inputs plus one
system-formatted timer; the answer is the per-surface table above with its citations, which
is what `FINDINGS.md` section 2 writes out in full, six languages included.

## 5. Design

Three investigation steps, each writing its sections of `FINDINGS.md` as it lands. Invariant:
the ticket's whole diff on `uat` is docs (D117.1). The option set the row ends at:
(1) status quo, (2) align the widget countdown's letters with the app's fixed-Latin lettered
law (row 69's resume shape), (3) wider convergence (2 plus the stale-card keying asymmetry
and the D79 device-keyed rule revisited, plus a decision on the unread `rtl` field). The
recommendation is D117.8; the owner rules.

Alternatives rejected: a device probe step (D117.3: the recorded evidence and the code answer
what the row asks); one big step (three bounded commits let the lane audit the inventory
before the judgement rests on it); keeping FINDINGS.md after DONE (D117.2).

Concurrency trace (read, never changed): a language pick commits the preference
(`stores/language.ts:130-195`), the convergence pass re-pushes both schedules' timelines and
snapshots (`stores/language.ts:85-97` through `stores/notifications.ts:1616, 1627` to
`stores/widget.ts`), the re-bake reads the new locale through `t()`/`prayerLabel`/`footerFor`,
and the props-less faces never move: they key off the device locale the widget process
itself reads.

**Acceptance criteria:**

- [R1.1] WHEN the inventory lands in FINDINGS.md section 1 THE SYSTEM SHALL record every one of the 14 widget kinds with its composition, platform reach and what varies per kind, grouped by the shared compositions per D117.5
- [R1.2] WHEN the inventory lands in FINDINGS.md section 2 THE SYSTEM SHALL record per rendered surface (gallery names, neutral card, stale card, catch card, countdown, prayer names, times, footer, unit letters, the rtl field) which locale input drives it and the rendered bytes for each of the six languages, every row citing file:line at the Planned at tree
- [R2.1] WHEN the landed-state analysis lands in FINDINGS.md section 3 THE SYSTEM SHALL record what rows 39 and 88 shipped on the widget surfaces with their commit shas, what D44/D79 keep device-keyed, row 69's parked scope quoted from its queue cell, and the patch's two hunk families with the openApp PR state
- [R2.2] WHEN the seams analysis lands in FINDINGS.md section 4 THE SYSTEM SHALL record each inconsistency the inventory found (at minimum the stale-card keying asymmetry between iOS and Android, the localised unit letters against rows 83/85/102's fixed-letter law, the system-formatted iOS timer against row 88's Latin-everywhere ruling, the stamped-but-unread rtl field, the out-of-six gallery fallback), each with file:line and, where code cannot settle it, the live read that would
- [R3.1] WHEN the recommendation lands in FINDINGS.md section 5 THE SYSTEM SHALL state the option set with each option's heal and cost, one recommendation (D117.8), row 69's fate (D117.6), the patch upstreaming recommendation (D117.7), and the rulings left to the owner, every line citing sections 1 to 4
- [R3.2] WHEN the executor finishes THE SYSTEM SHALL leave this ticket's whole diff holding only docs (plan folder, FINDINGS.md, the queue row and the two tracked version files; the gitignored `android/app/build.gradle` is set in the main tree only), checked as section 6 step 3 records it

## 6. Steps

- [x] Step 1: the inventory (`steps/1-inventory.md`) - R1.1, R1.2
- [x] Step 2: the landed state and the seams (`steps/2-landed-state.md`) - R2.1, R2.2
- [x] Step 3: the options and the recommendation (`steps/3-recommendation.md`) - R3.1, R3.2

## 7. Device proof

None (D117.3). The live-read list (the SwiftUI timer's glyphs under each device language, the
gallery names on a device set outside the six, the Arabic widget face in its LTR shell) is
named in `FINDINGS.md` section 4 with the exact read that would settle each; row 39's recorded
3T and S23 proofs and row 68's stamp record are the citable device evidence.

## 8. Records

`LOG.md` entries under `### Step 0N — done` for each step, the standard fields adapted to
docs steps (no red tests; the "red" is the FINDINGS section absent before the step), each
ending with the `session:` line. Planning's own record sits under `## Planning (2026-10-16)`.

Queue cell text the lane applies on DONE:

`DONE <date>, audited: the widget-language inventory answers in FINDINGS.md (folded here per D117.2, its folder closed): <one line naming the three locale inputs and the seams>; options 1 to 3 recorded, recommendation <option 2: the widget countdown's letters align with the app's fixed-Latin law, row 69's resume shape>, row 69 <stays parked, its colon half superseded by rows 85/102 at resume>, the patch upstreaming <recommended as one PR under row 51's discipline>; no code changed, the rulings wait on her`

Docs commit message: `<VERSION> - docs(plans): ticket 117 executed: 3 steps, the widget-language inventory answered`

## 9. Push

None. The lane never pushes. The orchestrator pushes after the audit.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor count is not 1, and `patches/expo-widgets+*.patch` changed name or text | Ticket 111's lane rebuilt the patch at its re-pin (the drift the dispatch named) | In the lane worktree: `git fetch -q origin uat`, rebase `lane/117` onto `uat`, re-verify the anchor text against the rebuilt patch (the device-locale hunks must still exist: the Swift `context.setObject((Locale.current...` line and the cpp `__expoWidgetDeviceLocale` setProperty), correct the anchor file from the rebuilt patch, record both readings in LOG.md, continue. A second drift, or the hunks gone from the rebuilt patch: `STOP: patch drift beyond the protocol, <what changed>` |
| An anchor count is not 1 in a file the re-pin did not touch | The tree moved past the Planned at sha | `NEEDS_CONTEXT: NEEDS REPLAN, <the anchor and its count>` |
| A section 4 file:line opens at other content | The map drifted from the tree | Re-open the file, correct the row in the same step, record both readings in the LOG entry |
| A claim about the SwiftUI timer's glyphs or the gallery on a non-covered device language needs a runtime trace | Code cannot settle it | Mark it `unverified` in FINDINGS.md with the exact live read that would settle it (D117.3, D117.4) |
| One FINDINGS section contradicts another | The inventory missed a surface | Correct the earlier section in the same step, record both |

Anticipated review fixes, word for word:

- "Add a device probe" - rejected: D117.3, the dispatch order bans device contact this wave.
- "Apply option 2 now" - rejected: D117.1, no code before her ruling.
- "Keep FINDINGS.md after DONE" - rejected: D117.2, the fold lands in the queue cell.
- "Close row 69 as superseded" - rejected: D117.6, the ban is hers; the row records the
  supersession of its format half and stays parked until she says go.

Restore lists: none. The ticket writes docs and deletes nothing.

## 11. Subagents

Planning: full-file reads in the lane worktree at `50f96266`. Delivery: one `athan-executor`
dispatch (weight 3 total, one session), then `athan-reviewer` blind and plan-conformance on
the findings' accuracy. Every worker may call `vision` for an image it cannot see. Nothing
else, ever.

## 12. Report to the owner

One paragraph: the three locale inputs, the seams, the option set, the recommendation, row
69's fate, the patch recommendation, the rulings left to her. The progress table, then the
four-line handoff.
