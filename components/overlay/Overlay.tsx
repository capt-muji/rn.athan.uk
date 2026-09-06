import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { buildCatcherRegions } from '@/components/overlay/catcherGeometry';
import { PrayerExplanation } from '@/components/prayer';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import {
  ANIMATION,
  EXTRAS_ENGLISH,
  EXTRAS_EXPLANATIONS,
  EXTRAS_EXPLANATIONS_ARABIC,
  OVERLAY,
  SPACING,
  STYLES,
} from '@/shared/constants';
import { perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { overlayAtom, toggleOverlay } from '@/stores/overlay';
import { measurementsListAtom } from '@/stores/ui';

/**
 * Overlay input layer for the focused prayer view (ADR-014, per-element)
 *
 * No content is duplicated and NOTHING visual sits over the page: the
 * background morphs to the veil gradient behind everything (VeilBackdrop),
 * non-selected content fades itself out, and the selected row / hero / date
 * highlight in place. This layer owns only input (the press-catcher with the
 * selected row exempt) and the extras explanation box.
 *
 * box-none while open: the catcher children remain tappable but the container
 * itself is never a touch target — taps in the row exempt pass through to the
 * REAL in-place row (RN hit-testing stops at the topmost candidate view).
 * While closed the subtree is display:none (ADR-013) — no draw, no
 * hit-testing; the latch delays the hide until the close fade-out finishes.
 */
export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);

  const [visible, setVisible] = useState(overlay.isOn);

  const layerOpacity = useAnimationOpacity(0);

  const listMeasurements = useAtomValue(measurementsListAtom);

  const window = useWindowDimensions();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleOverlay();
  };

  // Layout effect: fires synchronously after the commit — the mark measures
  // the true commit span, not scheduler-deferred effect-flush latency
  useLayoutEffect(() => {
    if (overlay.isOn) {
      setVisible(true);
      perfMeasure('overlay_open', 'overlay_open_start');
      layerOpacity.animate(1, { duration: ANIMATION.duration });
      return;
    }

    perfMeasure('overlay_close', 'overlay_close_start');
    layerOpacity.animate(0, { duration: ANIMATION.duration });

    // Hold the subtree displayable through the fade-out, then hide it
    const hideTimer = setTimeout(() => setVisible(false), ANIMATION.duration);

    return () => clearTimeout(hideTimer);
  }, [overlay.isOn, layerOpacity.animate]);

  // box-none: catchers catch, the row exempt falls through to the real row
  const computedStyleContainer: ViewStyle = {
    pointerEvents: overlay.isOn ? 'box-none' : 'none',
    display: visible ? 'flex' : 'none',
  };

  const catcherRegions = buildCatcherRegions({
    windowWidth: window.width,
    windowHeight: window.height,
    list: listMeasurements.width > 0 ? listMeasurements : null,
    rowIndex: overlay.selectedPrayerIndex,
  });

  // Info box geometry: unchanged from the copy era (list measurement anchors)
  const showInfoBoxAbove = overlay.selectedPrayerIndex >= 3;
  const INFO_BOX_HEIGHT = 300;

  const isExtra = overlay.scheduleType === ScheduleType.Extra;

  // Info box positioned below prayer row (for first 3 items)
  const computedStyleInfoBoxBelow: ViewStyle = {
    top:
      (listMeasurements?.pageY ?? 0) +
      overlay.selectedPrayerIndex * STYLES.prayer.height +
      STYLES.prayer.height +
      SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
    height: INFO_BOX_HEIGHT,
  };

  // Info box positioned above prayer row (for items 4+)
  const computedStyleInfoBoxAbove: ViewStyle = {
    top:
      (listMeasurements?.pageY ?? 0) +
      overlay.selectedPrayerIndex * STYLES.prayer.height -
      INFO_BOX_HEIGHT -
      SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
    height: INFO_BOX_HEIGHT,
    justifyContent: 'flex-end',
  };

  const computedStyleInfoBox = showInfoBoxAbove ? computedStyleInfoBoxAbove : computedStyleInfoBoxBelow;

  const prayerName = isExtra ? EXTRAS_ENGLISH[overlay.selectedPrayerIndex] : null;
  const explanation = isExtra ? EXTRAS_EXPLANATIONS[overlay.selectedPrayerIndex] : null;
  const explanationArabic = isExtra ? EXTRAS_EXPLANATIONS_ARABIC[overlay.selectedPrayerIndex] : null;

  return (
    <Reanimated.View style={[styles.container, computedStyleContainer, layerOpacity.style]}>
      {/* Prayer explanation box (extras only — overlay-native UI, faded by
          this layer; the background morph lives in VeilBackdrop) */}
      {isExtra && prayerName && explanation && explanationArabic && (
        <PrayerExplanation
          prayerName={prayerName}
          explanation={explanation}
          explanationArabic={explanationArabic}
          arrowPosition={showInfoBoxAbove ? 'bottom' : 'top'}
          style={computedStyleInfoBox}
        />
      )}

      {/* Press-catcher: everything except the selected row closes the overlay */}
      {catcherRegions.map((region) => (
        <Pressable
          key={region.id}
          onPress={handleClose}
          style={[styles.catcher, { top: region.top, left: region.left, width: region.width, height: region.height }]}
        />
      ))}
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY.zindexes.overlay,
  },
  catcher: {
    position: 'absolute',
  },
});
