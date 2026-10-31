/**
 * The athan asset table: the 32 mp3 requires sit inside thunks, so importing
 * the module evaluates nothing - a clip's module resolves on its first play
 * press (digest 5117 A3, owner order 5110: nothing audio initialises at
 * launch). The tabulated durations stay eager for the instant countdown.
 */

const mockResolved: number[] = [];

jest.mock('@/assets/audio/athans/athan1.mp3', () => {
  mockResolved.push(1);
  return 1001;
});
jest.mock('@/assets/audio/athans/athan32.mp3', () => {
  mockResolved.push(32);
  return 1032;
});

type AudioModule = typeof import('../audio');

const loadAudio = (): AudioModule => {
  let audio!: AudioModule;
  jest.isolateModules(() => {
    audio = require('../audio');
  });
  return audio;
};

beforeEach(() => {
  mockResolved.length = 0;
});

describe('the athan asset thunks', () => {
  it('evaluates no clip module at import', () => {
    loadAudio();

    expect(mockResolved).toEqual([]);
  });

  it('resolves a clip module on its first play press, and the resolved module after that', () => {
    const audio = loadAudio();

    expect(audio.athanAudio(0)).toBe(1001);
    expect(audio.athanAudio(31)).toBe(1032);
    expect(mockResolved).toEqual([1, 32]);
  });

  it('keeps the tabulated durations eager, parallel to the clip table', () => {
    const audio = loadAudio();

    expect(audio.ATHAN_DURATION_SECONDS).toHaveLength(32);
    expect(audio.ATHAN_DURATION_SECONDS[0]).toBe(28);
    expect(audio.ATHAN_AUDIOS).toHaveLength(32);
    expect(mockResolved).toEqual([]);
  });
});
