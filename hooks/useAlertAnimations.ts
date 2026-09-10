import { useAlertSwapBounce } from '@/hooks/useAlertSwapBounce';
import { useAnimationScale } from '@/hooks/useAnimation';

/**
 * Alert component animations
 *
 * The fill is derived from state in `Alert.tsx`; only press scale and the
 * change-bounce remain imperative (both are user-driven, foreground events).
 */
export const useAlertAnimations = () => {
  const AnimScale = useAnimationScale(1);
  const AnimSwap = useAlertSwapBounce();

  return { AnimScale, AnimSwap };
};
