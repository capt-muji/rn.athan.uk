/**
 * The Android lock card push path in stores/widget.ts.
 *
 * Separate file: the card is a surface of its own, so this pins that it
 * refreshes with the widgets flag OFF (a user may want the card and no
 * widget) and that the user's preference alone decides whether a snapshot
 * is pushed or the card is cleared.
 */

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.android ?? options.default,
  },
}));

jest.mock('@/shared/flags', () => ({
  FEATURE_FLAGS: { widgets: false, androidWidgets: false, androidLockCard: true },
}));

jest.mock('@/modules/widgetrefresh', () => ({ armWidgetRefreshChain: jest.fn(), setLockCard: jest.fn() }));

import { addDays } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { setLockCard } from '@/modules/widgetrefresh';
import { createInstant, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { lockCardEnabledAtom } from '@/stores/ui';
import { initWidgetSettingsSync, refreshPrayerWidgets } from '@/stores/widget';

const mockSetLockCard = setLockCard as jest.Mock;

const seedCache = () => {
  const days: ISingleApiResponseTransformed[] = [0, 1, 2].map((offset) => ({
    date: formatDateShort(addDays(createInstant(), offset)),
    fajr: '03:30',
    sunrise: '05:20',
    dhuhr: '13:10',
    asr: '17:45',
    magrib: '21:15',
    isha: '22:45',
    suhoor: '05:55',
    duha: '08:10',
    istijaba: '16:00',
  }));
  Database.saveAllPrayers(days);
};

describe('lock card push', () => {
  beforeEach(() => {
    mockSetLockCard.mockClear();
    seedCache();
  });

  it('pushes the snapshot when the user has the card on, despite the widgets flag being off', async () => {
    getDefaultStore().set(lockCardEnabledAtom, true);

    await refreshPrayerWidgets();

    expect(mockSetLockCard).toHaveBeenCalledTimes(1);
    const [enabled, snapshot] = mockSetLockCard.mock.calls[0];
    expect(enabled).toBe(true);
    expect(JSON.parse(snapshot as string).days.length).toBeGreaterThan(0);
  });

  it('clears the card and sends no snapshot when the user has it off', async () => {
    getDefaultStore().set(lockCardEnabledAtom, false);

    await refreshPrayerWidgets();

    expect(mockSetLockCard).toHaveBeenCalledWith(false, null);
  });

  it('clears the card rather than throwing when the prayer cache is empty', async () => {
    Database.clearPrefix('prayer_');
    getDefaultStore().set(lockCardEnabledAtom, true);

    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();

    expect(mockSetLockCard).toHaveBeenCalledWith(true, null);
  });

  it('subscribes to the preference with the widgets flag off, so the toggle acts at once', () => {
    getDefaultStore().set(lockCardEnabledAtom, false);
    initWidgetSettingsSync();
    mockSetLockCard.mockClear();

    getDefaultStore().set(lockCardEnabledAtom, true);

    expect(mockSetLockCard).toHaveBeenCalledWith(true, expect.any(String));
  });

  it('swallows a native throw, so a failed card can never break the widget refresh', async () => {
    getDefaultStore().set(lockCardEnabledAtom, true);
    mockSetLockCard.mockImplementationOnce(() => {
      throw new Error('native unavailable');
    });

    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();
  });
});
