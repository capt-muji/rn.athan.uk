import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View, type ViewInstance, type ViewProps } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { buildCatcherRegions } from '@/components/overlay/catcherGeometry';
import { getOverlayExplanation, getOverlayRow } from '@/components/overlay/overlayContent';
import { PrayerExplanation } from '@/components/prayer';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, OVERLAY, SPACING, STYLES } from '@/shared/constants';
import { perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { closeOverlay, overlayAtom } from '@/stores/overlay';
import { measurementOriginOffsetAtom, measurementsListAtom, setMeasurementOriginOffset } from '@/stores/ui';

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

  const originOffset = useAtomValue(measurementOriginOffsetAtom);

  const originRef = useRef<ViewInstance>(null);

  // onLayout, not a mount effect: the probe must exist in the native tree before it can measure,
  // and a window resize (Mac, iPad) re-fires it, which is exactly when the offset must refresh
  const measureOriginOffset = () => {
    originRef.current?.measureInWindow((x, y) => {
      setMeasurementOriginOffset({ x, y });
    });
  };

  const window = useWindowDimensions();

  // closeOverlay, not toggleOverlay(): the catchers only ever mean "close", and
  // toggleOverlay() re-reads isOn from the store rather than from this render.
  // A tap landing in the frame between an automatic close (the 2 second
  // schedule boundary) and the re-render that drops pointerEvents would have
  // read isOn:false and toggled the overlay back ON, at whatever
  // selectedPrayerIndex was last stored — a stale row, possibly from the
  // previous day. closeOverlay() is a no-op when already closed.
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeOverlay();
  };

  // Back closes the overlay rather than leaving the app, which is what an open veil looks like
  // it should do. Silent on the haptic: closeOverlay, not handleClose, because the press was not
  // a tap on the screen
  useEffect(() => {
    if (!overlay.isOn) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeOverlay();
      return true;
    });
    return () => subscription.remove();
  }, [overlay.isOn]);

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
  const computedStyleContainer: ViewProps['style'] = {
    pointerEvents: overlay.isOn ? 'box-none' : 'none',
    display: visible ? 'flex' : 'none',
  };

  const isExtra = overlay.scheduleType === ScheduleType.Extra;

  // selectedPrayerIndex indexes the sequence's rows; position uses the row List actually renders
  const selectedPrayer = usePrayer(overlay.scheduleType, overlay.selectedPrayerIndex, true);
  const { prayers, displayDate } = usePrayerSequence(overlay.scheduleType);
  const visualRowIndex = getOverlayRow(prayers, displayDate, overlay.scheduleType, overlay.selectedPrayerIndex);

  const catcherRegions = buildCatcherRegions({
    windowWidth: window.width,
    windowHeight: window.height,
    list: listMeasurements.width > 0 ? listMeasurements : null,
    rowIndex: visualRowIndex,
    originOffset,
  });

  // The box flips above the row only when it would otherwise run past the last row of THIS list.
  // A fixed index cannot decide that: Standard lists 6 rows and Extras 4 (5 on Fridays), so
  // `index >= 3` flipped the Extras list's LAST row and drew the box back over the rows above it
  const rowsOnThisList = prayers.filter((prayer) => prayer.belongsToDate === displayDate).length;
  const showInfoBoxAbove = visualRowIndex >= rowsOnThisList - 1 && rowsOnThisList > 1;

  // Root space, not window space: the list rect comes from `measureInWindow`, whose origin on iOS
  // sits above the root view's own, so the measured offset lifts the rect into the space this
  // layer's absolute children are placed in. On Android the two spaces coincide and it reads zero.
  const rowTop = listMeasurements.pageY - originOffset.y + visualRowIndex * STYLES.prayer.height;
  const rowLeft = listMeasurements.pageX - originOffset.x;

  // Anchored to the row edge it hangs from, and never given a height: the box is ~166pt of content,
  // so a fixed 300 left the below-branch hugging the top of an empty box (reading as touching the
  // row) and the above-branch floating its content far from it. Both branches anchor with `top` in
  // the same space; the above-branch lifts itself clear by its own height.
  const computedStyleInfoBox: ViewProps['style'] = showInfoBoxAbove
    ? {
        top: rowTop - SPACING.sm,
        transform: [{ translateY: '-100%' }],
        left: rowLeft,
        width: listMeasurements.width,
      }
    : {
        top: rowTop + STYLES.prayer.height + SPACING.sm,
        left: rowLeft,
        width: listMeasurements.width,
      };

  const { prayerName, explanation, explanationArabic } = getOverlayExplanation(
    overlay.scheduleType,
    selectedPrayer.english
  );

  return (
    <>
      {/* Zero-size, always laid out OUTSIDE the fading container: its own window-space position is
          the offset between the coordinate space `measureInWindow` reports and the root's, which is
          the space the box and the catchers are placed in. Inside, display:none while closed would
          stop it measuring at launch, which is exactly when the offset is needed. */}
      <View
        ref={originRef}
        collapsable={false}
        testID='overlay-origin'
        style={styles.origin}
        onLayout={measureOriginOffset}
      />

      <Reanimated.View testID='overlay-layer' style={[styles.container, computedStyleContainer, layerOpacityStyle]}>
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

        {/* Press-catcher: everything except the selected row closes the overlay.
          All four regions share one name deliberately — they are one dismiss
          target split only for hit-testing around the exempt row, so wherever
          a screen-reader user explores outside that row they hear the same
          thing. Unnamed, they were four anonymous buttons wrapped around the
          content. */}
        {catcherRegions.map((region) => (
          <Pressable
            key={region.id}
            onPress={handleClose}
            accessibilityRole='button'
            accessibilityLabel='Close prayer details'
            style={[styles.catcher, { top: region.top, left: region.left, width: region.width, height: region.height }]}
          />
        ))}
      </Reanimated.View>
    </>
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
  origin: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
  catcher: {
    position: 'absolute',
  },
});
