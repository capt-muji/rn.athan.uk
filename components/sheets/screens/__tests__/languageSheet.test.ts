/**
 * The language sheet's staged commit (T-519): a tap stages and ticks, the seat follows the staged row
 * or the locale in force, and a close that carries a foreign staged row reveals the loader, ticks
 * once and commits that row exactly once
 */

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light' },
  impactAsync: jest.fn(() => Promise.resolve()),
}));

import * as Haptics from 'expo-haptics';

import { commitStagedOnClose, seatLocaleFor, stageLanguage, stagesLanguageChange } from '../languageSheet';

// The unit project runs without React Native's timer setup; the commit waits one frame, as the tap did
globalThis.requestAnimationFrame = ((callback: () => void) =>
  setTimeout(callback, 0)) as unknown as typeof requestAnimationFrame;

beforeEach(() => {
  jest.mocked(Haptics.impactAsync).mockClear();
});

describe('the seat’s row', () => {
  it('holds the staged row while one is staged', () => {
    expect(seatLocaleFor('ar', 'en')).toBe('ar');
  });

  it('falls back to the locale in force when nothing is staged', () => {
    expect(seatLocaleFor(null, 'en')).toBe('en');
  });
});

describe('staging a tap', () => {
  it('makes the tapped row the staged candidate and ticks, without committing anything', () => {
    const tick = jest.fn();

    expect(stageLanguage('ar', tick)).toBe('ar');
    expect(tick).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('the staged-commit guard', () => {
  it('commits only a staged row that is not the locale already in force', () => {
    expect(stagesLanguageChange('ar', 'en')).toBe(true);
    expect(stagesLanguageChange('en', 'en')).toBe(false);
    expect(stagesLanguageChange(null, 'en')).toBe(false);
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
