/**
 * The settings button beside the pager: a completed press gives a tap and opens the settings sheet
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/shared/constants';
import { setSettingsSheetModal } from '@/stores/ui';

import SettingsButton from '../SettingsButton';

describe('the settings button, with the settings sheet mounted', () => {
  // An icon-only control, so its name is the only thing a screen reader could announce
  it('is named for a screen reader', async () => {
    setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
    await render(<SettingsButton />);

    expect(screen.getByRole('button', { name: 'Settings' })).toBeOnTheScreen();
  });

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

  // The owner's report, and it is an accessibility requirement rather than a preference: at 0.29 the circle
  // disappeared against the gradient in direct sunlight, so users with poor eyesight could not find the control
  it('draws a circle opaque enough to be found in sunlight', async () => {
    setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
    await render(<SettingsButton />);

    const alpha = (colour: string) => Number(colour.split(',')[3].replace(')', ''));

    expect(alpha(COLORS.settingsButton.background)).toBeGreaterThanOrEqual(0.6);
    expect(alpha(COLORS.settingsButton.border)).toBeGreaterThanOrEqual(0.6);
  });

  // A glyph left muted on a stronger circle is the same problem one layer in
  it('draws the glyph bright enough to read against its own circle', () => {
    const alpha = Number(COLORS.icon.settings.split(',')[3].replace(')', ''));

    expect(alpha).toBeGreaterThanOrEqual(0.8);
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
