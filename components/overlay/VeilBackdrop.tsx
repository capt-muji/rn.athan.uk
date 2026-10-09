import { LinearGradient } from 'expo-linear-gradient';
import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { Glow } from '@/components/ui';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, COLORS, SIZE } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

// Memoized with stabilized props so overlay toggles (which re-render this
// backdrop) never re-render the SVG's native views
const MemoizedGlow = memo(Glow);

/**
 * Veil backdrop for the in-place overlay (ADR-014, pixel-parity revision)
 *
 * Sits INSIDE the underlay (above BackgroundGradients, below the pager
 * content) so the veil reveals content resting on the exact gradient the old
 * duplicated overlay painted behind its copies.
 */
export default function VeilBackdrop() {
  const overlay = useAtomValue(overlayAtom);
  const window = useWindowDimensions();

  const opacityStyle = useDerivedOpacity(overlay.isOn ? 1 : 0, { duration: ANIMATION.duration });

  const isExtra = overlay.scheduleType === ScheduleType.Extra;
  const glowColor = isExtra ? COLORS.glow.overlayExtras : COLORS.glow.overlay;

  // Anchored to the content column so the glow keeps phone proportions on
  // large screens; reduces exactly to the old -width/2 math on phones
  const columnWidth = Math.min(window.width, SIZE.contentMaxWidth);
  const glowStyle = useMemo(
    () => ({
      top: -columnWidth / 1.25,
      left: window.width / 2 - columnWidth,
    }),
    [window.width, columnWidth]
  );

  return (
    <Reanimated.View style={[styles.container, opacityStyle]} pointerEvents='none'>
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
