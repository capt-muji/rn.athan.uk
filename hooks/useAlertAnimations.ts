import { useCallback } from 'react';

import { useAnimationScale, useAnimationOpacity, useAnimationBounce, useAnimationFill } from '@/hooks/useAnimation';
import { COLORS } from '@/shared/constants';

interface UseAlertAnimationsParams {
  /** Initial position for fill animation (0 = inactive, 1 = active) */
  initialColorPos: number;
}

/**
 * Hook managing Alert component animations
 *
 * Encapsulates scale, opacity, bounce, and fill animations used by the Alert component.
 * Provides animation values and convenience functions for common animation patterns.
 *
 * @param params Animation initialization parameters
 * @returns Animation values and control functions
 *
 * @example
 * const { AnimScale, AnimOpacity, AnimFill, resetPopupAnimations, hidePopup } = useAlertAnimations({
 *   initialColorPos: Prayer.ui.initialColorPos,
 * });
 */
export const useAlertAnimations = ({ initialColorPos }: UseAlertAnimationsParams) => {
  const AnimScale = useAnimationScale(1);
  const AnimOpacity = useAnimationOpacity(0);
  const AnimBounce = useAnimationBounce(0);
  const AnimFill = useAnimationFill(initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  /**
   * Reset popup animations to their initial show state
   * Called when showing the alert popup
   */
  const resetPopupAnimations = useCallback(() => {
    AnimBounce.reset(0);
    AnimOpacity.animate(1, { duration: 75 });
    AnimBounce.animate(1);
  }, [AnimBounce, AnimOpacity]);

  /**
   * Hide the popup by animating opacity to 0
   */
  const hidePopup = useCallback(() => {
    AnimOpacity.animate(0, { duration: 75 });
  }, [AnimOpacity]);

  return {
    AnimScale,
    AnimOpacity,
    AnimBounce,
    AnimFill,
    resetPopupAnimations,
    hidePopup,
  };
};
