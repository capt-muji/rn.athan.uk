/**
 * The Day block's line boxes: the font's own metrics serve in every locale, so
 * no Arabic glyph clips and English reads exactly as it always has
 */

import { act, render, screen } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { showLondonDay } from '@/__tests__/harness';
import { SPACING } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { openOverlay } from '@/stores/overlay';

import Day from '../Day';

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

describe('the location and date lines', () => {
  it('leave the line box to the font own metrics in every locale, so no glyph clips', async () => {
    showLondonDay('2026-09-11', '14:00');

    // The styles resolve at module scope, so the ar record needs Day loaded inside the locale,
    // on this suite's own React so its hooks still run
    const sharedReact = {
      react: require('react'),
      jsx: require('react/jsx-runtime'),
      jsxDev: require('react/jsx-dev-runtime'),
    };
    let ArabicDay!: typeof Day;
    jest.isolateModules(() => {
      jest.doMock('react', () => sharedReact.react);
      jest.doMock('react/jsx-runtime', () => sharedReact.jsx);
      jest.doMock('react/jsx-dev-runtime', () => sharedReact.jsxDev);
      require('@/shared/i18n/locale').setActiveLocale('ar');
      ArabicDay = require('../Day').default;
    });
    try {
      await render(<ArabicDay type={ScheduleType.Standard} />);

      const location = screen.getByText('لندن، المملكة المتحدة');
      const lines = location.parent?.children ?? [];
      const dateStyle = flattenStyle((lines[1] as unknown as { props: { style: unknown } }).props.style);
      // The pin that measured ar against the Latin box clipped the taller face; the font's
      // own box serves everywhere now
      expect(flattenStyle(location.props.style).lineHeight).toBeUndefined();
      expect(dateStyle.lineHeight).toBeUndefined();
    } finally {
      setActiveLocale('en');
    }

    await render(<Day type={ScheduleType.Standard} />);

    const english = screen.getByText('London, UK');
    expect(flattenStyle(english.props.style).lineHeight).toBeUndefined();
  });

  it('dials the location-to-date gap to 8 points under ar', async () => {
    showLondonDay('2026-09-11', '14:00');

    const sharedReact = {
      react: require('react'),
      jsx: require('react/jsx-runtime'),
      jsxDev: require('react/jsx-dev-runtime'),
    };
    let ArabicDay!: typeof Day;
    jest.isolateModules(() => {
      jest.doMock('react', () => sharedReact.react);
      jest.doMock('react/jsx-runtime', () => sharedReact.jsx);
      jest.doMock('react/jsx-dev-runtime', () => sharedReact.jsxDev);
      require('@/shared/i18n/locale').setActiveLocale('ar');
      ArabicDay = require('../Day').default;
    });
    try {
      await render(<ArabicDay type={ScheduleType.Standard} />);

      expect(flattenStyle(screen.getByText('لندن، المملكة المتحدة').props.style).marginBottom).toBe(8);
    } finally {
      setActiveLocale('en');
    }
  });

  it('keeps the location gap at 5 points under en', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Day type={ScheduleType.Standard} />);

    expect(flattenStyle(screen.getByText('London, UK').props.style).marginBottom).toBe(SPACING.quart);
  });
});

describe("the location label's ink", () => {
  it('rests at the tuned home ink', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Day type={ScheduleType.Standard} />);

    // The static entry carries the home ink; the tween's entry commits after this frame
    const [locationStatic] = screen.getByText('London, UK').props.style as unknown[];
    expect(flattenStyle(locationStatic).color).toBe('#7485b9');
  });

  it('tweens to the overlay ink on the flag its masjid fade rides', async () => {
    showLondonDay('2026-09-11', '14:00');
    const interpolateColor = jest.spyOn(Reanimated, 'interpolateColor');
    await render(<Day type={ScheduleType.Standard} />);

    const locationTween = () =>
      interpolateColor.mock.calls
        .filter((call) => (call[2] as unknown as readonly string[]).join() === ['#7485b9', '#7173bc'].join())
        .map((call) => call[0]);

    expect(locationTween().at(-1)).toBe(0);

    await act(() => openOverlay(ScheduleType.Standard, 4));

    expect(locationTween().at(-1)).toBe(1);
  });
});
