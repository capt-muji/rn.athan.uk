import { LinearGradient } from 'expo-linear-gradient';
import { useAtomValue } from 'jotai';
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { Glow } from '@/components/ui';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, COLORS } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

// Memoized with stabilized props so overlay toggles (which re-render this
// backdrop) never re-render the SVG's native views
const MemoizedGlow = memo(Glow);

/**
 * Veil backdrop for the in-place overlay (ADR-014, pixel-parity revision)
 *
 * Sits INSIDE the underlay (above BackgroundGradients, below the pager
 * content) so the veil's holes reveal content resting on the exact gradient
 * the old duplicated overlay painted behind its copies: the opaque overlay
 * gradient plus the top-left glow BEHIND the hero text (crisp, not tinted).
 * Fades in lockstep with the veil layer — the composite is the original
 * overlay's single fade.
 */
export default function VeilBackdrop() {
  const overlay = useAtomValue(overlayAtom);
  const opacity = useAnimationOpacity(0);
  const window = useWindowDimensions();

  useEffect(() => {
    opacity.animate(overlay.isOn ? 1 : 0, { duration: ANIMATION.duration });
  }, [overlay.isOn, opacity.animate]);

  const isExtra = overlay.scheduleType === ScheduleType.Extra;
  const glowColor = isExtra ? COLORS.glow.overlayExtras : COLORS.glow.overlay;

  // Stable while the window size holds — MemoizedGlow skips re-renders on
  // toggles and re-renders only when the schedule type flips the glow color
  const glowStyle = useMemo(
    () => ({
      top: -window.width / 1.25,
      left: -window.width / 2,
    }),
    [window.width]
  );

  return (
    <Reanimated.View style={[styles.container, opacity.style]} pointerEvents='none'>
      <LinearGradient
        colors={[COLORS.gradient.overlay.start, COLORS.gradient.overlay.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
      <MemoizedGlow color={glowColor} style={glowStyle} />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Same layer as the glow's own zIndex (-1): tie breaks by document
    // order, so the glow (rendered after) sits ABOVE the gradient — the
    // original overlay's stack (gradient z-1, then glow z-1)
    zIndex: -1,
  },
});
