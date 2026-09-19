/**
 * The native refresh-chain arm call for stores/widget.ts
 *
 * Every Android refresh that pushes snapshots also arms the native
 * minute-refresh chain exactly once (it is per-refresh, not per-schedule),
 * the androidWidgets flag gates it like every other widget call, and the
 * iOS path never arms it. The chain itself is native (modules/widgetrefresh)
 * and device-proven; this suite pins the JS wiring only.
 */

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.android ?? options.default,
  },
}));

jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: false, androidWidgets: true } }));

jest.mock('@/modules/widgetrefresh', () => ({ armWidgetRefreshChain: jest.fn() }));

import { addDays } from 'date-fns';

import { armWidgetRefreshChain as mockArm } from '@/modules/widgetrefresh';
import { createInstant, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { refreshPrayerWidgets } from '@/stores/widget';

const makeDayData = (date: string): ISingleApiResponseTransformed => ({
  date,
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

const seedPrayerCache = () => {
  const now = createInstant();
  const data: ISingleApiResponseTransformed[] = [];
  for (const offset of [-1, 0, 1, 2]) {
    data.push(makeDayData(formatDateShort(addDays(now, offset))));
  }
  Database.saveAllPrayers(data);
};

describe('the native refresh chain arm call', () => {
  beforeEach(() => {
    // The push paths arm label-flip timers; fake like every widget suite,
    // keeping Date real for the epoch math
    jest.useFakeTimers({ doNotFake: ['Date'] });
    seedPrayerCache();
  });

  afterEach(() => {
    jest.useRealTimers();
    (mockArm as unknown as jest.Mock).mockClear();
  });

  it('arms once per refresh on Android with the flag on, not once per schedule', async () => {
    await refreshPrayerWidgets();
    expect(mockArm).toHaveBeenCalledTimes(1);
  });

  it('re-arms on every refresh', async () => {
    await refreshPrayerWidgets();
    await refreshPrayerWidgets();
    expect(mockArm).toHaveBeenCalledTimes(2);
  });

  it('survives the native arm throwing: surfaces stay best-effort', async () => {
    (mockArm as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('native module gone');
    });
    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();
    expect(mockArm).toHaveBeenCalledTimes(1);
  });

  it('never arms on iOS, whatever the flags say', async () => {
    const mockArmIos = jest.fn();
    let refreshed: Promise<void> = new Promise((resolve) => resolve());
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', select: (options: { ios?: unknown }) => options.ios },
      }));
      jest.doMock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: true, androidWidgets: true } }));
      jest.doMock('@/modules/widgetrefresh', () => ({ armWidgetRefreshChain: mockArmIos }));
      const { refreshPrayerWidgets: iosRefresh } = require('@/stores/widget') as typeof import('@/stores/widget');
      refreshed = iosRefresh();
    });
    await refreshed;
    expect(mockArmIos).not.toHaveBeenCalled();
  });
});
