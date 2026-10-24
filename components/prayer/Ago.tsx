import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';

import { useDerivedVeiledBackgroundColor, useDerivedVeiledColor } from '@/hooks/useAnimation';
import { usePrayerAgo } from '@/hooks/usePrayerAgo';
import { ANIMATION, COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';

interface Props {
  type: ScheduleType;
}

/**
 * Displays time elapsed since the previous prayer
 *
 * Shows "now" for the first 60 seconds, then the lettered duration (Xh Ym) inside
 * the catalog sentence. Animates between normal and "recent" color states (≤5 mins).
 * Fades toward the veil ink when the overlay is open.
 *
 * @param type - Schedule type (Standard or Extra)
 */
export default function PrayerAgo({ type }: Props) {
  const { prayerAgo, minutesElapsed, isReady } = usePrayerAgo(type);

  // Mounted only once ready, so the colours' first-evaluation snap lands on real data
  if (!isReady) return null;

  return <PrayerAgoBadge prayerAgo={prayerAgo} minutesElapsed={minutesElapsed} />;
}

function PrayerAgoBadge({ prayerAgo, minutesElapsed }: { prayerAgo: string; minutesElapsed: number }) {
  const overlayIsOn = useAtomValue(overlayIsOnAtom);

  const isRecent = minutesElapsed <= 5 ? 1 : 0;
  const recentColorOptions = { duration: ANIMATION.durationMedium, easing: Easing.linear };

  // The overlay's veil wraps both tweens: the badge's ink and its pill wash sink toward the
  // veil solid together, so no glyph renders through an opacity while it fades (derived, so
  // the tween cannot strand on resume)
  const veilTarget = overlayIsOn ? 1 : 0;
  const prayerAgoColorStyle = useDerivedVeiledColor(veilTarget, isRecent, {
    fromColor: COLORS.prayerAgo.text,
    toColor: COLORS.feedback.success,
    veilColor: COLORS.gradient.overlay.veil,
    veilDuration: ANIMATION.durationFade,
    ...recentColorOptions,
  });
  const prayerAgoBackgroundStyle = useDerivedVeiledBackgroundColor(veilTarget, isRecent, {
    fromColor: COLORS.prayerAgo.gradient.start,
    toColor: COLORS.prayerAgo.gradient.end,
    veilColor: COLORS.gradient.overlay.veil,
    veilDuration: ANIMATION.durationFade,
    ...recentColorOptions,
  });

  // Hold the badge drawn through its fade, then drop it: the resting frame under an open
  // overlay shows the backdrop exactly, as the old opacity 0 did
  const [hiddenSettled, setHiddenSettled] = useState(false);
  useEffect(() => {
    if (!overlayIsOn) {
      setHiddenSettled(false);
      return;
    }

    const hideTimer = setTimeout(() => setHiddenSettled(true), ANIMATION.durationFade);
    return () => clearTimeout(hideTimer);
  }, [overlayIsOn]);

  return (
    <Animated.Text
      style={[
        styles.prayerAgo,
        { display: hiddenSettled ? 'none' : 'flex' },
        prayerAgoColorStyle,
        prayerAgoBackgroundStyle,
      ]}>
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
