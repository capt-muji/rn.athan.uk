import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  type WithSpringConfig,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ANIMATION } from '@/shared/constants';
import type { AlertType } from '@/shared/types';
import { resyncAtom } from '@/stores/ui';

/**
 * Alert icon change-bounce: the owner-picked Pop effect (2026-09-08, of five
 * on-device candidates).
 *
 * A GPU-composited transform bounce on the icon's inner wrapper — the press
 * AnimScale stays on the outer wrapper, so the two never fight. The glyph
 * swap itself (the SVG path change) fires inside the sequence, at the trough
 * of the dip, via the sequence segment callback, so the new glyph lands
 * exactly at the deformation extreme that masks it.
 */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** House pop spring (useAnimation's DEFAULT_SPRING values) — the pop home */
const POP_SPRING: WithSpringConfig = { damping: 12, stiffness: 500, mass: 0.5 };

const SCALE_DIP = 0.6;

type GlyphSwap = (icon: AlertType) => void;

/**
 * Dip to SCALE_DIP, swap the glyph at the trough, spring home with overshoot.
 * `swapGlyph` is null on the Y axis — the swap fires once, on X. `onComplete`
 * fires once the spring genuinely settles (never on a background-interrupted
 * sequence, which is exactly the case the resume guard below handles).
 */
function popSequence(durationMs: number, target: AlertType, swapGlyph: GlyphSwap | null, onComplete?: () => void) {
  'worklet';
  return withSequence(
    withTiming(SCALE_DIP, { duration: durationMs, easing: EASE_OUT }, (finished) => {
      if (finished && swapGlyph) runOnJS(swapGlyph)(target);
    }),
    withSpring(1, POP_SPRING, (finished) => {
      if (finished && onComplete) runOnJS(onComplete)();
    })
  );
}

/**
 * Hook owning the alert icon's change-bounce (the inner-wrapper transform).
 *
 * Mount is settled: both scale axes initialize at 1 and nothing plays until
 * `play` runs on a real atom value change (the Alert change effect, the
 * Toggle first-evaluation-snaps pattern).
 *
 * @returns the animated inner-wrapper style and `play(target, swapGlyph)`,
 *   which runs the pop and hands `target` to `swapGlyph` at the dip trough
 *
 * @example
 * const { style, play } = useAlertSwapBounce();
 * play(AlertType.Sound, setDisplayedAlert);
 */
export const useAlertSwapBounce = () => {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const isBouncing = useRef(false);
  const resync = useAtomValue(resyncAtom);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }, { scaleY: scaleY.value }],
  }));

  const play = useCallback(
    (target: AlertType, swapGlyph: GlyphSwap) => {
      const dip = ANIMATION.alertBounceDip;
      isBouncing.current = true;
      scaleX.value = popSequence(dip, target, swapGlyph, () => {
        isBouncing.current = false;
      });
      scaleY.value = popSequence(dip, target, null);
    },
    [scaleX, scaleY]
  );

  // The dip-swap-spring sequence is short but not instant; if the app is
  // backgrounded mid-bounce, JS timers freeze and the spring's completion
  // callback may never fire, leaving the icon mid-deformation. Snap to rest
  // on resume rather than leave it stranded (ai/features/overlay/spec.md).
  // biome-ignore lint/correctness/useExhaustiveDependencies: resync is a deliberate re-fire trigger, not read in the body
  useEffect(() => {
    if (isBouncing.current) {
      scaleX.value = 1;
      scaleY.value = 1;
      isBouncing.current = false;
    }
  }, [resync, scaleX, scaleY]);

  return { style, play };
};
