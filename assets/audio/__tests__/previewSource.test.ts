/**
 * The preview source of an athan row: where the sheet's one player reads each clip from now
 * that the Metro asset copy is gone and each mp3 rides the build once.
 *
 * Android must name its res/raw resource bare — expo-audio resolves a schemeless name through
 * getIdentifier(name, "raw", pkg), and a name carrying ".mp3" returns 0, which falls back to a
 * broken file path (AudioModule.kt isRawResource/getResourceName/getRawResourceURI). iOS must
 * hand AVURLAsset an absolute file URL (AudioUtils.createAVPlayerItem builds the asset from the
 * URL as given), which the notification side's bundle-root copy answers.
 */

import { Platform } from 'react-native';

import { onPlatform } from '@/__tests__/harness';

jest.mock('expo-file-system/legacy', () => ({
  bundleDirectory: '/var/containers/Bundle/Application/EXAMPLEUUID/Athan.app/',
}));

const { ATHAN_COUNT, athanPreviewSource } = jest.requireActual('@/assets/audio');

describe('athanPreviewSource', () => {
  afterEach(() => onPlatform(Platform.OS === 'android' ? 'ios' : 'android'));

  it('names Android rows by bare resource name, without the extension', () => {
    onPlatform('android');

    expect(athanPreviewSource(0)).toBe('athan1');
    expect(athanPreviewSource(ATHAN_COUNT - 1)).toBe('athan32');
  });

  it('names iOS rows by absolute file URL into the bundle root', () => {
    onPlatform('ios');

    expect(athanPreviewSource(0)).toBe('file:///var/containers/Bundle/Application/EXAMPLEUUID/Athan.app/athan1.mp3');
    expect(athanPreviewSource(ATHAN_COUNT - 1)).toBe(
      'file:///var/containers/Bundle/Application/EXAMPLEUUID/Athan.app/athan32.mp3'
    );
  });

  it('numbers a row source one above its zero-based index', () => {
    onPlatform('android');

    expect(athanPreviewSource(1)).toBe('athan2');
  });

  it('counts one source per row of the sheet', () => {
    expect(ATHAN_COUNT).toBe(32);
  });
});
