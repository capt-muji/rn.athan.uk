/**
 * The widgets' minute re-push after a native push that runs past the prayer it was counting down to
 */

import { london, saveLondonDays } from '@/hooks/__tests__/londonDays';
import { refreshPrayerWidgets } from '@/stores/widget';
import { PrayerWidget } from '@/widgets/PrayerWidget';

// Every widget push returns at once while the widgets flag is off, which is how the app ships
jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: true } }));

const PUSH_STARTS_BEFORE_DHUHR_MS = 400;
const RETRY_MS = 60_000;

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  // The unit project does not clear mocks, so an implementation queued by a row that failed early would run in the next
  jest.mocked(PrayerWidget.updateTimeline).mockReset();
});

describe('the Standard widgets on Friday 11 September 2026, pushed 400 ms before Dhuhr at 13:02', () => {
  // where the native push ends, and how far past Dhuhr that is in ms
  it.each([
    // With no time left, a minute-flip delay and the retry are both one minute, apart from LABEL_FLIP_EPSILON_MS: this
    // row tells the passed-target check from its absence only through that epsilon, and a zero epsilon would hide it
    ['at the moment of Dhuhr', 0],
    ['100 ms after Dhuhr', 100],
  ])('pushes again a minute after a native push that ends %s', async (_end, pastMs) => {
    const dhuhr = london('2026-09-11', '13:02').getTime();
    jest.useFakeTimers({ now: dhuhr - PUSH_STARTS_BEFORE_DHUHR_MS });
    saveLondonDays();
    const pushedAt: number[] = [];
    jest
      .mocked(PrayerWidget.updateTimeline)
      .mockImplementationOnce(() => {
        pushedAt.push(Date.now());
        jest.setSystemTime(dhuhr + pastMs);
      })
      .mockImplementationOnce(() => {
        pushedAt.push(Date.now());
      });

    await refreshPrayerWidgets();
    await jest.advanceTimersByTimeAsync(90_000);

    expect(pushedAt).toEqual([dhuhr - PUSH_STARTS_BEFORE_DHUHR_MS, dhuhr + pastMs + RETRY_MS]);
  });
});
