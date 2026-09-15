/**
 * The countdown bar colour row: when its picker opens, and what Done, dismissing and Reset do to the saved colour
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';

import { COLOR_PICKER_DEFAULT } from '@/shared/constants';
import { countdownBarColorAtom, countdownBarShownAtom } from '@/stores/ui';

import ColorPickerSettings from '../ColorPicker';

const CUSTOM_COLOUR = '#ff3366';

// The app writes these preferences only from components, through the atoms: Settings the bar's visibility, and this row
// its colour
const store = getDefaultStore();

/** Opens the picker the way a person does, by pressing the row */
const openPicker = () => fireEvent.press(screen.getByText('Countdown bar color'));

// The picker's close and Done buttons are icons with neither a label nor a role, so each is found by its icon
const closeButton = () => screen.getByTestId('svg:close');
const doneButton = () => screen.getByTestId('svg:check');

describe('the countdown bar colour row in the settings sheet', () => {
  it('opens the picker with a haptic when pressed while the bar is shown', async () => {
    await render(<ColorPickerSettings />);

    await openPicker();

    expect(screen.getByText('Select Color')).toBeOnTheScreen();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('opens nothing, and stays still, when pressed while the bar is hidden', async () => {
    store.set(countdownBarShownAtom, false);
    await render(<ColorPickerSettings />);

    await openPicker();

    expect(screen.queryByText('Select Color')).not.toBeOnTheScreen();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('saves the colour chosen and closes the picker with a haptic when Done is pressed', async () => {
    await render(<ColorPickerSettings />);
    await openPicker();
    await fireEvent.press(screen.getByRole('button', { name: `Select color: ${CUSTOM_COLOUR}` }));

    await fireEvent.press(doneButton());

    expect(store.get(countdownBarColorAtom)).toBe(CUSTOM_COLOUR);
    expect(screen.queryByText('Select Color')).not.toBeOnTheScreen();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
  });

  // how the picker is dismissed
  it.each([
    ['its close button', () => fireEvent.press(closeButton())],
    ['the system back action', () => fireEvent(screen.getByText('Select Color'), 'requestClose')],
  ])('discards the colour chosen when the picker is dismissed with %s', async (_way, dismiss) => {
    await render(<ColorPickerSettings />);
    await openPicker();
    await fireEvent.press(screen.getByRole('button', { name: `Select color: ${CUSTOM_COLOUR}` }));

    await dismiss();

    expect(store.get(countdownBarColorAtom)).toBe(COLOR_PICKER_DEFAULT);
    expect(screen.queryByText('Select Color')).not.toBeOnTheScreen();
  });

  it('reopens on the saved colour rather than one discarded earlier', async () => {
    await render(<ColorPickerSettings />);
    await openPicker();
    await fireEvent.press(screen.getByRole('button', { name: `Select color: ${CUSTOM_COLOUR}` }));
    await fireEvent.press(closeButton());
    await openPicker();

    await fireEvent.press(doneButton());

    expect(store.get(countdownBarColorAtom)).toBe(COLOR_PICKER_DEFAULT);
  });

  // saved colour, whether Reset is disabled
  it.each([
    [COLOR_PICKER_DEFAULT, true],
    [CUSTOM_COLOUR, false],
  ])('offers Reset for the saved colour %s only when it is not the default', async (colour, disabled) => {
    store.set(countdownBarColorAtom, colour);

    await render(<ColorPickerSettings />);

    expect(screen.getByText('Reset').parent).toHaveProp('accessibilityState', { disabled });
  });

  it('puts the default colour back with a haptic when Reset is pressed', async () => {
    store.set(countdownBarColorAtom, CUSTOM_COLOUR);
    await render(<ColorPickerSettings />);

    await fireEvent.press(screen.getByText('Reset'));

    expect(store.get(countdownBarColorAtom)).toBe(COLOR_PICKER_DEFAULT);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('keeps a custom colour, and stays still, when Reset is pressed while the bar is hidden', async () => {
    store.set(countdownBarColorAtom, CUSTOM_COLOUR);
    store.set(countdownBarShownAtom, false);
    await render(<ColorPickerSettings />);

    await fireEvent.press(screen.getByText('Reset'));

    expect(store.get(countdownBarColorAtom)).toBe(CUSTOM_COLOUR);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
