/**
 * The settings button beside the pager: a completed press gives a tap and opens the settings sheet
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { setSettingsSheetModal } from '@/stores/ui';

import SettingsButton from '../SettingsButton';

// jest-expo turns the native ExpoHaptics.impactAsync into a jest.fn that expo-haptics awaits; expo-haptics's own
// impactAsync is mocked so the call the app makes, and the style it asks for, can be observed
jest.mock('expo-haptics', () => ({
  ...jest.requireActual('expo-haptics'),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

// The button has no role, label or text to be found by, so it is reached as the root of what it renders

describe('the settings button, with the settings sheet mounted', () => {
  it('opens the settings sheet when pressed', async () => {
    const sheet = { present: jest.fn() };
    setSettingsSheetModal(sheet as unknown as BottomSheetModal);
    await render(<SettingsButton />);

    await fireEvent.press(screen.root!);

    expect(sheet.present).toHaveBeenCalledTimes(1);
  });

  it('gives a medium tap when pressed', async () => {
    setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
    await render(<SettingsButton />);

    await fireEvent.press(screen.root!);

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('neither taps nor opens the sheet for a touch that goes down and up without completing a press', async () => {
    const sheet = { present: jest.fn() };
    setSettingsSheetModal(sheet as unknown as BottomSheetModal);
    await render(<SettingsButton />);

    await fireEvent(screen.root!, 'pressIn');
    await fireEvent(screen.root!, 'pressOut');

    expect(sheet.present).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
