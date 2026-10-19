/**
 * The cover across an Android language switch (stores/language.ts over modules/switchcover): the
 * loader's own face is shown over the activity before the reload and hidden again when the reload
 * is refused, while iOS never shows a cover and keeps today's bare reload
 */

import type * as Updates from 'expo-updates';
import type * as Vanilla from 'jotai/vanilla';

import type * as SwitchCover from '@/device/switchCover';
import { COLORS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { languageChangingLine } from '@/shared/i18n';
import type * as LanguageStore from '@/stores/language';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// The lock's queueing has its own suite (notificationSchedulingLock); here it must
// only pass the operation through, so the commit's own cover calls are what the tests see
jest.mock('@/stores/notifications', () => ({
  rescheduleAllForLanguageChange: jest.fn(),
  withSchedulingLock: (operation: () => Promise<unknown>) => operation(),
}));

jest.mock('@/device/switchCover', () => ({
  showSwitchCover: jest.fn(() => Promise.resolve()),
  hideSwitchCover: jest.fn(() => Promise.resolve()),
}));

type World = {
  language: typeof LanguageStore;
  updates: typeof Updates;
  cover: typeof SwitchCover;
  store: ReturnType<typeof Vanilla.getDefaultStore>;
  warn: ReturnType<typeof jest.fn>;
};

/**
 * A fresh language store loaded as the given platform.
 *
 * IS_ANDROID is read as the module loads, so the store is required inside the isolate with the
 * platform switched inside the same callback (the __tests__/README.md fresh-load pattern). Its
 * atoms, its store and the cover and updates mocks it closed over all belong to that one world.
 */
const onPlatformWorld = (os: 'ios' | 'android'): World => {
  let world!: World;
  jest.isolateModules(() => {
    require('@/__tests__/harness').onPlatform(os);
    world = {
      language: require('@/stores/language'),
      updates: require('expo-updates'),
      cover: require('@/device/switchCover'),
      store: require('jotai/vanilla').getDefaultStore(),
      warn: require('@/shared/logger').default.warn,
    };
  });

  return world;
};

describe('a crossing switch on Android', () => {
  it('shows the cover in the loader face before the reload, which is called with no arguments', async () => {
    const world = onPlatformWorld('android');

    await world.language.commitLanguagePreference('ar');

    const show = jest.mocked(world.cover.showSwitchCover);
    // The cover must carry the loader's own face, so the restart span shows what the tap did;
    // '#fff' and 260 mirror the loader's own line colour and cap literals
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith({
      backgroundColor: COLORS.navigation.rootBackground,
      spinnerColor: COLORS.navigation.activityIndicator,
      spinnerSizeDp: SIZE.activityIndicator,
      lineText: languageChangingLine('ar'),
      lineColor: '#fff',
      lineSizeDp: TEXT.size,
      lineMarginTopDp: SIZE.activityIndicator / 2 + SPACING.xxxl,
      lineMaxWidthDp: 260,
    });
    expect(show.mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(world.updates.reloadAsync).mock.invocationCallOrder[0]
    );
    expect(world.updates.reloadAsync).toHaveBeenCalledWith();
    expect(world.cover.hideSwitchCover).not.toHaveBeenCalled();
  });

  it('hides the cover when the reload is refused', async () => {
    const world = onPlatformWorld('android');
    jest.mocked(world.updates.reloadAsync).mockRejectedValueOnce(new Error('reload refused'));

    await world.language.commitLanguagePreference('ar');

    expect(world.cover.showSwitchCover).toHaveBeenCalledTimes(1);
    expect(world.cover.hideSwitchCover).toHaveBeenCalledTimes(1);
  });

  it('relaunches bare and holds the face when the cover refuses to show', async () => {
    const world = onPlatformWorld('android');
    jest.mocked(world.cover.showSwitchCover).mockRejectedValueOnce(new Error('cover refused'));

    await world.language.commitLanguagePreference('ar');

    expect(world.updates.reloadAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(world.warn)).toHaveBeenCalledWith(
      'LANGUAGE: the switch cover refused to show, relaunching bare',
      expect.objectContaining({ error: expect.any(Error) })
    );
    // A bare reload still fulfils into death, so the loader face stays up
    expect(world.store.get(world.language.languageCommitBusyAtom)).toBe(true);
  });

  it('swallows a hide that fails after a refused reload, so the switch recovery still runs', async () => {
    const world = onPlatformWorld('android');
    jest.mocked(world.updates.reloadAsync).mockRejectedValueOnce(new Error('reload refused'));
    jest.mocked(world.cover.hideSwitchCover).mockRejectedValueOnce(new Error('cover stuck'));

    await expect(world.language.commitLanguagePreference('ar')).resolves.toBeUndefined();
  });

  it('shows nothing for a switch that keeps the same script, which never reloads', async () => {
    const world = onPlatformWorld('android');

    await world.language.commitLanguagePreference('ms');

    expect(world.cover.showSwitchCover).not.toHaveBeenCalled();
    expect(world.updates.reloadAsync).not.toHaveBeenCalled();
  });
});

describe('a crossing switch on iOS', () => {
  it('never shows the cover and reloads with no arguments', async () => {
    const world = onPlatformWorld('ios');

    await world.language.commitLanguagePreference('ar');

    expect(world.cover.showSwitchCover).not.toHaveBeenCalled();
    expect(world.cover.hideSwitchCover).not.toHaveBeenCalled();
    expect(world.updates.reloadAsync).toHaveBeenCalledWith();
  });
});
