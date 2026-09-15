/**
 * The countdown bar: what a screen reader hears of the time left, when it announces urgently, and when it hides
 */

import { act, render, screen } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { type Breakage, london, showLondonDay } from '@/__tests__/harness';
import { ScheduleType } from '@/shared/types';
import { checkOverlayBoundary, resyncCountdowns, startCountdowns } from '@/stores/countdown';
import { openOverlay } from '@/stores/overlay';
import { bumpResync } from '@/stores/ui';

import Bar from '../Bar';

const ASR = 3;

/** The bar as a screen reader finds it, by the share of the gap it names */
const barReading = (percent: number, options: { includeHiddenElements?: boolean } = {}) =>
  screen.getByRole('progressbar', { name: `Prayer countdown: ${percent} percent remaining`, ...options });

/** The three calls device/listeners.ts makes when the app returns to the foreground */
const returnToForeground = () => {
  checkOverlayBoundary();
  resyncCountdowns();
  bumpResync();
};

describe('the Standard bar on Friday 11 September 2026, between Dhuhr at 13:02 and Asr at 16:29', () => {
  it('tells a screen reader the share of the gap to Asr still to run, at 14:00', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Bar type={ScheduleType.Standard} />);

    expect(barReading(72)).toBeVisible();
  });

  it('reads 71 percent after a minute of ticks, rendered once a second', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();
    await render(<Bar type={ScheduleType.Standard} />);

    for (let second = 0; second < 60; second += 1) {
      await act(() => jest.advanceTimersByTime(1000));
    }

    expect(barReading(71)).toBeVisible();
  });

  // [London time, how a screen reader is told of changes]
  it.each([
    ['16:08', 'none'],
    ['16:09', 'assertive'],
  ])('at %s, with the last tenth of the gap starting at 16:08:18, announces changes as %s', async (time, region) => {
    showLondonDay('2026-09-11', time);

    await render(<Bar type={ScheduleType.Standard} />);

    expect(barReading(10)).toHaveProp('accessibilityLiveRegion', region);
  });

  it('starts announcing urgently when the bar crosses into its last tenth on screen', async () => {
    showLondonDay('2026-09-11', '16:08');
    startCountdowns();
    await render(<Bar type={ScheduleType.Standard} />);

    await act(() => jest.advanceTimersByTime(60_000));

    expect(barReading(10)).toHaveProp('accessibilityLiveRegion', 'assertive');
  });

  it('refills to 100 percent and stops announcing urgently the moment Asr comes', async () => {
    showLondonDay('2026-09-11', '16:28');
    startCountdowns();
    await render(<Bar type={ScheduleType.Standard} />);

    await act(() => jest.advanceTimersByTime(59_000));
    await act(() => jest.advanceTimersByTime(1000));

    expect(barReading(100)).toHaveProp('accessibilityLiveRegion', 'none');
  });

  // Pins only that the snap branch runs with Reduce Motion on and still reports the refill: Reanimated's published
  // mock finishes every timing at once, so a snap and an animation leave the same width
  it('crosses Asr straight to 100 percent with Reduce Motion on', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    showLondonDay('2026-09-11', '16:28');
    startCountdowns();
    await render(<Bar type={ScheduleType.Standard} />);

    await act(() => jest.advanceTimersByTime(59_000));
    await act(() => jest.advanceTimersByTime(1000));

    expect(barReading(100)).toHaveProp('accessibilityLiveRegion', 'none');
  });

  it('reads the true share at once on a return to the foreground after an hour suspended', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();
    await render(<Bar type={ScheduleType.Standard} />);

    // A suspended app runs no timers, so the clock moves on without a single tick
    jest.setSystemTime(london('2026-09-11', '15:00'));
    await act(() => returnToForeground());

    expect(barReading(43)).toBeVisible();
  });

  it('is not drawn under the overlay', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Bar type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, ASR));

    expect(barReading(72, { includeHiddenElements: true })).not.toBeVisible();
  });

  // [situation, London date, London time, times sent unreadably or days not stored]
  it.each<[string, string, string, Breakage]>([
    ['while Dhuhr, the row above Asr, has no readable time', '2026-09-11', '14:00', { '2026-09-11': ['dhuhr'] }],
    ['once no readable prayer is left to count to', '2026-09-12', '21:00', {}],
  ])('hides from sight and from a screen reader %s', async (_situation, date, time, breakage) => {
    showLondonDay(date, time, breakage);

    await render(<Bar type={ScheduleType.Standard} />);

    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { includeHiddenElements: true })).not.toBeVisible();
  });
});

describe("the colour picker's preview of the bar, on Friday 11 September 2026", () => {
  // [situation, London time, times sent unreadably]
  it.each<[string, string, Breakage]>([
    ["while the page's bar cannot be worked out", '14:00', { '2026-09-11': ['dhuhr'] }],
    ["in the page's bar's last tenth", '16:09', {}],
  ])('shows 65 percent to sight and to a screen reader, calmly, %s', async (_situation, time, breakage) => {
    showLondonDay('2026-09-11', time, breakage);

    await render(<Bar previewColor='#ff3366' previewProgress={65} scale={2.5} />);

    expect(barReading(65)).toBeVisible();
    expect(barReading(65)).toHaveProp('accessibilityLiveRegion', 'none');
  });
});
