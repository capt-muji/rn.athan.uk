import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useSettledWrite } from '@/hooks/useSettledWrite';
import { ANIMATION, COLORS, RADIUS, SIZE } from '@/shared/constants';
import { currentLocaleId, localeDirection } from '@/shared/i18n/locale';

import { REMINDER_SWITCH } from './dim';

/** What a labelled row needs to drive the switch as if it were pressed itself */
export interface ToggleHandle {
  /**
   * The switch's own press: flips the thumb optimistically and defers the
   * write to the thumb animation's settle
   */
  press: () => void;
}

interface ToggleProps {
  value: boolean;
  /**
   * The settled write: called once, with the pressed target, when the thumb's
   * animation settles - never inside the slide. The pressed target, not a
   * flip of the prop: a second press before the first settles supersedes it,
   * and the one write carries the thumb's final position.
   */
  onToggle: (next: boolean) => void;
  /** Fired the moment the switch is pressed, for feedback that belongs to the press itself */
  onPress?: () => void;
  /** Whether a refused press (frozen or disabled) still fires onPress: a row that refuses the write still answers the press */
  feedbackWhenRefused?: boolean;
  disabled?: boolean;
  /** Presses land nothing and render no flip, with none of the disabled dim */
  frozen?: boolean;
  /** What the switch announces; the setting's own label, since the track carries no text */
  accessibilityLabel?: string;
}

/**
 * Raw toggle switch primitive for binary on/off states.
 *
 * Features:
 * - Animated thumb with smooth sliding transition, flipped optimistically on press
 * - The preference write rides the settle: nothing writes during the thumb's slide
 * - Disabled state carried by colour (dim.ts), not opacity
 *
 * @example
 * <Toggle value={isOn} onToggle={(next) => setIsOn(next)} />
 */
const Toggle = forwardRef<ToggleHandle, ToggleProps>(
  ({ value, onToggle, onPress, feedbackWhenRefused, disabled, frozen, accessibilityLabel }, ref) => {
    // RTL travels the thumb the other way: the layout swap owns the inset keys, not the
    // travel. The locale's own direction, not the bridge snapshot: a starved crossing (row 78)
    // renders Arabic while I18nManager still reports the launch direction, and the English
    // travel then pushes the thumb off the track under the RTL layout (row 73)
    const isRTL = localeDirection(currentLocaleId()) === 'rtl';

    // Derived, not effect-driven: every flip re-runs the timing from the
    // thumb's live position on the UI thread, so the knob always converges on
    // the current value. The previous effect + JS-side shared-value
    // assignments raced under fast toggling — the G.3 knob desync and the
    // suspected rapid-press crash (G.8) both live in that race window.
    // First evaluation snaps instead of animating: a toggle mounted in the ON
    // state (persisted preferences) must appear settled, not slide in — the
    // mount behavior of the previous implementation, preserved exactly.
    const { pending, press, settle, generation } = useSettledWrite(onToggle);
    const effective = pending ?? value;

    const isFirstEvaluation = useSharedValue(true);
    const translateX = useDerivedValue(() => {
      const target = effective ? (isRTL ? -SIZE.toggle.translateX : SIZE.toggle.translateX) : 0;
      if (isFirstEvaluation.value) {
        isFirstEvaluation.value = false;
        return target;
      }
      return withTiming(target, { duration: ANIMATION.duration }, (finished) => {
        if (finished) runOnJS(settle)(generation, effective);
      });
    });

    const handlePress = useCallback(() => {
      if (disabled || frozen) {
        // The refusal owns the write, not the feedback: a switch that asks
        // still answers the press
        if (feedbackWhenRefused) onPress?.();
        return;
      }
      onPress?.();
      press(!effective);
    }, [disabled, frozen, feedbackWhenRefused, onPress, press, effective]);

    useImperativeHandle(ref, () => ({ press: handlePress }), [handlePress]);

    const thumbStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    // The dim rides colour (owner order 2026-10-31): the disabled track takes the segment
    // pill's locked pairs and the thumb its locked ink, so the circle reads on the track
    // instead of outshining the row it sits in
    const dimmedTrack = disabled ? (effective ? styles.trackOnDimmed : styles.trackOffDimmed) : null;

    return (
      <Pressable
        accessibilityRole={'switch'}
        // `checked` is what a screen reader announces as on/off; without it the state is
        // carried only by the thumb's position and the track colour
        accessibilityState={{ checked: effective, disabled: disabled === true }}
        accessibilityLabel={accessibilityLabel}
        onPress={handlePress}
        style={[styles.track, effective && styles.trackOn, dimmedTrack]}>
        <Animated.View style={[styles.thumb, thumbStyle, disabled && styles.thumbDimmed]} />
      </Pressable>
    );
  }
);

export default Toggle;

const styles = StyleSheet.create({
  track: {
    width: SIZE.toggle.width,
    height: SIZE.toggle.height,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.interactive.inactive,
    borderWidth: 1,
    borderColor: COLORS.interactive.inactiveBorder,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: COLORS.interactive.active,
    borderColor: COLORS.interactive.activeBorder,
  },
  trackOffDimmed: {
    backgroundColor: REMINDER_SWITCH.track.off.background,
    borderColor: REMINDER_SWITCH.track.off.border,
  },
  trackOnDimmed: {
    backgroundColor: REMINDER_SWITCH.track.on.background,
    borderColor: REMINDER_SWITCH.track.on.border,
  },
  thumbDimmed: {
    backgroundColor: REMINDER_SWITCH.thumbDisabled,
  },
  thumb: {
    width: SIZE.toggle.dotSize,
    height: SIZE.toggle.dotSize,
    borderRadius: SIZE.toggle.dotSize / 2,
    backgroundColor: COLORS.text.primary,
  },
});
