import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';
import { memo, useLayoutEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/app/Screen';
import { VeilBackdrop } from '@/components/overlay';
import { BackgroundGradients, RamadanDecorations, SettingsButton } from '@/components/ui';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { useChromeDeferred } from '@/hooks/useChromeDeferred';
import { ANIMATION, COLORS, SIZE, SPACING } from '@/shared/constants';
import { perfMark, perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { overlayAtom, overlayIsOnAtom } from '@/stores/atoms/overlay';
import { toggleOverlay } from '@/stores/overlay';

// Navigation re-renders on overlay toggles (scrollEnabled gate) — memoized so
// the flip updates ONLY the pager's native prop, never the page subtrees
const MemoScreen = memo(Screen);
const MemoSettingsButton = memo(SettingsButton);

export default function Navigation() {
  const { bottom } = useSafeAreaInsets();
  const dot0Animation = useAnimationOpacity(1);
  const dot1Animation = useAnimationOpacity(0.25);
  const overlayIsOn = useAtomValue(overlayIsOnAtom);
  const chromeOpacity = useAnimationOpacity(1);
  // Veil + decorations mount past the first content frame (launch chrome
  // defer); the veil pairs with the overlay, which defers on the same cadence
  const chromeDeferred = useChromeDeferred();

  // Per-element veil (ADR-014): chrome (dots, settings, decorations) fades
  // out with the overlay's fade — the old overlay hid it under the gradient
  useLayoutEffect(() => {
    chromeOpacity.animate(overlayIsOn ? 0 : 1, { duration: ANIMATION.duration });
  }, [overlayIsOn, chromeOpacity.animate]);

  const handlePageScrollState = (e: { nativeEvent: { pageScrollState: string } }) => {
    const state = e.nativeEvent.pageScrollState;
    if (state === 'dragging' || state === 'settling') {
      perfMark('pager_swipe_start');
    }
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;

    // Self-heal (chaos 2026-09-08, finding 2): a native drag begun in a
    // momentary overlay-closed instant settles even after scrollEnabled flips
    // back to false. If the pager lands on the other schedule under an open
    // overlay, close the overlay instead of rendering it over the wrong page
    const overlay = getDefaultStore().get(overlayAtom);
    const settledSchedule = position === 0 ? ScheduleType.Standard : ScheduleType.Extra;
    if (overlay.isOn && settledSchedule !== overlay.scheduleType) {
      toggleOverlay(false);
    }

    perfMeasure('pager_page', 'pager_swipe_start', { position });
    dot0Animation.animate(position === 0 ? 1 : 0.25, { duration: ANIMATION.duration });
    dot1Animation.animate(position === 1 ? 1 : 0.25, { duration: ANIMATION.duration });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.navigation.background }}>
      <BackgroundGradients />
      {chromeDeferred && (
        <>
          <Animated.View style={[styles.chromeLayer, chromeOpacity.style]} pointerEvents='box-none'>
            <RamadanDecorations />
          </Animated.View>
          {/* Veil backdrop (ADR-014): the overlay gradient + glow BEHIND content,
              so the veil layer's holes reveal in-place content on the same
              backdrop the old duplicated overlay painted */}
          <VeilBackdrop />
        </>
      )}

      {/* Pages self-constrain (Screen maxWidth) so the pager stays
          full-width and the whole screen stays swipeable */}
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        // Pre-materialize the adjacent page's native view at layout time.
        // ViewPager2's default (OFFSCREEN_PAGE_LIMIT_DEFAULT) creates pages
        // lazily on first swipe, which showed a ~300ms empty page + frame
        // drops the first time a user swiped to Extras after launch.
        offscreenPageLimit={1}
        overdrag={true}
        // Swipes are blocked while the overlay is open (hit-test parity: the
        // old full-screen layer swallowed every gesture; the row hole now
        // lets drags reach the pager, so the pager itself must refuse them)
        scrollEnabled={!overlayIsOn}
        onPageScrollStateChanged={handlePageScrollState}
        onPageSelected={handlePageSelected}>
        <MemoScreen type={ScheduleType.Standard} />
        <MemoScreen type={ScheduleType.Extra} />
      </PagerView>

      <Animated.View
        style={[
          styles.dotsContainer,
          { bottom: Platform.OS === 'android' ? bottom + SPACING.md : Math.max(bottom, SPACING.xl) },
          chromeOpacity.style,
        ]}>
        <View style={styles.buttonWrapper}>
          <MemoSettingsButton />
        </View>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dot0Animation.style]} />
          <Animated.View style={[styles.dot, dot1Animation.style]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chromeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    alignSelf: 'center',
    gap: SPACING.sm,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: SIZE.nav.bottomOffset, // Position above dots
    zIndex: 0, // Lowest z-index - should never appear above sheets or overlays
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    width: SIZE.navigationDot,
    height: SIZE.navigationDot,
    borderRadius: SIZE.navigationDot / 2,
    backgroundColor: COLORS.navigation.dot,
  },
});
