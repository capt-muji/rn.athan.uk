/**
 * The settings button beside the pager: a completed press gives a tap and opens the settings sheet
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { COLORS } from '@/shared/constants';
import { setSettingsSheetModal } from '@/stores/ui';

import SettingsButton, { ICON_SIZE } from '../SettingsButton';

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

  // 39x39 with 2px margins holding the 43px slot, so the flanking dots never move
  it('draws the circle at 39 inside the unchanged 43px slot', async () => {
    setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
    const tree = await render(<SettingsButton />);
    const root = tree.root as NonNullable<typeof tree.root>;

    expect(root.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 39, height: 39, marginHorizontal: 2 })])
    );
    expect(ICON_SIZE).toBe(18);
  });

  // The owner's report, and it is an accessibility requirement rather than a preference: at 0.29 the circle
  // disappeared against the gradient in direct sunlight, so users with poor eyesight could not find the control
  it('draws a circle opaque enough to be found in sunlight', async () => {
    setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
    await render(<SettingsButton />);

    const alpha = (colour: string) => Number(colour.split(',')[3].replace(')', ''));

    expect(alpha(COLORS.settingsButton.background)).toBeGreaterThanOrEqual(0.45);
    expect(alpha(COLORS.settingsButton.border)).toBeGreaterThanOrEqual(0.6);
  });

  // A glyph left muted on a stronger circle is the same problem one layer in.
  // The landed design (T-374) dims the glyph toward the background on purpose:
  // it must still read, at the picked design's own weight
  it('draws the glyph at the landed designs readable weight', () => {
    const alpha = Number(COLORS.icon.settings.split(',')[3].replace(')', ''));

    expect(alpha).toBeGreaterThanOrEqual(0.6);
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

  // The fill bakes opaque on Android so elevation's outline exists; #4e23bc is the owner's
  // locked value, verified on glass with the border and glyph beside it
  it('bakes an opaque fill and a real elevation on Android', async () => {
    Platform.OS = 'android';
    try {
      setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
      const tree = await render(<SettingsButton />);
      const root = tree.root as NonNullable<typeof tree.root>;
      const style = root.props.style.find(
        (s: { elevation?: number; shadowColor?: string }) => s?.elevation !== undefined
      );

      expect(style.elevation).toBe(10);
      expect(style.shadowColor).toBe('#0a0426');
      expect(style.backgroundColor).toBe('#4e23bc');
      expect(style.borderColor).toBe('rgba(116, 80, 207, 0.51)');
    } finally {
      Platform.OS = 'ios';
    }
  });

  it('dims the glyph one notch on Android alone', async () => {
    Platform.OS = 'android';
    try {
      setSettingsSheetModal({ present: jest.fn() } as unknown as BottomSheetModal);
      const tree = await render(<SettingsButton />);
      expect(JSON.stringify(tree.toJSON())).toContain('"opacity":0.9');
    } finally {
      Platform.OS = 'ios';
    }

    const tree = await render(<SettingsButton />);
    expect(JSON.stringify(tree.toJSON())).not.toContain('"opacity":0.9');
  });
});
