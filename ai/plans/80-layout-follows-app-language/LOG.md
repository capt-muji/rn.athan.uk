# LOG — ticket 80

## Ticket 80

## Planning (2026-10-14)

- Worktree `$HOME/athan-gitree/run-80`, branch `ticket/80` off `1b0d5229` (uat 2.0.402). The main checkout stays read-only; the owner's run order forbids merge, push and DONE this run.
- Ground read: `stores/language.ts`, `stores/bootstrap.ts`, `app/index.tsx`, `app/_layout.tsx`, `shared/i18n/locale.ts`, `device/listeners.ts`, `device/updates.ts`, `stores/notifications.ts` (the scheduling lock, the convergence driver), `components/sheets/screens/QiblaWave.tsx`, `shared/qiblaWave.ts`, `components/sheets/screens/ColorPicker.tsx`, `components/sheets/parts/SegmentedControl.tsx`, `components/sheets/parts/Toggle.tsx`.
- Pinned sources read at the installed tree: `react-native` 0.88.0-rc.3 `I18nManager.js`, `RCTI18nManager.mm`, `RCTI18nUtil.m`, `I18nUtil.kt`.
- Ground from history: `git show 0b62c90e:ai/plans/73-rtl-travel-family/AUDIT.md` and `LOG.md` (the QiblaWave sibling read, the swatch-ring ruling D4, the known window row 80 must close); rows 78 and 68 records for the starvation bound, the launch-init latch and D59.
- Planning scratch (deleted before any commit): a throwaway render of `Layout` under en and ar pinned the root's jest shape — a host View whose style arrives as the flattened object `{"flex":1,"backgroundColor":"#2c1c77"}` — and both red failure lines (`Expected: "ltr"/"rtl", Received: undefined`).
- The root inventory (an explore worker, 2026-10-14): one tree root (`GestureHandlerRootView`), every modal and sheet in-tree except the colour picker's react-native `Modal` (the app's only one); five existing `direction: 'ltr'` sites (Overlay, VeilBackdrop, Time, Countdown, RamadanDecorations) prove the prop's per-subtree reach in-repo, row 68's window-space catchers having device-proven it on the 3T; the `direction` prop sits in the installed ViewStyle types and the Fabric conversions; `InitialWidthMeasurement` mounts under the root and measures text intrinsic width, direction-safe.
- The grill, round 1 (2026-10-14): eleven findings, all applied — the RNTL 14 removal of `UNSAFE_*` queries (the wave suite now reaches the guide path through a `testID`), babel-plugin-jest-hoist's variable rule (the mock prefix), the localized picker row label under ar (`لون شريط العد التنازلي`), the break-1 grep contradiction, the rtlSwitch whole-suite red scope, a false import claim, the untested R1.3, the break-3 dead sed, the version-ladder gap, the mutation assertion number.
- The grill, round 2 (2026-10-14): seven findings, all applied — the break-1 arithmetic (the expected total is 2, not 1), the wave suite's red narrative (both cases fail at the testID lookup today), the index suite's missing static import, a `.tsx` typo in section 4.1, the restore-list overcount, the missing R1.4 for the modal host, and the marker write's placement pinned inside the try.
- `bash scripts/check-plan.sh ai/plans/80-layout-follows-app-language` prints `PLAN OK` after both rounds.
