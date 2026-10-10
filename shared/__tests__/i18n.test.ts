/**
 * The en catalog's own gates
 *
 * Byte parity: every member's value is pinned to the literal it replaced, so a catalog edit
 * that drifts one byte fails here before any screen ships it. The closure and join tests keep
 * the prayer labels exactly on the frozen id vocabulary: a new id without a label, or a label
 * that stops matching its title-case array slot, cannot join silently. The plural guard is
 * the deliberate-decision record: Hermes ships no Intl.PluralRules, so no plural construct
 * may enter the catalog until a remedy is chosen (R16).
 */

import { EXTRA_PRAYER_TITLES, PRAYER_IDS, STANDARD_PRAYER_TITLES } from '@/shared/constants';
import { en, PRAYER_LABELS, prayerLabel, t } from '@/shared/i18n';

/** Every catalog member as a (key, literal) pair, byte-identical to the pre-catalog source */
const PINNED_LITERALS: ReadonlyArray<[keyof typeof en, string]> = [
  ['prayer.fajr', 'Fajr'],
  ['prayer.sunrise', 'Sunrise'],
  ['prayer.dhuhr', 'Dhuhr'],
  ['prayer.asr', 'Asr'],
  ['prayer.magrib', 'Magrib'],
  ['prayer.isha', 'Isha'],
  ['prayer.midnight', 'Midnight'],
  ['prayer.last third', 'Last Third'],
  ['prayer.suhoor', 'Suhoor'],
  ['prayer.duha', 'Duha'],
  ['prayer.istijaba', 'Istijaba'],

  ['settings.title', 'Settings'],
  ['settings.showSeconds', 'Show seconds'],
  ['settings.showTimePassed', 'Show time passed'],
  ['settings.showDecorations', 'Show decorations'],
  ['settings.countdownBar', 'Countdown Bar'],
  ['settings.showCountdownBar', 'Show countdown bar'],
  ['settings.other', 'Other'],
  ['settings.whatsNew', "What's new"],
  ['settings.help', 'Help'],
  ['settings.subtitle', 'Set your preferences'],
  ['settings.prayer', 'Prayer'],
  ['settings.changeAthan', 'Change athan'],
  ['settings.qibla', 'Qibla'],
  ['settings.display', 'Display'],
  ['settings.showHijriDate', 'Show hijri date'],
  ['settings.whatsNewLabel', 'What’s new'],

  ['help.q.none', "Why don't I get any notifications?"],
  ['help.a.none', 'Without permission, notifications cannot be shown.'],
  ['help.step.allowNotificationsIos', 'Turn on Allow Notifications in the app settings'],
  ['help.step.allowNotificationsAndroid', 'Turn on notifications in the app settings'],
  ['help.step.leaveAthanCategories', 'Leave the athan categories on'],
  ['help.q.stopAfterDays', 'Why did notifications stop after a few days?'],
  ['help.a.stopAfterDays.ios', 'Two settings stop new notifications being sent.'],
  ['help.step.backgroundRefresh', 'Turn on Background App Refresh in the app settings'],
  ['help.step.lowPowerMode', 'Turn off Low Power Mode'],
  ['help.a.stopAfterDays.android', 'Battery optimisation stops new notifications being sent.'],
  ['help.step.batteryUnrestricted', 'Set battery usage to Unrestricted in the app settings'],
  ['help.step.batterySaver', 'Turn off Battery Saver'],
  ['help.q.stopAfterRestart', 'Why did notifications stop after a restart?'],
  [
    'help.a.stopAfterRestart',
    'After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.',
  ],
  ['help.step.openAfterReboot', 'Open this app after rebooting the phone'],
  ['help.q.noSound', 'Why does a notification show but play no sound?'],
  ['help.a.noSound', 'A silent phone mutes notification sound.'],
  ['help.step.silentMode', 'Take the phone out of silent mode'],
  ['help.q.dndTimes', 'Why are notifications silenced at certain times?'],
  ['help.a.dndTimes.ios', 'Focus and Do Not Disturb modes silence notifications until this app is allowed through.'],
  ['help.step.timeSensitive', 'Allow Time Sensitive Notifications in the app settings'],
  ['help.step.focusAllow', 'Allow this app in each Focus you use'],
  ['help.a.dndTimes.android', 'Do Not Disturb mode silences notifications until this app is allowed through.'],
  ['help.step.dndAccess', 'Allow Do Not Disturb access'],
  ['help.q.quiet', 'Why is the athan so quiet?'],
  ['help.a.quiet', 'It plays at alarm volume, not ring volume.'],
  ['help.step.alarmVolume', 'Raise the Alarm volume in your sound settings'],
  ['help.q.cutoff', 'Why does the athan cut off early?'],
  ['help.a.cutoff', 'Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.'],
  ['help.action.dndAccess', 'Grant Do Not Disturb access'],

  ['whatsNew.title.tabletSupport', 'Tablet support'],
  ['whatsNew.body.tabletSupport', 'Athan now supported on tablets'],
  ['whatsNew.title.athanSounds', 'Athan sounds'],
  ['whatsNew.body.athanSounds', 'New Athan sounds added'],
  ['whatsNew.title.reminderSounds', 'Reminder sounds'],
  ['whatsNew.body.reminderSounds', 'Every reminder now has its own sound'],
  ['whatsNew.title.widgets', 'Home & Lock widgets'],
  ['whatsNew.body.widgets', 'Add prayer times to your Home and Lock Screen'],
  ['whatsNew.title.secondReminder', 'A second reminder'],
  ['whatsNew.body.secondReminder', 'Each prayer can now carry two reminders, each with its own sound and timing'],
  ['whatsNew.title.helpPage', 'Help page'],
  ['whatsNew.body.helpPage', 'Settings now answers why an athan was not heard, and opens the setting that caused it'],
  ['whatsNew.title.qiblaCompass', 'Qibla compass'],
  [
    'whatsNew.body.qiblaCompass',
    'Turn until it vibrates: the compass taps once when you face Makkah, so nothing needs reading',
  ],
];

describe('the en catalog', () => {
  it("pins the en catalog bytes to today's literals", () => {
    for (const [key, literal] of PINNED_LITERALS) {
      expect(t(key)).toBe(literal);
    }
  });

  it('holds no plural construct in any catalog value', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value).not.toMatch(/\{count,|\{n,|<plural|other\}/);
      expect(key.endsWith('_one')).toBe(false);
      expect(key.endsWith('_other')).toBe(false);
    }
  });
});

describe('PRAYER_LABELS', () => {
  it('closes the prayer labels over exactly the eleven ids, injectively', () => {
    expect(Object.keys(PRAYER_LABELS).sort()).toEqual([...PRAYER_IDS].sort());
    expect(new Set(Object.values(PRAYER_LABELS)).size).toBe(PRAYER_IDS.length);
  });

  it('joins every catalog prayer label to the frozen vocabulary', () => {
    PRAYER_IDS.forEach((id, index) => {
      const title =
        index < STANDARD_PRAYER_TITLES.length
          ? STANDARD_PRAYER_TITLES[index]
          : EXTRA_PRAYER_TITLES[index - STANDARD_PRAYER_TITLES.length];
      expect(prayerLabel(id)).toBe(title);
    });
  });
});
