# Step 2: the digit map dies — Latin digits in every language

Requirements: R2.1, R2.2, R2.3, R2.4, R2.5, R3.1, R3.2
Weight: 2

## Anchor check

```bash
bash $TMPDIR/preflight-82.sh digits-map t-interpolate date-compose sections-regex shown-time widget-digits widget-bake stepper-visible sounditem-format digits-pin notif-pin date-pin time-ar-pin widget-renderer-pin widget-timeline-pin time-row-pin
```

Expected output ends `PREFLIGHT OK`. Any other output is STOP. Step 1 rewrote
`shared/time.ts`, `Countdown.tsx` and `Ago.tsx`; this step's anchors quote the regions
step 1 did not touch, so the counts hold.

## Goal

Every user-visible number renders Latin digits in all six locales. The digit map dies in
the app and in the widget runtime, every `localiseDigits` wrapper unwraps, and the
Arabic-Indic pins across the suites flip to Latin. No catalog value changes: no catalog
file, `catalog-lock.json`, `dist/` or `native-strings.json` entry carries a digit glyph
(verified at planning by grep), so the flip is code-side only.

## Branch

```bash
git checkout -b feat/82-latin-digits uat
```

## Files

Source: `shared/i18n/digits.ts` (deleted), `shared/i18n/index.ts`, `shared/time.ts`,
`hooks/usePrayer.ts`, `shared/widgetTimeline.ts`, `components/sheets/parts/Stepper.tsx`,
`components/sheets/parts/SoundItem.tsx`, `widgets/PrayerWidget.tsx`.
Tests: `shared/__tests__/digits.test.ts` (deleted), `shared/__tests__/time.test.ts`,
`shared/__tests__/dateLocalized.test.ts`, `shared/__tests__/notifications.test.ts`,
`stores/__tests__/countdown.test.ts`, `shared/__tests__/widgetTimeline.test.ts`,
`shared/__tests__/widgetSimulation.test.ts`, `shared/__tests__/widgetRenderer.test.ts`,
`components/prayer/__tests__/Time.test.tsx`,
`components/sheets/parts/__tests__/SoundItem.test.tsx`,
`components/sheets/screens/__tests__/Sound.test.tsx`,
`components/sheets/screens/__tests__/Alert.test.tsx`,
`components/countdown/__tests__/Countdown.test.tsx`.

## Red tests

Flip the pins first (values below), then run and record. Measured against the planning
worktree with the map neutralised (proof, 2026-10-13):

```bash
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit
```

`Tests: 6 failed` beyond step 1's landed flips: the `hideSeconds option` >
`draws the fixed-width shapes under ar` block (`Expected: "٠١:٠١", Received: "01:01"`),
the `native digits (D57)` ar pins of `formatTime` and `formatTimeAgo`
(`٢:٥٩:٠٠`, `٠:٠٢`, `١:٠٠`, `٢:٠١`), `splitColonSections`' Arabic-Indic case
(`time.test.ts:241-243`), and `formatPrayerTime`'s ar pin (`time.test.ts:696-699`,
`Expected: "٠٥:٤٤", Received: "05:44"`).

```bash
npx jest shared/__tests__/digits.test.ts shared/__tests__/dateLocalized.test.ts shared/__tests__/notifications.test.ts stores/__tests__/countdown.test.ts shared/__tests__/widgetTimeline.test.ts shared/__tests__/widgetSimulation.test.ts --watchman=false --selectProjects=unit
```

Per-suite failures: `digits.test.ts` `1 failed` (`maps 05:44 to ٠٥:٤٤ under ar`
receives `05:44`); `dateLocalized.test.ts` `2 failed` (the ar date and Hijri pins);
`notifications.test.ts` `2 failed` (`builds the reminder title with native digits under
ar` receives `العصر بعد 15`, and the reminder-content pin `تنبيه المغرب بعد ١٥`);
`countdown.test.ts` `1 failed` beyond step 1 (`display selector emits native digits
under ar` receives `01:01`); `widgetTimeline.test.ts` `1 failed` (the ar baking pin:
`Expected: "١٧:٤٥", Received: "17:45"`); `widgetSimulation.test.ts` `1 failed`
(`Expected: "٠١:٠٥", Received: "01:05"`).

```bash
npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit
```

`Tests: 4 failed, 59 passed, 63 total`, all four named `... under an ar device locale`:
the iOS footer digits (`Rab ٣٠` receives `Rab 30`), the Android countdown label
(`١٩د` receives `19د`), the v1 English fallback words (`١h ١٢m` receives `1h 12m`),
and the parsed legacy day footer (`Rab ٣٠`).

```bash
npx jest components/prayer/__tests__/Time.test.tsx components/sheets/parts/__tests__/SoundItem.test.tsx components/sheets/screens/__tests__/Sound.test.tsx components/sheets/screens/__tests__/Alert.test.tsx components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components
```

Beyond step 1's landed flips: Time's ar row pin (`٠٦:٤٦` receives `06:46`, the
`--:--` sentinel staying ASCII), SoundItem's preview pin (`٠:٠٣` receives `0:03`),
Alert's stepper pin (`١٥` receives `15`), Sound's row regex
(`/^أذان [٠-٩]+$/` matches nothing), and Countdown's two ar section tests
(`٠٢` and `٢٩` receive `02` and `29`).

## Change contracts

1. `shared/i18n/digits.ts` — the file is deleted. Its two exports
   (`ARABIC_INDIC`, `localiseDigits`) have no reader after this step.
2. `shared/i18n/index.ts` — the interpolation callback's body becomes exactly these
   two lines, which the break script's substitution matches:
   `const localized = String(supplied);` then `return localized;`. The
   `localiseDigits` import and re-export die.
3. `shared/time.ts` — `formatPrayerTime`, `formatDateLocalized`,
   `formatHijriDateLocalized` (both returns) and `footerFor` (both returns) return
   their composed strings directly; the import dies; `ALL_DIGITS` becomes
   `/^[0-9]+$/` and `ALL_ZEROS` becomes `/^0+$/` (the Arabic-Indic ranges have no
   producer left); `formatTime`/`formatTimeAgo` return their composed strings directly.
   The `formatHijriDateLocalized` docblock drops its "localiser then maps" wording.
4. `hooks/usePrayer.ts` — `getShownTime` returns `shown`; the import dies.
5. `shared/widgetTimeline.ts` — the four `localiseDigits` wrappers (buildDayList's
   `time`, `makeEntry`'s `nextTime`, the final-prayer `nextTime`, the snapshot `time`)
   unwrap; the import dies. No props version bump: entry shape is unchanged.
6. `components/sheets/parts/Stepper.tsx` — `const visible = String(value);`; the
   import dies.
7. `components/sheets/parts/SoundItem.tsx` — the local `formatTime` returns
   `composed`; the import dies.
8. `widgets/PrayerWidget.tsx` — `WIDGET_DIGITS`, its `localiseDigits` and the D57/D61
   comment block die; the seven `localiseDigits` call lines (406, 407, 408 in the
   Android label; 417 and 420 in the iOS footer; 682 and 686 in the legacy Android
   footer) use the strings directly. `localeKey` keeps its `STATIC` role: the
   device-keyed static copy is untouched (D44/D79). The iOS native timers
   (`Text(timerInterval:)`) are not touched (D82.7).
9. `shared/__tests__/digits.test.ts` — deleted with its subject.
10. Pin flips, value by value:
    - `time.test.ts`: the ar fixed-width block flips to the Latin equivalents
      (`3665,true` -> `"01:01"`, `120,true` -> `"00:02:00"`, `599,true` ->
      `"00:09:59"`, `600,true` and `601,true` -> `"00:10"`); the `native digits (D57)`
      describes re-derive: under ar the values equal the en values, and their names
      drop the native-digits wording for the one-design truth; `formatPrayerTime`'s
      ar pin flips to `"05:44"`; the `splitColonSections` Arabic-Indic case flips to
      a Latin case and keeps one negative case; the `formatTimeAgo` ar pins flip
      (`٠:٠٢` -> `"0:02"` alongside the `الآن` word pin, which stays byte-identical).
    - `dateLocalized.test.ts`: `الأحد, 11 أكتوبر 2026` and `ربيع الآخر 30, 1448`.
    - `notifications.test.ts`: `العصر بعد 15` and `تنبيه المغرب بعد 15`.
    - `countdown.test.ts`: `01:01`; the test's name drops its native-digits wording.
    - `widgetTimeline.test.ts`: `17:45`, `03:30`, `22:45`, `13:10`; the stale-card
      negative assertion `.not.toContain('13:10')` dies with the map, or it
      contradicts the flipped `toContain('13:10')` beside it.
    - `widgetSimulation.test.ts`: `01:05`.
    - `widgetRenderer.test.ts`: `Rab 30`, `19د`, `1h 12m`; the four test names drop
      their native-digits wording for Latin-digits wording; the two negative
      assertions that pinned the map's non-leak die with it (`.not.toContain('19د')`
      beside the Android label pin, `.not.toContain('Rab 30')` beside the legacy
      footer pin), or each contradicts its flipped neighbour.
    - `Time.test.tsx`: `06:46` (the `--:--` sentinel assertion stays).
    - `SoundItem.test.tsx`: `0:03`.
    - `Sound.test.tsx`: the regex becomes `/^أذان \d+$/`.
    - `Alert.test.tsx`: `15`.
    - `Countdown.test.tsx`: `02` and `29` (and the seconds-preference test's groups).

## Green run

All twelve suites pass, then `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0. Then the whole unit and components
projects pass (`npx jest --watchman=false`), because this step touches shared
composers: any suite failing outside the named twelve is a STOP.

## Break script

`scripts/break-step2.sh` in this folder. It re-inserts the ten-glyph map inside
`t()`'s interpolation in `shared/i18n/index.ts` (mutation asserted found once), runs
`shared/__tests__/notifications.test.ts`, catches the ar title pin failing
(`Expected: "العصر بعد 15", Received: "العصر بعد ١٥"`), restores the file, verifies
`git diff --quiet`, prints `ALL AS EXPECTED: 1`.

## Version and commit

Next patch after uat's `package.json`. Same three files, `app.json` first. Message:

```
<VERSION> - feat(82): Latin digits in every language, the app and widget digit maps deleted
```

Files added by name: the eight source files, the twelve test files, the two deletions,
this plan folder's `PLAN.md` and `LOG.md`, and `ai/plans/README.md`.

## Review checklist

- `grep -r "localiseDigits\|ARABIC_INDIC" --include="*.ts" --include="*.tsx" .`
  outside `node_modules` returns nothing.
- No catalog file, `catalog-lock.json`, `dist/` or `native-strings.json` byte changed.
- No channel id, notification scheduling line, or alert behaviour changed.
- The en reminder title and channel label pins are byte-identical (`{name} in {n}m`,
  `Athan {n}`).
- The `now`/`الآن` word pins survive untouched.
- The widget's `localeKey` still selects `STATIC`; only the digit map died.

## Merge

```bash
git checkout uat && git merge --no-ff feat/82-latin-digits -m "<VERSION> - merge feat/82-latin-digits: step 2, Latin digits everywhere"
```

## Done when

Checklist ticked, LOG.md entry appended with the red lines, the full-suite pass line
and the deletions list, merge landed on uat.
