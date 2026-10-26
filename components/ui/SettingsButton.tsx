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

  const computedStylesContainer: ViewStyle = {
    backgroundColor: COLORS.settingsButton.background,
    borderColor: COLORS.settingsButton.border,
    shadowColor: COLORS.shadow.button,
    elevation: Platform.OS === 'android' ? ELEVATION.settingsStrong : ELEVATION.subtle,
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
      <SettingsIcon width={ICON_SIZE} height={ICON_SIZE} style={styles.icon} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.rounded,
    borderWidth: 1,
    ...SHADOW.button,
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
});
