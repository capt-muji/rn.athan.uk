/**
 * Android flag gate for stores/widget.ts
 *
 * Separate file: mocks androidWidgets off at module scope (matching the iOS
 * widgetFlagOff.test.ts pattern), so refreshPrayerWidgets must return
 * before any snapshot build or native call. The cache is seeded on purpose:
 * with the gate broken, a push would land on the widget mocks — an empty
 * cache would mask the gate entirely.
 */

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.android ?? options.default,
  },
}));

jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: false, androidWidgets: false } }));

import { addDays } from 'date-fns';

import { createInstant, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { refreshPrayerWidgets } from '@/stores/widget';
import {
  ExtrasWidget,
  ExtrasWidgetDark,
  ExtrasWidgetDarkMedium,
  ExtrasWidgetMedium,
  PrayerWidget,
  PrayerWidgetDark,
  PrayerWidgetDarkMedium,
  PrayerWidgetMedium,
} from '@/widgets/PrayerWidget';

describe('refreshPrayerWidgets android flag gate', () => {
  it('is a no-op with androidWidgets off: seeded cache, no pushes, no reloads', async () => {
    const now = createInstant();
    const data: ISingleApiResponseTransformed[] = [];
    for (let offset = -1; offset < 3; offset++) {
      const day = addDays(now, offset);
      data.push({
        date: formatDateShort(day),
        fajr: '03:30',
        sunrise: '05:20',
        dhuhr: '13:10',
        asr: '17:45',
        magrib: '21:15',
        isha: '22:45',
        suhoor: '05:55',
        duha: '08:10',
        istijaba: '16:00',
      });
    }
    Database.saveAllPrayers(data);

    await refreshPrayerWidgets();

    const kinds = [
      PrayerWidget,
      PrayerWidgetMedium,
      PrayerWidgetDark,
      PrayerWidgetDarkMedium,
      ExtrasWidget,
      ExtrasWidgetMedium,
      ExtrasWidgetDark,
      ExtrasWidgetDarkMedium,
    ];
    for (const kind of kinds) {
      expect(kind.updateSnapshot).not.toHaveBeenCalled();
      expect(kind.updateTimeline).not.toHaveBeenCalled();
      expect(kind.reload).not.toHaveBeenCalled();
    }
  });
});
