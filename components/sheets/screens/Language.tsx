import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { memo, useCallback, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId, type LocaleId, localeVersionAtom } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { commitLanguagePreference, revealLanguageLoader } from '@/stores/language';
import { setLanguageSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import { commitStagedOnClose, seatLocaleFor, stageLanguage } from './languageSheet';

const ITEM_GAP = SPACING.xs;

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_language';
const CARD_BACKGROUND = 'rgba(99, 102, 241, 0.06)';
const CARD_BORDER = 'rgba(99, 102, 241, 0.15)';

/** Every shipped language in the picker's own codepoint order, each row numbered by its whole-list place */
const ROWS: readonly { id: LocaleId; name: string; position: number }[] = LANGUAGE_NAMES.map((entry, index) => ({
  id: entry.id,
  name: entry.name,
  position: index + 1,
}));

interface LanguageItemProps {
  index: number;
  position: number;
  name: string;
  /** Whether the purple seat holds this row: the row a close would save */
  isSeated: boolean;
  /** Whether this row is the locale in force */
  isSelected: boolean;
  closeToSave: string;
  onStage: (index: number) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}

/**
 * Presentational language row. Memoized with primitive props only, so a seat move re-renders just the
 * two rows that trade it, never the whole picker
 */
function LanguageItemImpl({
  index,
  position,
  name,
  isSeated,
  isSelected,
  closeToSave,
  onStage,
  onLayout,
}: LanguageItemProps) {
  const handlePress = useCallback(() => onStage(index), [onStage, index]);

  return (
    <Pressable
      style={styles.option}
      onPress={handlePress}
      onLayout={onLayout}
      accessibilityRole={'radio'}
      // Which language is in force is the seat's state and which one a close would save is the seated
      // row's, so a screen reader hears the same two states the sheet draws
      accessibilityState={{ selected: isSelected, checked: isSeated }}
      accessibilityLabel={isSeated ? `${name}, ${closeToSave}` : name}>
      {/* The index owns its slot, so a second digit never moves the name off the card's centre */}
      <View style={styles.optionIndexSlot} pointerEvents={'none'}>
        <Text style={[styles.optionIndex, isSeated && styles.optionIndexSeated]}>{`${position}.`}</Text>
      </View>
      <Text style={styles.optionLabel}>{name}</Text>
    </Pressable>
  );
}

const LanguageItem = memo(LanguageItemImpl);

/**
 * The language sheet as a plain numbered list (T-519): every shipped row in one freely scrolling
 * list, the purple seat on the locale in force when it opens, and a tap staging its row as the
 * candidate the close carries. The sheet's close is the one commit boundary (D47's no-cancel), and
 * the loader covers the wait.
 */
export default function BottomSheetLanguage() {
  const active = currentLocaleId();
  // The sheet re-renders on the close's own commit, so the seat converges onto the locale it saved
  // while the sheet is already closed and reopens settled
  useAtomValue(localeVersionAtom);
  const [staged, setStaged] = useState<LocaleId | null>(null);
  const [rowHeight, setRowHeight] = useState(0);

  // The staged row is read synchronously at the close, before any state write re-derives the rows
  const stagedRef = useRef<LocaleId | null>(null);

  // The staged row is drawn as well as held: the reader hears what a close will save
  const holdStaged = useCallback((next: LocaleId | null) => {
    stagedRef.current = next;
    setStaged(next);
  }, []);

  // Measure first row to get consistent height
  const handleItemLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (rowHeight === 0) {
        setRowHeight(e.nativeEvent.layout.height);
      }
    },
    [rowHeight]
  );

  // The sound sheet's own tap impact: the seat's move onto the row is the pick's whole answer
  const tapImpact = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stageRow = useCallback(
    (index: number) => {
      holdStaged(stageLanguage(ROWS[index].id, tapImpact));
    },
    [holdStaged, tapImpact]
  );

  const handleDismiss = useCallback(() => {
    // Read and clear the staged row before any state write, so no reset may race the close's commit
    const candidate = stagedRef.current;
    holdStaged(null);
    commitStagedOnClose(candidate, active, revealLanguageLoader, commitLanguagePreference);
  }, [active, holdStaged]);

  const seatLocale = seatLocaleFor(staged, active);
  const seatIndex = ROWS.findIndex((row) => row.id === seatLocale);

  // The seat holds its row's own slot in the list: one pitch per row below the first
  const seatStyle = {
    transform: [{ translateY: seatIndex * (rowHeight + ITEM_GAP) }],
    height: rowHeight,
    opacity: rowHeight > 0 ? 1 : 0,
  };

  // The close point is written on the sheet and in the seated row's own label, so a reader is told
  // what a close will do to the row under the finger
  const closeToSave = t('sheet.closeToSave');

  return (
    <Sheet
      setRef={setLanguageSheetModal}
      title={t('settings.language')}
      subtitle={closeToSave}
      icon={<IconView type={Icon.GLOBE} size={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['85%']}
      perfName={SHEET_PERF_NAME}
      stackBehavior={'push'}
      suppressCloseHaptic
      onDismiss={handleDismiss}>
      <View style={styles.card}>
        <View testID={'language-list'} style={styles.listContainer}>
          {/* The purple seat, absolutely placed behind the rows it slides between */}
          <View testID={'language-seat'} style={[styles.seat, seatStyle]} />

          {ROWS.map((row, index) => (
            <LanguageItem
              key={row.id}
              index={index}
              position={row.position}
              name={row.name}
              isSeated={row.id === seatLocale}
              isSelected={row.id === active}
              closeToSave={closeToSave}
              onStage={stageRow}
              onLayout={index === 0 ? handleItemLayout : undefined}
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    padding: SPACING.lg,
  },
  listContainer: {
    marginTop: SPACING.md,
    gap: ITEM_GAP,
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
    color: COLORS.text.sheetDim,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
    // Latin digits in a Latin run: an RTL paragraph would otherwise put the period before them
    writingDirection: 'ltr',
  },
  // The seated row's number: the one ink the sheet keeps white-on-purple beside the always-white name
  optionIndexSeated: {
    color: COLORS.text.primary,
  },
  optionLabel: {
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
});
