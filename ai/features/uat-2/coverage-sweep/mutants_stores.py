#!/usr/bin/env python3
"""Mutation pass for the stores coverage tests: python3 ai/features/uat-2/coverage-sweep/mutants_stores.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

mutate.MUTATIONS[:] = [
    # --- stores/atoms/overlay.ts ---
    ('stores/atoms/overlay.ts', 'atom((get) => get(overlayAtom).isOn)', 'atom((get) => !get(overlayAtom).isOn)', 'isOn atom inverted'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type;', 'return overlay.selectedPrayerIndex === index && overlay.scheduleType === type;', 'selected row lit while closed'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type;', 'return overlay.isOn && overlay.selectedPrayerIndex === index;', 'selected row lit on the other page'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type;', 'return overlay.isOn && overlay.scheduleType === type;', 'every row lit on the open page'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type;', 'return overlay.isOn;', 'both pages active'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type;', 'return overlay.scheduleType === type;', 'page active while closed'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type ? overlay.selectedPrayerIndex : 0;', 'return overlay.isOn ? overlay.selectedPrayerIndex : 0;', 'other page takes the selected index'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type ? overlay.selectedPrayerIndex : 0;', 'return overlay.scheduleType === type ? overlay.selectedPrayerIndex : 0;', 'closed page keeps the selected index'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== index;', 'return overlay.isOn && overlay.selectedPrayerIndex !== index;', 'rows veiled on the other page'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== index;', 'return overlay.scheduleType === type && overlay.selectedPrayerIndex !== index;', 'rows veiled while closed'),
    ('stores/atoms/overlay.ts', 'return overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== index;', 'return overlay.isOn && overlay.scheduleType === type;', 'selected row veiled too'),
    ('stores/atoms/overlay.ts', '  const cached = selectedAtoms.get(key);\n  if (cached) return cached;\n', '', 'selected atoms never cached'),
    ('stores/atoms/overlay.ts', 'const key = `${type}:${index}`;\n  const cached = selectedAtoms.get(key);', 'const key = `${index}`;\n  const cached = selectedAtoms.get(key);', 'selected cache key ignores the schedule'),
    ('stores/atoms/overlay.ts', '  activeForTypeAtoms.set(type, activeAtom);\n', '', 'active atoms never cached'),
    ('stores/atoms/overlay.ts', '  selectedIndexForTypeAtoms.set(type, indexAtom);\n', '', 'selected index atoms never cached'),
    ('stores/atoms/overlay.ts', 'const key = `${type}:${index}`;\n  const cached = hiddenAtoms.get(key);', 'const key = `${index}`;\n  const cached = hiddenAtoms.get(key);', 'hidden cache key ignores the schedule'),
    ('stores/atoms/overlay.ts', '  hiddenAtoms.set(key, hiddenAtom);\n', '', 'hidden atoms never cached'),
    ('stores/atoms/overlay.ts', 'const cached = activeForTypeAtoms.get(type);', 'const cached = selectedIndexForTypeAtoms.get(type) as Atom<boolean> | undefined;', 'active atom served from the index cache'),

    # --- stores/countdown.ts ---
    ('stores/countdown.ts', 'type === ScheduleType.Standard ? standardCountdownNameAtom : extraCountdownNameAtom', 'standardCountdownNameAtom', 'Extras hero named from Standard'),
    ('stores/countdown.ts', 'atom((get) => get(source).name)', 'atom((get) => get(source))', 'name selector hands back the whole countdown'),
    ('stores/countdown.ts', 'type === ScheduleType.Standard ? standardBarProgressAtom : extraBarProgressAtom', 'standardBarProgressAtom', 'Extras bar fill from Standard'),
    ('stores/countdown.ts', 'type === ScheduleType.Standard ? standardBarWarningAtom : extraBarWarningAtom', 'standardBarWarningAtom', 'Extras bar warning from Standard'),
    ('stores/countdown.ts', 'type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom', 'standardPrevPrayerAtom', 'bar measured from Standard previous row'),
    ('stores/countdown.ts', 'type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom', 'extraNextPrayerAtom', 'bar measured to Extras next row'),
    ('stores/countdown.ts', '    get(getCountdownAtom(type));\n    const prev = get(getPrevPrayerAtom(type));\n    const next = get(getNextPrayerAtom(type));\n    if (!prev || !next) return 0;', '    get(getCountdownAtom(ScheduleType.Standard));\n    const prev = get(getPrevPrayerAtom(type));\n    const next = get(getNextPrayerAtom(type));\n    if (!prev || !next) return 0;', 'bar fill ticks on the Standard countdown'),
    ('stores/countdown.ts', '    if (totalMs <= 0) return 0;\n', '', 'zero-length bar fill divides by zero'),
    ('stores/countdown.ts', '    if (totalMs <= 0) return false;\n', '', 'zero-length bar warning divides by zero'),
    ('stores/countdown.ts', '    if (totalMs <= 0) return 0;\n', '    if (totalMs < 0) return 0;\n', 'bar fill guard < instead of <='),
    ('stores/countdown.ts', '    if (totalMs <= 0) return false;\n', '    if (totalMs < 0) return false;\n', 'bar warning guard < instead of <='),

    # --- stores/notifications.ts: preference setters ---
    ('stores/notifications.ts', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, alertType);', 'const atom = getPrayerAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, alertType);', 'reminder choice written to the at-time alert'),
    ('stores/notifications.ts', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, alertType);', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, AlertType.Off);', 'reminder choice written as Off'),
    ('stores/notifications.ts', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, alertType);', 'const atom = getReminderAlertAtom(ScheduleType.Standard, prayerIndex);\n  store.set(atom, alertType);', 'Extras reminder written to Standard'),
    ('stores/notifications.ts', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, alertType);', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, alertType);\n  if (alertType === AlertType.Off) store.set(getPrayerAlertAtom(scheduleType, prayerIndex), AlertType.Off);', 'reminder off also turns the at-time alert off'),
    ('stores/notifications.ts', 'const atom = getReminderIntervalAtom(scheduleType, prayerIndex);\n  store.set(atom, interval);', 'const atom = getReminderAlertAtom(scheduleType, prayerIndex);\n  store.set(atom, interval);', 'interval written to the reminder alert'),
    ('stores/notifications.ts', 'const atom = getReminderIntervalAtom(scheduleType, prayerIndex);\n  store.set(atom, interval);', 'const atom = getReminderIntervalAtom(ScheduleType.Standard, prayerIndex);\n  store.set(atom, interval);', 'Extras interval written to Standard'),
    ('stores/notifications.ts', 'const atom = getReminderIntervalAtom(scheduleType, prayerIndex);\n  store.set(atom, interval);', 'const atom = getReminderIntervalAtom(scheduleType, prayerIndex);\n  store.set(atom, DEFAULT_REMINDER_INTERVAL);', 'interval written as the default'),
    ('stores/notifications.ts', 'store.set(soundPreferenceAtom, selection)', 'store.set(soundPreferenceAtom, selection || 1)', 'sound rollback to the first athan lost'),

    # --- stores/notifications.ts: the refresh gate and a reschedule that throws ---
    ('stores/notifications.ts', '  if (!shouldRescheduleNotifications()) {', '  if (false) {', 'refresh ignores the 12-hour gate'),
    ('stores/notifications.ts', 'return hoursElapsed >= NOTIFICATION_REFRESH_HOURS;', 'return hoursElapsed > NOTIFICATION_REFRESH_HOURS;', 'gate stays shut at exactly 12 hours'),
    ('stores/notifications.ts', "logger.error('NOTIFICATION: Failed to refresh notifications:', error);\n      throw error;", "logger.error('NOTIFICATION: Failed to refresh notifications:', error);", 'failed refresh reported as done'),
    ('stores/notifications.ts', "logger.error('BACKGROUND_TASK: Failed to reschedule from background:', error);\n      throw error;", "logger.error('BACKGROUND_TASK: Failed to reschedule from background:', error);", 'failed background reschedule reported as done'),
    ('stores/notifications.ts', "        perfMeasure(`sched_${operationName}`, `sched_${operationName}_start`);\n        reject(error);\n", "        perfMeasure(`sched_${operationName}`, `sched_${operationName}_start`);\n        reject(error);\n        throw error;\n", 'a failed operation jams the scheduling queue'),
    ('stores/notifications.ts', '      store.set(lastNotificationScheduleAtom, Date.now());\n      logger.info(\'NOTIFICATION: Refresh complete\');', '      store.set(lastNotificationScheduleAtom, Date.now() - 1);\n      logger.info(\'NOTIFICATION: Refresh complete\');', 'refresh stamps a moment other than now'),

    # --- stores/sync.ts: the launch trigger, the deferred widget push, a development build ---
    ('stores/sync.ts', '  return getDefaultStore().get(syncLoadable);', "  return { state: 'loading' };", 'launch trigger never starts the sync'),
    ('stores/sync.ts', 'sync({ deferWidgetRefresh: true })', 'sync({ deferWidgetRefresh: false })', 'launch sync waits for the widget push'),
    ('stores/sync.ts', 'requestAnimationFrame(() => {\n      setTimeout(() => {', '((run: () => void) => run())(() => {\n      ((run: () => void, _ms?: number) => run())(() => {', 'widget push started before the first paint'),
    ('stores/sync.ts', 'requestAnimationFrame(() => {\n      setTimeout(() => {', 'requestAnimationFrame(() => {\n      ((run: () => void, _ms?: number) => run())(() => {', 'widget push skips the macrotask hop'),
    ('stores/sync.ts', "PrayerWidgets.refreshPrayerWidgets().catch((error) => {\n          logger.warn('WIDGET: Deferred refresh failed', { error });\n        });", 'PrayerWidgets.refreshPrayerWidgets();', 'failed deferred widget push left unhandled'),
    ('stores/sync.ts', '  if (APP_CONFIG.isDev) return true;\n', '', 'development build trusts the cache'),

    # --- stores/version.ts: failures that must not reject the launch sync ---
    ('stores/version.ts', "    logger.warn('VERSION: Failed to read installed version', { error });\n    return '';", '    throw error;', 'unreadable config rejects the launch'),
    ('stores/version.ts', "    logger.warn('VERSION: Failed to reset notification schedule timestamp', { error });", '    throw error;', 'failed gate reset rejects the launch'),
    ('stores/version.ts', '  if (!installedVersion) {', '  if (false) {', 'upgrade check runs with no version'),

    # --- stores/ui.ts: launch gates, resume counter, What's New ---
    ('stores/ui.ts', '(value) => value + 1', '(value) => value', 'resume counter never moves'),
    ('stores/ui.ts', 'store.set(masjidIconLoadedAtom, true)', 'store.set(decorationsLoadedAtom, true)', 'icon load opens the decorations gate'),
    ('stores/ui.ts', 'store.set(decorationsLoadedAtom, true)', 'store.set(masjidIconLoadedAtom, true)', 'decorations load opens the icon gate'),
    ('stores/ui.ts', 'store.set(soundListReadyAtom, true)', 'store.set(soundListReadyAtom, false)', 'sound list never mounts'),
    ('stores/ui.ts', 'store.set(popupWhatsNewEnabledAtom, enabled)', 'store.set(popupUpdateEnabledAtom, enabled)', "What's New raises the update prompt"),
    ('stores/ui.ts', 'export const masjidIconLoadedAtom = atom(false);', "export const masjidIconLoadedAtom = atomWithStorageBoolean('masjid_icon_loaded', false);", 'icon gate persisted across launches'),

    # --- stores/sync.ts: the counterparts the launch tests also claim ---
    ('stores/sync.ts', '  } else {\n    await PrayerWidgets.refreshPrayerWidgets();\n  }', '  } else {\n    PrayerWidgets.refreshPrayerWidgets();\n  }', 'background sync stops waiting for the widget push'),
    ('stores/sync.ts', '        if (!hasUsableDays()) throw error;', '        if (false) throw error;', 'failed launch with nothing stored shows empty lists'),
    ('stores/sync.ts', '  return getDefaultStore().get(syncLoadable);', '  return getDefaultStore().get(loadable(atom(async () => sync({ deferWidgetRefresh: true }))));', 'each trigger starts another sync'),

    # --- stores/notifications.ts: committing one prayer ---
    ('stores/notifications.ts', '    if (atTimeAlert !== AlertType.Off && reminderAlert !== AlertType.Off) {', '    if (false) {', 'a single commit never arms the reminder'),
    ('stores/notifications.ts', '    if (atTimeAlert !== AlertType.Off && reminderAlert !== AlertType.Off) {', '    if (reminderAlert !== AlertType.Off) {', 'reminder armed with the at-time alert off'),
    ('stores/notifications.ts', '    if (atTimeAlert !== AlertType.Off && reminderAlert !== AlertType.Off) {', '    if (atTimeAlert !== AlertType.Off) {', 'reminder armed while the reminder is off'),
    ('stores/notifications.ts', '  const intervalMinutes = getReminderInterval(scheduleType, prayerIndex);', '  const intervalMinutes = DEFAULT_REMINDER_INTERVAL as ReminderInterval;', 'reminder ignores the saved interval'),

    # --- stores/notifications.ts: a refused stale cancel ---
    ('stores/notifications.ts', "    Device.cancelScheduledNotificationById(id).catch((error) =>\n      logger.warn('NOTIFICATION: Failed to cancel stale notification:', { id, error })\n    )", '    Device.cancelScheduledNotificationById(id)', 'one refused cancel rejects the reschedule'),
    ('stores/notifications.ts', '  const staleIds = NotificationUtils.findStaleScheduledNotificationIds(osIdentifiers, records);', '  const staleIds: string[] = [];', 'sweep never retries a refused cancel'),

    # --- counterparts for claims no mutant above could fail ---
    ('stores/sync.ts', '  if (APP_CONFIG.isDev) return true;\n', '  if (APP_CONFIG.isDev || APP_CONFIG.apiKey) return true;\n', 'prod build downloads on every launch'),
    ('stores/notifications.ts', 'store.set(soundPreferenceAtom, selection)', 'store.set(standardPrayerAlertAtoms[0], selection)', "athan choice written over Fajr's alert"),
    ('stores/countdown.ts', 'type === ScheduleType.Standard ? standardCountdownNameAtom : extraCountdownNameAtom', 'extraCountdownNameAtom', 'Standard hero named from Extras'),
    ('stores/atoms/overlay.ts', 'const cached = hiddenAtoms.get(key);', 'const cached = hiddenAtoms.get(key) ?? selectedAtoms.get(key);', 'hidden atom served from the selected cache'),

    # --- stores/notifications.ts: an off prayer whose cancel is refused ---
    ('stores/notifications.ts', '  await Device.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);\n  Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);', '  try {\n    await Device.clearAllScheduledNotificationForPrayer(scheduleType, prayerIndex);\n  } finally {\n    Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);\n  }', 'records dropped when the cancel is refused'),

    # --- stores/notifications.ts: what a single commit files, found by the independent review ---
    ('stores/notifications.ts', '_addMultipleScheduleRemindersForPrayer(scheduleType, prayerIndex, englishName, arabicName, reminderAlert)', '_addMultipleScheduleRemindersForPrayer(scheduleType, prayerIndex, englishName, arabicName, atTimeAlert)', "reminder armed with the at-time alert's type"),
    ('stores/notifications.ts', '_addMultipleScheduleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, atTimeAlert)', '_addMultipleScheduleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, reminderAlert)', "at-time alert armed with the reminder's type"),
    ('stores/notifications.ts', '_addMultipleScheduleNotificationsForPrayer(scheduleType, prayerIndex, englishName, arabicName, atTimeAlert)', '_addMultipleScheduleNotificationsForPrayer(scheduleType, 0, englishName, arabicName, atTimeAlert)', 'at-time records filed under index 0'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])
