/**
 * The badge saying how long ago the prayer above next was: its lettered words, when it shows
 * nothing, and its fade under the overlay
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { TEXT } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import PrayerAgo from '../Ago';

const ASR = 3;
const LETTER_SIZE = Math.round(TEXT.sizeDetail * 0.55);

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

describe('the Standard badge on Friday 11 September 2026, after Dhuhr at 13:02', () => {
  // [London clock, the badge's sentence with the gap spans composed in]
  it.each([
    ['13:05', 'Dhuhr 3 m ago'],
    ['14:00', 'Dhuhr 58 m ago'],
  ])('at %s reads "%s"', async (time, sentence) => {
    showLondonDay('2026-09-11', time);

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    expect(screen.getByText(sentence)).toBeVisible();
  });

  it('renders the same Latin digits and letters under ar inside the catalog words', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText('m')).toBeOnTheScreen();
      const gaps = screen.root?.queryAll(
        (node) => node.props.children === ' ' && flattenStyle(node.props.style).fontSize === 8,
        { includeSelf: true }
      );
      expect(gaps).toHaveLength(1);
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders the now sentence as one node under ar, with no letter and no gap node', async () => {
    showLondonDay('2026-09-11', '13:02');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText('الآن', { exact: false })).toBeOnTheScreen();
      expect(screen.queryByText('m')).toBeNull();
      expect(screen.queryByText('h')).toBeNull();
      const gaps = screen.root?.queryAll(
        (node) => node.props.children === ' ' && flattenStyle(node.props.style).fontSize === 8,
        { includeSelf: true }
      );
      expect(gaps).toHaveLength(0);
    } finally {
      setActiveLocale('en');
    }
  });

  it('fades out while the overlay is open', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, ASR));

    expect(screen.getByText('Dhuhr 58 m ago')).not.toBeVisible();
  });
});

describe('the Standard badge with no prayer above next to measure from', () => {
  it('shows nothing before any prayer times are stored', async () => {
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    expect(screen.toJSON()).toBeNull();
  });

  it('shows nothing before Isha on Friday 11 September 2026 when Magrib could not be read', async () => {
    showLondonDay('2026-09-11', '20:00', { '2026-09-11': ['magrib'] });

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    expect(screen.toJSON()).toBeNull();
  });
});

describe('the badge on Friday 11 September 2026, after Dhuhr at 13:02', () => {
  it('draws its letters at 55 percent of the badge size and 40 percent of its ink, and lifts four points', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    // Row 83: the letters ride the countdown's ruled typography (row 85), the ink
    // keeping the badge's own ruled weak-glyph strength (rows 79/81); row 81's lift stands
    const letter = screen.getByText('m');
    const letterStyle = flattenStyle(letter.props.style);
    expect(letterStyle.fontSize).toBe(LETTER_SIZE);
    expect(letterStyle.opacity).toBe(0.4);
    const badge = letter.parent;
    const badgeStyle =
      badge === null
        ? {}
        : Array.isArray(badge.props.style)
          ? Object.assign({}, ...badge.props.style)
          : badge.props.style;
    expect(badgeStyle.marginTop).toBe(-4);
  });

  it('separates the letter from its digits by the 2 point gap span', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    const gaps = screen.root?.queryAll(
      (node) => node.props.children === ' ' && flattenStyle(node.props.style).fontSize === 8,
      { includeSelf: true }
    );
    expect(gaps).toHaveLength(1);
  });
});
