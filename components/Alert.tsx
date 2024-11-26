import { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
  useAnimatedProps,
  withDelay,
  SharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as animationUtils from '@/shared/animation';

import { COLORS, TEXT, ANIMATION, PRAYER } from '@/shared/constants';
import { AlertType, AlertIcon, ScheduleType, AlertPreferences } from '@/shared/types';
import { alertPreferencesAtom, standardScheduleAtom, extraScheduleAtom } from '@/stores/store';
import { setAlertPreference } from '@/stores/actions';
import Icon from '@/components/Icon';
import { isTimePassed } from '@/shared/time';

const ALERT_CONFIGS = [
  { icon: AlertIcon.BELL_SLASH, label: "Off", type: AlertType.Off },
  { icon: AlertIcon.BELL_RING, label: "Notification", type: AlertType.Notification },
  { icon: AlertIcon.VIBRATE, label: "Vibrate", type: AlertType.Vibrate },
  { icon: AlertIcon.SPEAKER, label: "Sound", type: AlertType.Sound }
];

const TIMING_CONFIG = {
  duration: ANIMATION.duration
};

const SPRING_CONFIG = {
  damping: 12,
  stiffness: 500,
  mass: 0.5
}

type SharedValues = {
  fade: SharedValue<number>;
  bounce: SharedValue<number>;
  press: SharedValue<number>;
  colorPos: SharedValue<number>;
};

const createAnimatedStyles = (sharedValues: SharedValues) => ({
  alert: useAnimatedStyle(() => ({
    transform: [{ scale: sharedValues.press.value }]
  })),
  popup: useAnimatedStyle(() => ({
    opacity: sharedValues.fade.value,
    transform: [{
      scale: interpolate(sharedValues.bounce.value, [0, 1], [0.95, 1])
    }]
  }))
});

const createColorAnimatedProps = (sharedValues: ReturnType<typeof animationUtils.colorSharedValues>) => ({
  icon: useAnimatedProps(() => ({
    fill: animationUtils.interpolateColorSharedValue(sharedValues.colorPos)
  }))
});

interface Props { index: number; type: ScheduleType }

export default function Alert({ index, type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  // State
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const alertPreferences = useAtomValue(alertPreferencesAtom) as AlertPreferences;
  const [iconIndex, setIconIndex] = useState<number>(alertPreferences[index] || 0);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Derived State
  const prayer = schedule.today[index];
  const isPassed = isTimePassed(prayer.time);
  const isNext = index === schedule.nextIndex;
  const onLoadColorPos = isPassed || isNext ? 1 : 0;

  // Animations
  const sharedValues = {
    fade: useSharedValue(0),
    bounce: useSharedValue(0),
    press: useSharedValue(1),
    ...animationUtils.colorSharedValues(onLoadColorPos)
  };
  const animatedStyles = createAnimatedStyles(sharedValues);
  const animatedProps = createColorAnimatedProps(sharedValues);

  // Animations Updates
  if (isNext) {
    sharedValues.colorPos.value = withDelay(
      ANIMATION.duration,
      withTiming(1, { duration: ANIMATION.durationSlow })
    );
  };

  // Effects
  useEffect(() => {
    const colorPos = isPopupActive ? 1 : onLoadColorPos;
    sharedValues.colorPos.value = withTiming(colorPos, TIMING_CONFIG);
  }, [isPopupActive]);

  useEffect(() => () => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
  }, []);

  // Handlers
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    setIconIndex(nextIndex);
    setAlertPreference(index, ALERT_CONFIGS[nextIndex].type);

    timeoutRef.current && clearTimeout(timeoutRef.current);

    // Reset and trigger animations
    sharedValues.bounce.value = 0;
    sharedValues.fade.value = withTiming(1, TIMING_CONFIG);
    sharedValues.bounce.value = withSpring(1, SPRING_CONFIG);

    setIsPopupActive(true);

    timeoutRef.current = setTimeout(() => {
      sharedValues.fade.value = withTiming(0, TIMING_CONFIG);
      sharedValues.bounce.value = withSpring(0, SPRING_CONFIG);
      setIsPopupActive(false);
    }, ANIMATION.popupDuration);
  }, [iconIndex, index]);

  const computedStylesPopup = {
    ...PRAYER.shadow.common,
    ...(isStandard ? PRAYER.shadow.standard : PRAYER.shadow.extra)
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => sharedValues.press.value = withSpring(0.9, SPRING_CONFIG)}
        onPressOut={() => sharedValues.press.value = withSpring(1, SPRING_CONFIG)}
        style={styles.iconContainer}
      >
        <Animated.View style={animatedStyles.alert}>
          <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} animatedProps={animatedProps.icon} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, computedStylesPopup, animatedStyles.popup]}>
        <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} color="white" />
        <Text style={styles.label}>{ALERT_CONFIGS[iconIndex].label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  iconContainer: {
    paddingRight: PRAYER.padding.right,
    paddingLeft: 13,
    justifyContent: 'center',
  },
  popup: {
    position: 'absolute',
    alignSelf: 'center',
    right: '100%',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'black',
    gap: 15,
  },
  popupIcon: {
    marginRight: 15
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.activePrayer,
  },
});
