/**
 * Platform gate for stores/widget.ts
 *
 * Separate file: overrides the react-native mock so Platform.OS is 'android'
 * — refreshPrayerWidgets must return before touching any native widget API.
 */

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.android ?? options.default,
  },
}));

import { addDays } from 'date-fns';

import { createLondonDate, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { refreshPrayerWidgets } from '@/stores/widget';
import { ExtrasLockWidget, PrayerLockWidget } from '@/widgets/LockPrayerWidget';
import { ExtrasWidget, PrayerWidget } from '@/widgets/PrayerWidget';

describe('refreshPrayerWidgets platform gate', () => {
  it('is a no-op on Android: no cache reads, no native pushes', async () => {
    const now = createLondonDate();
    const tomorrow = addDays(now, 1);
    const dayData: ISingleApiResponseTransformed = {
      date: formatDateShort(tomorrow),
      fajr: '03:30',
      sunrise: '05:20',
      dhuhr: '13:10',
      asr: '17:45',
      magrib: '21:15',
      isha: '22:45',
      midnight: '23:52',
      'last third': '02:15',
      suhoor: '05:55',
      duha: '08:10',
      istijaba: '16:00',
    };
    Database.saveAllPrayers([dayData]);

    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();

    expect(PrayerWidget.updateTimeline).not.toHaveBeenCalled();
    expect(PrayerLockWidget.updateTimeline).not.toHaveBeenCalled();
    expect(ExtrasWidget.updateTimeline).not.toHaveBeenCalled();
    expect(ExtrasLockWidget.updateTimeline).not.toHaveBeenCalled();
  });
});
