/**
 * The volume footnote: the platform's copy, centred beside its information glyph
 */

import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { onPlatform } from '@/__tests__/harness';
import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';

import SheetVolumeNote from '../VolumeNote';

// The ar probe below requires the testing library fresh inside isolateModules, mid-test, where
// its import-time cleanup-hook registration is a jest-circus error
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';

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

  it('draws the iOS copy beside a smaller information glyph on the unchanged round chip', async () => {
    await render(<SheetVolumeNote />);

    expect(screen.getByText(IOS_COPY)).toBeOnTheScreen();
    const badge = screen.getByTestId('svg:info-bare', { includeHiddenElements: true });
    // Her footer-only ruling: the letter shrinks, the circle it sits on does not
    expect(badge.props.width).toBe(10);
    expect(badge.props.height).toBe(10);
    const chip = badge.parent;
    const chipStyle = StyleSheet.flatten(chip?.props.style) as { width?: number; height?: number };
    expect(chipStyle.width).toBe(20);
    expect(chipStyle.height).toBe(20);
  });

  it('centres every line in the sheet-subtitle ink at the detail size', async () => {
    await render(<SheetVolumeNote />);

    const text = noteStyle(IOS_COPY);
    expect(text.textAlign).toBe('center');
    expect(text.color).toBe(COLORS.text.sheetSubtitle);
    expect(text.fontSize).toBe(TEXT.sizeDetail);
    expect(text.fontFamily).toBe('Roboto-Regular');
    expect(text.lineHeight).toBeUndefined();
  });

  it('takes the 21 point script line box under ar, so the measured descender ink renders', async () => {
    let text: Record<string, unknown> = {};
    jest.resetModules();
    try {
      await jest.isolateModulesAsync(async () => {
        const { StyleSheet } = require('react-native');
        const { setActiveLocale } = require('@/shared/i18n/locale');
        setActiveLocale('ar');
        const rntl = require('@testing-library/react-native');
        const SheetVolumeNoteAr = require('../VolumeNote').default;
        await rntl.render(<SheetVolumeNoteAr />);
        text = StyleSheet.flatten(rntl.screen.getByText(/الرنين/).props.style) as Record<string, unknown>;
      });
      expect(text.lineHeight).toBe(21);
    } finally {
      setActiveLocale('en');
    }
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
