import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useQibla } from '@/hooks/useQibla';
import { useQiblaShake } from '@/hooks/useQiblaShake';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { FEATURE_FLAGS } from '@/shared/flags';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import QiblaCompass from './QiblaCompass';
import QiblaWave from './QiblaWave';

const SPACE_ABOVE_DIAL = SPACING.xxl;
const SPACE_BELOW_DIAL = SPACING.xxxl;

/**
 * The most of the screen's height the dial may take.
 *
 * Sizing it on width alone overflowed the sheet's own 85% cap on a short screen, and the sheet clamps rather
 * than scrolls, so the overflow was taken off the BOTTOM: the place name ended up against the screen edge
 * with its padding cut away. Bounding by height too keeps the whole column inside the cap.
 */
const DIAL_HEIGHT_SHARE = 0.45;

/** A reading that has not arrived yet, so the readout holds its height from the first frame */
const PENDING = '-';

const oneDecimal = (value: number | undefined): string => value?.toFixed(1) ?? PENDING;

/**
 * The wave the user must perform before the compass opens, and the bar showing how much of it is done.
 *
 * Its OWN component because `useQiblaShake` arms the accelerometer for the life of whatever calls it, and every
 * sheet in this app is mounted from launch: called in the sheet itself it would run the sensor forever
 * (Performance Design Rule 7). Mounted only while the hint is on screen, it arms and unregisters with the hint.
 */
const QiblaCalibration = ({ size, onWaved }: { size: number; onWaved: () => void }) => {
  const { hasWaved } = useQiblaShake(true);

  useEffect(() => {
    if (hasWaved) onWaved();
  }, [hasWaved, onWaved]);

  return (
    <View style={styles.waiting}>
      <Text style={styles.message}>Wave the phone in a figure eight to calibrate the compass.</Text>
      <QiblaWave size={size} />
    </View>
  );
};

/**
 * What the user is told when the qibla cannot be computed, with the one action that fixes it.
 *
 * A bearing needs a position, so a refusal is the end of the feature rather than a degraded version of it. The
 * settings link is offered because the permission cannot be asked for twice: once refused, the system dialog
 * never appears again and the app's own screen is the only route back.
 */
const QiblaPermissionDenied = () => (
  <View style={styles.waiting}>
    <Text style={styles.message}>
      The qibla is worked out from where you are, so it needs location access. Turn it on in Settings, then open this
      sheet again.
    </Text>
    <Pressable
      accessibilityRole='button'
      accessibilityLabel='Open settings'
      testID='qibla-open-settings'
      onPress={() => Linking.openSettings()}>
      <Text style={styles.action}>Open Settings</Text>
    </Pressable>
  </View>
);

export default function BottomSheetQibla() {
  const { width, height } = useWindowDimensions();
  const { bearing, hasHeading, permissionDenied, place, heading, aligned, diagnostic, start, stop } = useQibla();
  const [hasWaved, setHasWaved] = useState(false);

  const size = Math.min(Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2, height * DIAL_HEIGHT_SHARE);
  const headingReady = bearing !== null && hasHeading;

  // THE SHAKE IS THE GATE, which is the owner's requirement: the compass waits for a real wave even once the
  // heading is ready, because the gesture is what re-estimates the hard-iron offset the magnetometer carries,
  // and the wait doubles as the time the heading needs to converge behind it
  const showsCompass = headingReady && hasWaved;
  const isCalibrating = !showsCompass && !permissionDenied;

  // A fresh wave is asked for on every open, because the calibration it performs goes stale with the room
  const open = useCallback(async () => {
    setHasWaved(false);
    await start();
  }, [start]);

  const markWaved = useCallback(() => setHasWaved(true), []);

  // The user is told they may stop by FEEL, because they are watching the phone they are moving rather than the
  // screen. Fires once per arrival, and a compass lost and regained earns a second tap
  useEffect(() => {
    if (!showsCompass) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [showsCompass]);

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title='Qibla'
      subtitle='Turn until it vibrates'
      icon={<IconView type={Icon.COMPASS} size={16} color='rgba(165, 180, 252, 0.8)' />}
      onPresent={open}
      onDismiss={stop}
      perfName='sheet_qibla'
      scrollable={false}
      enableDynamicSizing
      contentCap={0.85}>
      {/* The stage holds the dial's square from the first frame: a dynamically-sized sheet measures its content, so
          reserving nothing would open it at a sliver and then resize under the user once the fix arrives */}
      <View
        testID='qibla-stage'
        style={[styles.stage, { height: size, marginTop: SPACE_ABOVE_DIAL, marginBottom: SPACE_BELOW_DIAL }]}>
        {/* A dial drawn without a live heading would hold its last angle and quietly point the wrong way, which is
            the one thing this feature must never do */}
        {showsCompass && <QiblaCompass size={size} bearing={bearing} heading={heading} aligned={aligned} />}
        {/* Mounted only while the hint is up, which is what keeps the accelerometer off behind the compass */}
        {isCalibrating && <QiblaCalibration size={size} onWaved={markWaved} />}
        {permissionDenied && <QiblaPermissionDenied />}
      </View>
      {/* The place belongs to the compass and arrives with it: shown while the hint is up, it answers a question
          the user has not been asked yet. Its height is held either way, because the sheet sizes itself from its
          content and a line that comes and goes would resize it under them */}
      <Text testID='qibla-place' style={styles.place} numberOfLines={1}>
        {showsCompass ? (place ?? ' ') : ' '}
      </Text>
      {/* The flag is build-time static, so this whole block folds away when it is off. It renders before the
          first reading for the same reason the place line is never conditional */}
      {FEATURE_FLAGS.qiblaDiagnostic && (
        <View testID='qibla-diagnostic'>
          <Text style={styles.place}>{`accuracy ${oneDecimal(diagnostic?.accuracyDegrees)}`}</Text>
          <Text style={styles.place}>{`wants calibration ${diagnostic?.wantsCalibration ?? PENDING}`}</Text>
          <Text style={styles.place}>{`fused heading ${oneDecimal(diagnostic?.fusedHeadingDegrees)}`}</Text>
          <Text style={styles.place}>{`fused error ${oneDecimal(diagnostic?.fusedErrorDegrees)}`}</Text>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  action: {
    color: COLORS.qibla.away.accent,
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.sizeDetail,
    textAlign: 'center',
  },
  message: {
    color: COLORS.text.secondary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    textAlign: 'center',
  },
  place: {
    color: COLORS.text.muted,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    lineHeight: TEXT.lineHeight.default,
    textAlign: 'center',
  },
  stage: {
    justifyContent: 'center',
  },
  waiting: {
    gap: SPACING.xxl,
  },
});
