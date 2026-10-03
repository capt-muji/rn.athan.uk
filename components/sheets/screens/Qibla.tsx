import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { useQibla } from '@/hooks/useQibla';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, COLORS, SIZE, SPACING, TEXT } from '@/shared/constants';
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
 * The invitation to wave, shown for a fixed time while the compass warms up behind it.
 *
 * NOTHING MEASURES THE WAVE, deliberately. Reading the accelerometer to verify it cost the compass its own
 * accuracy: the heading needs the accelerometer AND the magnetometer, the 3T's magnetometer tops out at 52Hz,
 * and a second 50Hz subscriber alongside it made the dial lag on exactly the slow, careful turn a qibla asks
 * for. The gesture was never verifiable anyway, only a proxy for the OS having re-estimated its hard iron.
 *
 * So the wait FAILS OPEN. A gate that waits for a gesture can refuse forever on a phone whose magnetometer
 * misbehaves, leaving the user no way through; a timer always ends, and a user who ignores the invitation
 * simply gets what the settling gate alone can give them.
 */
const QiblaCalibration = ({ size }: { size: number }) => (
  <View style={styles.waiting}>
    <View style={styles.instruction}>
      {/* No "calibrate" and no "figure eight": both are engineering words, and the drawing below already
          shows the motion better than a sentence naming it could */}
      <Text style={styles.headline}>Wake up the compass</Text>
      <Text style={styles.message}>Move your phone like this</Text>
    </View>
    <QiblaWave size={size} />
  </View>
);

/**
 * The sheet's own subtitle, which changes when the compass arrives and cross-fades rather than snapping.
 *
 * Two lines stacked and faded against each other, because a swap in place would resize the header mid-fade:
 * the absolute one is taken out of the layout, so the height is whichever line is on top.
 *
 * It fades on the SAME flag the compass does, so the words and the instrument change together.
 */
const QiblaSubtitle = ({ showsCompass }: { showsCompass: boolean }) => {
  const progress = useDerivedValue(() => withTiming(showsCompass ? 1 : 0, { duration: ANIMATION.durationFade }));
  const waiting = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const ready = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View>
      <Animated.Text style={[styles.subtitle, waiting]} numberOfLines={1}>
        Just a moment
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, styles.subtitleOver, ready]} numberOfLines={1}>
        Hold flat and turn slowly
      </Animated.Text>
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

  const size = Math.min(Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2, height * DIAL_HEIGHT_SHARE);
  // The settling gate is the whole wait, and it is the reason there is no timer beside it: it refuses to draw
  // until the heading has stopped drifting across its own 3000ms window, measured at 30 degrees of error on a
  // cold magnetometer against 0.71 once converged
  const showsCompass = bearing !== null && hasHeading;
  const isCalibrating = !showsCompass && !permissionDenied;

  // The user is told the compass has arrived by FEEL, because they are most likely looking at the phone they
  // are moving rather than at its screen
  useEffect(() => {
    if (!showsCompass) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [showsCompass]);

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title='Qibla'
      subtitle={<QiblaSubtitle showsCompass={showsCompass} />}
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
        {/* Mounted only while the hint is up, which is what keeps the accelerometer off behind the compass */}
        {isCalibrating && <QiblaCalibration size={size} />}
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
  headline: {
    color: COLORS.text.primary,
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.sizeDetail,
    textAlign: 'center',
  },
  instruction: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  message: {
    color: COLORS.text.sheetSubtitle,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    textAlign: 'center',
  },
  place: {
    color: COLORS.text.sheetSubtitle,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    lineHeight: TEXT.lineHeight.default,
    textAlign: 'center',
  },
  stage: {
    justifyContent: 'center',
  },
  // Matches the shared header's own subtitle, because this one replaces it for this sheet alone
  subtitle: {
    color: COLORS.text.sheetSubtitle,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    marginTop: SPACING.xs,
  },
  // Stacked rather than swapped, so the header keeps one height through the fade
  subtitleOver: {
    position: 'absolute',
    top: 0,
  },
  waiting: {
    alignItems: 'center',
    gap: SPACING.xxxl,
    // The hint and its figure share the square the dial would have filled, so the pair centres as one block
    // rather than the text sitting at the middle with the drawing hanging below it
    justifyContent: 'center',
  },
});
