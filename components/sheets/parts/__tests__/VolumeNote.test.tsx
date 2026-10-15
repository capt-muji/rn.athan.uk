/**
 * The volume footnote: the platform's copy, centred beside its information glyph
 */

import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { onPlatform } from '@/__tests__/harness';
import { COLORS, SPACING, TEXT } from '@/shared/constants';

import SheetVolumeNote from '../VolumeNote';

const IOS_COPY = 'Follows your Ringer & Alerts volume.\nSilent and Focus modes mute it.';
const ANDROID_COPY = 'Plays at alarm volume, not ring volume.';

const noteStyle = (copy: string): Record<string, unknown> =>
  StyleSheet.flatten(screen.getByText(copy).props.style) as Record<string, unknown>;

const footStyle = (copy: string): Record<string, unknown> =>
  StyleSheet.flatten(screen.getByText(copy).parent?.props.style) as Record<string, unknown>;

describe('the volume footnote', () => {
  it('draws the iOS copy beside the information glyph, the glyph keeping its distance', async () => {
    await render(<SheetVolumeNote />);

    expect(screen.getByText(IOS_COPY)).toBeOnTheScreen();
    expect(screen.getByTestId('svg:info-bare', { includeHiddenElements: true })).toBeOnTheScreen();
    const note = screen.getByText(IOS_COPY);
    const style = StyleSheet.flatten(note.props.style) as { marginStart?: number };
    expect(style.marginStart).toBe(SPACING.md);
  });

  it('draws the Android copy on Android', async () => {
    onPlatform('android');
    await render(<SheetVolumeNote />);

    expect(screen.getByText(ANDROID_COPY)).toBeOnTheScreen();
    expect(screen.getByTestId('svg:info-bare', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('centres every line in the sheet-subtitle ink at the detail size', async () => {
    await render(<SheetVolumeNote />);

    const text = noteStyle(IOS_COPY);
    expect(text.textAlign).toBe('center');
    expect(text.color).toBe(COLORS.text.sheetSubtitle);
    expect(text.fontSize).toBe(TEXT.sizeDetail);
    expect(text.fontFamily).toBe('Roboto-Regular');
  });

  it('lifts off the body, a centred row with its padding', async () => {
    await render(<SheetVolumeNote />);

    const foot = footStyle(IOS_COPY);
    expect(foot.flexDirection).toBe('row');
    expect(foot.justifyContent).toBe('center');
    expect(foot.alignItems).toBe('center');
    expect(foot.marginTop).toBe(SPACING.xxl);
    expect(foot.paddingHorizontal).toBe(SPACING.lg);
  });
});
