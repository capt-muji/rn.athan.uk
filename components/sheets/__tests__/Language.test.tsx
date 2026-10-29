/**
 * The language wheel (T-476): the list settles row by row on the centreline, a faint band in the dim
 * family rides the centre row while the purple stays on the locale in force, the sheet opens with that
 * locale centred, and everything T-451 built — the pinned search, the numbered centred rows, the
 * keyboard work and RTL — still holds over the wheel
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import { act } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { insideScroll, london } from '@/__tests__/harness';
import { COLORS, SPACING } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';
import * as LanguageStore from '@/stores/language';
import { languageSheetModalAtom } from '@/stores/ui';

import LanguageSheet from '../screens/Language';

// The published mock maps BottomSheetTextInput onto the plain TextInput, so the two read
// the same in a rendered tree: this tag keeps the library's own input findable, which is
// what the pin below hangs on
jest.mock('@gorhom/bottom-sheet', () => {
  const { createElement } = require('react');
  const { FlatList: NativeFlatList } = require('react-native') as typeof import('react-native');

  // The pinned 5.2.14 scrollable strips the caller's onScroll and re-dispatches it on the JS thread
  // as { nativeEvent: event } (createBottomSheetScrollableComponent, useScrollHandler). The suite's
  // list hands it over the same way, so a scroll reaches the screen exactly as it does on a phone
  const BottomSheetFlatList = (props: Record<string, unknown>) => {
    const { onScroll, onScrollBeginDrag, ...rest } = props as {
      onScroll?: (event: { nativeEvent: unknown }) => void;
      onScrollBeginDrag?: (event: { nativeEvent: unknown }) => void;
    };
    const deliver = (handler?: (event: { nativeEvent: unknown }) => void) =>
      handler && ((event: { nativeEvent: unknown }) => handler({ nativeEvent: event.nativeEvent }));

    return createElement(NativeFlatList, {
      ...rest,
      onScroll: deliver(onScroll),
      onScrollBeginDrag: onScrollBeginDrag && (() => onScrollBeginDrag({ nativeEvent: {} })),
    });
  };

  return {
    ...jest.requireActual('@gorhom/bottom-sheet/mock'),
    BottomSheetTextInput: (props: { [key: string]: unknown }) =>
      require('react').createElement('BottomSheetTextInput', props),
    BottomSheetFlatList,
  };
});

const store = getDefaultStore();

/** The modal a sheet handed the store when it rendered */
const renderedSheet = () => {
  const sheet = store.get(languageSheetModalAtom);
  if (!sheet) throw new Error('The sheet has not rendered');
  return sheet;
};

const SHIPPED_NAMES = LANGUAGE_NAMES.map((entry) => entry.name);
const ENGLISH_ROW = LANGUAGE_NAMES.findIndex((entry) => entry.id === 'en');
const ARABIC_ROW = LANGUAGE_NAMES.findIndex((entry) => entry.id === 'ar');

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

/** A scroll as the list reports it: the native event, delivered the way the library re-dispatches onScroll */
const scrollEvent = (offset: number) => ({
  nativeEvent: {
    contentOffset: { x: 0, y: offset },
    contentSize: { width: 300, height: LANGUAGE_NAMES.length * PITCH },
    layoutMeasurement: { width: 300, height: LIST_HEIGHT },
    zoomScale: 1,
  },
});

const scrollTo = (offset: number) => fireEvent(list(), 'scroll', scrollEvent(offset));

/** A finger taking the scroll back, as the list reports it */
const scrollBegin = () => fireEvent(list(), 'scrollBeginDrag', { nativeEvent: {} });

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

/** The list's own scroll command, which is where the wheel's opening and reseeding land */
const scrollToOffset = () => jest.spyOn(FlatList.prototype, 'scrollToOffset');

afterEach(async () => {
  setActiveLocale('en');
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

  it('snaps to one offset per row at the row pitch, which is the wheel’s whole settle line', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

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
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toMatchObject({
      selected: true,
      checked: false,
    });
    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: false,
    });
  });

  it('rides the delivered scroll: the faint band holds the centreline and the purple its row, one pitch per row travelled', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    // The list's own event, through the pinned library's dispatch: the wheel moves, one row down
    await scrollTo((ENGLISH_ROW + 1) * PITCH);
    await screen.rerender(<LanguageSheet />);

    // The faint band is the centreline itself, and the purple keeps the locale in force one pitch above it
    expect(bandSeat()).toBe(PAD);
    expect(seatSeat()).toBe(PAD - PITCH);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('ticks once for a seat the library delivers twice, because the tick is the seat’s own edge', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    // One event re-dispatched twice still crosses one seat: the detent fires on the crossing, not the delivery
    await scrollTo((ENGLISH_ROW + 1) * PITCH);
    await scrollTo((ENGLISH_ROW + 1) * PITCH);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('hides the purple while the rows are off-measure', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    expect(styleOf('language-seat').opacity).toBe(0);
  });

  it('hides the faint band over an empty list, as the purple already hides', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    await fireEvent.changeText(field(), 'zzz');

    // Nothing matches, so the wheel has no row to ride: the empty line is all the card says
    expect(styleOf('language-band').opacity).toBe(0);
    expect(screen.getByText('No languages found')).toBeOnTheScreen();
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

  it('reseeds on the row’s own pitch under Arabic, the same geometry the LTR locale gets', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const scroll = scrollToOffset();
    const english = await render(<LanguageSheet />);
    await openWheel();
    expect(scroll).toHaveBeenLastCalledWith({ offset: ENGLISH_ROW * PITCH, animated: false });
    await english.unmount();

    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);
    await openWheel();

    // A row index and the row pitch, never a mirrored sign: RTL centres the locale in force on the same line
    expect(scroll).toHaveBeenLastCalledWith({ offset: ARABIC_ROW * PITCH, animated: false });
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

    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toMatchObject({
      selected: true,
      checked: false,
    });
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: false,
    });
  });

  it('renders every shipped native name in codepoint order on the athan card pattern', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    // Reading each row's label from its props: the order is the assertion, and no
    // per-row query can express which came first
    expect(rowNames()).toEqual([...SHIPPED_NAMES]);
  });
});

describe('the staged commit at the close boundary', () => {
  /** The commit the close boundary carries, stubbed so no surface converges in the suite */
  const stubCommit = () => jest.spyOn(LanguageStore, 'commitLanguagePreference').mockResolvedValue();
  const stubReveal = () => jest.spyOn(LanguageStore, 'revealLanguageLoader');

  it('stages the tapped row without committing, revealing or closing, and ticks', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    const scroll = scrollToOffset();
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');
    await openWheel();

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(commitSpy).not.toHaveBeenCalled();
    expect(revealSpy).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
    // The faint band rides the animated scroll onto the row that was tapped
    expect(scroll).toHaveBeenLastCalledWith({ offset: ARABIC_ROW * PITCH, animated: true });
  });

  it('hands the detent back when a finger grabs a staging scroll', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));
    await scrollTo((ENGLISH_ROW - 1) * PITCH);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    // The finger takes the wheel back mid-flight: the rows it then crosses are its own, and each ticks
    await scrollBegin();
    await scrollTo((ENGLISH_ROW - 2) * PITCH);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
  });

  it('gives the staged row its own state and the close it commits on, so a reader is told what a close will do', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    stubReveal();
    await render(<LanguageSheet />);
    await openWheel();

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    // The purple still carries the locale in force; the staged row carries the close-to-save contract alone
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toMatchObject({
      selected: true,
      checked: false,
    });
    expect(screen.getByRole('radio', { name: `العربية, Close to save` }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: true,
    });

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // The close consumes the stage: the row is its name again and nothing is staged
    expect(commitSpy).toHaveBeenCalledWith('ar');
    expect(screen.getByRole('radio', { name: 'العربية' }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: false,
    });
  });

  it('ticks once for a tap on a far row, however many rows the staging scroll crosses', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);
    await openWheel();

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    // The staged scroll rides the wheel back to the tapped row, and every row it crosses reports its own seat
    for (let row = ENGLISH_ROW - 1; row > ARABIC_ROW; row -= 1) {
      await scrollTo(row * PITCH);
    }
    await scrollTo(ARABIC_ROW * PITCH);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    // The arrival hands the wheel back to the finger, so the next drag ticks again
    await scrollTo((ARABIC_ROW + 1) * PITCH);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
  });

  it('commits the staged row once on the close, with one tick, and never while it loads', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    await act(async () => {
      sheetProps().onDismiss();
    });

    // The loader stands on the close's own tick and the commit follows a paint later
    expect(revealSpy).toHaveBeenCalledWith('ar');
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(commitSpy).not.toHaveBeenCalled();

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledTimes(1);
    expect(commitSpy).toHaveBeenCalledWith('ar');
    // Nothing on the load path adds a second buzz
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('commits nothing on a second close of the same dismissal', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    await act(async () => {
      sheetProps().onDismiss();
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('changes nothing when the close carries no staged row', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);
    await openWheel();

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).not.toHaveBeenCalled();
    expect(revealSpy).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('changes nothing when the staged row is the locale already in force', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).not.toHaveBeenCalled();
    expect(revealSpy).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('stages nothing when the scroll settles, so a close after a scroll changes nothing', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    await render(<LanguageSheet />);
    await openWheel();

    // Settling is browsing only: the wheel is scrolled to another row and the close that follows commits nothing
    await scrollTo(ARABIC_ROW * PITCH);

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).not.toHaveBeenCalled();
  });

  it('keeps a staged row a filter still shows, and commits it at the close', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.press(screen.getByRole('radio', { name: 'Español' }));
    await fireEvent.changeText(field(), 'spanish');
    expect(commitSpy).not.toHaveBeenCalled();

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledWith('es');
  });

  it('drops a staged row its filter removed, so the close changes nothing', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.press(screen.getByRole('radio', { name: 'Español' }));
    await fireEvent.changeText(field(), 'zzz');

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).not.toHaveBeenCalled();
  });

  it('keeps a staged row through clearing the query, and the full list reseeds centred on the locale in force', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = stubCommit();
    const scroll = scrollToOffset();
    await render(<LanguageSheet />);
    await openWheel();
    await fireEvent.press(screen.getByRole('radio', { name: 'Español' }));
    await fireEvent.changeText(field(), 'spanish');
    await fireEvent.changeText(field(), '');
    expect(commitSpy).not.toHaveBeenCalled();

    // The reseed lands on the locale in force's seat in the whole list, not on the filtered row
    expect(scroll).toHaveBeenLastCalledWith({ offset: ENGLISH_ROW * PITCH, animated: false });
    // and the stage survives the reseed, still the row a close would save
    expect(screen.getByRole('radio', { name: 'Español, Close to save' }).props.accessibilityState).toMatchObject({
      checked: true,
    });

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledWith('es');
  });
});
