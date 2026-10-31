/**
 * A prayer row: its names, what a tap does to the overlay, and how it hides while the overlay shows another row
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { showLondonDay } from '@/__tests__/harness';
import { COLORS } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom, overlayFadeSettledAtom } from '@/stores/atoms/overlay';
import { closeOverlay, openOverlay } from '@/stores/overlay';

import Prayer from '../Prayer';

const FAJR = 0;
const SUNRISE = 1;
const DUHA = 3;
const ISTIJABA = 4;

describe('the Sunrise row before Fajr on Friday 11 September 2026 at 03:00', () => {
  it('names the prayer once, in one language', async () => {
    showLondonDay('2026-09-11', '03:00');

    await render(<Prayer type={ScheduleType.Standard} index={SUNRISE} />);

    expect(screen.getByText('Sunrise')).toBeOnTheScreen();
    expect(screen.queryByText('الشروق')).not.toBeOnTheScreen();
  });

  it('draws no name on the frame a vanished row reports', async () => {
    showLondonDay('2026-09-11', '12:00');

    await render(<Prayer type={ScheduleType.Standard} index={6} />);

    expect(screen.queryByText('Fajr')).not.toBeOnTheScreen();
  });
});

// The wrapper the hold-then-hide needs must not shrink-wrap: a fit-content row collapses
// the time column to nothing (the 2.4.15 regression, read on the owner's phones)
describe("the row's own content box", () => {
  it('fills the row, so the time column holds its width between the name and the bell', async () => {
    showLondonDay('2026-09-11', '03:00');

    await render(<Prayer type={ScheduleType.Standard} index={SUNRISE} />);

    expect(StyleSheet.flatten(screen.getByText('Sunrise').parent!.props.style).flex).toBe(1);
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
  // The row's cut rides the veil's own progress in the worklet (step 25, the badge's pattern):
  // the drop lands the frame the veil rests at 1, and the settle flag's later rise re-renders
  // no row at all - that write was digest 5111's wave 4, a JS commit plus a deletion-heavy
  // diff inside the entrance window, and the row no longer holds a reader for it
  it('drops the hidden row inside the veil worklet while the settle flag is still down', async () => {
    showLondonDay('2026-09-11', '14:00');
    await act(() => openOverlay(ScheduleType.Standard, FAJR));
    await act(() => getDefaultStore().set(overlayFadeSettledAtom, false));

    await render(
      <>
        <Prayer type={ScheduleType.Standard} index={FAJR} />
        <Prayer type={ScheduleType.Standard} index={SUNRISE} />
      </>
    );

    const sunrise = () => screen.getByText('Sunrise', { includeHiddenElements: true });
    const wrapperStyle = () => sunrise().parent!.props.style as { display?: string }[];
    const displayEntries = () => wrapperStyle().filter((entry) => entry.display !== undefined);
    // The worklet cut is the only display owner: it says none with the flag down, and no
    // JS-settled gate entry exists behind it to flip on the flag's rise
    expect(displayEntries().map((entry) => entry.display)).toEqual(['none']);
    expect(screen.getByText('Fajr')).toBeVisible();
  });

  it('re-renders no row when the settle flag rises, the wave-four commit de-staged', async () => {
    showLondonDay('2026-09-11', '14:00');
    await act(() => openOverlay(ScheduleType.Standard, FAJR));
    await act(() => getDefaultStore().set(overlayFadeSettledAtom, false));

    await render(
      <>
        <Prayer type={ScheduleType.Standard} index={FAJR} />
        <Prayer type={ScheduleType.Standard} index={SUNRISE} />
      </>
    );
    const sunrise = () => screen.getByText('Sunrise', { includeHiddenElements: true });
    const before = JSON.stringify(sunrise().parent!.props.style);

    await act(() => getDefaultStore().set(overlayFadeSettledAtom, true));

    expect(JSON.stringify(sunrise().parent!.props.style)).toBe(before);
    expect(screen.getByText('Fajr')).toBeVisible();
  });

  it('draws Sunrise again the moment the overlay closes, from the veil ink it rested on', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(
      <>
        <Prayer type={ScheduleType.Standard} index={FAJR} />
        <Prayer type={ScheduleType.Standard} index={SUNRISE} />
      </>
    );
    await act(() => openOverlay(ScheduleType.Standard, FAJR));
    await act(() => getDefaultStore().set(overlayFadeSettledAtom, true));

    // The close's own write flips the veil target back to 0, and the row's
    // display returns with the veil lift in the worklet — the jest mock lands
    // the tween instantly, so the resting frame reads flex
    await act(() => closeOverlay());

    const sunrise = screen.getByText('Sunrise');
    expect((StyleSheet.flatten(sunrise.parent!.props.style) as { display?: string }).display).toBe('flex');
  });

  it('sinks its hidden ink toward the veil constant, through colour and never opacity', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(
      <>
        <Prayer type={ScheduleType.Standard} index={FAJR} />
        <Prayer type={ScheduleType.Standard} index={SUNRISE} />
      </>
    );
    const interpolateColor = jest.spyOn(Reanimated, 'interpolateColor');

    await act(() => openOverlay(ScheduleType.Standard, FAJR));

    // The hidden row's name, time and colon each wrap their own tween inside the veil
    // interpolation; the selected row's three stay at the undrawn end
    const veilPositions = interpolateColor.mock.calls
      .filter((call) => (call[2] as unknown as readonly string[])[1] === COLORS.gradient.overlay.veil)
      .map((call) => call[0]);
    expect(veilPositions).toEqual([0, 0, 0, 1, 1, 1]);
    expect(
      StyleSheet.flatten(screen.getByText('Sunrise', { includeHiddenElements: true }).props.style).opacity
    ).toBeUndefined();
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

    expect(screen.getByText('Sunrise', { includeHiddenElements: true }).parent!.parent!).toHaveProp(prop, hidden);
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
