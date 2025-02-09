import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/app/Screen';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setPagePosition, setPopupTimesExplained, getPopupTimesExplained } from '@/stores/ui';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Navigation() {
  const { bottom } = useSafeAreaInsets();

  const dot0Animation = useAnimationOpacity(1);
  const dot1Animation = useAnimationOpacity(0.25);
  const gradient1Animation = useAnimationOpacity(1);

  const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const position = e.nativeEvent.position;

    dot0Animation.animate(position === 0 ? 1 : 0.25, { duration: ANIMATION.duration });
    dot1Animation.animate(position === 1 ? 1 : 0.25, { duration: ANIMATION.duration });
    gradient1Animation.animate(position === 0 ? 1 : 0, { duration: ANIMATION.duration });

    setPagePosition(position);

    if (position === 1 && getPopupTimesExplained() === 0) setPopupTimesExplained(1);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Screen 2 background */}
      <LinearGradient
        colors={['#180050', '#0b0026']}
        locations={[0, 1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: -1, y: 0.25 }}
      />

      {/* Screen 1 background */}
      <AnimatedLinearGradient
        colors={['#1b003e', '#2f0042']}
        locations={[0, 1]}
        style={[StyleSheet.absoluteFillObject, gradient1Animation.style]}
        start={{ x: -1, y: 0.25 }}
      />

      <PagerView style={{ flex: 1 }} initialPage={0} overdrag={true} onPageSelected={handlePageSelected}>
        <Screen type={ScheduleType.Standard} />
        <Screen type={ScheduleType.Extra} />
      </PagerView>

      <View style={[styles.dotsContainer, { bottom: bottom + 20 }]}>
        <Animated.View style={[styles.dot, dot0Animation.style]} />
        <Animated.View style={[styles.dot, dot1Animation.style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});
