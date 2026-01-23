import { Platform, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/app/Screen';
import BackgroundGradients from '@/components/BackgroundGradients';
import SettingsButton from '@/components/SettingsButton';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

export default function Navigation() {
  const { bottom } = useSafeAreaInsets();
  const dot0Animation = useAnimationOpacity(1);
  const dot1Animation = useAnimationOpacity(0.25);

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;

    dot0Animation.animate(position === 0 ? 1 : 0.25, { duration: ANIMATION.duration });
    dot1Animation.animate(position === 1 ? 1 : 0.25, { duration: ANIMATION.duration });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#031a4c' }}>
      <BackgroundGradients />

      <PagerView style={{ flex: 1 }} initialPage={0} overdrag={true} onPageSelected={handlePageSelected}>
        <Screen type={ScheduleType.Standard} />
        <Screen type={ScheduleType.Extra} />
      </PagerView>

      <View style={[styles.dotsContainer, { bottom: Platform.OS === 'android' ? 40 : bottom }]}>
        <View style={styles.buttonWrapper}>
          <SettingsButton />
        </View>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dot0Animation.style]} />
          <Animated.View style={[styles.dot, dot1Animation.style]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    alignSelf: 'center',
    gap: 8,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 25, // Position above dots
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cf98f4',
  },
});
