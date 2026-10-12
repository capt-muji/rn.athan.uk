# Ticket 65 findings: perfName remnants

Investigation only (queue row 65). No code changes in this row; sections land
as their steps merge. Measured at uat `b69befa9`, version 2.0.114.

## Section 1: the reader inventory

Method: six `grep -rn` runs from the repository root over `app/ components/
shared/ stores/ hooks/ device/ e2e/ scripts/` (node_modules, `.codegraph` and
`ai/` excluded), one per symbol: `perfName`, `perfMark`, `perfMeasure`,
`initPerfMonitor`, `EXPO_PUBLIC_PERF_MONITOR`, `PERF_ENABLED`. Hit totals:
`perfName` 21, `perfMark` 77, `perfMeasure` 37, `initPerfMonitor` 22,
`EXPO_PUBLIC_PERF_MONITOR` 30, `PERF_ENABLED` 4 — 191 hits on 174 distinct
lines across 30 files, 6 of them test suites, so 24 non-test files. Every
total matches planning's counts at `2670e596`. `device/` returns zero hits.

The e2e surface, which the owner named in the ask:

- The seven Maestro flows in `e2e/flows/` read none of the symbols: a
  case-insensitive grep for `perf` over `e2e/` matches no flow file. Flows
  drive screens; the harness around them collects the marks.
- `e2e/scripts/frame-audit.sh` reads nothing from the machinery. It is the
  separate frame-quality harness (screenrecord or SurfaceFlinger cadence);
  both scripts' headers state the split: marks are the in-app instrument,
  frame audits are separate.
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

### Observers: the four UI suites

| File:line | Symbol | Role |
| --- | --- | --- |
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
call sites 60, UI-suite observers 32, scripts and gate usage 5 — 191 rows.
