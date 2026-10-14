/**
 * The bounded boundary-crossing relaunch (stores/language.ts): a direction flip
 * reaches `Updates.reloadAsync` within the convergence cap whatever the
 * scheduling queue holds, while a same-direction pick and a queue that frees in
 * time keep today's behaviour (R1.1 to R1.4, R2.1, R2.2)
 */

import * as Updates from 'expo-updates';
import { getDefaultStore } from 'jotai';
import { I18nManager } from 'react-native';

import { setActiveLocale } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import { commitLanguagePreference, languagePreferenceAtom, lastArmedLanguageAtom } from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// Unlike the sibling suites this mock is not a pass-through: the operation waits
// behind a gate the test controls, which is how a held scheduling queue starves
// the relaunch in production
let mockReleaseQueue: () => void = () => {};
let mockQueueGate: Promise<void> = Promise.resolve();

jest.mock('@/stores/notifications', () => ({
  rescheduleAllForLanguageChange: jest.fn(() => Promise.resolve(true)),
  withSchedulingLock: (operation: () => Promise<unknown>) => mockQueueGate.then(() => operation()),
}));

const store = getDefaultStore();
const reschedule = jest.mocked(rescheduleAllForLanguageChange);
const reloadAsync = jest.mocked(Updates.reloadAsync);
const allowRTL = jest.mocked(I18nManager.allowRTL);
const forceRTL = jest.mocked(I18nManager.forceRTL);

// The gate must be a fresh promise per test: one release would free the queue
// for the rest of the file
beforeEach(() => {
  mockQueueGate = new Promise<void>((resolve) => {
    mockReleaseQueue = resolve;
  });
  jest.useFakeTimers({ now: 0 });
  I18nManager.forceRTL(false);
  jest.clearAllMocks();
  store.set(lastArmedLanguageAtom, '');
  store.set(languagePreferenceAtom, '');
});

afterEach(() => {
  setActiveLocale('en');
  jest.useRealTimers();
});

it('relaunches for the direction flip while the scheduling queue never frees', async () => {
  const committed = commitLanguagePreference('ar');
  await jest.advanceTimersByTimeAsync(9_999);
  expect(reloadAsync).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  expect(jest.mocked(logger.warn)).toHaveBeenCalledWith(
    'LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip'
  );
  expect(forceRTL).toHaveBeenLastCalledWith(true);
  expect(forceRTL.mock.invocationCallOrder.at(-1)!).toBeLessThan(reloadAsync.mock.invocationCallOrder.at(-1)!);
  mockReleaseQueue();
  await committed;
});

it('keeps the converged order and stays silent when the queue frees in time', async () => {
  mockReleaseQueue();
  await commitLanguagePreference('ar');
  expect(reschedule).toHaveBeenCalledTimes(1);
  const arm = reschedule.mock.invocationCallOrder.at(-1)!;
  const allow = allowRTL.mock.invocationCallOrder.at(-1)!;
  const force = forceRTL.mock.invocationCallOrder.at(-1)!;
  const reload = reloadAsync.mock.invocationCallOrder.at(-1)!;
  expect(allow).toBeGreaterThan(arm);
  expect(force).toBeGreaterThan(allow);
  expect(reload).toBeGreaterThan(force);
  expect(forceRTL).toHaveBeenLastCalledWith(true);
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  expect(jest.mocked(logger.warn)).not.toHaveBeenCalledWith(
    expect.stringContaining(
      'LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip'
    )
  );
  expect(jest.getTimerCount()).toBe(0);
});

it('leaves the queued convergence uncancelled after the capped relaunch', async () => {
  const committed = commitLanguagePreference('ar');
  await jest.advanceTimersByTimeAsync(10_000);
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  mockReleaseQueue();
  await committed;
  expect(reschedule).toHaveBeenCalledTimes(1);
});

it('never relaunches a same-direction pick under a held queue', async () => {
  store.set(languagePreferenceAtom, 'ms');
  setActiveLocale('ms');
  const committed = commitLanguagePreference('en');
  await jest.advanceTimersByTimeAsync(10_000);
  expect(reloadAsync).not.toHaveBeenCalled();
  expect(forceRTL).not.toHaveBeenCalled();
  expect(jest.mocked(logger.warn)).not.toHaveBeenCalledWith(
    expect.stringContaining(
      'LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip'
    )
  );
  mockReleaseQueue();
  await committed;
});

it('a refused relaunch under the cap still warns and resolves', async () => {
  reloadAsync.mockRejectedValueOnce(new Error('reload refused'));
  const committed = commitLanguagePreference('ar');
  await jest.advanceTimersByTimeAsync(10_000);
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  await expect(committed).resolves.toBeUndefined();
  expect(jest.mocked(logger.warn)).toHaveBeenCalledWith(
    'LANGUAGE: relaunch failed after the RTL flip',
    expect.objectContaining({ error: expect.any(Error) })
  );
  expect(forceRTL).toHaveBeenLastCalledWith(true);
  mockReleaseQueue();
});
