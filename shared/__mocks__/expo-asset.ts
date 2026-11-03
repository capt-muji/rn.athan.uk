// Mock for expo-asset: only stores/timetableAsset.ts imports it, and only
// fromModule(id).hash, .localUri and downloadAsync() matter. Both are settable
// so a test can simulate a metro asset whose content changed (the
// OTA-staleness case) or resolved to no local file, and downloadAsync resolves
// without IO because the mock never serves remote assets.

const state: { hash: string; localUri: string } = {
  hash: 'test-asset-hash',
  localUri: 'file:///mock/london-2026-2076.bin',
};

export const Asset = {
  fromModule: (_module: number) => ({
    get hash() {
      return state.hash;
    },
    downloadAsync: async () => {},
    get localUri() {
      return state.localUri;
    },
  }),
};

export const __setAssetLocalUri = (uri: string | null): void => {
  state.localUri = uri ?? '';
};

export const __setAssetHash = (hash: string): void => {
  state.hash = hash;
};
