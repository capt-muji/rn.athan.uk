/**
 * The frozen 2026 identifier bytes: the prayer vocabulary, the keys and OS ids it derives,
 * the audio files it joins, and the legacy families it must keep reading.
 */

import fs from 'node:fs';
import path from 'node:path';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import {
  athanAndroidChannelId,
  atTimeAndroidChannelId,
  extrasAndroidChannelId,
  getReminderNotificationSound,
  isDailyPrayer,
  reminderAndroidChannelId,
} from '@/shared/notifications';
import { AlertType, ScheduleType } from '@/shared/types';
import { EXTRAS_ENGLISH_PRE_1_0_27 } from '@/stores/notifications';

const DATE = '2026-08-28';
const INTERVALS = [5, 10, 15, 20, 25, 30] as const;
const read = (rel: string) => fs.readFileSync(path.join(__dirname, '../..', rel), 'utf8');

describe('the prayer identifier contract, frozen 2026', () => {
  it('pins the eleven ids in canonical order, both arrays', () => {
    expect([...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH].map((name) => name.toLowerCase())).toEqual([
      'fajr',
      'sunrise',
      'dhuhr',
      'asr',
      'magrib',
      'isha',
      'midnight',
      'last third',
      'suhoor',
      'duha',
      'istijaba',
    ]);
  });

  it('pins the four preference-key families including both reminder slots', () => {
    const ids = [...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH].map((name) => name.toLowerCase());
    const derived = new Set<string>();
    for (const id of ids) {
      for (const type of ['standard', 'extra'] as const) {
        derived.add(`preference_alert_${type}_${id}`);
        derived.add(`preference_reminder_alert_${type}_${id}`);
        derived.add(`preference_reminder_alert_${type}_${id}_2`);
        derived.add(`preference_reminder_interval_${type}_${id}`);
        derived.add(`preference_reminder_interval_${type}_${id}_2`);
      }
    }

    for (const frozen of [
      'preference_alert_standard_fajr',
      'preference_alert_standard_magrib',
      'preference_alert_extra_istijaba',
      'preference_alert_extra_last third',
      'preference_reminder_alert_standard_isha',
      'preference_reminder_alert_extra_last third',
      'preference_reminder_alert_extra_last third_2',
      'preference_reminder_interval_standard_sunrise',
      'preference_reminder_interval_standard_dhuhr_2',
      'preference_reminder_interval_extra_istijaba_2',
    ]) {
      expect(derived.has(frozen)).toBe(true);
    }
    expect(derived.size).toBe(11 * 2 * 5);
  });

  it('pins both OS identifier builders with the space form', () => {
    expect(prayerNotificationIdentifier(ScheduleType.Extra, 'Last Third', DATE)).toBe(
      'athan_extra_last third_2026-08-28'
    );
    expect(reminderNotificationIdentifier(ScheduleType.Extra, 'Last Third', DATE, 15)).toBe(
      'reminder_extra_last third_2026-08-28_15'
    );
    expect(prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', DATE)).toBe('athan_standard_fajr_2026-08-28');
    expect(reminderNotificationIdentifier(ScheduleType.Standard, 'Fajr', DATE, 15)).toBe(
      'reminder_standard_fajr_2026-08-28_15'
    );
  });

  it('pins the Android channel ids including the underscore forms', () => {
    expect(reminderAndroidChannelId('Last Third', 15)).toBe('reminder_last_third_15_v3');
    expect(athanAndroidChannelId(0)).toBe('athan_1_v4');
    expect(extrasAndroidChannelId).toBe('extras_at_time_v3');
    expect(atTimeAndroidChannelId('Sunrise', 3)).toBe('extras_at_time_v3');
    expect(atTimeAndroidChannelId('Asr', 3)).toBe('athan_4_v4');
  });

  it('pins the channel-name formats in English', () => {
    const shared = read('shared/notifications.ts');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(shared).toContain('name: `Athan ${soundIndex + 1}`');
    expect(shared).toContain("name: 'Extra Times'");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(shared).toContain('`${englishName} in ${intervalMinutes}m Reminder`');
  });

  it('pins the daily-prayer truth table', () => {
    const table: Record<string, boolean> = {
      Fajr: true,
      Sunrise: false,
      Dhuhr: true,
      Asr: true,
      Magrib: true,
      Isha: true,
      Midnight: false,
      'Last Third': false,
      Suhoor: false,
      Duha: false,
      Istijaba: false,
    };

    for (const [name, daily] of Object.entries(table)) {
      expect(`${name}:${isDailyPrayer(name)}`).toBe(`${name}:${daily}`);
    }
  });

  it('pins one bookkeeping record key per family', () => {
    const stores = read('stores/database.ts');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(stores).toContain('`scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}`');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(stores).toContain('`scheduled_reminders_${scheduleType}_${prayerIndex}_${notification.id}`');
    const id = prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', DATE);
    expect(`scheduled_notifications_standard_0_${id}`).toBe(
      'scheduled_notifications_standard_0_athan_standard_fajr_2026-08-28'
    );
  });

  it('pins the index-keyed legacy family and its migration map', () => {
    const stores = read('stores/notifications.ts');
    expect(stores).toContain('/^preference_(alert|reminder_alert|reminder_interval)_(standard|extra)_\\d+$/');
    expect([...EXTRAS_ENGLISH_PRE_1_0_27]).toEqual(['Last Third', 'Suhoor', 'Duha', 'Istijaba']);
  });

  it('joins every id and interval to an existing audio file, and the directory holds nothing unmapped', () => {
    const dir = fs.readdirSync(path.join(__dirname, '../../assets/audio/reminders'));
    expect(dir.length).toBe(67);

    for (const name of [...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH]) {
      for (const interval of INTERVALS) {
        const file = getReminderNotificationSound(AlertType.Sound, name, interval);
        expect(typeof file).toBe('string');
        expect(dir).toContain(file as string);
      }
    }

    const mapped = new Set<string>(['reminder.mp3']);
    for (const name of [...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH]) {
      for (const interval of INTERVALS) {
        const file = getReminderNotificationSound(AlertType.Sound, name, interval);
        if (typeof file === 'string') mapped.add(file);
      }
    }
    expect(dir.filter((entry) => !mapped.has(entry))).toEqual([]);
  });
});
