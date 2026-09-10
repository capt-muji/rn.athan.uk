import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { buildCatcherRegions } from '@/components/overlay/catcherGeometry';
import { PrayerExplanation } from '@/components/prayer';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
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
 * No content is duplicated and NOTHING visual sits over the page. This layer
 * owns only input (the press-catcher with the selected row exempt) and the
 * extras explanation box, faded by a derived opacity.
 */
export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);

  const [visible, setVisible] = useState(overlay.isOn);

  const layerOpacityStyle = useDerivedOpacity(overlay.isOn ? 1 : 0, { duration: ANIMATION.duration });

  const listMeasurements = useAtomValue(measurementsListAtom);

  const window = useWindowDimensions();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleOverlay();
  };

  // Layout effect: fires synchronously after the commit — the mark measures
  // the true commit span, not scheduler-deferred effect-flush latency
  useLayoutEffect(() => {
    perfMeasure(
      overlay.isOn ? 'overlay_open' : 'overlay_close',
      overlay.isOn ? 'overlay_open_start' : 'overlay_close_start'
    );
  }, [overlay.isOn]);

  // Hold the subtree displayable through the close fade-out, then hide it
  useEffect(() => {
    if (overlay.isOn) {
      setVisible(true);
      return;
    }

    const hideTimer = setTimeout(() => setVisible(false), ANIMATION.duration);
    return () => clearTimeout(hideTimer);
  }, [overlay.isOn]);

  // box-none: catchers catch, the row exempt falls through to the real row
  const computedStyleContainer: ViewStyle = {
    pointerEvents: overlay.isOn ? 'box-none' : 'none',
    display: visible ? 'flex' : 'none',
  };

  const isExtra = overlay.scheduleType === ScheduleType.Extra;

  // selectedPrayerIndex is the prayer's position in the chronological
  // sequence (matches usePrayer/getOverlayTarget elsewhere), not its on-screen
  // row: Extras rows display in canonical rank order (Midnight, Last Third,
  // Suhoor, Duha, Istijaba — see canonicalDisplayOrder), which the raw
  // chronological index does not generally match. Resolve the actual visual
  // row from the selected prayer's name for every position/content lookup
  // below. Standard has no such reordering, so its index is already correct.
  const selectedPrayer = usePrayer(overlay.scheduleType, overlay.selectedPrayerIndex, true);
  const visualRowIndex = isExtra ? EXTRAS_ENGLISH.indexOf(selectedPrayer.english) : overlay.selectedPrayerIndex;

  const catcherRegions = buildCatcherRegions({
    windowWidth: window.width,
    windowHeight: window.height,
    list: listMeasurements.width > 0 ? listMeasurements : null,
    rowIndex: visualRowIndex,
  });

  // Info box geometry: unchanged from the copy era (list measurement anchors)
  const showInfoBoxAbove = visualRowIndex >= 3;
  const INFO_BOX_HEIGHT = 300;

  // Info box positioned below prayer row (for first 3 items)
  const computedStyleInfoBoxBelow: ViewStyle = {
    top: (listMeasurements?.pageY ?? 0) + visualRowIndex * STYLES.prayer.height + STYLES.prayer.height + SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
    height: INFO_BOX_HEIGHT,
  };

  // Info box positioned above prayer row (for items 4+)
  const computedStyleInfoBoxAbove: ViewStyle = {
    top: (listMeasurements?.pageY ?? 0) + visualRowIndex * STYLES.prayer.height - INFO_BOX_HEIGHT - SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
    height: INFO_BOX_HEIGHT,
    justifyContent: 'flex-end',
  };

  const computedStyleInfoBox = showInfoBoxAbove ? computedStyleInfoBoxAbove : computedStyleInfoBoxBelow;

  const prayerName = isExtra ? selectedPrayer.english : null;
  const explanation = isExtra ? EXTRAS_EXPLANATIONS[visualRowIndex] : null;
  const explanationArabic = isExtra ? EXTRAS_EXPLANATIONS_ARABIC[visualRowIndex] : null;

  return (
    <Reanimated.View style={[styles.container, computedStyleContainer, layerOpacityStyle]}>
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
