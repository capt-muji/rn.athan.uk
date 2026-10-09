# Evidence log

What was read, what was measured, and what was deliberately not read. Every citation
below is from the branch `arch/39-localisation-opencode-deepseek-20261009` at commit
`9f1c0350`.

## 1. Independence

- The parallel design under `verify/39-localisation-*` was not read, in any worktree, at
  any point. Only `git branch -a` and `git worktree list` were run, which print branch
  and path names, not content.
- Nothing under `ai/plans/` or `ai/features/` was read. The only writes are the new files
  in `ai/plans/39-localisation/alternatives/opencode-deepseek/`.
- The work was done in a dedicated worktree
  (`$HOME/athan-gitree/worktrees/arch-39-opencode-deepseek`) created off `uat`. `uat` and
  `main` were not modified.

## 2. Measured baseline

Command, run on the untouched worktree:

```
yarn validate
```

Output, verbatim:

```
$ tsc --noEmit && biome check . --error-on-warnings && jest --silent --coverage
Checked 385 files in 308ms. No fixes applied.

=============================== Coverage summary ===============================
Statements   : 100% ( 4938/4938 )
Branches     : 100% ( 2153/2153 )
Functions    : 100% ( 1031/1031 )
Lines        : 100% ( 4427/4427 )
================================================================================

Test Suites: 189 passed, 189 total
Tests:       2 skipped, 5252 passed, 5254 total
Snapshots:   0 total
Time:        41.438 s
Done in 43.18s.
```

This is the cost the build session must keep green, and the reason the test plan adds
pure unit tests rather than slow integration ones.

## 3. Code read, and the facts taken from it

Domain and identity:

- `shared/types.ts:74` `RequiredTimeName` union; `shared/types.ts:108-122`
  `ISingleApiResponseTransformed` (stored shape, no names); `shared/types.ts:148-153`
  `ScheduleType`; `shared/types.ts:182-220` `AlertType`/`ReminderSlot` storage contracts;
  `shared/types.ts:266-307` `PrayerRow`/`ReadablePrayer`/`Prayer`.
- `shared/constants.ts:9,15,26,32` English and Arabic name arrays;
  `shared/constants.ts:39,47` night and midnight-crossing names;
  `shared/constants.ts:54-60,1006-1012` explanations; `shared/constants.ts:258`
  `PRAYER_TIMEZONE`; `shared/constants.ts:977-996` row height 57.
- `shared/prayer.ts:269-308` `createPrayer`; `:314-330` name selection;
  `:376-422` per-day build; `:446-483` sequence build; `:504-505` `getPrayerForDate`.
- `stores/database.ts:32` MMKV id; `:136-160` `prayer_*` records; `:188-304`
  notification and reminder records.

Notifications, channels, scheduling:

- `device/notifications.ts:44-50` at-time identifier; `:61-66` reminder identifier;
  `:82-137,212-255` scheduling.
- `shared/notifications.ts:17-24` record shape; `:88-117` daily-prayer sound set;
  `:123-189` title builders; `:147` slug; `:214-221` stale diff; `:268-361` budget
  planner; `:368-417` channel ids and configs; `:419-514` channel creation;
  `:516-552` legacy channel deletion; `:562-593` init.
- `stores/notifications.ts:203-313` alert and reminder atoms; `:333-409` repair marks;
  `:448-472` marked set; `:487-598` index-key migration; `:826-959` scheduling;
  `:1012-1155,1201-1447` reminders and commit.

Upgrade and cache:

- `stores/version.ts:82-109` upgrade detection; `:135` `CACHE_SCHEMA_VERSION`;
  `:144-156` keep prefixes; `:194-223` cache clear; `:230-292` `handleAppUpgrade`.
- `stores/bootstrap.ts:39-81` warm-cache hydration.
- `stores/sync.ts:125-137` armed-day save; `:234-261` `initializeAppState`;
  `:337-388` cache swap and keep list.

Widgets:

- `shared/widgetTypes.ts:14,21` prop versions; `:38-53` settings and row;
  `:62-118,127-173` prop shapes.
- `shared/widgetTimeline.ts:96-138` segment and day list; `:161-257` timeline;
  `:277-320` snapshot.
- `stores/widget.ts:84-90` settings read; `:124-140` settings sync; `:167-256` push;
  `:345-389` Android push.
- `widgets/PrayerWidget.tsx:312-340,481-518,759` fixed captions;
  `widgets/LockPrayerWidget.tsx:50-79,96-118,203-232,249-270,348-377,404-423` fixed
  captions.

UI and text:

- `components/prayer/Prayer.tsx:36,88-95,110-116` bilingual row.
- `stores/ui.ts:131-132` `showArabicNamesAtom`.
- `components/sheets/screens/Settings.tsx:32-188` Settings strings and the toggle.
- `components/sheets/screens/Alert.tsx:30-47,93-101,218-256` alert strings.
- `components/prayer/Explanation.tsx:6,77-80,159-165` bilingual explanation.
- `components/overlay/overlayContent.ts:10,51-59` explanation lookup.
- `shared/time.ts:229-254` date formatting; `:516-574` duration formatting.
- `shared/text.ts:25-27` digit substitution.
- `shared/help.ts:46-144` help content.
- `shared/whatsNew.ts:75-124,167-217` release content and rules.
- `components/modals/{Help,WhatsNew,Update}.tsx`, `components/ui/Error.tsx`,
  `components/day/Day.tsx:43-49`, `components/countdown/Countdown.tsx:46`,
  `app/index.tsx:211`, `hooks/useNotification.ts:58-59` fixed strings.

Gates:

- `jest.config.js:110-124` coverage collection; `:131-138` 100 per cent thresholds.
- `scripts/check-changed-coverage.js:35-50` unmeasured trees, including `widgets/`.
- `.husky/pre-commit` the four-step gate.
- `shared/__tests__/versionLockstep.test.ts:58-75`,
  `shared/__tests__/unusedExports.test.ts:39-53`,
  `shared/__tests__/identifierScan.test.ts:18-22`,
  `shared/__tests__/widgetContract.test.ts:94-144`.

## 4. Measurement discipline

Predictions were written before measurements where the repo's evidence rule asks for it.
The one prediction tested in this session was the baseline itself: the expectation was
that the untouched worktree passes at 100 per cent, and it did (section 2). No other
claim in these documents is presented as measured; each design statement is either a
citation or is labelled an estimate (`PROPOSAL.md` §12).

## 5. Unverified items carried as assumptions

- `Intl.DateTimeFormat().resolvedOptions().locale` reads the device locale under Hermes
  on both platforms. Isolated to one function in `stores/language.ts`; the platform
  fallback is named in `PROPOSAL.md` §17.
- `Intl.DateTimeFormat.formatToParts` availability, used only to strip the Hijri era
  token.
- The device behaviour of deleting an Android channel that a pending notification
  references. The design orders the reschedule first and relies on the fallback channel
  for the transient, which is the behaviour the existing init already assumes
  (`shared/notifications.ts:570-577`); it is re-checked on device by
  `UPGRADE-AND-RECOVERY.md` §5.

## 6. Cost evidence

The only measured cost is the gate runtime in section 2. Every other cost in
`PROPOSAL.md` §12 is an estimate in engineer-days and is labelled as such.
