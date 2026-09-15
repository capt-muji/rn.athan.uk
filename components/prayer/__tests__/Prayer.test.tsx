/**
 * A prayer row: its names, what a tap does to the overlay, and how it hides while the overlay shows another row
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';

import { showLondonDay } from '@/__tests__/harness';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import { openOverlay } from '@/stores/overlay';
import { showArabicNamesAtom } from '@/stores/ui';

import Prayer from '../Prayer';

const FAJR = 0;
const SUNRISE = 1;
const DUHA = 3;
const ISTIJABA = 4;

describe('the Sunrise row before Fajr on Friday 11 September 2026 at 03:00', () => {
  it('names the prayer in English and Arabic', async () => {
    showLondonDay('2026-09-11', '03:00');

    await render(<Prayer type={ScheduleType.Standard} index={SUNRISE} />);

    expect(screen.getByText('Sunrise')).toBeOnTheScreen();
    expect(screen.getByText('الشروق')).toBeOnTheScreen();
  });

  it('leaves the Arabic name out when Arabic names are turned off', async () => {
    showLondonDay('2026-09-11', '03:00');
    // Settings writes this preference through the atom itself: the store has no setter for it
    getDefaultStore().set(showArabicNamesAtom, false);

    await render(<Prayer type={ScheduleType.Standard} index={SUNRISE} />);

    expect(screen.getByText('Sunrise')).toBeOnTheScreen();
    expect(screen.queryByText('الشروق')).not.toBeOnTheScreen();
  });
});

// An Extras row that is not index 0: the overlay starts out holding the Standard list and index 0, so a row that
// opened or read the selection there would still pass on Fajr
describe('the Duha row on Friday 11 September 2026 at 12:00', () => {
  it('opens the overlay on its own list and index when tapped', async () => {
    showLondonDay('2026-09-11', '12:00');
    await render(<Prayer type={ScheduleType.Extra} index={DUHA} />);

    await fireEvent.press(screen.getByText('Duha'));

    expect(getDefaultStore().get(overlayAtom)).toEqual({
      isOn: true,
      selectedPrayerIndex: DUHA,
      scheduleType: ScheduleType.Extra,
    });
  });

  it('closes the overlay when tapped while the overlay shows it', async () => {
    showLondonDay('2026-09-11', '12:00');
    await render(<Prayer type={ScheduleType.Extra} index={DUHA} />);
    await act(() => openOverlay(ScheduleType.Extra, DUHA));

    await fireEvent.press(screen.getByText('Duha'));

    expect(getDefaultStore().get(overlayAtom)).toMatchObject({ isOn: false });
  });
});

describe('the Fajr row on Friday 11 September 2026 at 14:00', () => {
  it('gives a medium haptic when tapped', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Prayer type={ScheduleType.Standard} index={FAJR} />);

    await fireEvent.press(screen.getByText('Fajr'));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });
});

describe('the Fajr and Sunrise rows on Friday 11 September 2026 at 14:00, once the overlay is opened on Fajr', () => {
  it('hides Sunrise from sight and from a screen reader, and leaves Fajr on show', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(
      <>
        <Prayer type={ScheduleType.Standard} index={FAJR} />
        <Prayer type={ScheduleType.Standard} index={SUNRISE} />
      </>
    );

    await act(() => openOverlay(ScheduleType.Standard, FAJR));

    expect(screen.getByText('Fajr')).toBeVisible();
    expect(screen.queryByText('Sunrise')).not.toBeOnTheScreen();
    expect(screen.getByText('Sunrise', { includeHiddenElements: true })).not.toBeVisible();
  });

  // Each platform's screen reader reads only its own prop, so a row must carry both to be skipped on both
  // [screen reader, the prop it reads, the value that hides the row]
  it.each<[string, string, boolean | string]>([
    ['VoiceOver', 'accessibilityElementsHidden', true],
    ['TalkBack', 'importantForAccessibility', 'no-hide-descendants'],
  ])('tells %s to skip the Sunrise row', async (_reader, prop, hidden) => {
    showLondonDay('2026-09-11', '14:00');
    await render(
      <>
        <Prayer type={ScheduleType.Standard} index={FAJR} />
        <Prayer type={ScheduleType.Standard} index={SUNRISE} />
      </>
    );

    await act(() => openOverlay(ScheduleType.Standard, FAJR));

    expect(screen.getByText('Sunrise', { includeHiddenElements: true }).parent).toHaveProp(prop, hidden);
  });
});

describe('the Istijaba row on Friday 11 September 2026 at 20:00, with Saturday not stored', () => {
  it('leaves the overlay closed when tapped, since no later Istijaba is held for it to show', async () => {
    showLondonDay('2026-09-11', '20:00', { '2026-09-12': 'not stored' });
    await render(<Prayer type={ScheduleType.Extra} index={ISTIJABA} />);

    await fireEvent.press(screen.getByText('Istijaba'));

    expect(getDefaultStore().get(overlayAtom)).toMatchObject({ isOn: false });
  });
});
