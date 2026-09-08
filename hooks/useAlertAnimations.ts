import { useAlertSwapBounce } from '@/hooks/useAlertSwapBounce';
import { useAnimationFill, useAnimationScale } from '@/hooks/useAnimation';
import { COLORS } from '@/shared/constants';

interface UseAlertAnimationsParams {
  /** Initial position for fill animation (0 = inactive, 1 = active) */
  initialColorPos: number;
}

/**
 * Hook managing Alert component animations
 *
 * Encapsulates scale, swap-bounce, and fill animations used by the Alert component.
 *
 * @param params Animation initialization parameters
 * @returns Animation values
 *
 * @example
 * const { AnimScale, AnimSwap, AnimFill } = useAlertAnimations({
 *   initialColorPos: Prayer.ui.initialColorPos,
 * });
 */
export const useAlertAnimations = ({ initialColorPos }: UseAlertAnimationsParams) => {
  const AnimScale = useAnimationScale(1);
  const AnimSwap = useAlertSwapBounce();
  const AnimFill = useAnimationFill(initialColorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
  });

  return {
    AnimScale,
    AnimSwap,
    AnimFill,
  };
};
