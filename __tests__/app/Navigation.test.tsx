/**
 * The two prayer pages and the bottom bar: both lists in one pager, what a swipe that settles does to an open
 * overlay, and the one line of dot, Settings button, dot
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onPlatform, showLondonDay } from '@/__tests__/harness';
import { SPACING } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { perfMark, perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';
import { openOverlay } from '@/stores/overlay';

import Navigation from '../../app/Navigation';

// Swipe timings are recorded only in measurement builds, so the marks are observed instead
jest.mock('@/shared/perf');

// The stand-in forwards props to a testID'd View because the pinned testing library has no
// type query and the real host overwrites the prop with its own deduction: a library upgrade
// that renames layoutDirection breaks the app while this mock keeps passing, so the mock
// covers only what Navigation itself passes
jest.mock('react-native-pager-view', () => {
  const { View } = require('react-native');
  const MockPager = (props: { children?: React.ReactNode }) => <View {...props} testID='pager' />;
  return { __esModule: true, default: MockPager };
});

const MAGRIB = 4;

/** A frame and the macrotask after it, which is when the Extras page and the launch chrome mount */
const FIRST_FRAME_MS = 50;

/**
 * The Standard page's location line, the only one on screen before the first frame has passed. The pager's own
 * events reach the handlers from inside the page a swipe moved
 */
const standardPage = () => screen.getByText('London, UK');

describe('the prayer pages, Friday 11 September 2026 at 14:00', () => {
  // The locale cases mutate module state; every later assertion reads en
  afterEach(() => {
    setActiveLocale('en');
  });

  it('shows the Standard and Extras lists once the first frame has passed', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Midnight notification: off' })).toBeOnTheScreen();
  });

  // pager state
  it.each(['dragging', 'settling'])('marks the start of a swipe when the pager reports %s', async (pageScrollState) => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageScrollStateChanged', { nativeEvent: { pageScrollState } });

    expect(perfMark).toHaveBeenCalledWith('pager_swipe_start');
  });

  it('marks no swipe start when the pager comes to rest', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageScrollStateChanged', { nativeEvent: { pageScrollState: 'idle' } });

    expect(perfMark).not.toHaveBeenCalledWith('pager_swipe_start');
  });

  it('measures a swipe against the page it settled on', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageSelected', { nativeEvent: { position: 1 } });

    expect(perfMeasure).toHaveBeenCalledWith('pager_page', 'pager_swipe_start', { position: 1 });
  });

  it('closes an overlay open on the Standard list when a swipe settles on the Extras page', async () => {
    showLondonDay('2026-09-11', '14:00');
    openOverlay(ScheduleType.Standard, MAGRIB);
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageSelected', { nativeEvent: { position: 1 } });

    expect(getDefaultStore().get(overlayIsOnAtom)).toBe(false);
  });

  it('keeps an overlay open on the Standard list when a swipe settles back on the Standard page', async () => {
    showLondonDay('2026-09-11', '14:00');
    openOverlay(ScheduleType.Standard, MAGRIB);
    await render(<Navigation />);

    await fireEvent(standardPage(), 'pageSelected', { nativeEvent: { position: 0 } });

    expect(getDefaultStore().get(overlayIsOnAtom)).toBe(true);
  });

  it('passes layoutDirection rtl to the pager under an RTL locale', async () => {
    setActiveLocale('ar');
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    expect(screen.getByTestId('pager')).toHaveProp('layoutDirection', 'rtl');
  });

  it('passes layoutDirection ltr to the pager under an LTR locale', async () => {
    setActiveLocale('en');
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    expect(screen.getByTestId('pager')).toHaveProp('layoutDirection', 'ltr');
  });

  it('shows the Standard list on Android', async () => {
    showLondonDay('2026-09-11', '14:00');
    onPlatform('android');

    await render(<Navigation />);

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
  });
});

describe('the bottom bar, Friday 11 September 2026 at 14:00', () => {
  // The safe-area mock answers 0 on every inset, so a bottom inset is driven through the provider
  const withBottomInset = (inset: number) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: inset, left: 0 },
      }}>
      <Navigation />
    </SafeAreaProvider>
  );

  // The anchor rule: the line's bottom edge is today's dots-bottom line, clear of the home indicator. iOS clamps the
  // inset up to SPACING.xl, Android adds SPACING.md to it. Columns: the platform, the bottom inset, the anchor
  it.each<[string, number, number]>([
    ['ios', 0, SPACING.xl],
    ['ios', 34, 34],
    ['android', 0, SPACING.md],
    ['android', 10, 10 + SPACING.md],
  ])('anchors the line under %s with inset %s at bottom %s', async (os, inset, anchor) => {
    showLondonDay('2026-09-11', '14:00');
    if (os === 'android') onPlatform('android');

    await render(withBottomInset(inset));

    expect(screen.getByTestId('bottom-bar')).toHaveStyle({ bottom: anchor });
  });

  // The owner's ruled arrangement: small dot, big Settings button, small dot, and nothing else on the line. The
  // dots are decorative, so they are reached as drawn elements, not through a screen reader
  it('flanks the Settings button with the two dots in order', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    expect(screen.getByTestId('bottom-bar').children).toEqual([
      screen.getByTestId('schedule-dot-0', { includeHiddenElements: true }),
      screen.getByRole('button', { name: 'Settings' }),
      screen.getByTestId('schedule-dot-1', { includeHiddenElements: true }),
    ]);
  });

  // One centred line: the dots vertically centre against the button, a small gap between neighbours
  it('lays the bar out as one centred row', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    expect(screen.getByTestId('bottom-bar')).toHaveStyle({
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    });
  });

  // Decorative dots: the pager already announces the page, so a screen reader must not hear the dots again. The
  // dots are queried as drawn elements because being hidden is exactly what they assert
  it('hides the dots from a screen reader while the Settings button stays labelled', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    expect(screen.getByTestId('schedule-dot-0', { includeHiddenElements: true })).toHaveProp(
      'accessibilityElementsHidden',
      true
    );
    expect(screen.getByTestId('schedule-dot-1', { includeHiddenElements: true })).toHaveProp(
      'accessibilityElementsHidden',
      true
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeOnTheScreen();
  });

  // The stacking is gone: the button answers to the bar row directly, with no wrapper left above it
  it('sits the Settings button directly in the bar', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Navigation />);

    expect(screen.getByRole('button', { name: 'Settings' }).parent).toBe(screen.getByTestId('bottom-bar'));
  });
});
