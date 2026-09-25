/**
 * JS binding for the native widget refresh chain (modules/widgetrefresh).
 *
 * The native module exists only on Android builds; every other resolution
 * answers null and arming is a no-op, so callers need no platform branch.
 */

type NativeWidgetRefresh = {
  armWidgetRefreshChain?: () => void;
  setLockCard?: (enabled: boolean, snapshot: string | null) => void;
};

let nativeModule: NativeWidgetRefresh | null | undefined;

const getNativeModule = (): NativeWidgetRefresh | null => {
  if (nativeModule === undefined) {
    // Lazy on purpose: an eager expo import would drag the whole barrel into
    // every suite and the launch path for a call that runs once per push
    const expo = require('expo') as {
      requireOptionalNativeModule?: (name: string) => NativeWidgetRefresh | null;
    };
    nativeModule = expo.requireOptionalNativeModule?.('ExpoWidgetRefresh') ?? null;
  }
  return nativeModule;
};

export const armWidgetRefreshChain = (): void => {
  getNativeModule()?.armWidgetRefreshChain?.();
};

/**
 * Hands the lock card its setting and the snapshot it renders from. Native
 * stores both and re-renders on every minute tick, so the card keeps
 * counting down with the app closed.
 *
 * @param enabled The user's preference; false clears the card
 * @param snapshot The widget snapshot as JSON, or null to keep the stored one
 */
export const setLockCard = (enabled: boolean, snapshot: string | null): void => {
  getNativeModule()?.setLockCard?.(enabled, snapshot);
};
