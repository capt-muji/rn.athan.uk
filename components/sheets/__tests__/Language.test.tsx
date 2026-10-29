/**
 * The language sheet (D8, D26): every shipped native name in codepoint order, and a pick that closes
 * the sheet at once and hands the wait to the full-screen loader (ticket 86, D86.8)
 */

import { fireEvent, type RenderResult, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { act } from 'react';
import { StyleSheet } from 'react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import { london } from '@/__tests__/harness';
import { COLORS, SPACING } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';
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

const SHIPPED_NAMES = LANGUAGE_NAMES.map((entry) => entry.name);

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
  it('renders every shipped native name in codepoint order on the athan card pattern', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    // Reading each row's label from its props: the order is the assertion, and no
    // per-row query can express which came first
    const labels = screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel);
    expect(labels).toEqual([...SHIPPED_NAMES]);
    expect(screen.getByText('Choose your language')).toBeOnTheScreen();
    const active = screen.getByRole('radio', { name: 'English' });
    expect(active.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toEqual({ selected: false });
  });

  it('dismisses a paint after the tap, once the loader has been revealed', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    // The driver hangs exactly while the assertions run; the afterEach releases it
    driverMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    const revealSpy = jest.spyOn(LanguageStore, 'revealLanguageLoader');
    const rendered: RenderResult = await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    // The reveal is the tap's own tick, so the loader paints before anything heavy can freeze the sheet
    expect(revealSpy).toHaveBeenCalledWith('ar');
    expect(commitSpy).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledWith('ar');
    expect(dismiss).toHaveBeenCalledTimes(1);
    const tree = rendered.toJSON();
    expect(tree ? spinnerCount(tree) : 0).toBe(0);
  });

  it('swallows a rejected commit: the loader owns the wait, so the sheet has no failure face', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    jest.spyOn(LanguageStore, 'commitLanguagePreference').mockRejectedValueOnce(new Error('refused'));
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'ไทย' }));
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(dismiss).toHaveBeenCalledTimes(1);
    await act(async () => {});
  });

  it('closes without committing or revealing when the active locale is tapped', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    const revealSpy = jest.spyOn(LanguageStore, 'revealLanguageLoader');
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    expect(commitSpy).not.toHaveBeenCalled();
    expect(revealSpy).not.toHaveBeenCalled();
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

    await fireEvent(screen.getByRole('radio', { name: 'Azərbaycanca' }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 44 } },
    });

    expect(highlight().isShown).toBe(true);
    expect(highlight().height).toBe(44);
    // English sits after every Latin row that sorts before it: the seat is one row and one gap per row above
    const englishRow = SHIPPED_NAMES.indexOf('English');
    expect(highlight().seat).toBe(englishRow * 44 + englishRow * SPACING.xs);
  });

  it('marks the persisted pick as the selected row when the sheet opens again', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);

    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toEqual({ selected: false });
  });
});

describe('the language sheet rebuilt for the seventy-five (T-451)', () => {
  /** Whether a query result sits inside any scroll view: the one way to see that a node cannot scroll away */
  const insideScroll = (node: { parent: { type: string; parent: unknown } | null }) => {
    for (let parent = node.parent; parent !== null; parent = parent.parent as typeof parent) {
      if (parent.type === 'RCTScrollView') return true;
    }
    return false;
  };

  const field = () => screen.getByTestId('language-search');

  /** The props the sheet handed the modal, which its published mock keeps on the instance */
  const sheetProps = () =>
    (
      renderedSheet() as unknown as {
        props: { keyboardBehavior?: string; keyboardBlurBehavior?: string; onDismiss: () => void };
      }
    ).props;

  const rowNames = () => screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel);

  const highlight = () => {
    const indicator = screen.getByTestId('language-list').children[0];
    if (!indicator || typeof indicator === 'string') throw new Error('The list has no highlight');
    const style = StyleSheet.flatten(indicator.props.style) as {
      opacity?: number;
      height?: number;
      transform?: { translateY: number }[];
    };
    return { isShown: style.opacity === 1, seat: style.transform?.[0]?.translateY ?? 0 };
  };

  const measureFirstRow = () =>
    fireEvent(screen.getAllByRole('radio')[0], 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 44 } },
    });

  it('pins the field inside the card above the list, and the list is what scrolls', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(insideScroll(field())).toBe(false);
    expect(insideScroll(screen.getByText('Choose your language'))).toBe(false);
    expect(insideScroll(screen.getByRole('radio', { name: 'English' }))).toBe(true);
  });

  it('opens without the keyboard, asks for the search key, and dims the placeholder in the shared ink', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(field().props.autoFocus).toBeUndefined();
    expect(field().props.returnKeyType).toBe('search');
    expect(field().props.placeholder).toBe('Search languages');
    expect(field().props.placeholderTextColor).toBe(COLORS.text.muted);
    expect(sheetProps().keyboardBehavior).toBe('interactive');
    expect(sheetProps().keyboardBlurBehavior).toBe('restore');
  });

  it('puts the search glyph at the trailing edge in the dim ink, and the edge mirrors under RTL', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    const glyph = StyleSheet.flatten(screen.getByTestId('language-search-glyph').props.style);
    expect(glyph).toMatchObject({ position: 'absolute', end: SPACING.md });
    expect(glyph.left).toBeUndefined();
    expect(glyph.right).toBeUndefined();
    expect(screen.getByTestId('language-search-glyph').props.pointerEvents).toBe('none');
  });

  it('matches the endonym folded, the English name, and never the locale tag', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    await fireEvent.changeText(field(), 'espanol');
    expect(rowNames()).toEqual(['Español']);

    await fireEvent.changeText(field(), 'SPANISH');
    expect(rowNames()).toEqual(['Español']);

    await fireEvent.changeText(field(), 'turk');
    expect(rowNames()).toEqual(['Türkmençe', 'Türkçe']);

    await fireEvent.changeText(field(), 'zh-Hans');
    expect(screen.queryAllByRole('radio')).toEqual([]);
  });

  it('names the empty match in the reader’s language', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    await fireEvent.changeText(field(), 'zzz');

    expect(screen.getByText('No languages found')).toBeOnTheScreen();
  });

  it('clears the query when the sheet closes, so the next open is the whole list', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await fireEvent.changeText(field(), 'spanish');

    await act(async () => {
      sheetProps().onDismiss();
    });

    expect(field().props.value).toBe('');
    expect(screen.getAllByRole('radio')).toHaveLength(LANGUAGE_NAMES.length);
  });

  it('numbers every row with Latin digits in an absolute slot at the card’s left edge', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    const first = screen.getByText('1.');
    expect(first.props.children).toBe('1.');
    expect(screen.getByText('10.')).toBeOnTheScreen();
    expect(StyleSheet.flatten(first.parent?.props.style)).toMatchObject({ position: 'absolute', left: SPACING.md });
    // The digits read left to right inside an RTL paragraph too
    expect(StyleSheet.flatten(first.props.style)).toMatchObject({ writingDirection: 'ltr' });
  });

  it('keeps the Latin index at the same physical edge under Arabic', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);

    const first = screen.getByText('1.');
    expect(StyleSheet.flatten(first.parent?.props.style)).toMatchObject({ position: 'absolute', left: SPACING.md });
    expect(screen.getByText('12.')).toBeOnTheScreen();
  });

  it('centres the name on the card, with nothing pushing it and the index out of its way', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    const row = screen.getByRole('radio', { name: 'English' });
    expect(StyleSheet.flatten(row.props.style).alignItems).toBe('center');
    expect(StyleSheet.flatten(row.props.style).paddingStart).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByText('1.').parent?.props.style).position).toBe('absolute');
  });

  it('seats the highlight on the filtered list, and hides it when the active row is filtered out', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    act(() => setActiveLocale('tr'));
    await render(<LanguageSheet />);
    await measureFirstRow();

    await fireEvent.changeText(field(), 'turk');
    // Türkmençe keeps the first seat, Türkçe the second, so the highlight moves with its row
    expect(highlight().isShown).toBe(true);
    expect(highlight().seat).toBe(44 + SPACING.xs);

    await fireEvent.changeText(field(), 'spanish');
    expect(highlight().isShown).toBe(false);
  });

  it('commits a filtered pick at once and closes', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    driverMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    const revealSpy = jest.spyOn(LanguageStore, 'revealLanguageLoader');
    const rendered = await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');
    await fireEvent.changeText(field(), 'spanish');

    await fireEvent.press(screen.getByRole('radio', { name: 'Español' }));

    expect(revealSpy).toHaveBeenCalledWith('es');
    expect(dismiss).not.toHaveBeenCalled();
    await act(async () => {
      await jest.runAllTimersAsync();
    });
    expect(dismiss).toHaveBeenCalledTimes(1);
    const tree = rendered.toJSON();
    expect(tree ? spinnerCount(tree) : 0).toBe(0);
  });
});
