# Step 04: forward-only convergence

**Requirements:** R4.1, R4.2, R4.3, R3.4, R9.1, R9.2
Weight: 2
**Anchors:** `reschedule-driver-head`, `commit-sound-shape`, `channel-caches`, `reminder-channel-name`, `listeners-foreground`, `app-init-timeout`, `update-android-channel`.

## Goal

A language change re-arms notifications, renames channels under their frozen ids,
re-pushes widgets and stamps `preference_language_last_armed`; the same check runs at
launch and on foreground; an armed reminder inside its final 30 seconds survives every
pass. Channel ids, identifiers and sounds never change bytes.

## Branch

`feat/39-04-convergence` off `uat`.

## Files

- `stores/language.ts` (new), `stores/notifications.ts`, `shared/notifications.ts`, `device/listeners.ts`, `app/index.tsx`
- tests: `stores/__tests__/languageConvergence.test.ts` (new), the reminder keep-alive suite extension, `shared/__tests__/notifications.test.ts`

## Red tests

1. `languageConvergence.test.ts`: with `currentLocaleId()` forced to `ar` and the stamp holding `en`, `reconcileLanguageSurfaces()` calls the reschedule path once and then stamps `ar` — fails today (no function).
2. Same suite: with the stamp equal to the locale, `reconcileLanguageSurfaces()` performs no reschedule (the driver spy sees zero calls) — fails today.
3. The keep-alive extension: a convergence pass over a sequence whose reminder fires in 20 seconds keeps that reminder's record and identifier armed (adapt the shape of `stores/__tests__/reminderImminentKeepAlive.test.ts`: same seeds, drive the convergence pass instead of the plain reschedule) — fails today (no pass to drive).
4. `shared/__tests__/notifications.test.ts` extension: the reminder channel name under `ar` is `تنبيه {name} بعد {n} د` shaped (`t('channel.reminder', ...)`), not the template literal — fails today.

Record the first failing lines.

## Change contracts

1. `shared/notifications.ts`: `export const resetAndroidChannelCaches = (): void` clears `createdReminderChannels`, `createdAthanChannels` and `extrasChannelCreated`. The reminder channel name line becomes `t('channel.reminder', { name: prayerLabel(id), n: intervalMinutes })`. No id, sound, importance or vibration byte changes.
2. `stores/language.ts`:
   - `export const lastArmedLanguageAtom = atomWithStorageString('preference_language_last_armed', '')` (`''` = never armed).
   - `export const reconcileLanguageSurfaces = async (): Promise<void>` — if `currentLocaleId() === store.get(lastArmedLanguageAtom)` return; else under `withSchedulingLock(..., 'reconcileLanguageSurfaces')`: `resetAndroidChannelCaches()`, `await _rescheduleAllNotifications({ deferWidgetRefresh: false })` (the awaited widget push rides it), then `store.set(lastArmedLanguageAtom, currentLocaleId())`. Every failure is caught, logged through Pino as `LANGUAGE: surface convergence failed, retrying at next launch` and leaves the stamp unwritten (dirty stays dirty; R3.4). No rollback, no cancel pass.
   - `export const commitLanguagePreference = async (locale: LocaleId): Promise<void>` — persists through the preference atom (step 05 lands the atom; this step lands the function reading it from `stores/language.ts`'s own `languagePreferenceAtom = atomWithStorageString('preference_language', '')`), calls `setActiveLocale(locale)` (the UI re-renders via the remount key), then `await reconcileLanguageSurfaces()`. Errors inside convergence do not propagate to the caller (forward-only), so the caller's dismiss is unconditional.
3. `device/listeners.ts`: the background→active branch calls `reconcileLanguageSurfaces()` after the existing sync/refresh work, fire-and-forget with the catch already inside.
4. `app/index.tsx`: inside the 1.5 s init timeout, after `initializeNotifications(...)` resolves, `reconcileLanguageSurfaces()` (the scheduling lock serialises it behind the init reschedule).
5. `stores/notifications.ts`: no signature changes. `_rescheduleAllNotifications` is consumed as-is (its at-time and reminder passes create channels through the reset caches and freeze `t()`-driven copy at schedule time, which is R9.1 by construction).

## Green run

New and extended suites pass; `yarn test:tz` passes (no date logic touched, run as guard); `yarn validate` passes.

## Break script

Copy `stores/language.ts` to `$TMPDIR`; `sed -i '' "s/currentLocaleId() === store.get(lastArmedLanguageAtom)/false/" stores/language.ts`; run test 2 (the no-op case), expect it to fail with the driver spy called once; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): forward-only surface convergence with last-armed stamp and channel cache reset`.

## Review checklist

- No channel id, notification identifier, sound or importance byte changed (`prayerIdContract` and the freeze table stay green untouched).
- The stamp writes only after a full pass, never before.
- No rollback path exists anywhere in the new code (D34).

## Merge

`git checkout uat && git merge --no-ff feat/39-04-convergence -m "Merge feat/39-04-convergence into uat: job 39 step 04"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 4`.
