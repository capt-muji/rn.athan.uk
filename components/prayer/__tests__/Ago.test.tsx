/**
 * The badge saying how long ago the prayer above next was: its words, when it shows nothing, and its fade under the overlay
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import PrayerAgo from '../Ago';

const ASR = 3;
const GAP_COLON = '\u2009\u2009:\u2009\u2009';

describe('the Standard badge on Friday 11 September 2026, after Dhuhr at 13:02', () => {
  // [London clock, the badge's sentence]
  it.each([
    ['13:05', 'Dhuhr 0\u2009\u2009:\u2009\u200903 ago'],
    ['14:00', 'Dhuhr 0\u2009\u2009:\u2009\u200958 ago'],
  ])('at %s reads "%s"', async (time, sentence) => {
    showLondonDay('2026-09-11', time);

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    expect(screen.getByText(sentence, { normalizer: (s) => s })).toBeVisible();
    expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
  });

  it('splits the duration colon with thin-space gaps under ar', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders the now badge as one node under ar, with no gap node', async () => {
    showLondonDay('2026-09-11', '13:02');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText('الآن', { exact: false })).toBeOnTheScreen();
      expect(screen.queryByText(GAP_COLON)).toBeNull();
    } finally {
      setActiveLocale('en');
    }
  });

  it('fades out while the overlay is open', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, ASR));

    expect(screen.getByText('Dhuhr 0\u2009\u2009:\u2009\u200958 ago', { normalizer: (s) => s })).not.toBeVisible();
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
  it('renders its colon at 40 percent of the badge colour and lifts four points', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    // Row 81: the colon sits 60 percent under the badge's own colour, and the badge
    // rises four points away from the settings button after the list gap's 25 percent cut
    const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
    const colonStyle = Array.isArray(colon.props.style) ? Object.assign({}, ...colon.props.style) : colon.props.style;
    expect(colonStyle.opacity).toBe(0.4);
    const badge = colon.parent;
    const badgeStyle =
      badge === null
        ? {}
        : Array.isArray(badge.props.style)
          ? Object.assign({}, ...badge.props.style)
          : badge.props.style;
    expect(badgeStyle.marginTop).toBe(-4);
  });
});
