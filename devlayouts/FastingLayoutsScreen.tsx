/**
 * The fasting layout harness screen (T-623): the real alert-sheet chrome
 * presenting one variant at a time, with the dev strip at the bottom of the
 * sheet body - the backdrop covers everything outside the sheet, so the
 * strip lives inside it. Dev-only: nothing shipped imports here. The strip's
 * literals are hoisted code values for the string scanner; every visible
 * variant string is a catalog key.
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { Sheet } from '@/components/sheets/parts';
import { IconView } from '@/components/ui';
import { COLORS, HIT_SLOP, type PrayerId, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { prayerLabel, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { VARIANTS } from './registry';
import { harnessIndexFromParam } from './variantParam';

const SUHOOR: PrayerId = 'suhoor';
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const PREV_LABEL = 'Prev';
const NEXT_LABEL = 'Next';

export function FastingLayoutsScreen() {
  const params = useLocalSearchParams<{ v?: string | string[] }>();
  const vKey = Array.isArray(params.v) ? (params.v[0] ?? '') : (params.v ?? '');
  const [index, setIndex] = useState(() => harnessIndexFromParam(vKey, VARIANTS.length));
  const sheetRef = useRef<BottomSheetModal | null>(null);

  // The screenshot pass deep-links each variant; the strip stays live for
  // manual browsing between links
  useEffect(() => {
    setIndex(harnessIndexFromParam(vKey, VARIANTS.length));
  }, [vKey]);

  const handleRef = useCallback((ref: BottomSheetModal | null) => {
    sheetRef.current = ref;
  }, []);

  // The sheet presents on mount: the harness screen is only ever the
  // exploration surface, so it opens straight into the chrome screenshots
  // capture
  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const variant = VARIANTS[index];
  const Variant = variant.Component;

  const goPrev = () => setIndex((current) => Math.max(0, current - 1));
  const goNext = () => setIndex((current) => Math.min(VARIANTS.length - 1, current + 1));

  return (
    <LinearGradient style={styles.screen} colors={[COLORS.gradient.screen.start, COLORS.gradient.screen.end]}>
      <Sheet
        setRef={handleRef}
        title={prayerLabel(SUHOOR)}
        subtitle={t('sheet.closeToSave')}
        icon={<IconView type={Icon.BELL_RING} size={16} color={SHEET_ICON_COLOR} />}
        enableDynamicSizing
        contentCap={0.85}>
        <Variant />
        <View style={styles.strip}>
          <Pressable
            style={styles.stripButton}
            hitSlop={HIT_SLOP.md}
            onPress={goPrev}
            disabled={index === 0}
            accessibilityLabel={PREV_LABEL}>
            <Text style={[styles.stripButtonText, index === 0 ? styles.stripButtonOff : null]}>{PREV_LABEL}</Text>
          </Pressable>
          <Text style={styles.stripLabel}>{`${index + 1} / ${VARIANTS.length} - ${variant.name}`}</Text>
          <Pressable
            style={styles.stripButton}
            hitSlop={HIT_SLOP.md}
            onPress={goNext}
            disabled={index === VARIANTS.length - 1}
            accessibilityLabel={NEXT_LABEL}>
            <Text style={[styles.stripButtonText, index === VARIANTS.length - 1 ? styles.stripButtonOff : null]}>
              {NEXT_LABEL}
            </Text>
          </Pressable>
        </View>
      </Sheet>
    </LinearGradient>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.smd,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
  },
  stripButton: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.py,
  },
  stripButtonText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  stripButtonOff: {
    color: COLORS.text.sheetSubtitle,
    opacity: 0.5,
  },
  stripLabel: {
    flexShrink: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
  },
});
