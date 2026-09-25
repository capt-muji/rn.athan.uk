/**
 * A native push that runs past the prayer it was counting down to leaves no timer behind
 */

import { london, saveLondonDays } from '@/hooks/__tests__/londonDays';
import { refreshPrayerWidgets } from '@/stores/widget';
import { PrayerWidget } from '@/widgets/PrayerWidget';

// Every widget push returns at once while the widgets flag is off, which is how the app ships
jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { iosWidgets: true } }));

const PUSH_STARTS_BEFORE_DHUHR_MS = 400;

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  // The unit project does not clear mocks, so an implementation queued by a row that failed early would run in the next
  jest.mocked(PrayerWidget.updateTimeline).mockReset();
});

describe('the Standard widgets on Friday 11 September 2026, pushed 400 ms before Dhuhr at 13:02', () => {
  // where the native push ends, and how far past Dhuhr that is in ms
  it.each([
    ['at the moment of Dhuhr', 0],
    ['100 ms after Dhuhr', 100],
  ])('pushes once and arms nothing when the native push ends %s', async (_end, pastMs) => {
    const dhuhr = london('2026-09-11', '13:02').getTime();
    jest.useFakeTimers({ now: dhuhr - PUSH_STARTS_BEFORE_DHUHR_MS });
    saveLondonDays();
    const pushedAt: number[] = [];
    jest.mocked(PrayerWidget.updateTimeline).mockImplementation(() => {
      pushedAt.push(Date.now());
      jest.setSystemTime(dhuhr + pastMs);
    });

    await refreshPrayerWidgets();
    await jest.advanceTimersByTimeAsync(90_000);

    // Overrunning the target used to arm a retry a minute out. Nothing is armed
    // now: the next push rides data (sync, reschedule, background task), never a
    // clock, because each one costs a WidgetKit reload per kind (ISSUES.md §G.1)
    expect(pushedAt).toEqual([dhuhr - PUSH_STARTS_BEFORE_DHUHR_MS]);
  });
});
