import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useLayoutEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, type ViewProps } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { buildCatcherRegions } from '@/components/overlay/catcherGeometry';
import { getOverlayRow } from '@/components/overlay/overlayContent';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, OVERLAY } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { perfMeasure } from '@/shared/perf';
import { overlayFadeSettledAtom } from '@/stores/atoms/overlay';
import { closeOverlay, markOverlayFadeSettled, overlayAtom } from '@/stores/overlay';
import { measurementsListAtom } from '@/stores/ui';

/**
 * Overlay input layer for the focused prayer view (ADR-014, per-element)
 *
 * No content is duplicated and NOTHING visual sits over the page. This layer
 * owns only input (the press-catcher with the selected row exempt) and the
 * extras explanation box, whose face and inks fade inside itself.
 */
export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);
  const fadeSettled = useAtomValue(overlayFadeSettledAtom);

  // The layer's own fade is the family's settle clock: its completion raises
  // the fade-hold flag for every subtree the overlay holds displayable, so
  // one batched commit flips them all after the fade truly ended
  const layerOpacityStyle = useDerivedOpacity(overlay.isOn ? 1 : 0, {
    duration: ANIMATION.duration,
    onSettled: markOverlayFadeSettled,
  });

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

  // Held displayable through the close fade by the fade-settled flag: the
  // display drops when the fade has truly settled, never on a wall timer
  // phase-locked to the JS call
  // box-none: catchers catch, the row exempt falls through to the real row
  const computedStyleContainer: ViewProps['style'] = {
    pointerEvents: overlay.isOn ? 'box-none' : 'none',
    display: overlay.isOn || !fadeSettled ? 'flex' : 'none',
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
    <Reanimated.View testID={'overlay-layer'} style={[styles.container, computedStyleContainer, layerOpacityStyle]}>
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
          accessibilityRole={'button'}
          accessibilityLabel={t('overlay.closeDetails')}
          style={[
            styles.catcher,
            { top: region.top, transform: [{ translateX: region.left }], width: region.width, height: region.height },
          ]}
        />
      ))}
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    // The catchers carry window-space pageX offsets; the pinned Yoga resolves an
    // inset-less absolute against its containing node's direction, so this one holds them physical
    direction: 'ltr',
    zIndex: OVERLAY.zindexes.overlay,
  },
  catcher: {
    position: 'absolute',
  },
});
