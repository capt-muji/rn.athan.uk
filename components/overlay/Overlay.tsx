import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useLayoutEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, type ViewProps } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { buildCatcherRegions } from '@/components/overlay/catcherGeometry';
import { getOverlayRow } from '@/components/overlay/overlayContent';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, OVERLAY } from '@/shared/constants';
import { perfMeasure } from '@/shared/perf';
import { closeOverlay, overlayAtom } from '@/stores/overlay';
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

  // selectedPrayerIndex indexes the sequence's rows; position uses the row List actually renders
  const { prayers, displayDate } = usePrayerSequence(overlay.scheduleType);
  const visualRowIndex = getOverlayRow(prayers, displayDate, overlay.scheduleType, overlay.selectedPrayerIndex);

  const catcherRegions = buildCatcherRegions({
    windowWidth: window.width,
    windowHeight: window.height,
    list: listMeasurements.width > 0 ? listMeasurements : null,
    rowIndex: visualRowIndex,
  });

  return (
    <Reanimated.View testID='overlay-layer' style={[styles.container, computedStyleContainer, layerOpacityStyle]}>
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
