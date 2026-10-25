/**
 * JS binding for the native switch-cover module (modules/switchcover).
 *
 * The restart behind an Android language switch destroys the React context before
 * the new one paints, so no JS view can hold the loader's face across that span:
 * the native cover shown here does, in the loader's own values, until the new
 * context's first content commit hides it. Every export resolves having done
 * nothing on a build whose native side is missing, so iOS and Jest skip cleanly.
 */

/** The cover's face, in the loader's own values; every dp field is scaled by the display density natively */
export type SwitchCoverOptions = {
  backgroundColor: string;
  spinnerColor: string;
  spinnerSizeDp: number;
  lineText: string;
  lineColor: string;
  lineSizeDp: number;
  lineMarginTopDp: number;
  lineMaxWidthDp: number;
};

type NativeSwitchCover = {
  show: (cover: SwitchCoverOptions) => Promise<void>;
  hide: () => Promise<void>;
};

let nativeModule: NativeSwitchCover | null | undefined;

const resolveNative = (): NativeSwitchCover | null => {
  if (nativeModule === undefined) {
    // Lazy on purpose: an eager expo import would drag the whole barrel into every
    // suite, and the cover is reached only by a language switch's relaunch
    const expo = require('expo') as {
      requireOptionalNativeModule?: (name: string) => NativeSwitchCover | null;
    };
    nativeModule = expo.requireOptionalNativeModule?.('SwitchCover') ?? null;
  }

  return nativeModule;
};

/** Shows the cover over the activity's content, if the build carries one */
export const showSwitchCover = async (options: SwitchCoverOptions): Promise<void> => {
  await resolveNative()?.show(options);
};

/** Lifts the cover, if one is showing */
export const hideSwitchCover = async (): Promise<void> => {
  await resolveNative()?.hide();
};
