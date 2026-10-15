/**
 * The lettered countdown: the old zero-drop behaviour in every language, the
 * capital unit letters, the held display, and the bar under it
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { showLondonDay } from '@/__tests__/harness';
import { COLORS, TEXT } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { standardCountdownAtom, startCountdowns } from '@/stores/countdown';
import { closeOverlay, openOverlay } from '@/stores/overlay';
import { countdownBarShownAtom, showSecondsAtom } from '@/stores/ui';

import Countdown from '../Countdown';

const MAGRIB = 4;
const LETTER_INK = 'rgba(160, 200, 255, 0.4)';
const LETTER_SIZE = Math.round(TEXT.sizeLarge * 0.55);

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

/** Writes the countdown the display selectors format, so no ticker is needed */
const setCountdown = (timeLeft: number | null) =>
  getDefaultStore().set(standardCountdownAtom, { timeLeft, name: 'asr' });

const setSecondsPreference = (shown: boolean) => getDefaultStore().set(showSecondsAtom, shown);

describe('the lettered countdown on the Standard schedule', () => {
  it('names Asr and renders the unpadded groups with their lowercase letters, at 2h29m', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(8940);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('Asr')).toBeOnTheScreen();
    expect(screen.getByText('2 h')).toBeOnTheScreen();
    expect(screen.getByText('29 m')).toBeOnTheScreen();
    expect(screen.getByLabelText('2h 29m')).toBeOnTheScreen();
    expect(screen.queryByText('02:29')).toBeNull();
  });

  it('renders the same groups under ar, Latin digits left to right', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(8940);
    setActiveLocale('ar');
    try {
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('2 h')).toBeOnTheScreen();
      expect(screen.getByText('29 m')).toBeOnTheScreen();
      const row = screen.getByLabelText('2h 29m');
      expect(flattenStyle(row.props.style).direction).toBe('ltr');
    } finally {
      setActiveLocale('en');
    }
  });

  it('drops the hours at zero, so 42 minutes reads one group', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(2525);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('42 m')).toBeOnTheScreen();
    expect(screen.queryByText('h')).toBeNull();
  });

  it('drops zero minutes beside live hours, so a whole hour with seconds hidden reads 1H alone', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(3600);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('1 h')).toBeOnTheScreen();
    expect(screen.queryByText('m')).toBeNull();
    expect(screen.queryByText('s')).toBeNull();
  });

  it('drops zero minutes beside live hours with seconds shown, so the top of an hour reads 1H 5S', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(true);
    setCountdown(3605);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('1 h')).toBeOnTheScreen();
    expect(screen.getByText('5 s')).toBeOnTheScreen();
    expect(screen.queryByText('m')).toBeNull();
  });

  it('renders seconds alone under a minute whatever the preference forces', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(45);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('45 s')).toBeOnTheScreen();
    expect(screen.queryByText('h')).toBeNull();
    expect(screen.queryByText('m')).toBeNull();
  });

  it('drops zero seconds beside live minutes, so 9m00s reads one group', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(540);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('9 m')).toBeOnTheScreen();
    expect(screen.queryByText('s')).toBeNull();
  });

  it('renders 0S alone at the clamp, never an empty row', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(true);
    setCountdown(0);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByText('0 s')).toBeOnTheScreen();
  });

  it('drops the whole seconds group when the preference is off over ten minutes', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(8945);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.queryByText('s')).toBeNull();

    await act(() => setSecondsPreference(true));

    expect(screen.getByText('5 s')).toBeOnTheScreen();
  });

  it('draws the letters small and faint inside the digit run, the digits full brightness', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(8940);

    await render(<Countdown type={ScheduleType.Standard} />);

    const group = screen.getByText('2 h');
    const groupStyle = flattenStyle(group.props.style);
    expect(groupStyle.color).toBe(COLORS.text.primary);
    expect(groupStyle.fontVariant).toEqual(['tabular-nums']);
    expect(groupStyle.fontSize).toBe(TEXT.sizeLarge);

    const letter = screen.getByText('h');
    const letterStyle = flattenStyle(letter.props.style);
    expect(letterStyle.color).toBe(LETTER_INK);
    expect(letterStyle.fontSize).toBe(LETTER_SIZE);
  });

  it('separates each letter from its digits by the 2 point gap span', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    setCountdown(8940);

    await render(<Countdown type={ScheduleType.Standard} />);

    const gaps = screen.root?.queryAll(
      (node) => node.props.children === ' ' && flattenStyle(node.props.style).fontSize === 8,
      { includeSelf: true }
    );
    expect(gaps).toHaveLength(2);
  });

  it('holds the unavailable display as one node, and names no prayer a screen reader cannot use', async () => {
    showLondonDay('2026-09-11', '21:00', { '2026-09-12': 'not stored' });
    startCountdowns();

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByLabelText('No prayer time to count down to')).toHaveTextContent('...');
    expect(screen.getByText('--:--')).toBeOnTheScreen();
    expect(screen.queryByText('s')).toBeNull();
  });

  it('counts down to the prayer the overlay opens on', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSecondsPreference(false);
    startCountdowns();
    await render(<Countdown type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, MAGRIB));

    expect(screen.getByText('Magrib')).toBeOnTheScreen();
    expect(screen.getByText('5 h')).toBeOnTheScreen();
    expect(screen.getByText('28 m')).toBeOnTheScreen();
  });

  it('renders the current countdown while the overlay holds the page even before a list is on screen', async () => {
    await act(() => openOverlay(ScheduleType.Standard, 0));
    try {
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('10 s')).toBeOnTheScreen();
    } finally {
      await act(() => closeOverlay());
    }
  });

  it('shows the bar under the countdown and removes it the moment the preference is off', async () => {
    showLondonDay('2026-09-11', '14:00');
    setCountdown(8940);

    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();

    await act(() => getDefaultStore().set(countdownBarShownAtom, false));

    expect(screen.queryByRole('progressbar', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });
});

describe('the countdown before any list is on screen', () => {
  it('renders nothing, so the page does not show a countdown with nothing behind it', async () => {
    await render(<Countdown type={ScheduleType.Standard} />);

    expect(screen.toJSON()).toBeNull();
  });
});
