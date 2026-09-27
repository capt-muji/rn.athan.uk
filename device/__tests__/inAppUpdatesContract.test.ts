/**
 * The shape of expo-in-app-updates, which this project cannot exercise on either of its devices
 *
 * Play In-App Updates only answers for a build Play itself installed, and both test phones carry side-loads, so the
 * usual proof is unavailable until a build reaches an internal test track. These assertions are the guard that is:
 * they read the REAL package, never a mock, and fail here rather than on a user's phone if the version drifts, a
 * function the app calls is renamed, or the Android module stops being declared to autolinking.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require('expo-in-app-updates/package.json') as { version: string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moduleConfig = require('expo-in-app-updates/expo-module.config.json') as {
  platforms: string[];
  android: { modules: string[] };
};

describe('the expo-in-app-updates package', () => {
  it('is pinned to exactly 0.12.0', () => {
    expect(packageJson.version).toBe('0.12.0');
  });

  it('exposes the two functions the app calls', () => {
    const inAppUpdates = jest.requireActual('expo-in-app-updates') as Record<string, unknown>;

    expect(typeof inAppUpdates.checkForUpdate).toBe('function');
    expect(typeof inAppUpdates.startUpdate).toBe('function');
  });

  it('declares its Android module to autolinking', () => {
    expect(moduleConfig.platforms).toContain('android');
    expect(moduleConfig.android.modules).toContain('expo.modules.inappupdates.ExpoInAppUpdatesModule');
  });
});
