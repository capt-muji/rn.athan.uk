/**
 * The athan sound sheet saves the row tapped when it closes. Athan 1 is index 0, the value a truthiness check
 * mistakes for no choice, so every case runs across every row rather than a convenient one.
 *
 * It also plays one preview at a time on a single player that is replaced when the row changes, and the status it
 * reads can still belong to the replaced player. A status trusted from the wrong player stops a preview the moment
 * it starts, or shows the previous clip's seconds.
 */

import {
  displayedSoundSelection,
  hasSoundDraft,
  isPreviewFinished,
  type PreviewPlayback,
  previewRemainingSeconds,
} from '../soundSheet';

// assets/audio/index.ts lists 32 athans; the module cannot be imported here because jest has no mp3 transform
const ROWS = Array.from({ length: 32 }, (_, index) => index);

const PLAYER = 'current-player';
const RELEASED = 'released-player';

// Reported clip lengths are not whole seconds; these span the shortest and longest athans in 0.7 s steps
const DURATIONS = Array.from({ length: 18 }, (_, step) => (190 + step * 7) / 10);

// Distinct per row, so a lookup one row out shows up as a wrong number
const TABULATED = ROWS.map((row) => 100 + row);

const playback = (overrides: Partial<PreviewPlayback>): PreviewPlayback => ({
  playingIndex: 4,
  playerId: PLAYER,
  statusId: PLAYER,
  playing: false,
  currentTime: 0,
  duration: 0,
  ...overrides,
});

describe('displayedSoundSelection', () => {
  it('highlights the row tapped, Athan 1 included, whatever was saved', () => {
    const wrong: string[] = [];

    for (const draft of ROWS) {
      for (const saved of ROWS) {
        const shown = displayedSoundSelection(draft, saved);
        if (shown !== draft) wrong.push(`tapped ${draft}, saved ${saved}, shown ${shown}`);
      }
    }

    expect(wrong).toEqual([]);
  });

  it('highlights the saved athan until a row is tapped', () => {
    for (const saved of ROWS) expect(displayedSoundSelection(null, saved)).toBe(saved);
  });
});

describe('hasSoundDraft', () => {
  it('has a choice to save for every row tapped, Athan 1 included', () => {
    const dropped = ROWS.filter((draft) => !hasSoundDraft(draft));

    expect(dropped).toEqual([]);
  });

  it('has nothing to save when no row was tapped', () => {
    expect(hasSoundDraft(null)).toBe(false);
  });
});

describe('isPreviewFinished', () => {
  it('ends the preview when the current player stops at the end of its clip, up to a tenth of a second short', () => {
    const missed: string[] = [];

    for (const duration of DURATIONS) {
      for (const currentTime of [duration - 0.1, duration - 0.05, duration, duration + 0.2]) {
        if (!isPreviewFinished(playback({ duration, currentTime }))) missed.push(`${currentTime} of ${duration}`);
      }
    }

    expect(missed).toEqual([]);
  });

  it('never ends a preview on a status left by the released player, however finished it looks', () => {
    const reaped: string[] = [];

    for (const playingIndex of ROWS) {
      for (const duration of DURATIONS) {
        const stale = playback({ playingIndex, statusId: RELEASED, duration, currentTime: duration });
        if (isPreviewFinished(stale)) reaped.push(`row ${playingIndex}, ${duration}`);
      }
    }

    expect(reaped).toEqual([]);
  });

  it('keeps a preview that is still playing, even at the end of its clip', () => {
    for (const duration of DURATIONS) {
      expect(isPreviewFinished(playback({ playing: true, duration, currentTime: duration }))).toBe(false);
    }
  });

  it('keeps a preview paused or stopped more than a tenth of a second short of the end', () => {
    for (const duration of DURATIONS) {
      for (const currentTime of [duration - 0.11, duration - 1, duration / 2, 0.3]) {
        expect(isPreviewFinished(playback({ duration, currentTime }))).toBe(false);
      }
    }
  });

  it('keeps a new player that has not reported a length, or has not moved, however short its clip', () => {
    expect(isPreviewFinished(playback({ currentTime: 0.3, duration: 0 }))).toBe(false);
    expect(isPreviewFinished(playback({ currentTime: 0, duration: 0 }))).toBe(false);
    expect(isPreviewFinished(playback({ currentTime: 0, duration: 0.05 }))).toBe(false);
  });

  it('does nothing when no row is playing', () => {
    expect(isPreviewFinished(playback({ playingIndex: null, duration: 25, currentTime: 25 }))).toBe(false);
  });
});

describe('previewRemainingSeconds', () => {
  it('shows 0 when no row is playing, whatever the status says', () => {
    for (const statusId of [PLAYER, RELEASED]) {
      expect(
        previewRemainingSeconds(playback({ playingIndex: null, statusId, duration: 25, currentTime: 3 }), TABULATED)
      ).toBe(0);
    }
  });

  it("shows each row's tabulated seconds, not the released player's leftover 22, until the current player reports", () => {
    const wrong: string[] = [];

    for (const playingIndex of ROWS) {
      const stale = previewRemainingSeconds(
        playback({ playingIndex, statusId: RELEASED, duration: 25, currentTime: 3 }),
        TABULATED
      );
      const unreported = previewRemainingSeconds(playback({ playingIndex, duration: 0, currentTime: 0 }), TABULATED);
      if (stale !== 100 + playingIndex) wrong.push(`row ${playingIndex} stale showed ${stale}`);
      if (unreported !== 100 + playingIndex) wrong.push(`row ${playingIndex} unreported showed ${unreported}`);
    }

    expect(wrong).toEqual([]);
  });

  it.each([
    [30, 0, 30],
    [30, 0.4, 30],
    [30, 0.6, 29],
    [29.5, 0, 30],
    [19.3, 0, 19],
    [30, 29.6, 0],
  ])('rounds the current player at %d s with %d s played to %i', (duration, currentTime, shown) => {
    expect(previewRemainingSeconds(playback({ duration, currentTime }), TABULATED)).toBe(shown);
  });

  it('stays within half a second of the time left and never counts back up as the clip plays', () => {
    const wrong: string[] = [];

    for (const duration of DURATIONS) {
      let previous = Number.POSITIVE_INFINITY;
      for (let quarter = 0; quarter * 0.25 <= duration; quarter += 1) {
        const currentTime = quarter * 0.25;
        const shown = previewRemainingSeconds(playback({ duration, currentTime }), TABULATED);
        if (Math.abs(shown - (duration - currentTime)) > 0.5)
          wrong.push(`${currentTime} of ${duration} showed ${shown}`);
        if (shown > previous) wrong.push(`${currentTime} of ${duration} rose to ${shown}`);
        previous = shown;
      }
    }

    expect(wrong).toEqual([]);
  });

  it('never shows a negative count when the position runs past the length', () => {
    for (const duration of DURATIONS) {
      for (const overshoot of [0.4, 0.6, 1, 5]) {
        expect(previewRemainingSeconds(playback({ duration, currentTime: duration + overshoot }), TABULATED)).toBe(0);
      }
    }
  });
});
