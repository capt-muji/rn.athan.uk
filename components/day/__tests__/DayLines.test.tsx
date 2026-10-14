/**
 * The Day block's line heights: the ar clamps that keep the location and date lines from drifting apart
 */

import { render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';

import Day from '../Day';

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

describe('the location and date lines', () => {
  it('clamp their line boxes under ar, and leave English to its own metrics', async () => {
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
      // The owner's ruling, 2026-10-14: tight enough to close the ar gap, tall enough to clear the ascenders
      expect(flattenStyle(location.props.style).lineHeight).toBe(24);
      expect(dateStyle.lineHeight).toBe(27);
    } finally {
      setActiveLocale('en');
    }

    await render(<Day type={ScheduleType.Standard} />);

    const english = screen.getByText('London, UK');
    expect(flattenStyle(english.props.style).lineHeight).toBeUndefined();
  });
});
