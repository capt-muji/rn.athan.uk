/**
 * The reminder rows' control floor. Both rows carry one shared minimum, so a wide-glyph locale grows its control
 * leftward by exactly its content's excess over English while the label column yields only that excess, and English
 * itself asks for exactly the width it already has.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { type LocaleId, setActiveLocale } from '@/shared/i18n/locale';
import { AlertType } from '@/shared/types';

import ReminderCard from '../ReminderCard';

/** The row as the phone lays it out: its width is what the shared minimum is computed against */
const layOutRow = async (width: number) =>
  await fireEvent(screen.getByTestId('reminder-sound-row'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 34 } },
  });

/** One measurer text reporting its first line's width. The measurer hides from screen readers, so the
 * harness reads it back with hidden elements included - the phone measures text accessibility cannot see */
const measure = async (id: string, lines: Array<{ width: number }>) =>
  await fireEvent(screen.getByTestId(id, { hidden: true }), 'textLayout', { nativeEvent: { lines } });

/** Every measurement the card needs, with the English pair always at its own widths */
const driveMeasurements = async (active: readonly [number, number]) => {
  await measure('reminder-baseline-silent', [{ width: 28 }]);
  await measure('reminder-baseline-sound', [{ width: 40 }]);
  await measure('reminder-active-silent', [{ width: active[0] }]);
  await measure('reminder-active-sound', [{ width: active[1] }]);
};

const soundHostMinWidth = () => StyleSheet.flatten(screen.getByTestId('reminder-sound-host').props.style).minWidth;
const beforeHostMinWidth = () => StyleSheet.flatten(screen.getByTestId('reminder-before-host').props.style).minWidth;

// The row 303 wide, its label column 100 and its gap 12 leave 191 available; the English pair's widest option
// (icon 13 + gap 8 + text 40 = 61) floors every locale at 15.75 per side
const AVAILABLE = 191;
const BASELINE_CONTENT = 61;
const FLOOR = 15.75;

// Per locale: the pair's two label text widths, the widest option's content, and the minimum the rows must carry.
// Every number is the pure module's arithmetic written out: 21 + the wider text, then (content + 31.5) * 2 + 6
const LOCALE_CASES = [
  ['en', [28, 40], 61, 191],
  ['ar', [18, 16], 39, 147],
  ['hi', [44, 30], 65, 199],
  ['ms', [34, 32], 55, 179],
  ['so', [47, 48], 69, 207],
  ['th', [30, 26], 51, 171],
] as const;

const renderCard = () =>
  render(
    <ReminderCard
      title='Reminder 1'
      hint='any hint'
      reminder={{ alert: AlertType.Silent, interval: 15 }}
      sound={AlertType.Silent}
      taken={null}
      locked={false}
      onToggle={() => {}}
      onSelectSound={() => {}}
      onSelectInterval={() => {}}
    />
  );

describe('the reminder rows under each shipped locale', () => {
  it.each(LOCALE_CASES)(
    '%s carries one shared minimum that keeps every option at or above the English slack',
    async (locale, widths, content, expected) => {
      setActiveLocale(locale as LocaleId);
      try {
        await renderCard();
        await layOutRow(303);
        await driveMeasurements(widths);

        expect(soundHostMinWidth()).toBe(expected);
        expect(beforeHostMinWidth()).toBe(expected);

        // The width the row actually gives the control is the greater of today's and the minimum
        const width = Math.max(AVAILABLE, expected);
        const perSideSlack = ((width - 6) / 2 - content) / 2;
        expect(perSideSlack).toBeGreaterThanOrEqual(FLOOR);

        if (expected >= AVAILABLE) {
          // The minimum decides the width, so each option sits at exactly the floor of slack
          expect(expected - AVAILABLE).toBe(2 * (content - BASELINE_CONTENT));
          expect(perSideSlack).toBe(FLOOR);
        } else {
          expect(expected).toBeLessThan(AVAILABLE);
        }
      } finally {
        setActiveLocale('en');
      }
    }
  );
});

describe("the reminder rows' minimum under the locales the ticket names", () => {
  it("grows the Somali pair by exactly twice its content's excess over English", async () => {
    setActiveLocale('so');
    try {
      await renderCard();
      await layOutRow(303);
      await driveMeasurements([47, 48]);

      // 191 + 2 * (69 - 61): both rows, the same number
      expect(soundHostMinWidth()).toBe(207);
      expect(beforeHostMinWidth()).toBe(207);
    } finally {
      setActiveLocale('en');
    }
  });

  it('asks English for exactly the width it already has, with the label column still able to yield', async () => {
    await renderCard();
    await layOutRow(303);
    await driveMeasurements([28, 40]);

    expect(soundHostMinWidth()).toBe(191);
    expect(beforeHostMinWidth()).toBe(191);
    expect(screen.getByText('Before')).toHaveStyle({ width: 100, flexShrink: 1 });
  });

  it('never binds the minimum for a locale narrower than English', async () => {
    setActiveLocale('ar');
    try {
      await renderCard();
      await layOutRow(303);
      await driveMeasurements([18, 16]);

      // (39 + 31.5) * 2 + 6, below today's width: the row keeps what it already had
      expect(soundHostMinWidth()).toBe(147);
      expect(beforeHostMinWidth()).toBe(147);
    } finally {
      setActiveLocale('en');
    }
  });

  it('carries no minimum before anything is measured, so the first frame is today\u2019s layout', async () => {
    await renderCard();

    expect(soundHostMinWidth()).toBe(0);
    expect(beforeHostMinWidth()).toBe(0);
  });

  it('keeps the widest line each measurer ever reported', async () => {
    await renderCard();
    await layOutRow(303);
    await driveMeasurements([47, 48]);

    // Relayouts report narrower lines, and a text with no lines yet reports nothing: the maxima hold
    await measure('reminder-baseline-sound', [{ width: 5 }]);
    await measure('reminder-active-sound', [{ width: 20 }]);
    await measure('reminder-baseline-silent', []);
    await measure('reminder-active-silent', []);

    expect(soundHostMinWidth()).toBe(207);
  });
});

describe('the measurer the floor is computed from', () => {
  it('is invisible, cannot be touched and stays out of the screen reader\u2019s order', async () => {
    await renderCard();

    const measurer = screen.getByTestId('reminder-measurer', { hidden: true });
    expect(measurer).toHaveStyle({ position: 'absolute', opacity: 0 });
    expect(measurer.props.pointerEvents).toBe('none');
    // TalkBack focuses alpha-0 text; the measurer would read four phantom labels per card
    expect(measurer.props.accessibilityElementsHidden).toBe(true);
    expect(measurer.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('carries the active locale\u2019s own pair beside the English baseline', async () => {
    setActiveLocale('so');
    try {
      await renderCard();

      expect(screen.getByTestId('reminder-active-silent', { hidden: true }).props.children).toBe('Aamusan');
      expect(screen.getByTestId('reminder-active-sound', { hidden: true }).props.children).toBe('Dhawaaq');
      expect(screen.getByTestId('reminder-baseline-silent', { hidden: true }).props.children).toBe('Silent');
      expect(screen.getByTestId('reminder-baseline-sound', { hidden: true }).props.children).toBe('Sound');
    } finally {
      setActiveLocale('en');
    }
  });

  it('measures each pair at the typography the segment labels themselves draw', async () => {
    await renderCard();

    // Under en the card draws 'Sound' four ways: the row label, the segment's own label, and the
    // measurer's baseline and active copies. The measurer must match the segment, not the row label
    const sounds = screen.getAllByText('Sound', { hidden: true });
    const segment = StyleSheet.flatten(sounds[1].props.style);
    const baseline = StyleSheet.flatten(sounds[2].props.style);
    const active = StyleSheet.flatten(sounds[3].props.style);

    expect(active.fontSize).toBe(segment.fontSize);
    expect(active.fontFamily).toBe(segment.fontFamily);
    expect(baseline.fontSize).toBe(segment.fontSize);
    expect(baseline.fontFamily).toBe(segment.fontFamily);
    // The segment label style itself: ty.size(TEXT.sizeDetail - 1) in ty.familyRegular
    expect(active.fontSize).toBe(13);
    expect(active.fontFamily).toBe('Roboto-Regular');
  });
});
