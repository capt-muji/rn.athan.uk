/**
 * The top safe-area inset a screen may honor.
 *
 * A top inset above the largest any iPhone delivers cannot come from a phone: it names a
 * compat-scaled window, which the system letterboxes precisely so the panel's hazards sit outside
 * it, so the window's own top edge is the true zero. At or below the phone maximum every geometry
 * is a phone's and renders exactly the delivered inset.
 */

/** The largest top inset any iPhone delivers: the 16 Pro-class Dynamic Island */
export const PHONE_MAX_TOP_INSET = 62;

export const honoredTopInset = (top: number): number => (top > PHONE_MAX_TOP_INSET ? 0 : top);
