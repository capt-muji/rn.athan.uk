import * as Haptics from 'expo-haptics';
import { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, interpolateColor, useDerivedValue } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { TEXT, SPACING, RADIUS, COLORS, ANIMATION } from '@/shared/constants';
import { AlertType, Icon } from '@/shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SegmentOption {
  value: AlertType;
  label: string;
  icon: Icon;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  selected: AlertType;
  onSelect: (value: AlertType) => void;
  disabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEGMENT_COLORS = {
  selected: '#fff',
  unselected: 'rgb(95, 133, 177)',
};

// =============================================================================
// ANIMATED SEGMENT OPTION
// =============================================================================

interface AnimatedSegmentOptionProps {
  option: SegmentOption;
  isSelected: boolean;
  onPress: () => void;
}

function AnimatedSegmentOption({ option, isSelected, onPress }: AnimatedSegmentOptionProps) {
  const progress = useDerivedValue(() => withTiming(isSelected ? 1 : 0, { duration: ANIMATION.duration }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [SEGMENT_COLORS.unselected, SEGMENT_COLORS.selected]),
  }));

  const selectedIconOpacity = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const unselectedIconOpacity = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable style={styles.option} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.iconLayer, unselectedIconOpacity]}>
          <IconView type={option.icon} size={13} color={SEGMENT_COLORS.unselected} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, selectedIconOpacity]}>
          <IconView type={option.icon} size={13} color={SEGMENT_COLORS.selected} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, labelStyle]}>{option.label}</Animated.Text>
    </Pressable>
  );
}

// =============================================================================
// SEGMENTED CONTROL
// =============================================================================

/**
 * Animated segmented control for selecting alert types.
 * Features smooth indicator sliding and icon color transitions.
 *
 * @example
 * <SegmentedControl
 *   options={ALERT_OPTIONS}
 *   selected={currentAlert}
 *   onSelect={setAlert}
 * />
 */
export default function SegmentedControl({ options, selected, onSelect, disabled }: SegmentedControlProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const padding = 3;

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === selected), [options, selected]);
  const optionWidth = containerWidth > 0 ? (containerWidth - padding * 2) / options.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(selectedIndex * optionWidth, { duration: ANIMATION.duration }) }],
    width: optionWidth,
  }));

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.container, disabled && styles.disabled]} onLayout={handleLayout}>
      {containerWidth > 0 && <Animated.View style={[styles.indicator, indicatorStyle]} />}
      {options.map((option) => (
        <AnimatedSegmentOption
          key={option.value}
          option={option}
          isSelected={selected === option.value}
          onPress={() => {
            if (!disabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }
          }}
        />
      ))}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  disabled: {
    opacity: 0.4,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    backgroundColor: COLORS.interactive.active,
    borderRadius: RADIUS.md - 2,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.md - 2,
  },
  iconContainer: {
    width: 13,
    height: 13,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  label: {
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.regular,
  },
});
