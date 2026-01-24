import { useCallback } from 'react';

import { useAnimationScale, useAnimationOpacity, useAnimationBounce, useAnimationFill } from '@/hooks/useAnimation';
import { COLORS, ANIMATION } from '@/shared/constants';

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
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
  });

  /**
   * Reset popup animations to their initial show state
   * Called when showing the alert popup
   */
  const resetPopupAnimations = useCallback(() => {
    AnimBounce.reset(0);
    AnimOpacity.animate(1, { duration: ANIMATION.durationFast });
    AnimBounce.animate(1);
  }, [AnimBounce, AnimOpacity]);

  /**
   * Hide the popup by animating opacity to 0
   */
  const hidePopup = useCallback(() => {
    AnimOpacity.animate(0, { duration: ANIMATION.durationFast });
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
