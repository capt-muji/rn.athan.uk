/**
 * The Sahur row's fasting section: the mode picker with its explanations,
 * the white-days add-on, and the preview of what the current selection arms.
 * First-frame settled - values change, nothing animates in.
 */

import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { formatShownDate } from '@/components/day/shownDate';
import LabeledToggle from '@/components/sheets/parts/LabeledToggle';
import type { PrayerId } from '@/shared/constants';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { FASTING_MODES, type FastingDesignation, fastingEvaluator, upcomingFastingDays } from '@/shared/fasting';
import { prayerLabel, type TranslationKey, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import * as PrayerUtils from '@/shared/prayer';
import { isReadable } from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { type FastingMode, type FastingSelection, ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { fastingDawoodAnchorAtom } from '@/stores/notifications';
import { hijriDateEnabledAtom, show24HourFormatAtom } from '@/stores/ui';

const MODE_LABEL: Record<FastingMode, TranslationKey> = {
  everyDay: 'fasting.mode.everyDay',
  muhammad: 'fasting.mode.muhammad',
  dawood: 'fasting.mode.dawood',
  whiteDays: 'fasting.mode.whiteDays',
};

const MODE_HINT: Record<FastingMode, TranslationKey> = {
  everyDay: 'fasting.mode.everyDayHint',
  muhammad: 'fasting.mode.muhammadHint',
  dawood: 'fasting.mode.dawoodHint',
  whiteDays: 'fasting.mode.whiteDaysHint',
};

const BADGE_LABEL: Record<FastingDesignation, TranslationKey> = {
  muhammad: 'fasting.mode.muhammad',
  dawood: 'fasting.mode.dawood',
  whiteDay: 'fasting.mode.whiteDays',
  ramadan: 'fasting.badge.ramadan',
};

/** How many upcoming fasts the preview lists beside the next one */
const PREVIEW_COUNT = 4;

// The string guard reads attribute-held literals as copy; these are code values
const SUHOOR: PrayerId = 'suhoor';
const RADIO_ROLE = 'radio';

interface FastingCardProps {
  selection: FastingSelection;
  onSelectionChange: (next: FastingSelection) => void;
}

export default function FastingCard({ selection, onSelectionChange }: FastingCardProps) {
  const hijriDate = useAtomValue(hijriDateEnabledAtom);
  const use24Hour = useAtomValue(show24HourFormatAtom);
  const anchorMs = useAtomValue(fastingDawoodAnchorAtom);

  const suhoorFor = (date: string) => {
    const prayer = PrayerUtils.getPrayerForDate(ScheduleType.Extra, SUHOOR, date);
    return prayer !== null && isReadable(prayer) ? prayer.datetime : null;
  };

  // A Dawood selection with no stored cycle previews from now, which is where its commit anchors anyway
  const settings = {
    ...selection,
    dawoodAnchorMs: selection.mode === 'dawood' && anchorMs === 0 ? Date.now() : anchorMs,
  };

  const today = TimeUtils.getTodayDateString();
  const verdictFor = fastingEvaluator(settings, suhoorFor);
  const upcoming = upcomingFastingDays(today, PREVIEW_COUNT, settings, suhoorFor);
  const nextSahur = upcoming[0];
  const nextSahurRow = PrayerUtils.getPrayerForDate(ScheduleType.Extra, SUHOOR, nextSahur.date);
  const tomorrow = TimeUtils.addDaysToDateString(today, 1);

  const stateWord = (arms: boolean) => (arms ? t('fasting.state.on') : t('fasting.state.off'));

  const badgesFor = (designations: readonly FastingDesignation[]) =>
    designations.length > 0
      ? designations.map((designation) => t(BADGE_LABEL[designation])).join(', ')
      : t(MODE_LABEL[selection.mode]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('fasting.card.title')}</Text>
      <Text style={styles.cardHint}>{t('fasting.card.hint')}</Text>
      <View style={styles.modeList}>
        {FASTING_MODES.map((mode) => (
          <Pressable
            key={mode}
            style={styles.modeRow}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: selection.mode === mode }}
            accessibilityLabel={t(MODE_LABEL[mode])}
            onPress={() => onSelectionChange({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <View style={styles.modeText}>
              <Text style={styles.modeLabel}>{t(MODE_LABEL[mode])}</Text>
              <Text style={styles.modeHint}>{t(MODE_HINT[mode])}</Text>
            </View>
            <View style={[styles.radio, selection.mode === mode ? styles.radioOn : null]} />
          </Pressable>
        ))}
      </View>
      {(selection.mode === 'muhammad' || selection.mode === 'dawood') && (
        <LabeledToggle
          label={t('fasting.addOn.whiteDays')}
          value={selection.whiteDaysAddOn}
          onToggle={(next) => onSelectionChange({ mode: selection.mode, whiteDaysAddOn: next })}
        />
      )}
      <View style={styles.preview}>
        <Text style={styles.previewLine}>
          {t('fasting.preview.today')}: {stateWord(verdictFor(today).arms)}
        </Text>
        <Text style={styles.previewLine}>
          {t('fasting.preview.tomorrow')}: {stateWord(verdictFor(tomorrow).arms)}
        </Text>
      </View>
      {nextSahurRow !== null && isReadable(nextSahurRow) && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>
            {t('fasting.preview.next')} {prayerLabel(SUHOOR)}
          </Text>
          <Text style={styles.previewMain}>
            {formatShownDate(nextSahur.date, hijriDate)}, {TimeUtils.formatDisplayTime(nextSahurRow.time, use24Hour)}
          </Text>
          {upcoming.slice(1).map(({ date, verdict }) => (
            <View key={date} style={styles.previewRow}>
              <Text style={styles.previewDate} numberOfLines={1}>
                {formatShownDate(date, hijriDate)}
              </Text>
              <Text style={styles.previewBadges}>{badgesFor(verdict.designations)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
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
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: '#d8eaf8',
    marginBottom: SPACING.sm - 1,
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  modeList: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.smd,
  },
  modeText: {
    flexShrink: 1,
  },
  modeLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  modeHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    marginTop: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  radioOn: {
    borderColor: COLORS.text.primary,
    borderWidth: 6,
  },
  preview: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.07)',
    gap: SPACING.xs,
  },
  previewTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: '#d8eaf8',
  },
  previewMain: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.primary,
  },
  previewLine: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  previewDate: {
    flexShrink: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.primary,
  },
  previewBadges: {
    flexShrink: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});
