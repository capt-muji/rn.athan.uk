/**
 * The countdown above a list: the prayer it names, the time it shows, and the bar under it
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { showLondonDay } from '@/__tests__/harness';
import { COLORS } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { startCountdowns } from '@/stores/countdown';
import { openOverlay } from '@/stores/overlay';
import { countdownBarShownAtom, showSecondsAtom } from '@/stores/ui';

import Countdown from '../Countdown';

const MAGRIB = 4;
const GAP_COLON = '\u2009:\u2009';

/**
 * Turns the bar preference on or off. The settings sheet writes it through the atom's own setter, and stores/ui.ts
 * has no setter function for it, so this is the app's own write path
 */
const setCountdownBarShown = (shown: boolean) => getDefaultStore().set(countdownBarShownAtom, shown);

describe('the Standard countdown on Friday 11 September 2026, Asr at 16:29 and Magrib at 19:28', () => {
  it('names Asr for a screen reader and counts down to it in hours and minutes, at 14:00', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByRole('text', { name: 'Asr' })).toBeOnTheScreen();
    expect(screen.getByText('02')).toBeOnTheScreen();
    expect(screen.getByText('29')).toBeOnTheScreen();
    expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
    expect(screen.queryByText('02:29')).toBeNull();
  });

  it('renders fixed-width sections with gapped colons under ar', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('02')).toBeOnTheScreen();
      expect(screen.getByText('29')).toBeOnTheScreen();
      expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
      expect(screen.queryByText('02:29')).toBeNull();
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders three sections under ar while the seconds preference is on', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    getDefaultStore().set(showSecondsAtom, true);
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('02')).toBeOnTheScreen();
      expect(screen.getAllByText(GAP_COLON, { normalizer: (s) => s })).toHaveLength(2);
    } finally {
      setActiveLocale('en');
      getDefaultStore().set(showSecondsAtom, false);
    }
  });

  it('renders the held display as one node under ar, with no sections', async () => {
    showLondonDay('2026-09-11', '21:00', { '2026-09-12': 'not stored' });
    setActiveLocale('ar');
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('--:--')).toBeOnTheScreen();
      expect(screen.queryByText(GAP_COLON)).toBeNull();
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders the colon nodes dim', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
      const style = Array.isArray(colon.props.style) ? Object.assign({}, ...colon.props.style) : colon.props.style;
      expect(style.color).toBe(COLORS.text.muted);
    } finally {
      setActiveLocale('en');
    }
  });

  it('rounds the time left up, so a countdown started 600 ms into 16:28, with 59.4 s left, reads 00:01:00 and not 00:00:59', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(600));

    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getAllByText('00')).toHaveLength(2);
    expect(screen.getByText('01')).toBeOnTheScreen();
  });

  it('holds 00:00:01, never 00:00:00, when the countdown starts half a second after Asr, before the list has moved on', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(60_500));

    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('Asr')).toBeOnTheScreen();
    expect(screen.getAllByText('00')).toHaveLength(2);
    expect(screen.getByText('01')).toBeOnTheScreen();
  });

  it('swaps to Magrib the instant Asr comes, for a countdown started 400 ms into 16:28', async () => {
    showLondonDay('2026-09-11', '16:28');
    await act(() => jest.advanceTimersByTime(400));
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => jest.advanceTimersByTime(59_600));

    expect(screen.getByText('Magrib')).toBeOnTheScreen();
    expect(screen.getByText('02')).toBeOnTheScreen();
    expect(screen.getByText('59')).toBeOnTheScreen();
  });

  it('counts down to the prayer the overlay opens on', async () => {
    showLondonDay('2026-09-11', '14:00');
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, MAGRIB));

    expect(screen.getByText('Magrib')).toBeOnTheScreen();
    expect(screen.getByText('05')).toBeOnTheScreen();
    expect(screen.getByText('28')).toBeOnTheScreen();
  });

  it('shows the bar under the countdown on a fresh install', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('removes the bar the moment the preference is turned off', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => setCountdownBarShown(false));

    expect(screen.queryByRole('progressbar', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('names no prayer after Isha while the next day is not stored, and tells a screen reader why', async () => {
    showLondonDay('2026-09-11', '21:00', { '2026-09-12': 'not stored' });
    startCountdowns();

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByLabelText('No prayer time to count down to')).toHaveTextContent('...');
    expect(screen.getByText('--:--')).toBeOnTheScreen();
  });
});

describe('the Standard countdown before any list is on screen', () => {
  it('renders nothing, so the page does not show a countdown with nothing behind it', async () => {
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.toJSON()).toBeNull();
  });
});
