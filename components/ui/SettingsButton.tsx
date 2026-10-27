import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import SettingsIcon from '@/assets/icons/svg/settings.svg';
import { useAnimationScale } from '@/hooks/useAnimation';
import { COLORS, ELEVATION, HIT_SLOP, RADIUS, SHADOW, SIZE } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { showSettingsSheet } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ICON_SIZE = 18;
const BUTTON_WIDTH = 39;

export default function SettingsButton() {
  const AnimScale = useAnimationScale(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showSettingsSheet();
  };

  // Android's outline rule draws a shadow only from an opaque background, so the fill is
  // baked opaque at its measured composite over the local gradient. The owner's 2026-10-27
  // ruling halves the tint's strength (25.5% alpha, #4c21bb) while the bake stays opaque
  // so the outline - and the shadow it casts - survives; the same ruling dials the border
  // and the icon down a notch on Android alone
  const computedStylesContainer: ViewStyle =
    Platform.OS === 'android'
      ? {
          backgroundColor: '#4e23bc',
          borderColor: 'rgba(116, 80, 207, 0.51)',
          shadowColor: '#0a0426',
          elevation: 10,
        }
      : {
          backgroundColor: COLORS.settingsButton.background,
          borderColor: COLORS.settingsButton.border,
          ...SHADOW.button,
          shadowColor: COLORS.shadow.button,
          elevation: ELEVATION.subtle,
        };

  return (
    <AnimatedPressable
      hitSlop={HIT_SLOP.lg}
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}
      accessibilityRole={'button'}
      // An icon-only control, so the glyph is all a sighted user needs and a screen reader gets nothing
      accessibilityLabel={t('settingsButton.label')}>
      <SettingsIcon
        width={ICON_SIZE}
        height={ICON_SIZE}
        style={[styles.icon, Platform.OS === 'android' && styles.iconAndroid]}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.rounded,
    borderWidth: 1,
    zIndex: 0,
    // The margins hold the 43px slot so the flanking dots never move
    width: BUTTON_WIDTH,
    height: BUTTON_WIDTH,
    justifyContent: 'center',
    marginHorizontal: (SIZE.button.icon - BUTTON_WIDTH) / 2,
    alignItems: 'center',
  },
  icon: {
    color: COLORS.icon.settings,
  },
  iconAndroid: {
    opacity: 0.9,
  },
});
