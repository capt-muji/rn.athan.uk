/**
 * The badge saying how long ago the prayer above next was: its lettered words, when it shows
 * nothing, its fade under the overlay, and its one-line pin in every shipped locale
 */

import { act, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai/vanilla';
import * as Reanimated from 'react-native-reanimated';

import { showLondonDay } from '@/__tests__/harness';
import { ANIMATION, COLORS } from '@/shared/constants';
import { tIn } from '@/shared/i18n';
import { LOCALE_IDS, setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { overlayFadeSettledAtom } from '@/stores/atoms/overlay';
import { openOverlay } from '@/stores/overlay';

import PrayerAgo, { PrayerAgoBadge } from '../Ago';

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

  it('fades toward the veil ink while the overlay is open, then drops from the tree at the fade settle', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);

    await act(() => openOverlay(ScheduleType.Standard, ASR));
    await act(() => getDefaultStore().set(overlayFadeSettledAtom, false));

    // The fade carries the ink, so the words stay drawn while it runs
    expect(screen.getByText('Dhuhr \u206658m\u2069 ago')).toBeOnTheScreen();

    await act(() => getDefaultStore().set(overlayFadeSettledAtom, true));

    expect(screen.queryByText('Dhuhr \u206658m\u2069 ago')).not.toBeOnTheScreen();
  });

  // The badge joins the veil in lockstep (T-490): the ink and the pill each wrap their own tween
  // inside a veil interpolation, so both descriptors carry the veil solid as their far end, and
  // every veil tween the badge starts rides the overlay's own 200ms clock - the pill darkening
  // with its ink is what keeps the ink from ever reading dark on a bright pill
  it('sinks its ink and its pill toward the veil solid together, on the overlay own fade clock', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<PrayerAgo type={ScheduleType.Standard} />);
    const interpolateColor = jest.spyOn(Reanimated, 'interpolateColor');
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await act(() => openOverlay(ScheduleType.Standard, ASR));

    const veilFarEnds = interpolateColor.mock.calls.filter(
      (call) => (call[2] as unknown as readonly string[])[1] === COLORS.gradient.overlay.veil
    );
    expect(veilFarEnds).toHaveLength(2);

    // The badge's three veil tweens: the ink's, the pill's and the display cut's
    const veilClocks = withTiming.mock.calls.filter(([toValue]) => toValue === 1);
    expect(veilClocks).toHaveLength(3);
    for (const [, config] of veilClocks) {
      expect((config as { duration: number }).duration).toBe(ANIMATION.duration);
    }
  });

  // The cut, mirroring the card's (T-490): the badge's animated style itself reads display none
  // once the veil progress rests at 1, before any settle flag has spoken. The first
  // display-carrying entry of the style array is the animated cut; the settle gate behind it
  // is only the resting backstop
  it('cuts its own display to none inside the veil worklet, ahead of the settle gate', async () => {
    showLondonDay('2026-09-11', '14:00');
    await act(() => openOverlay(ScheduleType.Standard, ASR));

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    const badge = screen.getByText('Dhuhr \u206658m\u2069 ago', { includeHiddenElements: true });
    const animatedDisplay = (badge.props.style as { display?: string }[]).find(
      (entry) => entry.display !== undefined
    )?.display;
    expect(animatedDisplay).toBe('none');
  });

  it('keeps the cut at flex while no veil is drawn, the overlay closed', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<PrayerAgo type={ScheduleType.Standard} />);

    const badge = screen.getByText('Dhuhr \u206658m\u2069 ago');
    const animatedDisplay = (badge.props.style as { display?: string }[]).find(
      (entry) => entry.display !== undefined
    )?.display;
    expect(animatedDisplay).toBe('flex');
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

describe('the badge pinned to one line in every shipped locale', () => {
  // Hindi wraps the badge into a cropped second line on Android when the text element goes
  // unconstrained, so the badge caps itself and every locale's sentence must survive the cap
  it.each(LOCALE_IDS)('renders the %s sentence whole on one line', async (locale) => {
    const composed = tIn(locale, 'time.ago', {
      name: tIn(locale, 'prayer.fajr'),
      duration: '\u206658m\u2069',
    });

    await render(<PrayerAgoBadge prayerAgo={composed} minutesElapsed={10} />);

    const badge = screen.getByText(composed);
    expect(badge).toBeOnTheScreen();
    expect(badge.props.numberOfLines).toBe(1);
  });
});
