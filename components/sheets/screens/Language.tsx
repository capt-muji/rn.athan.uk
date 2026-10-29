import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { commitLanguagePreference, revealLanguageLoader } from '@/stores/language';
import { hideLanguageSheet, setLanguageSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import { filterLanguages } from './languageFilter';
import { pickLanguage } from './languageSheet';

const ITEM_GAP = SPACING.xs;
const SEARCH_GLYPH_SIZE = 16;

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_language';
const CARD_BACKGROUND = 'rgba(99, 102, 241, 0.06)';
const CARD_BORDER = 'rgba(99, 102, 241, 0.15)';

/**
 * The language sheet, on the athan sheet's own pattern: the card, its hint and
 * the purple highlight behind the row in force. The search field is pinned in
 * the card's top piece so it never scrolls, and its query filters the list by
 * name (T-451). A pick commits immediately and closes (D47's no-cancel); the
 * loader covers the wait.
 */
export default function BottomSheetLanguage() {
  const active = currentLocaleId();
  const [query, setQuery] = useState('');
  const [itemHeight, setItemHeight] = useState(0);

  const rows = useMemo(() => filterLanguages(query), [query]);
  const seat = rows.findIndex((entry) => entry.id === active);

  const handleItemLayout = useCallback((e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    setItemHeight((current) => current || height);
  }, []);

  // The seat follows the filtered list, and hides when the language in force is not in it
  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: Math.max(seat, 0) * (itemHeight + ITEM_GAP) }],
      height: itemHeight,
      opacity: seat >= 0 && itemHeight > 0 ? 1 : 0,
    }),
    [seat, itemHeight]
  );

  const cardTop = (
    <View style={styles.cardTop}>
      <Text style={styles.cardHint}>{t('language.chooseHint')}</Text>
      <View style={styles.searchRow}>
        <BottomSheetTextInput
          testID={'language-search'}
          style={styles.searchField}
          value={query}
          onChangeText={setQuery}
          placeholder={t('language.search')}
          placeholderTextColor={COLORS.text.muted}
          returnKeyType={'search'}
          autoCorrect={false}
        />
        <View testID={'language-search-glyph'} style={styles.searchGlyph} pointerEvents={'none'}>
          <IconView type={Icon.SEARCH} size={SEARCH_GLYPH_SIZE} color={COLORS.text.muted} />
        </View>
      </View>
    </View>
  );

  return (
    <Sheet
      setRef={setLanguageSheetModal}
      title={t('settings.language')}
      // No subheading: the title centres against the icon alone
      subtitle={null}
      icon={<IconView type={Icon.GLOBE} size={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['60%']}
      perfName={SHEET_PERF_NAME}
      stackBehavior={'push'}
      pinned={cardTop}
      keyboardBehavior={'interactive'}
      keyboardBlurBehavior={'restore'}
      onDismiss={() => setQuery('')}>
      <View style={styles.cardBody}>
        <View testID={'language-list'} style={styles.listContainer}>
          <Animated.View style={[styles.indicator, indicatorStyle]} />

          {rows.map((entry, index) => (
            <Pressable
              key={entry.id}
              style={styles.option}
              onPress={() =>
                pickLanguage(entry.id, active, commitLanguagePreference, hideLanguageSheet, revealLanguageLoader)
              }
              onLayout={index === 0 ? handleItemLayout : undefined}
              accessibilityRole={'radio'}
              // Which language is in force is carried by the highlight and this state,
              // so a screen reader can tell the rows apart
              accessibilityState={{ selected: entry.id === active }}
              accessibilityLabel={entry.name}>
              {/* The index owns its slot, so a second digit never moves the name off the card's centre */}
              <View style={styles.optionIndexSlot} pointerEvents={'none'}>
                <Text style={styles.optionIndex}>{`${index + 1}.`}</Text>
              </View>
              <Text style={styles.optionLabel}>{entry.name}</Text>
            </Pressable>
          ))}
        </View>

        {rows.length === 0 && <Text style={styles.noMatch}>{t('language.noMatch')}</Text>}
      </View>
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // One card split across the pinned piece and the scrolling one: the corners and
  // the border meet at a butt joint, so the surface reads as one
  cardTop: {
    backgroundColor: CARD_BACKGROUND,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    borderColor: CARD_BORDER,
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  cardBody: {
    backgroundColor: CARD_BACKGROUND,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderTopWidth: 0,
    borderColor: CARD_BORDER,
    padding: SPACING.lg,
    paddingTop: 0,
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  searchRow: {
    marginTop: SPACING.sm,
  },
  searchField: {
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    paddingStart: SPACING.md,
    // The glyph's own room at the trailing edge, so the query never runs under it
    paddingEnd: SPACING.md + SEARCH_GLYPH_SIZE + SPACING.sm,
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
  searchGlyph: {
    position: 'absolute',
    end: SPACING.md,
    width: SEARCH_GLYPH_SIZE,
    height: SEARCH_GLYPH_SIZE,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    // The athan rows carry their height in their controls; these rows carry it here, so the touch room matches
    minHeight: 48,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  optionIndexSlot: {
    position: 'absolute',
    // The owner's order: the index sits at the card's left edge in both directions
    left: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  optionIndex: {
    color: COLORS.text.muted,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
    // Latin digits in a Latin run: an RTL paragraph would otherwise put the period before them
    writingDirection: 'ltr',
  },
  optionLabel: {
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
  noMatch: {
    marginTop: SPACING.md,
    textAlign: 'center',
    color: COLORS.text.muted,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
});
