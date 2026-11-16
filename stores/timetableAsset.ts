/**
 * The artifact's IO seam: the only module that knows the artifact is a metro
 * asset. Jest maps the .bin require to a stub and mocks both Expo packages,
 * so the real code here runs under test.
 */

import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

/** The bundled artifact's metro module, resolved lazily so the asset registry is never touched at import */
const requireArtifactModule = (): number => require('@/assets/data/london-2026-2076.bin') as number;

/** The artifact's content hash as metro recorded it at build time, synchronously */
export const artifactHash = (): string => {
  const asset = Asset.fromModule(requireArtifactModule());
  if (typeof asset.hash !== 'string' || asset.hash.length === 0) {
    throw new Error('The timetable asset carries no hash; it was not bundled by metro');
  }
  return asset.hash;
};

/**
 * The artifact's bytes, read from the app package. A bundled asset resolves
 * through one async native hop (a copy out of the APK on Android); the read
 * itself is whole-file, so the bytes are complete or the call throws.
 */
export const loadArtifactBytes = async (): Promise<Uint8Array> => {
  const asset = Asset.fromModule(requireArtifactModule());
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('The timetable asset resolved to no local file');

  const bytes = await new File(asset.localUri).bytes();
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) throw new Error('The timetable asset read as no bytes');
  return bytes;
};
