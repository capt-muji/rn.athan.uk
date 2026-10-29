/**
 * The language sheet's staged commit (T-476): a tap stages and ticks, and nothing else, while a close
 * that carries a foreign staged row reveals the loader, ticks once and commits that row exactly once
 */

// The staged commit imports the wheel, whose scroll handler uses runOnJS; the unit project runs
// without the animation runtime, so the seam is the identity here
jest.mock('react-native-reanimated', () => ({ runOnJS: (fn: () => void) => fn }));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light' },
  impactAsync: jest.fn(() => Promise.resolve()),
}));

import * as Haptics from 'expo-haptics';

import { filterLanguages } from '../languageFilter';
import { commitStagedOnClose, settleStageLanguage, stageLanguage } from '../languageSheet';

// The unit project runs without React Native's timer setup; the commit waits one frame, as the tap did
globalThis.requestAnimationFrame = ((callback: () => void) =>
  setTimeout(callback, 0)) as unknown as typeof requestAnimationFrame;

beforeEach(() => {
  jest.mocked(Haptics.impactAsync).mockClear();
});

describe('staging a tap', () => {
  it('makes the tapped row the staged candidate and ticks, without committing anything', () => {
    const tick = jest.fn();

    expect(stageLanguage('ar', tick)).toBe('ar');
    expect(tick).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('staging a settle', () => {
  it('makes the settled row the staged candidate, with no tick and no buzz of its own', () => {
    const rows = filterLanguages('');

    expect(settleStageLanguage(rows, 2)).toBe(rows[2].id);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('stages nothing off either end of the list', () => {
    const rows = filterLanguages('');

    expect(settleStageLanguage(rows, -1)).toBeNull();
    expect(settleStageLanguage(rows, rows.length)).toBeNull();
  });

  it('stages nothing over an empty list', () => {
    expect(settleStageLanguage([], 0)).toBeNull();
  });
});

describe('the close boundary', () => {
  it('commits nothing when no row was staged', () => {
    const reveal = jest.fn();
    const commit = jest.fn(() => Promise.resolve());

    expect(commitStagedOnClose(null, 'en', reveal, commit)).toBe(false);
    expect(reveal).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('commits nothing when the staged row is the locale already in force', () => {
    const reveal = jest.fn();
    const commit = jest.fn(() => Promise.resolve());

    expect(commitStagedOnClose('en', 'en', reveal, commit)).toBe(false);
    expect(reveal).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('reveals the loader on the close’s tick, ticks, and commits the staged row one paint later', async () => {
    jest.useFakeTimers();
    const reveal = jest.fn();
    const commit = jest.fn(() => Promise.resolve());

    expect(commitStagedOnClose('ar', 'en', reveal, commit)).toBe(true);
    // The loader stands before the commit's first synchronous stretch can freeze the closing sheet
    expect(reveal).toHaveBeenCalledWith('ar');
    expect(commit).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);

    await jest.runAllTimersAsync();

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('ar');
    jest.useRealTimers();
  });

  it('swallows a refused commit: the loader owns the wait, so the sheet has no failure face', async () => {
    jest.useFakeTimers();
    const commit = jest.fn(() => Promise.reject(new Error('refused')));

    expect(commitStagedOnClose('ar', 'en', jest.fn(), commit)).toBe(true);

    await jest.runAllTimersAsync();

    expect(commit).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
