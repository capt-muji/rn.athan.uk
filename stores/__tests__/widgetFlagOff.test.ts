/**
 * Disabled-flag behavior for stores/widget.ts
 *
 * With FEATURE_FLAGS.widgets false the store must be inert on iOS: pushes
 * resolve without evaluating the widget bridge (no updateTimeline calls on
 * any of the ten kinds). The enabled case in the same suite proves the
 * difference is the flag, not the fixture.
 *
 * Uses the repo's mock-prefix + require-after-reset pattern (ai/AGENTS.md
 * Testing): flags.ts reads the env at module evaluation, so each case sets
 * the variable, resets modules, and requires a consistent fresh stack in
 * the test body.
 */

import { addDays } from 'date-fns';

import type { ISingleApiResponseTransformed } from '@/shared/types';

interface WidgetStack {
  Database: typeof import('@/stores/database');
  time: typeof import('@/shared/time');
  homeMocks: typeof import('@/widgets/PrayerWidget');
  lockMocks: typeof import('@/widgets/LockPrayerWidget');
  widgetStore: typeof import('@/stores/widget');
}

const loadFreshStack = (): WidgetStack => {
  const stack = {} as WidgetStack;
  jest.resetModules();

  const RN = require('react-native');
  RN.Platform.OS = 'ios';
  stack.Database = require('@/stores/database');
  stack.time = require('@/shared/time');
  stack.homeMocks = require('@/widgets/PrayerWidget');
  stack.lockMocks = require('@/widgets/LockPrayerWidget');
  stack.widgetStore = require('@/stores/widget');

  return stack;
};

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

const seedPrayerCache = (stack: WidgetStack, days: number) => {
  const data: ISingleApiResponseTransformed[] = [];
  for (let offset = -1; offset < days; offset++) {
    const day = addDays(stack.time.createInstant(), offset);
    data.push(makeDayData(stack.time.formatDateShort(day)));
  }
  stack.Database.saveAllPrayers(data);
};

const allKinds = (stack: WidgetStack) => [...Object.values(stack.homeMocks), ...Object.values(stack.lockMocks)];

// Fake macrotasks only: the enabled push arms the store's label-flip timer,
// which re-arms per fire and would keep the worker alive forever on real
// timers. Date stays real so seeding and timeline math see the wall clock.
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['Date'] });
});

afterEach(() => {
  jest.useRealTimers();
  process.env.EXPO_PUBLIC_WIDGETS = '1';
});

describe('refreshPrayerWidgets under the widgets feature flag', () => {
  it('is inert on iOS when the flag is disabled: no kind is pushed', async () => {
    delete process.env.EXPO_PUBLIC_WIDGETS;
    const stack = loadFreshStack();
    seedPrayerCache(stack, 2);

    await expect(stack.widgetStore.refreshPrayerWidgets()).resolves.toBeUndefined();

    for (const kind of allKinds(stack)) {
      expect(kind.updateTimeline).not.toHaveBeenCalled();
    }
  });

  it('pushes all kinds on iOS when the flag is enabled', async () => {
    process.env.EXPO_PUBLIC_WIDGETS = '1';
    const stack = loadFreshStack();
    seedPrayerCache(stack, 2);

    await stack.widgetStore.refreshPrayerWidgets();

    expect(stack.homeMocks.PrayerWidget.updateTimeline).toHaveBeenCalledTimes(1);
    expect(stack.homeMocks.PrayerWidgetDark.updateTimeline).toHaveBeenCalledTimes(1);
    expect(stack.lockMocks.PrayerLockWidget.updateTimeline).toHaveBeenCalledTimes(1);
  });
});
