/**
 * The badge saying how long ago the prayer above next was: its lettered words, when it shows
 * nothing, and its fade under the overlay
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import PrayerAgo from '../Ago';

const ASR = 3;

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

describe('the Standard badge on Friday 11 September 2026, after Dhuhr at 13:02', () => {
  // [London clock, the badge's plain sentence]
  it.each([
    ['13:05', 'Dhuhr \u20663m\u2069 ago'],
    ['14:00', 'Dhuhr \u206658m\u2069 ago'],
  ])('at %s reads "%s"', async (time, sentence) => {
    showLondonDay('2026-09-11', time);

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    expect(screen.getByText(sentence)).toBeVisible();
  });

  it('renders the isolated duration as one plain node under ar, with no styled letter', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText('الظهر قبل \u206658m\u2069')).toBeOnTheScreen();
      expect(screen.queryByText('m')).toBeNull();
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

    expect(screen.getByText('Dhuhr \u206658m\u2069 ago')).not.toBeVisible();
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
