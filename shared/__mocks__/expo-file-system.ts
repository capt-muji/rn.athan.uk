// Mock for expo-file-system: only stores/timetableAsset.ts imports it, and
// only the File class's async bytes() read matters. The bytes are settable so
// a test can serve the real committed artifact, a torn truncation of it, or a
// read that stays pending until the test settles it (the in-flight stage).

const state = { bytes: null as Uint8Array | null, deferred: null as null | (() => Promise<Uint8Array>) };

export class File {
  async bytes(): Promise<Uint8Array> {
    if (state.deferred) return state.deferred();
    if (state.bytes === null) throw new Error('mock File: no bytes set (call __setFileBytes)');
    return state.bytes;
  }
}

export const __setFileBytes = (bytes: Uint8Array | null): void => {
  state.bytes = bytes;
  state.deferred = null;
};

/** The next read stays pending until the returned resolver settles it, for the in-flight stage */
export const __deferFileBytes = (deferred: () => Promise<Uint8Array>): void => {
  state.deferred = deferred;
};
