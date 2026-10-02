import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

export default function BottomSheetQibla() {
  const { width, height } = useWindowDimensions();
  const { bearing, hasHeading, permissionDenied, place, heading, aligned, diagnostic, start, stop } = useQibla();

  const size = Math.min(Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2, height * DIAL_HEIGHT_SHARE);
  const headingReady = bearing !== null && hasHeading;
  // The magnetometer arms cold and the settling gate refuses to draw until it converges, which is the few blank
  // seconds the user was left looking at
  const isCalibrating = !headingReady && !permissionDenied;
  const { progress: shakeProgress } = useQiblaShake(isCalibrating);
  const showsCompass = headingReady;

  // The owner's requirement: the user is told they may stop waving by FEEL, because they are looking at the phone
  // they are moving rather than at the screen. The effect runs only when `showsCompass` itself changes, so the
  // tap lands once per arrival without a guard of its own, and a compass lost and regained earns a second one
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
      onPresent={start}
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
        {isCalibrating && (
          <View style={styles.waiting}>
            <Text style={styles.message}>Wave the phone in a figure eight to calibrate the compass.</Text>
            <QiblaWave size={size} progress={shakeProgress} />
          </View>
        )}
        {permissionDenied && <Text style={styles.message}>The qibla needs your location.</Text>}
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
