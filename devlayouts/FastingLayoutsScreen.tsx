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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { Sheet } from '@/components/sheets/parts';
import { IconView } from '@/components/ui';
import { COLORS, HIT_SLOP, type PrayerId, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { prayerLabel, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { type R2Selection, r2Seed } from './r2/model';
import { R2Provider, useR2 } from './r2/parts';
import type { R4Design } from './r4/FastingCardR4';
import { r4Seed } from './r4/model';
import { R4SheetBody } from './r4/R4SheetBody';
import type { R5Design } from './r5/FastingCardR5';
import { r5Seed } from './r5/model';
import { R5SheetBody } from './r5/R5SheetBody';
import type { R6Design } from './r6/FastingCardR6';
import { r6Seed } from './r6/model';
import { R6SheetBody } from './r6/R6SheetBody';
import { VARIANTS } from './registry';
import { harnessIndexFromParam } from './variantParam';

const SUHOOR: PrayerId = 'suhoor';
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const PREV_LABEL = 'Prev';
const NEXT_LABEL = 'Next';
const SAVE_LABEL = 'Save';
const R4_LABEL = 'R4';
const R5_LABEL = 'R5';
const R6_LABEL = 'R6';

/** The deep link's r4 design number; null outside 1-5 means variant mode */
const r4DesignFromParam = (value: string | string[] | undefined): R4Design | null => {
  const first = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  const requested = Number.parseInt(first, 10);
  if (!Number.isFinite(requested) || requested < 1 || requested > 5) return null;
  return requested as R4Design;
};

/** The deep link's r5 design number; null outside 1-10 means the other modes */
const r5DesignFromParam = (value: string | string[] | undefined): R5Design | null => {
  const first = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  const requested = Number.parseInt(first, 10);
  if (!Number.isFinite(requested) || requested < 1 || requested > 10) return null;
  return requested as R5Design;
};

/** The deep link's r6 design number; null outside 1-10 means the other modes */
const r6DesignFromParam = (value: string | string[] | undefined): R6Design | null => {
  const first = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  const requested = Number.parseInt(first, 10);
  if (!Number.isFinite(requested) || requested < 1 || requested > 10) return null;
  return requested as R6Design;
};

/** The harness chrome's Save control: commits the draft so the tense flips */
function SaveButton() {
  const { save } = useR2();
  return (
    <Pressable style={styles.stripButton} hitSlop={HIT_SLOP.md} onPress={save} accessibilityLabel={SAVE_LABEL}>
      <Text style={styles.stripButtonText}>{SAVE_LABEL}</Text>
    </Pressable>
  );
}

export function FastingLayoutsScreen() {
  const params = useLocalSearchParams<{
    v?: string | string[];
    r4?: string | string[];
    r5?: string | string[];
    r6?: string | string[];
    state?: string | string[];
    bare?: string | string[];
  }>();
  const vKey = firstParam(params.v);
  const r4Design = r4DesignFromParam(params.r4);
  const r5Design = r5DesignFromParam(params.r5);
  const r6Design = r6DesignFromParam(params.r6);
  const bare = firstParam(params.bare) === '1';
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
  // The round-2 rows name their opening set; the round-1 rows keep their own state;
  // the round-4, round-5 and round-6 sheet bodies seed from the state param
  const seed: R2Selection = useMemo(
    () =>
      r6Design
        ? r6Seed(params.state)
        : r5Design
          ? r5Seed(params.state)
          : r4Design
            ? r4Seed(params.state)
            : r2Seed(variant.open ?? 'every'),
    [r6Design, r5Design, r4Design, params.state, variant.open]
  );

  const goPrev = () => setIndex((current) => Math.max(0, current - 1));
  const goNext = () => setIndex((current) => Math.min(VARIANTS.length - 1, current + 1));

  const sheet = (
    <Sheet
      setRef={handleRef}
      title={prayerLabel(SUHOOR)}
      subtitle={t('sheet.closeToSave')}
      icon={<IconView type={Icon.BELL_RING} size={16} color={SHEET_ICON_COLOR} />}
      enableDynamicSizing
      contentCap={0.85}>
      {r6Design ? (
        <>
          <R6SheetBody design={r6Design} seed={seed} />
          {!bare && <R6Strip design={r6Design} />}
        </>
      ) : r5Design ? (
        <>
          <R5SheetBody design={r5Design} seed={seed} />
          {!bare && <R5Strip design={r5Design} />}
        </>
      ) : r4Design ? (
        <>
          <R4SheetBody design={r4Design} seed={seed} />
          {!bare && <R4Strip design={r4Design} />}
        </>
      ) : (
        <R2Provider seed={seed}>
          <Variant />
          {!bare && (
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
              <SaveButton />
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
          )}
        </R2Provider>
      )}
    </Sheet>
  );

  return (
    <LinearGradient style={styles.screen} colors={[COLORS.gradient.screen.start, COLORS.gradient.screen.end]}>
      {sheet}
    </LinearGradient>
  );
}

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

/** The round-4 strip: design navigation only, hidden from bare frames */
function R4Strip({ design }: { readonly design: R4Design }) {
  const router = useRouter();

  const move = (next: number) => {
    router.setParams({ r4: String(next) });
  };

  return (
    <View style={styles.strip}>
      <Pressable
        style={styles.stripButton}
        hitSlop={HIT_SLOP.md}
        onPress={() => move(design - 1)}
        disabled={design === 1}
        accessibilityLabel={PREV_LABEL}>
        <Text style={[styles.stripButtonText, design === 1 ? styles.stripButtonOff : null]}>{PREV_LABEL}</Text>
      </Pressable>
      <Text style={styles.stripLabel}>{`${R4_LABEL} ${design} / 5`}</Text>
      <Pressable
        style={styles.stripButton}
        hitSlop={HIT_SLOP.md}
        onPress={() => move(design + 1)}
        disabled={design === 5}
        accessibilityLabel={NEXT_LABEL}>
        <Text style={[styles.stripButtonText, design === 5 ? styles.stripButtonOff : null]}>{NEXT_LABEL}</Text>
      </Pressable>
    </View>
  );
}

/** The round-5 strip: design navigation only, hidden from bare frames */
function R5Strip({ design }: { readonly design: R5Design }) {
  const router = useRouter();

  const move = (next: number) => {
    router.setParams({ r5: String(next) });
  };

  return (
    <View style={styles.strip}>
      <Pressable
        style={styles.stripButton}
        hitSlop={HIT_SLOP.md}
        onPress={() => move(design - 1)}
        disabled={design === 1}
        accessibilityLabel={PREV_LABEL}>
        <Text style={[styles.stripButtonText, design === 1 ? styles.stripButtonOff : null]}>{PREV_LABEL}</Text>
      </Pressable>
      <Text style={styles.stripLabel}>{`${R5_LABEL} ${design} / 10`}</Text>
      <Pressable
        style={styles.stripButton}
        hitSlop={HIT_SLOP.md}
        onPress={() => move(design + 1)}
        disabled={design === 10}
        accessibilityLabel={NEXT_LABEL}>
        <Text style={[styles.stripButtonText, design === 10 ? styles.stripButtonOff : null]}>{NEXT_LABEL}</Text>
      </Pressable>
    </View>
  );
}

/** The round-6 strip: design navigation only, hidden from bare frames */
function R6Strip({ design }: { readonly design: R6Design }) {
  const router = useRouter();

  const move = (next: number) => {
    router.setParams({ r6: String(next) });
  };

  return (
    <View style={styles.strip}>
      <Pressable
        style={styles.stripButton}
        hitSlop={HIT_SLOP.md}
        onPress={() => move(design - 1)}
        disabled={design === 1}
        accessibilityLabel={PREV_LABEL}>
        <Text style={[styles.stripButtonText, design === 1 ? styles.stripButtonOff : null]}>{PREV_LABEL}</Text>
      </Pressable>
      <Text style={styles.stripLabel}>{`${R6_LABEL} ${design} / 10`}</Text>
      <Pressable
        style={styles.stripButton}
        hitSlop={HIT_SLOP.md}
        onPress={() => move(design + 1)}
        disabled={design === 10}
        accessibilityLabel={NEXT_LABEL}>
        <Text style={[styles.stripButtonText, design === 10 ? styles.stripButtonOff : null]}>{NEXT_LABEL}</Text>
      </Pressable>
    </View>
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
