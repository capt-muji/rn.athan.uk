/**
 * The language wheel (T-476): the list settles row by row on the centreline, a faint band in the dim
 * family rides the centre row while the purple stays on the locale in force, the sheet opens with that
 * locale centred, and everything T-451 built — the pinned search, the numbered centred rows, the
 * keyboard work and RTL — still holds over the wheel
 */

import { fireEvent, type RenderResult, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { act } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import { insideScroll, london } from '@/__tests__/harness';
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

// The published mock maps BottomSheetTextInput onto the plain TextInput, so the two read
// the same in a rendered tree: this tag keeps the library's own input findable, which is
// what the pin below hangs on
jest.mock('@gorhom/bottom-sheet', () => ({
  ...jest.requireActual('@gorhom/bottom-sheet/mock'),
  BottomSheetTextInput: (props: { [key: string]: unknown }) =>
    require('react').createElement('BottomSheetTextInput', props),
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
const ENGLISH_ROW = LANGUAGE_NAMES.findIndex((entry) => entry.id === 'en');

// The wheel's own measures: a 400-point viewport, one 44-point row and the row gap
const LIST_HEIGHT = 400;
const ROW_HEIGHT = 44;
const PITCH = ROW_HEIGHT + SPACING.xs;
const PAD = (LIST_HEIGHT - ROW_HEIGHT) / 2;

const list = () => screen.getByTestId('language-list');
const field = () => screen.getByTestId('language-search');

/** The drawn style of a band: hidden while the rows are off-measure, so it is read as drawn */
const styleOf = (testID: string) => {
  const node = screen.getByTestId(testID, { includeHiddenElements: true });
  return StyleSheet.flatten(node.props.style) as {
    backgroundColor?: string;
    opacity?: number;
    height?: number;
    overflow?: string;
    position?: string;
    top?: number;
    start?: number | string;
    end?: number | string;
    bottom?: number;
    transform?: { translateY: number }[];
  };
};

const seatSeat = () => styleOf('language-seat').transform?.[0]?.translateY ?? Number.NaN;
const bandSeat = () => styleOf('language-band').transform?.[0]?.translateY ?? Number.NaN;

const measureList = (height = LIST_HEIGHT) =>
  fireEvent(list(), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height } } });

const measureFirstRow = (height = ROW_HEIGHT) =>
  fireEvent(screen.getAllByRole('radio')[0], 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height } },
  });

/** The sheet library reporting its settle at the open snap point, which is the sheet's own onPresent */
const presentSheet = () => fireEvent(list(), 'change', 0);

/** The wheel as a person finds it open: both measures landed and the sheet presented */
const openWheel = async () => {
  await measureList();
  await measureFirstRow();
  await presentSheet();
};

/** The props the sheet handed the modal, which its published mock keeps on the instance */
const sheetProps = () =>
  (
    renderedSheet() as unknown as {
      props: {
        keyboardBehavior?: string;
        keyboardBlurBehavior?: string;
        onDismiss: () => void;
      };
    }
  ).props;

const rowNames = () => screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel);

// The spinner carries no role, label or text of its own, so it is counted in the
// serialized tree, the one shape every renderer agrees on
const spinnerCount = (node: ReactTestRendererJSON): number => {
  const own = node.type === 'ActivityIndicator' ? 1 : 0;
  const children = (node.children ?? []).filter((child): child is ReactTestRendererJSON => typeof child === 'object');
  return own + children.reduce((total, child) => total + spinnerCount(child), 0);
};

/** The list's own scroll command, which is where the wheel's opening and reseeding land */
const scrollToOffset = () => jest.spyOn(FlatList.prototype, 'scrollToOffset');

// The hanging driver's release valve, armed by the busy test and fired here even
// when one of its assertions throws
let release: () => void = () => {};

afterEach(async () => {
  setActiveLocale('en');
  driverMock.mockReset();
  // A failed assertion throws past the test's own release, and the hanging driver
  // would hold the scheduling queue for every test after it
  release();
  await act(async () => {});
});

describe('the language wheel', () => {
  it('pads each end by half a row, so the first and last rows reach the centreline', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    expect(StyleSheet.flatten(list().props.contentContainerStyle)).toMatchObject({
      paddingTop: PAD,
      paddingBottom: PAD,
    });
  });

  it('snaps to one offset per row at the row pitch, on the fast settle', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    expect(list().props.decelerationRate).toBe('fast');
    expect(list().props.snapToOffsets).toEqual(LANGUAGE_NAMES.map((_, index) => index * PITCH));
  });

  it('opens with the locale in force settled on the centreline', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const scroll = scrollToOffset();
    await render(<LanguageSheet />);
    await openWheel();

    expect(scroll).toHaveBeenCalledWith({ offset: ENGLISH_ROW * PITCH, animated: false });
  });

  it('places the purple on the locale’s own row and the faint band on the centre row, one pitch per row', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await measureList();
    await measureFirstRow();

    // The wheel has not settled yet, so the scroll sits at zero: the seat is its row's pitch count
    // down and the faint band is the first row, already on the centreline
    expect(seatSeat()).toBe(PAD + ENGLISH_ROW * PITCH);
    expect(bandSeat()).toBe(PAD);
  });

  it('does not settle the wheel before the sheet is presented', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const scroll = scrollToOffset();
    await render(<LanguageSheet />);
    await measureList();
    await measureFirstRow();

    expect(scroll).not.toHaveBeenCalled();

    await presentSheet();

    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it('rides a faint band on the centre row, in the dim family and under the rows', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    const band = styleOf('language-band');
    expect(band.backgroundColor).toBe(COLORS.text.muted);
    expect(band.opacity).toBe(0.3);
    expect(band.height).toBe(ROW_HEIGHT);
    expect(bandSeat()).toBe(PAD);
  });

  it('clips both bands to the list’s own frame, so a far scroll paints neither over the card', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    expect(styleOf('language-band-layer')).toMatchObject({
      position: 'absolute',
      top: 0,
      start: 0,
      end: 0,
      bottom: 0,
      overflow: 'hidden',
    });
  });

  it('keeps the purple on the locale in force, with the faint band beside it', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    const seat = styleOf('language-seat');
    expect(seat.backgroundColor).toBe(COLORS.interactive.active);
    expect(seat.opacity).toBe(1);
    expect(seat.height).toBe(ROW_HEIGHT);
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toEqual({ selected: false });
  });

  it('hides the purple while the rows are off-measure', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(styleOf('language-seat').opacity).toBe(0);
  });

  it('moves the purple with the filtered list and hides it when the locale leaves the filter', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    act(() => setActiveLocale('tr'));
    await render(<LanguageSheet />);
    await openWheel();

    await fireEvent.changeText(field(), 'turk');
    // Türkmençe keeps the first seat, Türkçe the second, so the purple moves with its row
    expect(styleOf('language-seat').opacity).toBe(1);

    await fireEvent.changeText(field(), 'spanish');
    expect(styleOf('language-seat').opacity).toBe(0);
  });

  it('re-centres on the filtered list while the sheet is up, and on the seat the query removed', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const scroll = scrollToOffset();
    await render(<LanguageSheet />);
    await openWheel();

    await fireEvent.changeText(field(), 'spanish');

    // The locale in force is filtered out, so the wheel centres the list's first row
    expect(scroll).toHaveBeenLastCalledWith({ offset: 0, animated: false });
  });

  it('does not re-centre the wheel into a dismissing sheet', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const scroll = scrollToOffset();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.changeText(field(), 'spanish');
    const beforeClose = scroll.mock.calls.length;

    await act(async () => {
      sheetProps().onDismiss();
    });

    // The close clears the query, which re-derives the full list: no reseed lands on the way out
    expect(scroll).toHaveBeenCalledTimes(beforeClose);
    expect(field().props.value).toBe('');
  });

  it('reads close-to-save on the sheet’s subtitle', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(screen.getByText('Close to save')).toBeOnTheScreen();
  });
});

describe('the language wheel over T-451’s picker', () => {
  it('pins the field inside the card above the list, and the list is what scrolls', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

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

  it('seats the glyph at the field’s vertical centre, the way the row’s index slot seats', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(StyleSheet.flatten(screen.getByTestId('language-search-glyph').props.style)).toMatchObject({
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    });
  });

  it('keeps the field the sheet library’s own text input', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(field().type).toBe('BottomSheetTextInput');
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

  it('marks the persisted pick as the selected row when the sheet opens again', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);
    await openWheel();

    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toEqual({ selected: false });
  });

  it('renders every shipped native name in codepoint order on the athan card pattern', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    // Reading each row's label from its props: the order is the assertion, and no
    // per-row query can express which came first
    expect(rowNames()).toEqual([...SHIPPED_NAMES]);
  });
});

describe('a pick on the wheel', () => {
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
