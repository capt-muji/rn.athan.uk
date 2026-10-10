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
