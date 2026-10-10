/**
 * The English catalog: one flat object, dotted keys, byte-identical values
 *
 * Flat and dotted because Hermes compiles large object literals slowly when they nest
 * (hermes#1046) and the flat-JSON bridge (step 07) round-trips this exact shape. The values
 * are the literals the waves replace, so the app renders the same bytes as 1.29.x.
 */

import type { PrayerId } from '@/shared/constants';

export const en = {
  'prayer.fajr': 'Fajr',
  'prayer.sunrise': 'Sunrise',
  'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr',
  'prayer.magrib': 'Magrib',
  'prayer.isha': 'Isha',
  'prayer.midnight': 'Midnight',
  'prayer.last third': 'Last Third',
  'prayer.suhoor': 'Suhoor',
  'prayer.duha': 'Duha',
  'prayer.istijaba': 'Istijaba',

  'settings.title': 'Settings',
  'settings.showSeconds': 'Show seconds',
  'settings.showTimePassed': 'Show time passed',
  'settings.showDecorations': 'Show decorations',
  'settings.countdownBar': 'Countdown Bar',
  'settings.showCountdownBar': 'Show countdown bar',
  'settings.other': 'Other',
  'settings.whatsNew': "What's new",
  'settings.help': 'Help',
  'settings.subtitle': 'Set your preferences',
  'settings.prayer': 'Prayer',
  'settings.changeAthan': 'Change athan',
  'settings.qibla': 'Qibla',
  'settings.display': 'Display',
  'settings.showHijriDate': 'Show hijri date',
  'settings.whatsNewLabel': 'What’s new',

  'help.q.none': "Why don't I get any notifications?",
  'help.a.none': 'Without permission, notifications cannot be shown.',
  'help.step.allowNotificationsIos': 'Turn on Allow Notifications in the app settings',
  'help.step.allowNotificationsAndroid': 'Turn on notifications in the app settings',
  'help.step.leaveAthanCategories': 'Leave the athan categories on',
  'help.q.stopAfterDays': 'Why did notifications stop after a few days?',
  'help.a.stopAfterDays.ios': 'Two settings stop new notifications being sent.',
  'help.step.backgroundRefresh': 'Turn on Background App Refresh in the app settings',
  'help.step.lowPowerMode': 'Turn off Low Power Mode',
  'help.a.stopAfterDays.android': 'Battery optimisation stops new notifications being sent.',
  'help.step.batteryUnrestricted': 'Set battery usage to Unrestricted in the app settings',
  'help.step.batterySaver': 'Turn off Battery Saver',
  'help.q.stopAfterRestart': 'Why did notifications stop after a restart?',
  'help.a.stopAfterRestart':
    'After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.',
  'help.step.openAfterReboot': 'Open this app after rebooting the phone',
  'help.q.noSound': 'Why does a notification show but play no sound?',
  'help.a.noSound': 'A silent phone mutes notification sound.',
  'help.step.silentMode': 'Take the phone out of silent mode',
  'help.q.dndTimes': 'Why are notifications silenced at certain times?',
  'help.a.dndTimes.ios': 'Focus and Do Not Disturb modes silence notifications until this app is allowed through.',
  'help.step.timeSensitive': 'Allow Time Sensitive Notifications in the app settings',
  'help.step.focusAllow': 'Allow this app in each Focus you use',
  'help.a.dndTimes.android': 'Do Not Disturb mode silences notifications until this app is allowed through.',
  'help.step.dndAccess': 'Allow Do Not Disturb access',
  'help.q.quiet': 'Why is the athan so quiet?',
  'help.a.quiet': 'It plays at alarm volume, not ring volume.',
  'help.step.alarmVolume': 'Raise the Alarm volume in your sound settings',
  'help.q.cutoff': 'Why does the athan cut off early?',
  'help.a.cutoff': 'Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.',
  'help.action.dndAccess': 'Grant Do Not Disturb access',

  'whatsNew.title.tabletSupport': 'Tablet support',
  'whatsNew.body.tabletSupport': 'Athan now supported on tablets',
  'whatsNew.title.athanSounds': 'Athan sounds',
  'whatsNew.body.athanSounds': 'New Athan sounds added',
  'whatsNew.title.reminderSounds': 'Reminder sounds',
  'whatsNew.body.reminderSounds': 'Every reminder now has its own sound',
  'whatsNew.title.widgets': 'Home & Lock widgets',
  'whatsNew.body.widgets': 'Add prayer times to your Home and Lock Screen',
  'whatsNew.title.secondReminder': 'A second reminder',
  'whatsNew.body.secondReminder': 'Each prayer can now carry two reminders, each with its own sound and timing',
  'whatsNew.title.helpPage': 'Help page',
  'whatsNew.body.helpPage': 'Settings now answers why an athan was not heard, and opens the setting that caused it',
  'whatsNew.title.qiblaCompass': 'Qibla compass',
  'whatsNew.body.qiblaCompass':
    'Turn until it vibrates: the compass taps once when you face Makkah, so nothing needs reading',

  'notification.now': '{name} now',
  'notification.reminder': '{name} in {n}m',

  'sheet.closeToSave': 'Close to save',

  'alert.card.athan': 'Athan',
  'alert.card.athanHint': 'Notification at prayer time',
  'alert.reminder': 'Reminder {n}',
  'alert.reminderHint': 'Notification before prayer time',
  'alert.option.off': 'Off',
  'alert.option.silent': 'Silent',
  'alert.option.sound': 'Sound',
  'alert.unavailable':
    "This prayer's time isn't available\nright now, so no alert will go off.\n\nYour alert setting is kept and will\nreturn once a time is available.",
  'reminder.sound': 'Sound',
  'reminder.before': 'Before',
  'reminder.unitMinutes': 'min',
  'stepper.value': '{value} {unit}',
  'stepper.decrease': 'Decrease to {value} {unit}',
  'stepper.increase': 'Increase to {value} {unit}',

  'sound.title': 'Select Athan',
  'sound.notificationSound': 'Notification sound',
  'soundItem.athan': 'Athan {n}',
  'soundItem.preview': 'Preview {name}',
  'soundItem.stopPreview': 'Stop previewing {name}',

  'colorPicker.label': 'Countdown bar color',
  'colorPicker.resetLabel': 'Reset to the default colour',
  'colorPicker.reset': 'Reset',
  'colorPicker.cancel': 'Cancel',
  'colorPicker.title': 'Select Color',
  'colorPicker.done': 'Done',

  'qibla.title': 'Qibla',
  'qibla.calibrationHeadline': 'Wake up the compass',
  'qibla.calibrationMessage': 'Move your phone like this',
  'qibla.lostTitle': 'Could not find north',
  'qibla.lostMessage': 'Please try standing in a different location',
  'qibla.subtitleWaiting': 'Follow below instructions',
  'qibla.subtitleReady': 'Hold flat and turn slowly',
  'qibla.permissionDenied':
    'The qibla is worked out from where you are, so it needs location access. Turn it on in Settings, then open this sheet again.',
  'qibla.openSettingsLabel': 'Open settings',
  'qibla.openSettings': 'Open Settings',

  'modal.close': 'Close',
  'help.title': 'Help',
  'whatsNew.heading': "What's New",
  'whatsNew.platformNote': ' ({platform} only)',
  'update.title': 'Update Available!',
  'update.message': 'A new version is available.\nWould you like to update now?',
  'update.later': 'Later',
  'update.update': 'Update',

  'overlay.closeDetails': 'Close prayer details',
  'day.location': 'London, UK',
  'settingsButton.label': 'Settings',
  'countdown.progressA11y': 'Prayer countdown: {percent} percent remaining',
  'countdown.waitingLabel': 'No prayer time to count down to',
  'error.heading': ' Oh no! ',
  'error.body': ' Something went wrong. ',
  'error.hint': ' Try refreshing! ',
  'error.refresh': ' Refresh ',
  'prayerAlert.notification': '{name} notification: {state}',
  'prayerAlert.state.off': 'off',
  'prayerAlert.state.silent': 'silent',
  'prayerAlert.state.sound': 'sound',
  'prayerAlert.state.unavailable': 'unavailable',
  'prayerAlert.hintUnavailable': 'Explains why no alert can be set for this prayer',
  'prayerAlert.hintOpen': 'Opens the alert options for this prayer',

  'extras.explanation.midnight': 'Halfway between Magrib and Fajr',
  'extras.explanation.last third': 'Start of the last third of the night',
  'extras.explanation.suhoor': '20 mins before Fajr',
  'extras.explanation.duha': '20 mins after Sunrise',
  'extras.explanation.istijaba': '1 hour before Magrib (Fridays only)',

  'duration.h': 'h',
  'duration.m': 'm',
  'duration.s': 's',
  'duration.now': 'now',
  'time.now': '{name} now',
  'time.ago': '{name} {duration} ago',

  'channel.athan': 'Athan {n}',
  'channel.extras': 'Extra Times',

  'app.loadingLabel': 'Loading prayer times',
  'qibla.locationTitle': 'Enable Location',
  'qibla.locationMessage':
    'The qibla is worked out from where you are, so it needs location access. Would you like to enable it in settings?',
  'dialog.cancel': 'Cancel',
  'dialog.openSettings': 'Open Settings',
  'notifications.enableTitle': 'Enable Notifications',
  'notifications.enableMessage': 'Prayer time notifications are disabled. Would you like to enable them in settings?',

  'widget.stale': 'Out of date',
  'widget.refresh': 'Open Athan to refresh',
  'widget.refreshLead': 'Open Athan',
  'widget.refreshTail': 'to refresh',
} as const satisfies Record<string, string>;

export type TranslationKey = keyof typeof en;

/** The shape every locale's catalog must satisfy: the en key set, values translated */
export type Catalog = Record<TranslationKey, string>;

/**
 * Prayer labels resolved from the catalog's own members, so display never re-authors a name
 * and a label cannot drift from its catalog entry
 */
export const PRAYER_LABELS: Record<PrayerId, string> = {
  fajr: en['prayer.fajr'],
  sunrise: en['prayer.sunrise'],
  dhuhr: en['prayer.dhuhr'],
  asr: en['prayer.asr'],
  magrib: en['prayer.magrib'],
  isha: en['prayer.isha'],
  midnight: en['prayer.midnight'],
  'last third': en['prayer.last third'],
  suhoor: en['prayer.suhoor'],
  duha: en['prayer.duha'],
  istijaba: en['prayer.istijaba'],
};
