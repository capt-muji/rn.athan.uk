/**
 * JSX runtime shim restoring global Text prop defaults.
 *
 * React 19 removed defaultProps for function components, and RN 0.86 turned Text
 * into a function component - so the previous `Text.defaultProps` mutation stopped
 * applying entirely and text scaled with the OS accessibility size again (breaking
 * the fixed layout). This shim injects the same defaults (allowFontScaling: false,
 * maxFontSizeMultiplier: 1) into every Text element created through the automatic
 * JSX runtime, which covers all app code plus precompiled libraries that render
 * text (e.g. reanimated's Animated.Text).
 *
 * Known boundary: elements created via React.createElement with a getter-frozen
 * React namespace (classic-runtime npm libs rendering their own Text) are not
 * intercepted - React 19 exports are non-writable. No such usage renders text in
 * this app today.
 *
 * Wired up by the Metro resolver in metro.config.js, which redirects
 * react/jsx-runtime and react/jsx-dev-runtime imports here.
 */

// @ts-expect-error - specifier resolved by the Metro resolver to react/jsx-dev-runtime
import * as DevelopmentRuntime from 'athan-jsx-runtime/dev';
// @ts-expect-error - specifier resolved by the Metro resolver to react/jsx-runtime
import * as ProductionRuntime from 'athan-jsx-runtime/main';

type JsxFactory = (type: unknown, props: Record<string, unknown> | null, ...rest: unknown[]) => unknown;

const TEXT_DEFAULTS = { allowFontScaling: false, maxFontSizeMultiplier: 1 };

// Resolved lazily (and only once): requiring react-native while it is still
// initializing would yield an incomplete export.
let textComponent: unknown;

const getTextComponent = (): unknown => {
  if (textComponent === undefined) {
    try {
      textComponent = require('react-native').Text ?? null;
    } catch {
      textComponent = null;
    }
  }
  return textComponent;
};

const withTextDefaults =
  (factory: JsxFactory): JsxFactory =>
  (type, props, ...rest) => {
    if (type === getTextComponent()) {
      return factory(type, { ...TEXT_DEFAULTS, ...props }, ...rest);
    }
    return factory(type, props, ...rest);
  };

export const jsx: JsxFactory = withTextDefaults(ProductionRuntime.jsx as JsxFactory);
export const jsxs: JsxFactory = withTextDefaults(ProductionRuntime.jsxs as JsxFactory);
export const jsxDEV: JsxFactory = withTextDefaults(DevelopmentRuntime.jsxDEV as JsxFactory);
export const Fragment = ProductionRuntime.Fragment;
