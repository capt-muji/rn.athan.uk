/**
 * The two prayer pages: both lists in one pager, and what a swipe that settles does to an open overlay
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { onPlatform, showLondonDay } from '@/__tests__/harness';
import { perfMark, perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';
import { openOverlay } from '@/stores/overlay';

import Navigation from '../../app/Navigation';

// Swipe timings are recorded only in measurement builds, so the marks are observed instead
jest.mock('@/shared/perf');

const MAGRIB = 4;

/** A frame and the macrotask after it, which is when the Extras page and the launch chrome mount */
const FIRST_FRAME_MS = 50;

/**
 * The Standard page's location line, the only one on screen before the first frame has passed. The pager's own
 * events reach the handlers from inside the page a swipe moved
 */
const standardPage = () => screen.getByText('London, UK');

describe('the prayer pages, Friday 11 September 2026 at 14:00', () => {
  it('shows the Standard and Extras lists once the first frame has passed', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Midnight notification: off' })).toBeOnTheScreen();
  });

  // pager state
  it.each(['dragging', 'settling'])('marks the start of a swipe when the pager reports %s', async (pageScrollState) => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageScrollStateChanged', { nativeEvent: { pageScrollState } });

    expect(perfMark).toHaveBeenCalledWith('pager_swipe_start');
  });

  it('marks no swipe start when the pager comes to rest', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageScrollStateChanged', { nativeEvent: { pageScrollState: 'idle' } });

    expect(perfMark).not.toHaveBeenCalledWith('pager_swipe_start');
  });

  it('measures a swipe against the page it settled on', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageSelected', { nativeEvent: { position: 1 } });

    expect(perfMeasure).toHaveBeenCalledWith('pager_page', 'pager_swipe_start', { position: 1 });
  });

  it('closes an overlay open on the Standard list when a swipe settles on the Extras page', async () => {
    showLondonDay('2026-09-11', '14:00');
    openOverlay(ScheduleType.Standard, MAGRIB);
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageSelected', { nativeEvent: { position: 1 } });

    expect(getDefaultStore().get(overlayIsOnAtom)).toBe(false);
  });

  it('keeps an overlay open on the Standard list when a swipe settles back on the Standard page', async () => {
    showLondonDay('2026-09-11', '14:00');
    openOverlay(ScheduleType.Standard, MAGRIB);
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageSelected', { nativeEvent: { position: 0 } });

    expect(getDefaultStore().get(overlayIsOnAtom)).toBe(true);
  });

  it('shows the Standard list on Android', async () => {
    showLondonDay('2026-09-11', '14:00');
    onPlatform('android');

    await render(<Navigation />);

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
  });
});
