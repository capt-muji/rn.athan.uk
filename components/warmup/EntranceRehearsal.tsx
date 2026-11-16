/**
 * The overlay entrance's rehearsal (digest 5101 approach B): the same
 * shared-value hook families the entrance runs — the veil and layer
 * opacity, the rows' veiled inks, the ago badge's veiled wash — driven
 * through two real timed legs at zero amplitude, off-screen, so the user's
 * first open is the animation's second run through the same shared worklet
 * code (Hermes compiles per function: one execution anywhere warms every
 * entrance instance).
 *
 * It cannot draw, twice over: the target only ever steps 0 -> EPSILON -> 0,
 * so no interpolateColor channel the mappers compute moves by more than a
 * twentieth of one 8-bit level and every update rounds to no change, and
 * the rig sits at top -10000 (the InitialWidthMeasurement precedent) where
 * no frame of it can reach the display. The settle clock mirrors the
 * family's own — the layer's fade completion is what raises the overlay's
 * flags — so the opacity leg's onSettled drives the legs.
 *
 * The honest limits, recorded in the ticket: per-node style registration
 * and the entrance's inline mappers (the hero's transform, the badge's
 * display cut) still pay at the first open; only the shared-hook families
 * warm here.
 */

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDerivedOpacity, useDerivedVeiledBackgroundColor, useDerivedVeiledColor } from '@/hooks/useAnimation';
import { ANIMATION, COLORS } from '@/shared/constants';
import { markRehearsalSettled } from '@/stores/warmup';

/** Below one 8-bit rounding step in every channel the mappers interpolate */
const REHEARSAL_EPSILON = 0.0001;

/** The leg counter's stops: mount snap, out, back, done */
const LEG_DONE = 3;

export default function EntranceRehearsal() {
  // 0 = mounted (first evaluation snaps and settles), 1 = out leg, 2 = back
  // leg, 3 = both ran. A settle that arrives early (a suspend resume, a
  // resync snap) advances the count the same way — the legs shorten, the
  // ladder never wedges.
  const [leg, setLeg] = useState(0);
  const [target, setTarget] = useState(0);

  const handleSettled = useCallback(() => {
    setLeg((current) => Math.min(current + 1, LEG_DONE));
  }, []);

  const opacityStyle = useDerivedOpacity(target, {
    duration: ANIMATION.duration,
    onSettled: handleSettled,
  });

  // The rows' own tween shapes: the colour leg rides durationSlow inside
  // the veil's own 200ms, exactly as Prayer and Time draw them
  const inkStyle = useDerivedVeiledColor(target, 0, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    veilColor: COLORS.gradient.overlay.veil,
    veilDuration: ANIMATION.duration,
    duration: ANIMATION.durationSlow,
  });

  const washStyle = useDerivedVeiledBackgroundColor(target, 0, {
    fromColor: COLORS.prayerAgo.gradient.start,
    toColor: COLORS.prayerAgo.gradient.end,
    veilColor: COLORS.gradient.overlay.veilThrough,
    veilDuration: ANIMATION.duration,
    duration: ANIMATION.durationSlow,
  });

  useEffect(() => {
    if (leg === 1) setTarget(REHEARSAL_EPSILON);
    else if (leg === 2) setTarget(0);
    else if (leg === LEG_DONE) markRehearsalSettled();
  }, [leg]);

  return (
    <Animated.View
      style={[styles.offscreen, opacityStyle]}
      pointerEvents={'none'}
      accessibilityElementsHidden
      importantForAccessibility={'no-hide-descendants'}>
      <Animated.Text style={[styles.probe, inkStyle]}>{''}</Animated.Text>
      <Animated.View style={[styles.probe, washStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -10000,
    start: 0,
    width: 1,
    height: 1,
  },
  probe: {
    width: 1,
    height: 1,
  },
});
