import { BottomSheetFlatList, type BottomSheetFlatListMethods, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { ComponentType, Ref } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type FlatListProps, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { commitLanguagePreference, revealLanguageLoader } from '@/stores/language';
import { hideLanguageSheet, setLanguageSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import { filterLanguages, type LanguageRow } from './languageFilter';
import { pickLanguage } from './languageSheet';
import {
  bandTranslateY,
  centrePad,
  offsetForIndex,
  seatTranslateY,
  snapOffsets,
  wheelScrollHandler,
} from './languageWheel';

const ITEM_GAP = SPACING.xs;
const SEARCH_GLYPH_SIZE = 16;
const BAND_OPACITY = 0.3;

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_language';
const CARD_BACKGROUND = 'rgba(99, 102, 241, 0.06)';
const CARD_BORDER = 'rgba(99, 102, 241, 0.15)';

// The wheel needs the library's own scrollable, which registers itself with the sheet, and the
// animated wrapper is what carries the scroll worklet that drives both bands on the UI thread
type WheelListProps = FlatListProps<LanguageRow> & { ref?: Ref<BottomSheetFlatListMethods> };

// The library's list omits the list props it forwards from its public type, and the animated wrapper
// strips them again; the wheel hands over the plain list's own surface, which both pass straight through
const WheelList = Animated.createAnimatedComponent(BottomSheetFlatList) as unknown as ComponentType<WheelListProps>;

/** The gap a row's own pitch carries, drawn as the list's separator */
const RowGap = () => <View style={styles.rowGap} />;

/**
 * The language sheet as a wheel (T-476): the list settles row by row on its centreline, a faint dim
 * band rides the row a stop would select, and the purple stays on the locale in force for the whole
 * session with the sheet open. The search field is pinned in the card's top piece and filters the
 * rows by name (T-451). A pick commits on the tap and closes (D47's no-cancel); the loader covers the
 * wait.
 */
export default function BottomSheetLanguage() {
  const active = currentLocaleId();
  const [query, setQuery] = useState('');
  const [listHeight, setListHeight] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  const [presented, setPresented] = useState(false);

  const rows = useMemo(() => filterLanguages(query), [query]);
  const seat = rows.findIndex((entry) => entry.id === active);
  const metrics = useMemo(
    () => ({ count: rows.length, listHeight, rowHeight, gap: ITEM_GAP }),
    [rows.length, listHeight, rowHeight]
  );

  const listRef = useRef<BottomSheetFlatListMethods | null>(null);
  const scrollY = useSharedValue(0);

  const handleListLayout = useCallback((e: LayoutChangeEvent) => {
    setListHeight(e.nativeEvent.layout.height);
  }, []);

  const handleItemLayout = useCallback((e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    setRowHeight((current) => current || height);
  }, []);

  // The wheel opens on the locale in force, and re-centres whenever the filtered rows change while
  // the sheet is up: a reseed into the dismissing query clear would scroll a sheet on its way out
  useEffect(() => {
    if (!presented || listHeight === 0 || rowHeight === 0) return;

    const offset = offsetForIndex(metrics, seat >= 0 ? seat : 0);
    scrollY.value = offset;
    listRef.current?.scrollToOffset({ offset, animated: false });
  }, [presented, metrics, seat, listHeight, rowHeight, scrollY]);

  const scrollHandler = useAnimatedScrollHandler(wheelScrollHandler(scrollY), [scrollY]);

  const bandStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: bandTranslateY(metrics, scrollY.value) }],
      height: rowHeight,
    }),
    [metrics, rowHeight]
  );

  // The purple stays on the locale in force: only a filter change can move it to another row, and
  // the filtered-out and off-measure gates are T-451's own
  const seatStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: seatTranslateY(metrics, Math.max(seat, 0), scrollY.value) }],
      height: rowHeight,
      opacity: seat >= 0 && rowHeight > 0 ? 1 : 0,
    }),
    [metrics, seat, rowHeight]
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
      subtitle={t('sheet.closeToSave')}
      icon={<IconView type={Icon.GLOBE} size={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['60%']}
      perfName={SHEET_PERF_NAME}
      stackBehavior={'push'}
      pinned={cardTop}
      hostsScrollable
      keyboardBehavior={'interactive'}
      keyboardBlurBehavior={'restore'}
      onPresent={() => setPresented(true)}
      onDismiss={() => {
        setPresented(false);
        setQuery('');
      }}>
      <View style={styles.cardBody}>
        <View style={styles.wheel}>
          {/* The clip is the viewport gate: neither band can paint over the card on a far scroll */}
          <View testID={'language-band-layer'} style={styles.bandLayer} pointerEvents={'none'}>
            <Animated.View testID={'language-band'} style={[styles.band, bandStyle]} />
            <Animated.View testID={'language-seat'} style={[styles.seat, seatStyle]} />
          </View>

          <WheelList
            testID={'language-list'}
            ref={listRef}
            style={styles.list}
            data={rows}
            keyExtractor={(entry) => entry.id}
            renderItem={({ item, index }) => (
              <Pressable
                style={styles.option}
                onPress={() =>
                  pickLanguage(item.id, active, commitLanguagePreference, hideLanguageSheet, revealLanguageLoader)
                }
                onLayout={index === 0 ? handleItemLayout : undefined}
                accessibilityRole={'radio'}
                // Which language is in force is carried by the highlight and this state,
                // so a screen reader can tell the rows apart
                accessibilityState={{ selected: item.id === active }}
                accessibilityLabel={item.name}>
                {/* The index owns its slot, so a second digit never moves the name off the card's centre */}
                <View style={styles.optionIndexSlot} pointerEvents={'none'}>
                  <Text style={styles.optionIndex}>{`${index + 1}.`}</Text>
                </View>
                <Text style={styles.optionLabel}>{item.name}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={RowGap}
            contentContainerStyle={{
              paddingTop: centrePad(metrics),
              paddingBottom: centrePad(metrics),
            }}
            onLayout={handleListLayout}
            snapToOffsets={snapOffsets(metrics)}
            decelerationRate={'fast'}
            // Every row stays mounted: the picker's census reads them all, and the wheel measures
            // the first one
            initialNumToRender={Math.max(rows.length, 1)}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />
        </View>

        {rows.length === 0 && <Text style={styles.noMatch}>{t('language.noMatch')}</Text>}
      </View>
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // One card split across the pinned piece and the wheel: the corners and
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
    flex: 1,
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
    // Top and bottom at zero stretch the slot over the field's height, the seat the row's index slot takes
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: SEARCH_GLYPH_SIZE,
  },
  wheel: {
    flex: 1,
    marginTop: SPACING.md,
  },
  bandLayer: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // The dim family at the surface's own wash: no text lives in the band, so no text carries its opacity
  band: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    backgroundColor: COLORS.text.muted,
    opacity: BAND_OPACITY,
    borderRadius: RADIUS.md,
  },
  seat: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    backgroundColor: COLORS.interactive.active,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
  },
  list: {
    flex: 1,
  },
  rowGap: {
    height: ITEM_GAP,
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
