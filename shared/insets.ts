/**
 * The top safe-area inset a screen may honor.
 *
 * An inset above the largest any iPhone delivers cannot come from a phone. It names either a
 * panel-class canvas - a window wider than the app's own content column, the tall presentation a
 * folding iPhone's inner display grants a portrait app - whose hazards sit inside it, or a scaled
 * letterbox window, which the system centers precisely so the panel's hazards sit outside it and
 * the window's own top edge is the true zero. Both deliver the same measured number, so the
 * window's width, never the inset's value, tells them apart. At or below the phone maximum every
 * geometry is a phone's and renders exactly the delivered inset.
 */

import { SIZE } from '@/shared/constants';

/** The largest top inset any iPhone delivers: the 16 Pro-class Dynamic Island */
export const PHONE_MAX_TOP_INSET = 62;

export const honoredTopInset = (top: number, windowWidth: number): number =>
  top > PHONE_MAX_TOP_INSET && windowWidth <= SIZE.contentMaxWidth ? 0 : top;
