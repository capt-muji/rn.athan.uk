/**
 * The time on a prayer row: its own, the next day's while the overlay shows the row once it has passed, and --:-- when unreadable
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import PrayerTime from '../Time';

const GAP_COLON = '\u2009\u2009:\u2009\u2009';
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

    expect(screen.getByLabelText(time)).toBeOnTheScreen();
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
    expect(screen.getByLabelText('06:46')).toBeOnTheScreen();
  });

  it('renders the row time with Latin digits under ar, and the unread sentinel stays ASCII', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': ['fajr'] });
    setActiveLocale('ar');
    try {
      await render(
        <>
          <PrayerTime type={ScheduleType.Extra} index={SUHOOR} />
          <PrayerTime type={ScheduleType.Extra} index={DUHA} />
        </>
      );

      expect(screen.getByLabelText('06:46')).toBeOnTheScreen();
      expect(screen.getByText('--:--')).toBeOnTheScreen();
    } finally {
      setActiveLocale('en');
    }
  });
});

// Not Fajr, index 0, which the overlay holds as its selection before it is first opened, and not Dhuhr, whose
// Saturday time is Friday's
describe('the passed Sunrise row on Friday 11 September 2026 at 14:00, once the overlay is opened on it', () => {
  it("shows Saturday's Sunrise", async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Standard} index={SUNRISE} />);

    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));

    expect(screen.getByLabelText('06:28')).toBeOnTheScreen();
  });

  it("shows --:-- when Saturday's Sunrise could not be read", async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-12': ['sunrise'] });
    await render(<PrayerTime type={ScheduleType.Standard} index={SUNRISE} />);

    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));

    expect(screen.getByText('--:--')).toBeOnTheScreen();
  });
});

describe('the readable row time on Friday 11 September 2026 at 14:00', () => {
  it('splits its colon into a gap node at two thin spaces per side', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Extra} index={3} />);

    expect(screen.getByText(GAP_COLON, { normalizer: (s) => s })).toBeOnTheScreen();
  });

  it('renders the split colon at 40 percent of its digits, and labels the whole time', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Extra} index={3} />);

    // Row 81: the colon sits 60 percent under its own row's digits, whichever state the row is in
    const colon = screen.getByText(GAP_COLON, { normalizer: (s) => s });
    const style = Array.isArray(colon.props.style) ? Object.assign({}, ...colon.props.style) : colon.props.style;
    expect(style.opacity).toBe(0.4);
    expect(screen.getByLabelText('06:46')).toBeOnTheScreen();
  });

  it('renders the unread sentinel as one node with no gap node', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': 'not stored' });
    await render(<PrayerTime type={ScheduleType.Standard} index={2} />);

    expect(screen.getByText('--:--')).toBeOnTheScreen();
    expect(screen.queryByText(GAP_COLON)).toBeNull();
  });
});
