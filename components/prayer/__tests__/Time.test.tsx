/**
 * The time on a prayer row: its own, the next day's while the overlay shows the row once it has passed, and --:-- when unreadable
 */

import { act, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import PrayerTime from '../Time';

const SUNRISE = 1;
const DHUHR = 2;
const ASR = 3;
const MAGRIB = 4;
const MIDNIGHT = 0;
const SUHOOR = 2;
const DUHA = 3;

const COLON_COLOUR = 'rgba(160, 200, 255, 0.3)';
const NEXT_COLON_COLOUR = 'rgba(160, 200, 255, 0.45)';

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

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
  it('splits its colon into its own node, centred by margins and lifted half a point', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerTime type={ScheduleType.Extra} index={3} />);

    const colon = screen.getByText(':');
    const style = flattenStyle(colon.props.style);
    // The gap is margin-based so no text direction can unbalance it, and the glyph rides half a point high
    expect(style.marginHorizontal).toBe(3);
    expect(style.transform).toEqual([{ translateY: -1.5 }]);
  });

  it('paints the colon at the dim colour, and half as bright again on the next prayer only', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(
      <>
        <PrayerTime type={ScheduleType.Standard} index={ASR} />
        <PrayerTime type={ScheduleType.Standard} index={MAGRIB} />
      </>
    );

    // Asr is next at 14:00, so its colon brightens for the active background; Magrib's stays at the dim colour
    const colon = screen.getAllByText(':')[0];
    expect(flattenStyle(colon.props.style).color).toBe(NEXT_COLON_COLOUR);
    const upcoming = screen.getAllByText(':')[1];
    expect(flattenStyle(upcoming.props.style).color).toBe(COLON_COLOUR);
    expect(screen.getByLabelText('16:29')).toBeOnTheScreen();
    expect(screen.getByLabelText('19:28')).toBeOnTheScreen();
  });

  it('renders the unread sentinel as one node with no colon node', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': 'not stored' });
    await render(<PrayerTime type={ScheduleType.Standard} index={2} />);

    expect(screen.getByText('--:--')).toBeOnTheScreen();
    expect(screen.queryByText(':')).toBeNull();
  });
});
