/**
 * Forward-only language convergence (stores/language.ts): the last-armed stamp
 * gates one locked rescheduling pass, and a bail, a refusal or a death leaves it
 * dirty so the next launch or foreground finishes the job (D34, R3.4, R4.1)
 */

import * as Updates from 'expo-updates';
import { getDefaultStore } from 'jotai';

import { currentLocaleId, setActiveLocale } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import * as SharedNotifications from '@/shared/notifications';
import {
  commitLanguagePreference,
  languagePreferenceAtom,
  lastArmedLanguageAtom,
  reconcileLanguageSurfaces,
} from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';

// The lock's queueing has its own suite (notificationSchedulingLock); here it must
// only pass the operation through, so the wrapper spy sees every call
jest.mock('@/stores/notifications', () => ({
  rescheduleAllForLanguageChange: jest.fn(),
  withSchedulingLock: (operation: () => Promise<unknown>) => operation(),
}));

const store = getDefaultStore();
const rescheduleMock = jest.mocked(rescheduleAllForLanguageChange);

beforeEach(() => {
  jest.clearAllMocks();
  store.set(lastArmedLanguageAtom, '');
  store.set(languagePreferenceAtom, '');
});

afterEach(() => {
  setActiveLocale('en');
});

describe('the record-boundary relaunch', () => {
  it('relaunches when the typography record changes even though the direction does not', async () => {
    // en -> hi: both ltr, but module-scope styles froze the Latin faces, so the context
    // must re-evaluate them the only way available - the crossing relaunch
    const reloadSpy = jest.spyOn(Updates, 'reloadAsync').mockResolvedValue();
    rescheduleMock.mockResolvedValue(true);

    await commitLanguagePreference('hi');

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(store.get(languagePreferenceAtom)).toBe('hi');
    reloadSpy.mockRestore();
  });

  it('keeps the instant switch between locales that share the Latin record', async () => {
    const reloadSpy = jest.spyOn(Updates, 'reloadAsync').mockResolvedValue();
    rescheduleMock.mockResolvedValue(true);

    await commitLanguagePreference('ms');

    expect(reloadSpy).not.toHaveBeenCalled();
    expect(store.get(languagePreferenceAtom)).toBe('ms');
    reloadSpy.mockRestore();
  });
});

describe('reconcileLanguageSurfaces', () => {
  it('resets the channel caches, re-arms once, then stamps the locale', async () => {
    const resetSpy = jest.spyOn(SharedNotifications, 'resetAndroidChannelCaches');
    setActiveLocale('ar');
    store.set(lastArmedLanguageAtom, 'en');
    rescheduleMock.mockResolvedValue(true);

    await reconcileLanguageSurfaces();

    expect(rescheduleMock).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(resetSpy.mock.invocationCallOrder[0]).toBeLessThan(rescheduleMock.mock.invocationCallOrder[0]);
    expect(store.get(lastArmedLanguageAtom)).toBe('ar');
  });

  it('does no rescheduling while the stamp already matches the locale', async () => {
    setActiveLocale('ar');
    store.set(lastArmedLanguageAtom, 'ar');
    rescheduleMock.mockResolvedValue(true);

    await reconcileLanguageSurfaces();

    expect(rescheduleMock).not.toHaveBeenCalled();
    expect(store.get(lastArmedLanguageAtom)).toBe('ar');
  });

  it('leaves the stamp unwritten when the pass bails on an empty cache', async () => {
    setActiveLocale('ar');
    store.set(lastArmedLanguageAtom, 'en');
    rescheduleMock.mockResolvedValue(false);

    await reconcileLanguageSurfaces();

    expect(rescheduleMock).toHaveBeenCalledTimes(1);
    expect(store.get(lastArmedLanguageAtom)).toBe('en');
  });

  it('logs a failed pass and leaves the stamp dirty for the next launch', async () => {
    setActiveLocale('ar');
    store.set(lastArmedLanguageAtom, 'en');
    rescheduleMock.mockRejectedValue(new Error('native refused'));

    await expect(reconcileLanguageSurfaces()).resolves.toBeUndefined();

    expect(store.get(lastArmedLanguageAtom)).toBe('en');
    expect(logger.warn).toHaveBeenCalledWith('LANGUAGE: surface convergence failed, retrying at next launch', {
      error: expect.any(Error),
    });
  });
});

describe('commitLanguagePreference', () => {
  it('persists the pick, switches the locale, and converges behind it', async () => {
    rescheduleMock.mockResolvedValue(true);

    await commitLanguagePreference('th');

    expect(store.get(languagePreferenceAtom)).toBe('th');
    expect(currentLocaleId()).toBe('th');
    expect(rescheduleMock).toHaveBeenCalledTimes(1);
    expect(store.get(lastArmedLanguageAtom)).toBe('th');
  });
});
