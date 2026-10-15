import { useCallback, useEffect, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { commitLanguagePreference } from '@/stores/language';
import { hideLanguageSheet, setLanguageSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import { pickLanguage } from './languageSheet';

const ITEM_GAP = SPACING.xs;

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_language';

/**
 * The language sheet, on the athan sheet's own pattern: the card, its hint and
 * the sliding purple highlight behind the row in force. A pick commits
 * immediately and closes (D47's no-cancel); the loader covers the wait.
 */
export default function BottomSheetLanguage() {
  const active = currentLocaleId();
  const [itemHeight, setItemHeight] = useState(0);
  const translateY = useSharedValue(0);

  const selectedIndex = Math.max(
    LANGUAGE_NAMES.findIndex((entry) => entry.id === active),
    0
  );

  const handleItemLayout = useCallback((e: LayoutChangeEvent) => {
    setItemHeight((current) => current || e.nativeEvent.layout.height);
  }, []);

  // The sheet closes on a pick and the root remounts on a locale change, so the
  // seat is only ever set once per mount: no animated move can occur
  useEffect(() => {
    if (itemHeight === 0) return;

    translateY.value = selectedIndex * (itemHeight + ITEM_GAP);
  }, [selectedIndex, itemHeight, translateY]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
      height: itemHeight,
      opacity: itemHeight > 0 ? 1 : 0,
    }),
    [itemHeight]
  );

  return (
    <Sheet
      setRef={setLanguageSheetModal}
      title={t('settings.language')}
      subtitle={t('language.applyHint')}
      icon={<IconView type={Icon.GLOBE} size={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['60%']}
      perfName={SHEET_PERF_NAME}
      stackBehavior={'push'}>
      <View style={styles.card}>
        <Text style={styles.cardHint}>{t('language.chooseHint')}</Text>

        <View testID={'language-list'} style={styles.listContainer}>
          <Animated.View style={[styles.indicator, indicatorStyle]} />

          {LANGUAGE_NAMES.map((entry, index) => (
            <Pressable
              key={entry.id}
              style={styles.option}
              onPress={() => pickLanguage(entry.id, active, commitLanguagePreference, hideLanguageSheet)}
              onLayout={index === 0 ? handleItemLayout : undefined}
              accessibilityRole={'radio'}
              // Which language is in force is carried by the highlight and this state,
              // so a screen reader can tell the rows apart
              accessibilityState={{ selected: entry.id === active }}
              accessibilityLabel={entry.name}>
              <Text style={styles.optionLabel}>{entry.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: 'rgba(86, 134, 189, 0.725)',
  },
  listContainer: {
    marginTop: SPACING.md,
    gap: ITEM_GAP,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    backgroundColor: COLORS.interactive.active,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingStart: SPACING.md,
  },
  optionLabel: {
    flex: 1,
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
});
