/**
 * The time on a prayer row: its own, the next day's while the overlay shows the row once it has passed, and --:-- when unreadable
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import PrayerTime from '../Time';

const SUNRISE = 1;
const DHUHR = 2;
const ASR = 3;
const MIDNIGHT = 0;
const SUHOOR = 2;
const DUHA = 3;

describe('a row before Fajr on Friday 11 September 2026 at 03:00', () => {
  // [row, schedule, index, the time it shows]
  it.each<[string, ScheduleType, number, string]>([
    ['Sunrise', ScheduleType.Standard, SUNRISE, '06:26'],
    ['Duha', ScheduleType.Extra, DUHA, '06:46'],
  ])('shows %s at its own time', async (_row, type, index, time) => {
    showLondonDay('2026-09-11', '03:00');

    await render(<PrayerTime type={type} index={index} />);

    expect(screen.getByText(time)).toBeOnTheScreen();
  });
});

describe('a row on Friday 11 September 2026 at 14:00 whose time could not be read', () => {
  // [row, schedule, index, times sent unreadably or days not stored]
  it.each<[string, ScheduleType, number, Parameters<typeof showLondonDay>[2]]>([
    ['Asr, sent unreadably', ScheduleType.Standard, ASR, { '2026-09-11': ['asr'] }],
    ['Dhuhr, on a day not stored', ScheduleType.Standard, DHUHR, { '2026-09-11': 'not stored' }],
    [
      "Midnight, worked out from the day before's unreadable Magrib",
      ScheduleType.Extra,
      MIDNIGHT,
      { '2026-09-10': ['magrib'] },
    ],
  ])('shows --:-- for %s', async (_row, type, index, breakage) => {
    showLondonDay('2026-09-11', '14:00', breakage);

    await render(<PrayerTime type={type} index={index} />);

    expect(screen.getByText('--:--')).toBeOnTheScreen();
  });
});

// An unreadable Fajr dashes Midnight, Last Third and Suhoor alike, so Suhoor is drawn beside a readable Duha: a row
// reading any index but its own would then show the wrong one of the two
describe('the Suhoor and Duha rows on Friday 11 September 2026 at 14:00, with Fajr unreadable', () => {
  it('shows --:-- for Suhoor, worked out from the unreadable Fajr, and Duha at its own time', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': ['fajr'] });

    await render(
      <>
        <PrayerTime type={ScheduleType.Extra} index={SUHOOR} />
        <PrayerTime type={ScheduleType.Extra} index={DUHA} />
      </>
    );

    expect(screen.getByText('--:--')).toBeOnTheScreen();
    expect(screen.getByText('06:46')).toBeOnTheScreen();
  });
});

// Not Fajr, index 0, which the overlay holds as its selection before it is first opened, and not Dhuhr, whose
// Saturday time is Friday's
describe('the passed Sunrise row on Friday 11 September 2026 at 14:00, once the overlay is opened on it', () => {
  it("shows Saturday's Sunrise", async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Standard} index={SUNRISE} />);

    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));

    expect(screen.getByText('06:28')).toBeOnTheScreen();
  });

  it("shows --:-- when Saturday's Sunrise could not be read", async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-12': ['sunrise'] });
    await render(<PrayerTime type={ScheduleType.Standard} index={SUNRISE} />);

    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));

    expect(screen.getByText('--:--')).toBeOnTheScreen();
  });
});
