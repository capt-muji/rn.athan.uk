/**
 * The language sheet (D8, D26): six native names in codepoint order, and a pick that closes
 * the sheet at once and hands the wait to the full-screen loader (ticket 86, D86.8)
 */

import { fireEvent, type RenderResult, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { act } from 'react';
import { StyleSheet } from 'react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import { london } from '@/__tests__/harness';
import { SPACING } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import * as LanguageStore from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';
import { languageSheetModalAtom } from '@/stores/ui';

import LanguageSheet from '../screens/Language';

// The convergence driver is the seam the suite freezes: a hanging driver holds the real
// commit's promise unsettled, which is the state the progress face covers
jest.mock('@/stores/notifications', () => ({
  ...jest.requireActual('@/stores/notifications'),
  rescheduleAllForLanguageChange: jest.fn(),
}));

const store = getDefaultStore();
const driverMock = jest.mocked(rescheduleAllForLanguageChange);

/** The modal a sheet handed the store when it rendered */
const renderedSheet = () => {
  const sheet = store.get(languageSheetModalAtom);
  if (!sheet) throw new Error('The sheet has not rendered');
  return sheet;
};

const SIX_NAMES = ['Bahasa Melayu', 'English', 'Soomaali', 'العربية', 'हिन्दी', 'ไทย'] as const;

// The hanging driver's release valve, armed by the busy test and fired here even
// when one of its assertions throws
let release: () => void = () => {};

// The spinner carries no role, label or text of its own, so it is counted in the
// serialized tree, the one shape every renderer agrees on
const spinnerCount = (node: ReactTestRendererJSON): number => {
  const own = node.type === 'ActivityIndicator' ? 1 : 0;
  const children = (node.children ?? []).filter((child): child is ReactTestRendererJSON => typeof child === 'object');
  return own + children.reduce((total, child) => total + spinnerCount(child), 0);
};

afterEach(async () => {
  setActiveLocale('en');
  driverMock.mockReset();
  // A failed assertion throws past the test's own release, and the hanging driver
  // would hold the scheduling queue for every test after it
  release();
  await act(async () => {});
});

describe('the language sheet, Friday 11 September 2026 at 14:00', () => {
  it('renders the six native names in codepoint order on the athan card pattern', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    // Reading each row's label from its props: the order is the assertion, and no
    // per-row query can express which came first
    const labels = screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel);
    expect(labels).toEqual([...SIX_NAMES]);
    expect(screen.getByText('Choose your language')).toBeOnTheScreen();
    const active = screen.getByRole('radio', { name: 'English' });
    expect(active.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toEqual({ selected: false });
  });

  it('dismisses at once, with no applying row and no in-sheet spinner', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    // The driver hangs exactly while the assertions run; the afterEach releases it
    driverMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    const rendered: RenderResult = await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    expect(commitSpy).toHaveBeenCalledWith('ar');
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Applying…')).not.toBeOnTheScreen();
    const tree = rendered.toJSON();
    expect(tree ? spinnerCount(tree) : 0).toBe(0);
  });

  it('swallows a rejected commit: the loader owns the wait, so the sheet has no failure face', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    jest.spyOn(LanguageStore, 'commitLanguagePreference').mockRejectedValueOnce(new Error('refused'));
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'ไทย' }));

    expect(dismiss).toHaveBeenCalledTimes(1);
    await act(async () => {});
  });

  it('closes without committing when the active locale is tapped', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    expect(commitSpy).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('seats the highlight behind the language in force once the first row is measured', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    const highlight = () => {
      const indicator = screen.getByTestId('language-list').children[0];
      if (!indicator || typeof indicator === 'string') throw new Error('The list has no highlight');
      const style = StyleSheet.flatten(indicator.props.style) as {
        opacity?: number;
        height?: number;
        transform?: { translateY: number }[];
      };
      return { isShown: style.opacity === 1, height: style.height, seat: style.transform?.[0]?.translateY ?? 0 };
    };

    expect(highlight().isShown).toBe(false);

    await fireEvent(screen.getByRole('radio', { name: 'Bahasa Melayu' }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 44 } },
    });

    expect(highlight().isShown).toBe(true);
    expect(highlight().height).toBe(44);
    // English sits second: the seat is one row and one gap below the list's top
    expect(highlight().seat).toBe(44 + SPACING.xs);
  });

  it('marks the persisted pick as the selected row when the sheet opens again', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);

    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toEqual({ selected: false });
  });
});
