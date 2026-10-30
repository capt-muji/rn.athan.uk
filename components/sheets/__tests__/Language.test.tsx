/**
 * The language sheet's plain numbered list (T-519): every shipped row in one freely scrolling list,
 * the purple seat on the locale in force when it opens, a tap staging its row with the sound sheet's
 * own impact, and the close as the one commit boundary
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import { act } from 'react';
import { StyleSheet } from 'react-native';

import { insideScroll, showLondonDay } from '@/__tests__/harness';
import { COLORS, SPACING } from '@/shared/constants';
import { LOCALE_IDS, setActiveLocale } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';
import * as LanguageStore from '@/stores/language';
import { languageSheetModalAtom } from '@/stores/ui';

import LanguageSheet from '../screens/Language';

const store = getDefaultStore();

/** The modal a sheet handed the store when it rendered */
const renderedSheet = () => {
  const sheet = store.get(languageSheetModalAtom);
  if (!sheet) throw new Error('The sheet has not rendered');
  return sheet;
};

const ENGLISH_ROW = LANGUAGE_NAMES.findIndex((entry) => entry.id === 'en');
const GERMAN_ROW = LANGUAGE_NAMES.findIndex((entry) => entry.id === 'de');
const ARABIC_ROW = LANGUAGE_NAMES.findIndex((entry) => entry.id === 'ar');

// The list's own measures: one measured row and the row gap, which is every row's pitch
const ROW_HEIGHT = 48;
const PITCH = ROW_HEIGHT + SPACING.xs;

const list = () => screen.getByTestId('language-list');

/** The drawn style of the seat, read as drawn so a hidden seat is read hidden */
const styleOf = (testID: string) => {
  const node = screen.getByTestId(testID, { includeHiddenElements: true });
  return StyleSheet.flatten(node.props.style) as {
    backgroundColor?: string;
    opacity?: number;
    height?: number;
    marginTop?: number;
    gap?: number;
    paddingTop?: number;
    paddingBottom?: number;
    transform?: { translateY: number }[];
  };
};

const seatOffset = () => styleOf('language-seat').transform?.[0]?.translateY ?? Number.NaN;

const measureFirstRow = (height = ROW_HEIGHT) =>
  fireEvent(screen.getAllByRole('radio')[0], 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height } },
  });

/** The props the sheet handed the modal, which its published mock keeps on the instance */
const sheetProps = () =>
  (
    renderedSheet() as unknown as {
      props: {
        snapPoints?: (string | number)[];
        onDismiss: () => void;
      };
    }
  ).props;

afterEach(async () => {
  setActiveLocale('en');
  await act(async () => {});
});

describe('the plain list', () => {
  it('carries every shipped row in the picker’s own codepoint order, numbered from 1', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(screen.getAllByRole('radio')).toHaveLength(LANGUAGE_NAMES.length);
    expect(screen.getByRole('radio', { name: 'Azərbaycanca' })).toBeOnTheScreen();
    expect(screen.getByText('1.')).toBeOnTheScreen();
    expect(screen.getByText(`${LANGUAGE_NAMES.length}.`)).toBeOnTheScreen();
  });

  it('names every shipped id, so a dropped endonym row cannot pass', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(LANGUAGE_NAMES).toHaveLength(LOCALE_IDS.length);
  });

  it('numbers every row with Latin digits in an absolute slot at the card’s left edge', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    const first = screen.getByText('1.');
    expect(first.props.children).toBe('1.');
    expect(screen.getByText('10.')).toBeOnTheScreen();
    expect(StyleSheet.flatten(first.parent?.props.style)).toMatchObject({ position: 'absolute', left: SPACING.md });
    // The digits read left to right inside an RTL paragraph too
    expect(StyleSheet.flatten(first.props.style)).toMatchObject({ writingDirection: 'ltr' });
  });

  it('keeps the Latin index at the same physical edge under Arabic', async () => {
    showLondonDay('2026-09-11', '14:00');
    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);

    const first = screen.getByText('1.');
    expect(StyleSheet.flatten(first.parent?.props.style)).toMatchObject({ position: 'absolute', left: SPACING.md });
    expect(screen.getByText('12.')).toBeOnTheScreen();
  });

  it('centres the name on the card, with nothing pushing it and the index out of its way', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    const row = screen.getByRole('radio', { name: 'English, Close to save' });
    expect(StyleSheet.flatten(row.props.style).alignItems).toBe('center');
    expect(StyleSheet.flatten(row.props.style).paddingStart).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByText('1.').parent?.props.style).position).toBe('absolute');
  });

  it('rides the sheet’s own scroll view, so the reader scrolls the list free', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(insideScroll(screen.getByRole('radio', { name: 'English, Close to save' }))).toBe(true);
  });

  it('spans the height the settings and sound sheets span, so the three read as one family', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(sheetProps().snapPoints).toEqual(['85%']);
  });

  it('reads close-to-save on the sheet’s subtitle', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(screen.getByText('Close to save')).toBeOnTheScreen();
  });
});

describe('the wheel’s strip', () => {
  it('draws no band, no search field and no empty-state line', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(screen.queryByTestId('language-band')).toBeNull();
    expect(screen.queryByTestId('language-band-layer')).toBeNull();
    expect(screen.queryByTestId('language-search')).toBeNull();
    expect(screen.queryByText('No languages found')).toBeNull();
  });

  it('settles nothing: the list carries no snap offsets, no scroll handler and no detents', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(list().props.snapToOffsets).toBeUndefined();
    expect(list().props.onScroll).toBeUndefined();
    expect(list().props.getItemLayout).toBeUndefined();
  });

  it('pads the card’s own edges only, with no oversized gap above the first row or below the last', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    const container = styleOf('language-list');
    expect(container).toMatchObject({ marginTop: SPACING.md, gap: SPACING.xs });
    expect(container.paddingTop).toBeUndefined();
    expect(container.paddingBottom).toBeUndefined();
  });
});

describe('the purple seat', () => {
  it('stays hidden until the first row has been measured', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(styleOf('language-seat').opacity).toBe(0);

    await measureFirstRow();

    expect(styleOf('language-seat').opacity).toBe(1);
    expect(styleOf('language-seat').height).toBe(ROW_HEIGHT);
  });

  it('keeps the height it first measured when the first row is laid out again at another height', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);
    await measureFirstRow();

    await measureFirstRow(60);

    expect(styleOf('language-seat').height).toBe(ROW_HEIGHT);
  });

  it('opens on the locale in force, which carries the close-to-save contract', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);
    await measureFirstRow();

    expect(seatOffset()).toBe(ENGLISH_ROW * PITCH);
    expect(screen.getByRole('radio', { name: 'English, Close to save' }).props.accessibilityState).toMatchObject({
      selected: true,
      checked: true,
    });
    expect(screen.getByRole('radio', { name: 'Deutsch' }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: false,
    });
  });

  it('seats on the locale in force’s own row under Arabic, the same geometry the LTR locale gets', async () => {
    showLondonDay('2026-09-11', '14:00');
    act(() => setActiveLocale('ar'));
    await render(<LanguageSheet />);
    await measureFirstRow();

    // A row index and the row pitch, never a mirrored sign
    expect(seatOffset()).toBe(ARABIC_ROW * PITCH);
  });

  it('moves onto the tapped row, which becomes the row a close would save', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);
    await measureFirstRow();

    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    expect(seatOffset()).toBe(GERMAN_ROW * PITCH);
    // The locale in force keeps its own state; the tapped row carries the close-to-save contract alone
    expect(screen.getByRole('radio', { name: 'English' }).props.accessibilityState).toMatchObject({
      selected: true,
      checked: false,
    });
    expect(screen.getByRole('radio', { name: 'Deutsch, Close to save' }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: true,
    });
  });

  it('draws the seat in the family’s own ink', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);
    await measureFirstRow();

    const seat = styleOf('language-seat');
    expect(seat.backgroundColor).toBe(COLORS.interactive.active);
  });
});

describe('the number’s two inks', () => {
  it('reads the seated row’s number white and every other row’s number dim', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(StyleSheet.flatten(screen.getByText(`${ENGLISH_ROW + 1}.`).props.style).color).toBe(COLORS.text.primary);
    expect(StyleSheet.flatten(screen.getByText('1.').props.style).color).toBe(COLORS.text.sheetDim);
  });

  it('crosses the inks when the seat moves: the tapped row’s number goes white, the row that loses the seat goes dim', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    expect(StyleSheet.flatten(screen.getByText(`${GERMAN_ROW + 1}.`).props.style).color).toBe(COLORS.text.primary);
    expect(StyleSheet.flatten(screen.getByText(`${ENGLISH_ROW + 1}.`).props.style).color).toBe(COLORS.text.sheetDim);
  });

  it('keeps the language name white in every state', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<LanguageSheet />);

    expect(StyleSheet.flatten(screen.getByText('English').props.style).color).toBe(COLORS.text.primary);
    expect(StyleSheet.flatten(screen.getByText('Deutsch').props.style).color).toBe(COLORS.text.primary);
  });
});

describe('the tap', () => {
  /** The commit the close boundary carries, stubbed so no surface converges in the suite */
  const stubCommit = () => jest.spyOn(LanguageStore, 'commitLanguagePreference').mockResolvedValue();
  const stubReveal = () => jest.spyOn(LanguageStore, 'revealLanguageLoader');

  it('stages the tapped row without committing, revealing or closing, on the sound sheet’s own impact', async () => {
    showLondonDay('2026-09-11', '14:00');
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    // The scroll lost every tick it had: nothing the sheet does buzzes like a wheel
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(commitSpy).not.toHaveBeenCalled();
    expect(revealSpy).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
  });
});

describe('the staged commit at the close boundary', () => {
  const stubCommit = () => jest.spyOn(LanguageStore, 'commitLanguagePreference').mockResolvedValue();
  const stubReveal = () => jest.spyOn(LanguageStore, 'revealLanguageLoader');

  it('commits the staged row once on the close, with one Light impact, and never while it loads', async () => {
    showLondonDay('2026-09-11', '14:00');
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);
    await measureFirstRow();
    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    await act(async () => {
      sheetProps().onDismiss();
    });

    // The loader stands on the close's own tick and the commit follows a paint later
    expect(revealSpy).toHaveBeenCalledWith('de');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(commitSpy).not.toHaveBeenCalled();

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledTimes(1);
    expect(commitSpy).toHaveBeenCalledWith('de');
    // The tap's Medium and the close's Light are the whole sheet's buzz: nothing on the load path adds one
    const impacts = jest.mocked(Haptics.impactAsync).mock.calls;
    expect(impacts.filter(([style]) => style === Haptics.ImpactFeedbackStyle.Medium)).toHaveLength(1);
    expect(impacts.filter(([style]) => style === Haptics.ImpactFeedbackStyle.Light)).toHaveLength(1);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it('commits nothing on a second close of the same dismissal', async () => {
    showLondonDay('2026-09-11', '14:00');
    const commitSpy = stubCommit();
    await render(<LanguageSheet />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    await act(async () => {
      sheetProps().onDismiss();
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).toHaveBeenCalledTimes(1);
    const lights = jest
      .mocked(Haptics.impactAsync)
      .mock.calls.filter(([style]) => style === Haptics.ImpactFeedbackStyle.Light);
    expect(lights).toHaveLength(1);
  });

  it('changes nothing when the close carries no staged row', async () => {
    showLondonDay('2026-09-11', '14:00');
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);

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
    showLondonDay('2026-09-11', '14:00');
    const commitSpy = stubCommit();
    const revealSpy = stubReveal();
    await render(<LanguageSheet />);

    // The open already seats the locale in force, so tapping its row stages no change
    await fireEvent.press(screen.getByRole('radio', { name: 'English, Close to save' }));

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(commitSpy).not.toHaveBeenCalled();
    expect(revealSpy).not.toHaveBeenCalled();
    const lights = jest
      .mocked(Haptics.impactAsync)
      .mock.calls.filter(([style]) => style === Haptics.ImpactFeedbackStyle.Light);
    expect(lights).toHaveLength(0);
  });

  it('consumes the stage at the close: the row is its name again and the seat returns to the locale in force', async () => {
    showLondonDay('2026-09-11', '14:00');
    stubCommit();
    await render(<LanguageSheet />);
    await measureFirstRow();
    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    await act(async () => {
      sheetProps().onDismiss();
    });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen.getByRole('radio', { name: 'Deutsch' }).props.accessibilityState).toMatchObject({
      selected: false,
      checked: false,
    });
    expect(seatOffset()).toBe(ENGLISH_ROW * PITCH);
  });
});
