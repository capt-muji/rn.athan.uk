import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';

import { useDerivedProgress, useDerivedVeiledBackgroundColor, useDerivedVeiledColor } from '@/hooks/useAnimation';
import { usePrayerAgo } from '@/hooks/usePrayerAgo';
import { ANIMATION, COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { overlayFadeSettledAtom, overlayIsOnAtom } from '@/stores/atoms/overlay';

interface Props {
  type: ScheduleType;
}

/**
 * Displays time elapsed since the previous prayer
 *
 * Shows "now" for the first 60 seconds, then the lettered duration (Xh Ym) inside
 * the catalog sentence. Animates between normal and "recent" color states (≤5 mins).
 * Sinks its ink toward the veil and thins its pill into it while the overlay is open.
 *
 * @param type - Schedule type (Standard or Extra)
 */
export default function PrayerAgo({ type }: Props) {
  const { prayerAgo, minutesElapsed, isReady } = usePrayerAgo(type);

  // Mounted only once ready, so the colours' first-evaluation snap lands on real data
  if (!isReady) return null;

  return <PrayerAgoBadge prayerAgo={prayerAgo} minutesElapsed={minutesElapsed} />;
}

// Exported so tests render the real badge, the calculatePrayerAgo precedent (hooks/usePrayerAgo.ts:19)
export function PrayerAgoBadge({ prayerAgo, minutesElapsed }: { prayerAgo: string; minutesElapsed: number }) {
  const overlayIsOn = useAtomValue(overlayIsOnAtom);
  const fadeSettled = useAtomValue(overlayFadeSettledAtom);

  const isRecent = minutesElapsed <= 5 ? 1 : 0;
  const recentColorOptions = { duration: ANIMATION.durationMedium, easing: Easing.linear };

  // The badge joins the veil on the overlay's own 200ms clock, the treatment the rows carry:
  // the ink sinks toward the veil solid exactly as the rows' glyphs do, while the pill THINS
  // into the veil - the wash's alpha runs down to zero over the veil's own channels, so the
  // veil shows through it unhindered instead of the pill filling toward the opaque solid,
  // which rode above the veil mid-fade with a crisp edge and re-entered effectively complete
  // on the close (T-490 step 4). The pair still sinks together: the ink never reads dark on
  // its own pill (T-375's "fades with the overlay, no gray shift" holds - the hue never moves)
  const veilTarget = overlayIsOn ? 1 : 0;
  const prayerAgoColorStyle = useDerivedVeiledColor(veilTarget, isRecent, {
    fromColor: COLORS.prayerAgo.text,
    toColor: COLORS.feedback.success,
    veilColor: COLORS.gradient.overlay.veil,
    veilDuration: ANIMATION.duration,
    ...recentColorOptions,
  });
  const prayerAgoBackgroundStyle = useDerivedVeiledBackgroundColor(veilTarget, isRecent, {
    fromColor: COLORS.prayerAgo.gradient.start,
    toColor: COLORS.prayerAgo.gradient.end,
    veilColor: COLORS.gradient.overlay.veilThrough,
    veilDuration: ANIMATION.duration,
    ...recentColorOptions,
  });

  // The badge's own cut, mirroring the card's placer (T-490): display flips to none in the
  // worklet evaluation that carries the veil progress to 1 - by then every pixel of the badge
  // has dissolved into the veil solid, so the cut lands on the first frame that no longer
  // shows it, never a settle-gate snap a commit later. On close it flips flex the moment the
  // veil lifts. The words leave by display alone, never through an opacity (T-294)
  const veilProgress = useDerivedProgress(veilTarget, { duration: ANIMATION.duration });
  const badgeCutStyle = useAnimatedStyle(() => ({ display: veilProgress.value >= 1 ? 'none' : 'flex' }));

  // The resting backstop, no longer carrying the transition: the animated cut above overrides
  // it whenever they disagree, and it holds the resting frame should the cut never run
  return (
    <Animated.Text
      style={[
        styles.prayerAgo,
        prayerAgoColorStyle,
        prayerAgoBackgroundStyle,
        badgeCutStyle,
        { display: overlayIsOn && fadeSettled ? 'none' : 'flex' },
      ]}
      numberOfLines={1}>
      {prayerAgo}
    </Animated.Text>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  prayerAgo: {
    textAlign: 'center',
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.py,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: -SPACING.xs,
  },
});
