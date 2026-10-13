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
const GAP_COLON = '\u2009:\u2009';

describe('the Standard badge on Friday 11 September 2026, after Dhuhr at 13:02', () => {
  // [London clock, the badge's words]
  it.each([
    ['13:05', 'Dhuhr 3m ago'],
    ['14:00', 'Dhuhr 58m ago'],
  ])('at %s reads "%s"', async (time, words) => {
    showLondonDay('2026-09-11', time);

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    expect(screen.getByText(words)).toBeVisible();
  });

  it('splits the duration colon with thin-space gaps under ar', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText(GAP_COLON)).toBeOnTheScreen();
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

    expect(screen.getByText('Dhuhr 58m ago')).not.toBeVisible();
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
