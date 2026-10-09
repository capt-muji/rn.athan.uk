/**
 * A prayer page: what it shows on the first frame, and what the Extras page holds back until that frame has passed
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { showLondonDay } from '@/__tests__/harness';
import { ScheduleType } from '@/shared/types';
import { showTimePassedAtom } from '@/stores/ui';

import Screen from '../../app/Screen';

/** A frame and the macrotask after it, which is when launch chrome and the Extras content mount */
const FIRST_FRAME_MS = 50;

describe('a prayer page, Friday 11 September 2026 at 14:00', () => {
  it('shows the Standard countdown, date, list and time since Dhuhr on the first frame', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Screen type={ScheduleType.Standard} />);

    expect(screen.getByRole('progressbar', { name: /^Prayer countdown/ })).toBeOnTheScreen();
    expect(screen.getByText('Fri, 11 Sep 2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.getByText('Dhuhr 58m ago')).toBeOnTheScreen();
  });

  it('shows nothing on the Extras page on the first frame', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Screen type={ScheduleType.Extra} />);

    expect(screen.queryByText('Fri, 11 Sep 2026')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Midnight notification: off' })).not.toBeOnTheScreen();
  });

  it('shows the Extras countdown, date, list and time since Duha once the first frame has passed', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Screen type={ScheduleType.Extra} />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('progressbar', { name: /^Prayer countdown/ })).toBeOnTheScreen();
    expect(screen.getByText('Fri, 11 Sep 2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Midnight notification: off' })).toBeOnTheScreen();
    expect(screen.getByText('Duha 7h 14m ago')).toBeOnTheScreen();
  });

  it('leaves out the time since the last prayer when Show time passed is off', async () => {
    showLondonDay('2026-09-11', '14:00');
    // The Settings toggle writes this preference through its atom, and the store has no setter for it
    getDefaultStore().set(showTimePassedAtom, false);

    await render(<Screen type={ScheduleType.Standard} />);

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.queryByText('Dhuhr 58m ago')).not.toBeOnTheScreen();
  });
});
