import { useAtomValue } from 'jotai';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { prayerLabel, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { deferPastNextPaint } from '@/shared/nextPaint';
import {
  type AlertMenuState,
  AlertType,
  Icon,
  type PerReminderSlot,
  REMINDER_SLOTS,
  type ReminderSetting,
  type ReminderSlot,
} from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { type AlertSheetState, alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';

import { SegmentedControl, type SegmentOption, Sheet, VolumeNote } from '../parts';
import { freeReminderInterval } from '../parts/reminderStep';
import {
  type AlertDraft,
  initialDraft,
  initialReminderInterval,
  selectionNeedsPermission,
  takenInterval,
} from './alertDraft';
import ReminderCard from './ReminderCard';

// Resolved at call time so a locale switch reaches the labels on the next render
const alertOptions = (): SegmentOption[] => [
  { value: AlertType.Off, label: t('alert.option.off'), icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: t('alert.option.silent'), icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: t('alert.option.sound'), icon: Icon.SPEAKER },
];

// Nothing the user can do fixes a time the timetable did not give, so this explains and reassures without asking
// for an action: the saved setting returns by itself on the next occurrence with a readable time
// The hard lines are all within about 12dp of each other, so the centred block reads as an even paragraph, and at
// the default font size (and up to Android's Large) each fits a 360dp phone inside the padding below without
// wrapping a second time
const unavailableMessage = (): string => t('alert.unavailable');

interface AlertSheetBodyRef {
  /** Values snapshotted at mount — the change-detection baseline for the deferred commit */
  getOriginalState: () => AlertMenuState;
  /** Live draft values at the moment of the call */
  getCurrentState: () => AlertMenuState;
}

/** Both slots through one change, so a writer never has to assert the pair's shape back */
const mapSlots = (
  reminders: PerReminderSlot<ReminderSetting>,
  change: (reminder: ReminderSetting, slot: ReminderSlot) => ReminderSetting
): PerReminderSlot<ReminderSetting> => [change(reminders[0], 0), change(reminders[1], 1)];

interface AlertSheetBodyProps {
  sheetState: AlertSheetState;
  /** The open session: the body re-derives its draft when it changes, instead of remounting */
  session: number;
  ensurePermissions: () => Promise<boolean>;
}

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_alert';

export default function BottomSheetAlert() {
  const sheetState = useAtomValue(alertSheetStateAtom);
  const { commitAlertMenuChanges, ensurePermissions } = useNotification();
  const bodyRef = useRef<AlertSheetBodyRef>(null);

  // Fires from the sheet's unified close signal once the close animation has
  // settled; the warm body stays mounted, so its ref is live here — see
  // AlertSheetBody below. The commit starts past the next paint, the sound
  // sheet's own parity: the close haptic's dispatch has left the thread before
  // any scheduling call begins
  const handleDismiss = useCallback(async () => {
    if (!sheetState) return;
    const body = bodyRef.current;
    if (!body) return;

    const originalState = body.getOriginalState();
    const currentState = body.getCurrentState();

    await deferPastNextPaint();

    await commitAlertMenuChanges(sheetState.type, sheetState.index, sheetState.prayerId, originalState, currentState);
  }, [sheetState, commitAlertMenuChanges]);

  return (
    <Sheet
      setRef={setAlertSheetModal}
      title={sheetState ? prayerLabel(sheetState.prayerId) : ''}
      subtitle={t('sheet.closeToSave')}
      icon={<IconView type={Icon.BELL_RING} size={16} color={SHEET_ICON_COLOR} />}
      enableDynamicSizing
      contentCap={0.85}
      onDismiss={handleDismiss}
      perfName={SHEET_PERF_NAME}>
      {sheetState?.isUnavailable && (
        // No body is mounted, so its ref stays empty and the dismiss commits nothing
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>{unavailableMessage()}</Text>
        </View>
      )}
      {sheetState && !sheetState.isUnavailable && (
        <AlertSheetBody
          ref={bodyRef}
          sheetState={sheetState}
          session={sheetState.session}
          ensurePermissions={ensurePermissions}
        />
      )}
      <VolumeNote />
    </Sheet>
  );
}

// =============================================================================
// SHEET BODY
// =============================================================================

/**
 * Alert sheet content. The tree stays mounted after its first open (the warm
 * sheet), so a fresh open re-derives its draft from the synchronous
 * MMKV-backed store getters DURING RENDER, when the open session advances -
 * the adjust-state-when-a-prop-changes pattern, no effect, no remount, the
 * values correct in the same render that reveals them (an effect-driven load
 * painted the Off defaults first and corrected them after, which surfaced as
 * the first-frame flash).
 *
 * The parent reads the draft via the imperative handle at close for the
 * deferred commit (the AlertMenu pattern).
 *
 * While the mounted athan is Off, each reminder DRAFTS Off and a Silent pill
 * whatever the store holds, so the slide-off keeps today's pixels; the stored
 * choices live in the draft's preservedAlerts alone until the athan turns
 * back on.
 */
const AlertSheetBody = forwardRef<AlertSheetBodyRef, AlertSheetBodyProps>(
  ({ sheetState, session, ensurePermissions }, ref) => {
    // The store's own settings for this prayer, snapshotted at open and at every
    // session change: the baseline the commit rolls back to, and the preserved
    // choices the off-to-on move restores from
    const readBaseline = (): AlertMenuState => {
      const saved = (slot: ReminderSlot): ReminderSetting => ({
        alert: getReminderAlertType(sheetState.type, sheetState.index, slot),
        interval: initialReminderInterval(getReminderInterval(sheetState.type, sheetState.index, slot)),
      });

      return { atTimeAlert: getPrayerAlertType(sheetState.type, sheetState.index), reminders: [saved(0), saved(1)] };
    };

    const [mountedState, setMountedState] = useState<AlertMenuState>(readBaseline);
    const [draft, setDraft] = useState<AlertDraft>(() => initialDraft(readBaseline()));
    const [sessionSeen, setSessionSeen] = useState(session);

    // The re-derive a fresh open needs, run during render: React discards the
    // in-flight render and re-renders immediately with the fresh draft, before
    // anything commits. The baseline re-reads the stores too, so the commit
    // baseline is fresh even after a rolled-back commit.
    if (session !== sessionSeen) {
      setSessionSeen(session);
      const baseline = readBaseline();
      setMountedState(baseline);
      setDraft(initialDraft(baseline));
    }

    const { atTimeAlert, reminders, sounds, preservedAlerts } = draft;

    const updateReminder = useCallback((slot: ReminderSlot, change: Partial<ReminderSetting>) => {
      setDraft((current) => ({
        ...current,
        reminders: mapSlots(current.reminders, (reminder, index) =>
          index === slot ? { ...reminder, ...change } : reminder
        ),
      }));
    }, []);

    const handleAlertSelect = useCallback(
      async (type: AlertType) => {
        // Read before the permission await: the selection that lands is the one this press started
        const leavingOff = atTimeAlert === AlertType.Off && type !== AlertType.Off;
        if (selectionNeedsPermission({ selected: type, atTimeAlert })) {
          // A denied prompt must leave the control where it was. commitAlertMenuChanges
          // re-checks permissions at dismiss and saves nothing without them, so moving
          // the selection anyway left the user believing the athan was armed for this
          // prayer when nothing would ever fire. Returning here is also what removes
          // that second, now-redundant prompt at dismiss.
          if (!(await ensurePermissions())) return;
        }

        // The athan is back on: each reminder returns to the choice it held before the athan went
        // off, and the pill reads the sound that reminder fires with
        if (leavingOff) {
          setDraft((current) => {
            const preserved = current.preservedAlerts;
            const reminders = mapSlots(current.reminders, (reminder, slot) => ({
              ...reminder,
              alert: preserved[slot],
            }));
            const restored = { ...current.sounds };
            for (const slot of REMINDER_SLOTS) {
              const alert = preserved[slot];
              if (alert !== AlertType.Off) restored[slot] = alert;
            }
            return { ...current, atTimeAlert: type, reminders, sounds: restored };
          });
          return;
        }

        // Into Off: the choices on screen are preserved, then the draft slides off exactly as today
        if (type === AlertType.Off && atTimeAlert !== AlertType.Off) {
          setDraft((current) => ({
            ...current,
            atTimeAlert: type,
            preservedAlerts: [current.reminders[0].alert, current.reminders[1].alert],
            reminders: mapSlots(current.reminders, (reminder) => ({ ...reminder, alert: AlertType.Off })),
          }));
          return;
        }

        setDraft((current) => ({ ...current, atTimeAlert: type }));
      },
      [atTimeAlert, ensurePermissions]
    );

    const handleReminderToggle = useCallback(
      (slot: ReminderSlot, next: boolean) => {
        // A locked control refuses the press itself; the guard stays for a control
        // that stops refusing. The switch always delivers a flip of its drawn
        // state, so the pressed target is always a change
        const canEnable = atTimeAlert !== AlertType.Off && (slot === 0 || reminders[0].alert !== AlertType.Off);
        if (!canEnable) return;

        const other = reminders[slot === 0 ? 1 : 0];

        // Switching on beside a reminder already holding this minute moves to the nearest free one, which is the
        // only moment a value can change without a press on its own stepper
        const interval = next
          ? freeReminderInterval(reminders[slot].interval, takenInterval(other))
          : reminders[slot].interval;

        updateReminder(slot, { alert: next ? sounds[slot] : AlertType.Off, interval });
      },
      [atTimeAlert, reminders, sounds, updateReminder]
    );

    const handleReminderSoundSelect = useCallback((slot: ReminderSlot, type: AlertType) => {
      setDraft((current) => ({
        ...current,
        sounds: { ...current.sounds, [slot]: type as AlertType.Silent | AlertType.Sound },
        reminders: mapSlots(current.reminders, (reminder, index) =>
          index === slot ? { ...reminder, alert: type } : reminder
        ),
      }));
    }, []);

    useImperativeHandle(ref, () => ({
      getOriginalState: () => mountedState,
      getCurrentState: () => ({
        atTimeAlert,
        // Store truth at close: the draft displays Off beside an Off athan, so the preserved
        // choices stand in and the commit writes them
        reminders:
          atTimeAlert === AlertType.Off
            ? mapSlots(reminders, (reminder, slot) => ({ ...reminder, alert: preservedAlerts[slot] }))
            : reminders,
      }),
    }));

    const canEnableReminder = atTimeAlert !== AlertType.Off;

    return (
      <>
        {/* Prayer Alert Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('alert.card.athan')}</Text>
          <Text style={styles.cardHint}>{t('alert.card.athanHint')}</Text>
          <View style={{ marginTop: SPACING.md }}>
            <SegmentedControl
              key={`athan-${sheetState.type}-${sheetState.index}`}
              options={alertOptions()}
              selected={atTimeAlert}
              onSelect={handleAlertSelect}
            />
          </View>
        </View>

        <ReminderCard
          title={t('alert.reminder', { n: 1 })}
          hint={t('alert.reminderHint')}
          reminder={reminders[0]}
          sound={sounds[0]}
          taken={takenInterval(reminders[1])}
          locked={!canEnableReminder}
          onToggle={(next) => handleReminderToggle(0, next)}
          onSelectSound={(type) => handleReminderSoundSelect(0, type)}
          onSelectInterval={(interval) => updateReminder(0, { interval })}
        />

        <ReminderCard
          title={t('alert.reminder', { n: 2 })}
          hint={t('alert.reminderHint')}
          reminder={reminders[1]}
          sound={sounds[1]}
          taken={takenInterval(reminders[0])}
          locked={!canEnableReminder || reminders[0].alert === AlertType.Off}
          onToggle={(next) => handleReminderToggle(1, next)}
          onSelectSound={(type) => handleReminderSoundSelect(1, type)}
          onSelectInterval={(interval) => updateReminder(1, { interval })}
        />
      </>
    );
  }
);

const ty = typographyFor(currentLocaleId());

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Cards - shadcn inspired with indigo theme
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  reminderOptions: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.07)',
    gap: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionLabel: {
    fontSize: ty.size(13),
    fontFamily: ty.familyRegular,
    color: 'rgb(146, 184, 228)',
    width: 100,
  },
  // Centred both ways in a box about as tall as the options it stands in for. The short lines keep the block
  // narrow and well inside the title's edge; the padding only guarantees that on the narrowest phones
  unavailable: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xxxl,
    marginBottom: SPACING.md,
  },
  // The header subtitle's own dim colour and size
  unavailableText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
    lineHeight: ty.lineHeight(22),
  },
});
