import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { useQibla } from '@/hooks/useQibla';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, COLORS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import QiblaCompass from './QiblaCompass';
import QiblaWave from './QiblaWave';

const SPACE_ABOVE_DIAL = SPACING.xxl;
const SPACE_BELOW_DIAL = SPACING.xxxl;

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_qibla';

/**
 * The most of the screen's height the dial may take.
 *
 * Sizing it on width alone overflowed the sheet's own 85% cap on a short screen, and the sheet clamps rather
 * than scrolls, so the overflow was taken off the BOTTOM: the place name ended up against the screen edge
 * with its padding cut away. Bounding by height too keeps the whole column inside the cap.
 */
const DIAL_HEIGHT_SHARE = 0.45;

/**
 * The invitation to wave, shown until the compass may be drawn.
 *
 * NO SENSOR IS READ FOR THE WAVE, deliberately. Reading the accelerometer to verify it cost the compass its own
 * accuracy: the heading needs the accelerometer AND the magnetometer, the 3T's magnetometer tops out at 52Hz,
 * and a second 50Hz subscriber alongside it made the dial lag on exactly the slow, careful turn a qibla asks
 * for. Where the wave IS measured, on a phone reading Google's fused sensor, it is measured from the attitude
 * that sensor already sends with each heading.
 *
 * The wait does NOT fail open. A heading nothing has vouched for is never drawn, however long the user waits,
 * because a wrong qibla is worse than none.
 */
const QiblaCalibration = ({ size }: { size: number }) => (
  <View style={styles.waiting}>
    <View style={styles.instruction}>
      {/* No "calibrate" and no "figure eight": both are engineering words, and the drawing below already
          shows the motion better than a sentence naming it could */}
      <Text style={styles.headline}>{t('qibla.calibrationHeadline')}</Text>
      <Text style={styles.message}>{t('qibla.calibrationMessage')}</Text>
    </View>
    <QiblaWave size={size} />
  </View>
);

/**
 * What the user is told once the phone has gone as long as a wave takes without finding north.
 *
 * Laid over the foot of the stage rather than added to its column, so the hint above it does not move when this
 * arrives. Mounted only then, which is also what keeps a screen reader from announcing a failure that has not
 * happened.
 */
const QiblaLost = () => (
  <Animated.View testID={'qibla-lost'} style={styles.lost} entering={FadeIn.duration(ANIMATION.durationMedium)}>
    <Text style={styles.message}>{t('qibla.lostTitle')}</Text>
    <Text style={styles.message}>{t('qibla.lostMessage')}</Text>
  </Animated.View>
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
      {/* The WIDER line is the one left in flow, because an absolutely positioned child contributes no width:
          the container would otherwise shrink-wrap the narrower line and clip this one inside it */}
      <Animated.Text style={[styles.subtitle, waiting]} numberOfLines={1}>
        {t('qibla.subtitleWaiting')}
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, styles.subtitleOver, ready]} numberOfLines={1}>
        {t('qibla.subtitleReady')}
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
    <Text style={styles.message}>{t('qibla.permissionDenied')}</Text>
    <Pressable
      accessibilityRole={'button'}
      accessibilityLabel={t('qibla.openSettingsLabel')}
      testID={'qibla-open-settings'}
      onPress={() => Linking.openSettings()}>
      <Text style={styles.action}>{t('qibla.openSettings')}</Text>
    </Pressable>
  </View>
);

export default function BottomSheetQibla() {
  const { width, height } = useWindowDimensions();
  const { bearing, hasHeading, permissionDenied, place, heading, aligned, arrivedQuietly, lost, start, stop } =
    useQibla();

  const size = Math.min(Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2, height * DIAL_HEIGHT_SHARE);
  // What the compass waits for depends on which sensor the phone reads, and the hook decides it: a heading
  // reaches here only once it has passed that gate
  const showsCompass = bearing !== null && hasHeading;
  const isCalibrating = !showsCompass && !permissionDenied;

  // The user is told the compass has arrived by FEEL, because they are most likely looking at the phone they
  // are moving rather than at its screen. One that arrives before the hint could be read announces nothing:
  // nothing was waited for, and the tap would land as part of the sheet opening
  useEffect(() => {
    if (!showsCompass || arrivedQuietly) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [showsCompass, arrivedQuietly]);

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title={t('qibla.title')}
      subtitle={<QiblaSubtitle showsCompass={showsCompass} />}
      icon={<IconView type={Icon.COMPASS} size={16} color={SHEET_ICON_COLOR} />}
      onPresent={start}
      onDismiss={stop}
      perfName={SHEET_PERF_NAME}
      scrollable={false}
      enableDynamicSizing
      contentCap={0.85}>
      {/* The stage holds the dial's square from the first frame: a dynamically-sized sheet measures its content, so
          reserving nothing would open it at a sliver and then resize under the user once the fix arrives */}
      <View
        testID={'qibla-stage'}
        style={[styles.stage, { height: size, marginTop: SPACE_ABOVE_DIAL, marginBottom: SPACE_BELOW_DIAL }]}>
        {/* A dial drawn without a live heading would hold its last angle and quietly point the wrong way, which is
            the one thing this feature must never do */}
        {showsCompass && <QiblaCompass size={size} bearing={bearing} heading={heading} aligned={aligned} />}
        {/* Mounted only while the hint is up, so its looping animation never ticks on behind the compass */}
        {isCalibrating && <QiblaCalibration size={size} />}
        {/* Only ever beside the hint: over a drawn compass it would be reporting a north that was found */}
        {lost && isCalibrating && <QiblaLost />}
        {permissionDenied && <QiblaPermissionDenied />}
      </View>
      {/* The place belongs to the compass and arrives with it: shown while the hint is up, it answers a question
          the user has not been asked yet. Its height is held either way, because the sheet sizes itself from its
          content and a line that comes and goes would resize it under them */}
      <Text testID={'qibla-place'} style={styles.place} numberOfLines={1}>
        {showsCompass ? (place ?? ' ') : ' '}
      </Text>
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
  // Out of the column's flow, so the hint keeps its place when these lines arrive beneath it
  lost: {
    alignItems: 'center',
    bottom: 0,
    gap: SPACING.xs,
    left: 0,
    position: 'absolute',
    right: 0,
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
