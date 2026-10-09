/**
 * JS binding for the native widget refresh chain (modules/widgetrefresh).
 *
 * One call starts all three revivers of the minute tick: the alarm that
 * carries the cadence, a 15-minute WorkManager watchdog that survives an OEM
 * force-stop, and an ACTION_TIME_TICK listener that re-arms every system
 * minute while this process lives. Each covers a window the others cannot.
 *
 * The native module exists only on Android builds; every other resolution
 * answers null and arming is a no-op, so callers need no platform branch.
 */

type NativeWidgetRefresh = { armWidgetRefreshChain?: () => void };

let nativeModule: NativeWidgetRefresh | null | undefined;

export const armWidgetRefreshChain = (): void => {
  if (nativeModule === undefined) {
    // Lazy on purpose: an eager expo import would drag the whole barrel into
    // every suite and the launch path for a call that runs once per push
    const expo = require('expo') as {
      requireOptionalNativeModule?: (name: string) => NativeWidgetRefresh | null;
    };
    nativeModule = expo.requireOptionalNativeModule?.('ExpoWidgetRefresh') ?? null;
  }
  nativeModule?.armWidgetRefreshChain?.();
};
