# Ticket 65 findings: perfName remnants

Investigation only (queue row 65). No code changes in this row; sections land
as their steps merge. Measured at uat `b69befa9`, version 2.0.114.

## Section 1: the reader inventory

Method: six `grep -rn` runs from the repository root over `app/ components/
shared/ stores/ hooks/ device/ e2e/ scripts/ __tests__/` (node_modules,
`.codegraph` and `ai/` excluded), one per symbol: `perfName`, `perfMark`,
`perfMeasure`, `initPerfMonitor`, `EXPO_PUBLIC_PERF_MONITOR`, `PERF_ENABLED`.
Hit totals: `perfName` 21, `perfMark` 80, `perfMeasure` 39,
`initPerfMonitor` 22, `EXPO_PUBLIC_PERF_MONITOR` 30, `PERF_ENABLED` 4, for 196
hits on 178 distinct lines across 31 files, 7 of them test suites, so 24
non-test files. The step's contract swept eight directories and drew 191
hits; the audit's re-sweep added `__tests__/`, the jest-run root test tree
the contract omitted, and with it the Navigation observer suite (five hits,
four lines). `device/` returns zero hits.

The e2e surface, which the owner named in the ask:

- The seven Maestro flows in `e2e/flows/` read none of the symbols: a
  case-insensitive grep for `perf` over `e2e/` matches no flow file. Flows
  drive screens; the harness around them collects the marks.
- `e2e/scripts/frame-audit.sh` reads nothing from the machinery. It is the
  separate frame-quality harness (screenrecord or SurfaceFlinger cadence);
  the split is stated in `baseline-compare.sh`'s own header: marks are the
  in-app instrument, frame audits are separate.
- `e2e/scripts/baseline-compare.sh` is the one true e2e reader. It streams
  the ReactNativeJS logcat while a flow runs, extracts the `PERF_MEASURE`
  lines (`:36`), computes medians and diffs them against
  `e2e/baselines/android-3t.json`; it demands a Release build with the gate
  on (`:6`, `:39`).
- `e2e/baselines/android-3t.json` carries seven `sheet_*` keys (`:6, :7, :8,
  :17, :25, :28, :30`): medians and notes keyed by mark names, data not code.

Two adjacency notes. The screens' module-local constants `SHEET_PERF_NAME`
(Sound `:29`, Qibla `:23`, Alert `:65`, Language `:18`) and
`SETTINGS_PERF_NAME` (Settings `:35`) match none of the six case-sensitive
terms; they are the prop's values and die with it in a removal. `ai/` records
and the `.codegraph` index are excluded by the contract and contain no app
code.

### Machinery: `shared/perf.ts`

| File:line | Symbol | Role |
| --- | --- | --- |
| `shared/perf.ts:5` | `EXPO_PUBLIC_PERF_MONITOR` | machinery: header doc naming the build-time gate |
| `shared/perf.ts:21` | `initPerfMonitor` | machinery: header doc on pre-init mark buffering |
| `shared/perf.ts:34` | `EXPO_PUBLIC_PERF_MONITOR` | machinery: the gate itself, PERF_ENABLED from the env var, prod-excluded |
| `shared/perf.ts:34` | `PERF_ENABLED` | machinery: the gate itself, PERF_ENABLED from the env var, prod-excluded |
| `shared/perf.ts:60` | `initPerfMonitor` | machinery: pendingMarks doc, the pre-init replay buffer |
| `shared/perf.ts:180` | `EXPO_PUBLIC_PERF_MONITOR` | machinery: doc on initPerfMonitor gate |
| `shared/perf.ts:182` | `initPerfMonitor` | machinery: initPerfMonitor export, installs observers, MMKV ring, background flush |
| `shared/perf.ts:183` | `PERF_ENABLED` | machinery: gate check guarding initPerfMonitor |
| `shared/perf.ts:222` | `perfMark` | machinery: perfMark export |
| `shared/perf.ts:223` | `PERF_ENABLED` | machinery: gate check guarding perfMark |
| `shared/perf.ts:226` | `initPerfMonitor` | machinery: comment on pre-init replay inside perfMark |
| `shared/perf.ts:241` | `perfMeasure` | machinery: perfMeasure export |
| `shared/perf.ts:242` | `PERF_ENABLED` | machinery: gate check guarding perfMeasure |

### Machinery tests and mock

| File:line | Symbol | Role |
| --- | --- | --- |
| `shared/__mocks__/react-native-performance.ts:2` | `EXPO_PUBLIC_PERF_MONITOR` | machinery: the RN performance mock |
| `shared/__tests__/perf.test.ts:7` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:180` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:185` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:193` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:197` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:198` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:199` | `perfMeasure` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:208` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:209` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:210` | `perfMeasure` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:217` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:218` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:219` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:227` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:228` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:232` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:233` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:243` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:245` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:247` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:250` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:262` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:267` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:268` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:272` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:287` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:291` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:293` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:302` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:304` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:307` | `perfMeasure` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:310` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:311` | `perfMeasure` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:319` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:321` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:323` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:324` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:325` | `perfMeasure` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:338` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:340` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:343` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:352` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:354` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:397` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:414` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:417` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:419` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:436` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:441` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:443` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:458` | `initPerfMonitor` | observer: machinery gate suite |
| `shared/__tests__/perf.test.ts:460` | `perfMark` | observer: machinery gate suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:89` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:93` | `initPerfMonitor` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:101` | `EXPO_PUBLIC_PERF_MONITOR` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:117` | `perfMark` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:130` | `perfMark` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:145` | `perfMeasure` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:148` | `perfMark` | observer: machinery flush suite |
| `shared/__tests__/perfBackgroundFlush.test.ts:150` | `perfMeasure` | observer: machinery flush suite |

### Sheet wiring: `components/sheets/parts/Sheet.tsx`

| File:line | Symbol | Role |
| --- | --- | --- |
| `components/sheets/parts/Sheet.tsx:15` | `perfMark` | wiring: marks import into the sheet wrapper |
| `components/sheets/parts/Sheet.tsx:15` | `perfMeasure` | wiring: marks import into the sheet wrapper |
| `components/sheets/parts/Sheet.tsx:52` | `perfName` | wiring: prop doc naming the measures it produces |
| `components/sheets/parts/Sheet.tsx:53` | `EXPO_PUBLIC_PERF_MONITOR` | wiring: prop doc naming the gate env var |
| `components/sheets/parts/Sheet.tsx:55` | `perfName` | wiring: the perfName prop type entry |
| `components/sheets/parts/Sheet.tsx:120` | `perfName` | wiring: perfName destructured in the wrapper |
| `components/sheets/parts/Sheet.tsx:161` | `perfName` | wiring: handleAnimate branches on perfName |
| `components/sheets/parts/Sheet.tsx:163` | `perfName` | wiring: handleAnimate open-animation mark |
| `components/sheets/parts/Sheet.tsx:163` | `perfMark` | wiring: handleAnimate open-animation mark |
| `components/sheets/parts/Sheet.tsx:165` | `perfName` | wiring: handleAnimate close-start mark |
| `components/sheets/parts/Sheet.tsx:165` | `perfMark` | wiring: handleAnimate close-start mark |
| `components/sheets/parts/Sheet.tsx:170` | `perfName` | wiring: handleAnimate deps carry perfName |
| `components/sheets/parts/Sheet.tsx:194` | `perfName` | wiring: handleChange early-returns without perfName |
| `components/sheets/parts/Sheet.tsx:196` | `perfName` | wiring: handleChange open measure, present to settled |
| `components/sheets/parts/Sheet.tsx:196` | `perfMeasure` | wiring: handleChange open measure, present to settled |
| `components/sheets/parts/Sheet.tsx:197` | `perfName` | wiring: handleChange open-animation measure |
| `components/sheets/parts/Sheet.tsx:197` | `perfMeasure` | wiring: handleChange open-animation measure |
| `components/sheets/parts/Sheet.tsx:199` | `perfName` | wiring: handleChange close measure |
| `components/sheets/parts/Sheet.tsx:199` | `perfMeasure` | wiring: handleChange close measure |
| `components/sheets/parts/Sheet.tsx:202` | `perfName` | wiring: handleChange deps carry perfName |

### Call sites: screens, parts, overlay, stores, hooks, loader, app root

| File:line | Symbol | Role |
| --- | --- | --- |
| `app/_layout.tsx:28` | `initPerfMonitor` | call site: initPerfMonitor import |
| `app/_layout.tsx:31` | `EXPO_PUBLIC_PERF_MONITOR` | call site: comment naming the gate env var |
| `app/_layout.tsx:33` | `initPerfMonitor` | call site: initPerfMonitor call, first thing in the entry |
| `app/index.tsx:22` | `perfMark` | call site: launch instrumentation import |
| `app/index.tsx:22` | `perfMeasure` | call site: launch instrumentation import |
| `app/index.tsx:47` | `perfMark` | call site: index_module mark, module evaluated |
| `app/index.tsx:50` | `perfMark` | call site: comment on the mark no-op cost |
| `app/index.tsx:51` | `EXPO_PUBLIC_PERF_MONITOR` | call site: comment naming the gate env var |
| `app/index.tsx:67` | `perfMark` | call site: index_first_render mark |
| `app/index.tsx:195` | `perfMark` | call site: home_content mark |
| `app/index.tsx:196` | `perfMeasure` | call site: js_to_content measure |
| `app/Navigation.tsx:15` | `perfMark` | call site: pager instrumentation import |
| `app/Navigation.tsx:15` | `perfMeasure` | call site: pager instrumentation import |
| `app/Navigation.tsx:43` | `perfMark` | call site: pager_swipe_start mark |
| `app/Navigation.tsx:60` | `perfMeasure` | call site: pager_page measure |
| `components/overlay/Overlay.tsx:14` | `perfMeasure` | call site: overlay-measure import |
| `components/overlay/Overlay.tsx:63` | `perfMeasure` | call site: overlay measure call |
| `components/sheets/parts/LabeledToggle.tsx:4` | `perfMark` | call site: tap-mark import |
| `components/sheets/parts/LabeledToggle.tsx:22` | `perfMark` | call site: toggle_tap mark on row tap |
| `components/sheets/parts/SoundItem.tsx:10` | `perfMark` | call site: tap-mark import |
| `components/sheets/parts/SoundItem.tsx:91` | `perfMark` | call site: sound_select_tap mark on row select |
| `components/sheets/parts/SoundItem.tsx:97` | `perfMark` | call site: sound_play_tap mark on preview play |
| `components/sheets/screens/Alert.tsx:94` | `perfName` | call site: perfName prop via module-local SHEET_PERF_NAME (defined :65) |
| `components/sheets/screens/Language.tsx:37` | `perfName` | call site: perfName prop via module-local SHEET_PERF_NAME (defined :18) |
| `components/sheets/screens/Qibla.tsx:147` | `perfName` | call site: perfName prop via module-local SHEET_PERF_NAME (defined :23) |
| `components/sheets/screens/Settings.tsx:89` | `perfName` | call site: perfName prop via module-local SETTINGS_PERF_NAME (defined :35) |
| `components/sheets/screens/Sound.tsx:176` | `perfName` | call site: perfName prop via module-local SHEET_PERF_NAME (defined :29) |
| `hooks/useNotification.ts:8` | `perfMark` | call site: sound-commit instrumentation import |
| `hooks/useNotification.ts:8` | `perfMeasure` | call site: sound-commit instrumentation import |
| `hooks/useNotification.ts:284` | `perfMark` | call site: sound_commit_start mark |
| `hooks/useNotification.ts:290` | `perfMeasure` | call site: sound_commit measure |
| `shared/i18n/loader.ts:7` | `perfMark` | call site: catalog-mark import |
| `shared/i18n/loader.ts:15` | `perfMark` | call site: catalog_require_start mark, import-time |
| `shared/i18n/loader.ts:24` | `perfMark` | call site: catalog_require_end mark, import-time |
| `stores/bootstrap.ts:28` | `perfMark` | call site: bootstrap-mark import |
| `stores/bootstrap.ts:55` | `initPerfMonitor` | call site: comment on pre-initPerfMonitor buffering |
| `stores/bootstrap.ts:57` | `perfMark` | call site: bootstrap_start mark |
| `stores/bootstrap.ts:68` | `perfMark` | call site: bootstrap_hydrated mark |
| `stores/bootstrap.ts:76` | `perfMark` | call site: bootstrap_done mark |
| `stores/countdown.ts:13` | `perfMark` | call site: overlay-mark import |
| `stores/countdown.ts:293` | `perfMark` | call site: overlay_close_start mark |
| `stores/notifications.ts:25` | `perfMark` | call site: scheduler instrumentation import |
| `stores/notifications.ts:25` | `perfMeasure` | call site: scheduler instrumentation import |
| `stores/notifications.ts:58` | `perfMark` | call site: scheduler enqueue mark |
| `stores/notifications.ts:62` | `perfMeasure` | call site: scheduler queue-wait measure |
| `stores/notifications.ts:63` | `perfMark` | call site: scheduler start mark |
| `stores/notifications.ts:67` | `perfMeasure` | call site: scheduler run measure |
| `stores/notifications.ts:1615` | `perfMark` | call site: widget_push_start mark, fallback path |
| `stores/notifications.ts:1621` | `perfMeasure` | call site: widget_push measure, fallback path |
| `stores/notifications.ts:1626` | `perfMark` | call site: widget_push_start mark, main path |
| `stores/notifications.ts:1628` | `perfMeasure` | call site: widget_push measure, main path |
| `stores/overlay.ts:12` | `perfMark` | call site: overlay-mark import |
| `stores/overlay.ts:46` | `perfMark` | call site: overlay_open_start mark |
| `stores/overlay.ts:58` | `perfMark` | call site: overlay_close_start mark |
| `stores/ui.ts:6` | `perfMark` | call site: present-mark import |
| `stores/ui.ts:179` | `perfMark` | call site: sheet_sound_present mark in showSheet |
| `stores/ui.ts:185` | `perfMark` | call site: sheet_settings_present mark in showSettingsSheet |
| `stores/ui.ts:191` | `perfMark` | call site: sheet_qibla_present mark in showQiblaSheet |
| `stores/ui.ts:197` | `perfMark` | call site: sheet_language_present mark in showLanguageSheet |
| `stores/ui.ts:224` | `perfMark` | call site: sheet_alert_present mark in showAlertSheet |

### Observers: the five UI suites

| File:line | Symbol | Role |
| --- | --- | --- |
| `__tests__/app/Navigation.test.tsx:9` | `perfMark` | observer: pager mark suite (the audit's `__tests__/` re-sweep) |
| `__tests__/app/Navigation.test.tsx:9` | `perfMeasure` | observer: pager mark suite (the audit's `__tests__/` re-sweep) |
| `__tests__/app/Navigation.test.tsx:48` | `perfMark` | observer: pager_swipe_start assertion |
| `__tests__/app/Navigation.test.tsx:57` | `perfMark` | observer: pager_swipe_start negative assertion |
| `__tests__/app/Navigation.test.tsx:66` | `perfMeasure` | observer: pager_page measure assertion |
| `components/overlay/__tests__/Overlay.test.tsx:13` | `perfMeasure` | observer: overlay measure suite |
| `components/overlay/__tests__/Overlay.test.tsx:22` | `perfMark` | observer: overlay measure suite |
| `components/overlay/__tests__/Overlay.test.tsx:22` | `perfMeasure` | observer: overlay measure suite |
| `components/overlay/__tests__/Overlay.test.tsx:152` | `perfMeasure` | observer: overlay measure suite |
| `components/overlay/__tests__/Overlay.test.tsx:156` | `perfMeasure` | observer: overlay measure suite |
| `components/sheets/parts/__tests__/LabeledToggle.test.tsx:8` | `perfMark` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/LabeledToggle.test.tsx:12` | `EXPO_PUBLIC_PERF_MONITOR` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/LabeledToggle.test.tsx:13` | `perfMark` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/LabeledToggle.test.tsx:13` | `perfMeasure` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/LabeledToggle.test.tsx:60` | `perfMark` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:13` | `perfMark` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:13` | `perfMeasure` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:17` | `EXPO_PUBLIC_PERF_MONITOR` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:18` | `perfMark` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:18` | `perfMeasure` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:208` | `perfName` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:212` | `perfMark` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:213` | `perfMark` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:217` | `perfName` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:221` | `perfMark` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:225` | `perfName` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:229` | `perfMeasure` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:236` | `perfName` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:240` | `perfMeasure` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:253` | `perfMark` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/Sheet.test.tsx:254` | `perfMeasure` | observer: sheet wiring suite |
| `components/sheets/parts/__tests__/SoundItem.test.tsx:10` | `perfMark` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/SoundItem.test.tsx:14` | `EXPO_PUBLIC_PERF_MONITOR` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/SoundItem.test.tsx:15` | `perfMark` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/SoundItem.test.tsx:15` | `perfMeasure` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/SoundItem.test.tsx:92` | `perfMark` | observer: tap-mark suite |
| `components/sheets/parts/__tests__/SoundItem.test.tsx:100` | `perfMark` | observer: tap-mark suite |

### Scripts and gate usage

| File:line | Symbol | Role |
| --- | --- | --- |
| `e2e/README.md:43` | `EXPO_PUBLIC_PERF_MONITOR` | gate usage: release measurement-build command line |
| `e2e/scripts/baseline-compare.sh:6` | `EXPO_PUBLIC_PERF_MONITOR` | gate usage: requirements comment |
| `e2e/scripts/baseline-compare.sh:39` | `EXPO_PUBLIC_PERF_MONITOR` | gate usage: no-marks failure hint |
| `scripts/scan-strings.mjs:23` | `perfMark` | script: NON_DISPLAY_CALLEES regex lists the symbol names, never calls them |
| `scripts/scan-strings.mjs:23` | `perfMeasure` | script: NON_DISPLAY_CALLEES regex lists the symbol names, never calls them |

Counts per group: machinery 13, machinery tests and mock 61, sheet wiring 20,
call sites 60, UI-suite observers 37, scripts and gate usage 5, for 196 rows.

## Section 2: the removal probe

Method (D80): a throwaway detached worktree at uat `85c2142e`
(`$HOME/athan-gitree/worktrees/probe-65`, node_modules symlinked from the
repository), nine files edited to the step's list and nothing committed:

- `components/sheets/parts/Sheet.tsx`: the `perfName` prop, its type entry
  and doc, the marks in `handleAnimate`, the measures in `handleChange`, the
  prop's dependency-array entries.
- The five screens: the `perfName={...}` props and the now-unused constants
  (`SHEET_PERF_NAME` in Sound, Qibla, Alert, Language; `SETTINGS_PERF_NAME`
  in Settings).
- `components/sheets/parts/{SoundItem,LabeledToggle}.tsx`: the `perfMark`
  tap calls.
- `stores/ui.ts`: the five `perfMark('sheet_*_present')` calls.

The worktree was deleted after the runs (`git worktree list` shows no
probe-65 entry). `shared/perf.ts` and every non-sheet mark stayed untouched.

One command deviation, recorded for the audit: the plan's
`--selectProjects=components,unit` matched no projects under this Jest (the
comma form is not accepted), so the run passed the flag twice
(`--selectProjects=components --selectProjects=unit`). Same projects, same
suites, everything else verbatim.

### What fails

`npx tsc --noEmit` exits 1 with four errors, all in
`components/sheets/parts/__tests__/Sheet.test.tsx` (`:208`, `:217`, `:225`,
`:236`), each verbatim:

```
error TS2353: Object literal may only specify known properties, and 'perfName' does not exist in type 'Partial<SheetProps>'.
```

The observer suite passes the prop by name, so the prop's deletion is a type
error the compiler names. tsc flags no unused import (`noUnusedLocals` is
off); that surface belongs to Biome below.

`npx biome check . --error-on-warnings` exits 1 with five warnings and one
error:

- `lint/correctness/noUnusedImports` on `Sheet.tsx:15`
  (`perfMark, perfMeasure`), `SoundItem.tsx:10`, `LabeledToggle.tsx:4` and
  `stores/ui.ts:6` (each `perfMark`): the imports the deletions orphan.
- `lint/correctness/noUnusedFunctionParameters` on `Sheet.tsx:153`:
  `handleAnimate`'s `toIndex` parameter served only the deleted marks.
- A format error in `Alert.tsx`: the prop's line carried the JSX closing
  bracket, so its deletion leaves `onDismiss={handleDismiss}` and `>` on
  lines the formatter would join.

`npx jest components/sheets stores/__tests__/ui.test.ts` (both projects):
3 suites failed, 16 passed; 9 tests failed, 430 passed, 439 total. The
failures, verbatim:

- `Sheet.test.tsx`, "the settings sheet in a measurement build":
  - "marks a move towards 0 as sheet_settings_animate" (`:212`):
    `expect(perfMark).toHaveBeenCalledTimes(1)` received 0.
  - "marks a move towards -1 as sheet_settings_close_start" (`:212`): same,
    0 calls.
  - "marks a move towards null as sheet_settings_close_start" (`:212`):
    same, 0 calls.
  - "measures the open from the present and from the animation start once
    it settles open" (`:229`): `perfMeasure.mock.calls` was `[]`, expected
    `[['sheet_settings_open', 'sheet_settings_present'],
    ['sheet_settings_open_anim', 'sheet_settings_animate']]`.
  - "measures the close from its start once it settles closed" (`:240`):
    `[]`, expected `[['sheet_settings_close', 'sheet_settings_close_start']]`.
- `SoundItem.test.tsx`:
  - "marks a tap on the row as a selection of its place for a measurement
    build" (`:92`): `[]`, expected `[['sound_select_tap', { index: 2 }]]`.
  - "marks a tap on its play button as a play of its place for a
    measurement build" (`:100`): `[]`, expected
    `[['sound_play_tap', { index: 2 }]]`.
- `LabeledToggle.test.tsx`:
  - "marks one toggle tap with its label for a measurement build when the
    label is pressed" (`:60`): `[]`, expected
    `[['toggle_tap', { label: 'Show seconds' }]]`.
  - the same test's "when the switch is pressed" row (`:60`): same failure.

The five `sheet_*_present` marks in `stores/ui.ts` break no test:
`stores/__tests__/ui.test.ts` passes, because no suite asserts them. Their
only consumers were the open measures that started from them, so deleting
both leaves nothing dangling; the flags name only the orphaned import.

### What holds

Each claim names its proof from the same run (16 suites passed, 430 tests):

- The five screen suites (`Settings.test.tsx`, `Sound.test.tsx`,
  `Qibla.test.tsx`, `Alert.test.tsx`, `Language.test.tsx`) pass with the
  props and constants gone.
- `stores/__tests__/ui.test.ts` passes with the present marks gone.
- The remaining parts suites pass: `Sheet.test.tsx`'s other describes
  (back button, snap points, first-present, "a sheet with no perf name",
  whose not-called assertions hold trivially), `Header`, `SegmentedControl`,
  `Shared`, `Stepper`, `Toggle`, `SheetHost`, `reminderStep`, `alertDraft`,
  `ColorPicker`, `soundSheet`.
- Scope note: the probe ran the plan's command only
  (`components/sheets` plus `ui.test.ts`). The machinery suites
  (`perf.test.ts`, `perfBackgroundFlush.test.ts`) were not run in the
  worktree; nothing in the probe touches `shared/perf.ts`, and the full
  suite at uat `85c2142e` (step 1's commit hook) passed 5471 tests.

### e2e and scripts after the deletion

A grep over `e2e/` and `scripts/` for `perfName`, `perfMark`, `perfMeasure`
and the `sheet_` mark names returns exactly the expected set and no more:

- `scripts/scan-strings.mjs:23`: the `NON_DISPLAY_CALLEES` regex listing
  the symbol names; a non-caller, so the deletion breaks nothing there.
- `e2e/scripts/baseline-compare.sh:6,39` and `e2e/README.md:43`: the
  gate's `EXPO_PUBLIC_PERF_MONITOR` usages (uppercase; they match the
  gate-term grep, not the four patterns above), unaffected by the sheet
  wiring.
- Seven `sheet_*` lines in `e2e/baselines/android-3t.json` (`:6, :7, :8,
  :17, :25, :28, :30`).

### The orphaning cost

`e2e/baselines/android-3t.json` would carry eight dead keys if the measures
died: the medians `sheet_alert_open` (456), `sheet_settings_open` (370),
`sheet_sound_open` (807), `sheet_settings_close` (202), the notes
`sheet_alert_entrance`, `sheet_animation_config`, `sound_sheet_mount_cap`,
and the median `toggle_tap_ms` (`:9`), whose mark the probe's scope also
deletes and which was already unmatchable through its `_ms` suffix. Nothing
errors: `baseline-compare.sh` diffs the marks a capture actually
contains, so keys with no captured mark simply stop matching, and the
historical baselines for sheet open/close become unreadable data. No hit
beyond the expected four appeared, so no reader contradicts section 1.

## Section 3: the recommendation

The owner rules on reading (D81); every claim below cites its evidence.

### 1. What removal costs

Three scopes exist, and their costs differ by an order of magnitude.

Dropping the sheet wiring only (the probe's scope, section 2):

- Nine source files touched: `Sheet.tsx`, the five screens, `SoundItem`,
  `LabeledToggle`, `stores/ui.ts` (section 2's method list).
- Three suites edited and ten tests deleted or rewritten: `Sheet.test.tsx`
  loses its "settings sheet in a measurement build" describe (six tests:
  three `it.each` rows, the between-snap-points negative, two measure
  tests, plus the four `perfName` call sites tsc names),
  `LabeledToggle.test.tsx` its tap-mark test (two rows),
  `SoundItem.test.tsx` its two tap-mark tests (section 2, What fails).
- Six lint findings to clear by hand: four orphaned imports, one orphaned
  parameter, one JSX reformat (section 2, Biome).
- Eight keys in `e2e/baselines/android-3t.json` orphan: nothing
  errors, the comparison just silently stops covering sheet open/close
  and toggle taps (section 2, orphaning cost).
- Given up: sheet open/close and tap timing in a measurement build. The
  launch, bootstrap, scheduler, widget-push, catalog and overlay timings
  stay, because their marks live outside the sheets (section 1, call sites).

Removing the machinery too (the full cleanup):

- The 24 non-test files of section 1's surface plus every suite that
  observes the machinery: the two machinery suites and the mock, the five
  UI observer suites of section 1's observers group (Overlay, Sheet,
  LabeledToggle, SoundItem), and the Navigation pager suite the audit's
  `__tests__/` re-sweep added; every export has a non-sheet caller, so
  nothing is droppable piecemeal (section 1, machinery and call-site
  groups).
- The `EXPO_PUBLIC_PERF_MONITOR` launch-diagnosis capability goes entirely:
  `js_to_content`, `index_first_render`/`home_content`, the bootstrap
  timeline, scheduler queue-waits and widget-push timing (section 1, call
  sites), the instrument that measured the app's cold start and the
  notification pipeline, not only the sheets.
- `baseline-compare.sh`, its README section and the whole baselines file
  lose their subject (section 1, e2e surface): the harness reads
  `PERF_MEASURE` lines that would no longer exist.

### 2. What removal risks

The probe names the live dependencies, and they are all tests (section 2):
the compiler, the linter and ten Jest cases are the entire breakage: no
e2e flow, no script, no runtime path reads the sheet marks (section 1, e2e
surface; section 2, e2e after the deletion). The one silent risk is the
orphaning: nothing fails when the baselines keys stop matching, so a future
sheet-regression audit would quietly lose its rows (section 2, orphaning
cost). That silence cuts both ways: removal is safe if wanted, but its
cost is easy to under-notice.

### 3. Recommendation

**Keep.** Nothing in a production build pays for the wiring (the gate
folds every mark out of store bundles, section 1 machinery), and it is
the only instrument behind the sheet baselines, so a removal ticket would
spend ten tests and eight baseline keys to buy tidiness the owner cannot
feel. If she ever wants the cleanup anyway, the probe is the map: a small,
well-bounded ticket (nine files, three suites, six lint findings, eight
dead keys), worth its own row only then.
