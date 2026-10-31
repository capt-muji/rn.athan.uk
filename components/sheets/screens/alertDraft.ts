/**
 * The alert sheet's draft rules, pure so they can be tested without a renderer (same split as
 * components/countdown/tipGeometry.ts).
 *
 * The draft is what closing the sheet commits. A stored value read wrongly into it does not stay on screen alone:
 * the next change the user makes commits the misread value alongside their own.
 */

import { DEFAULT_REMINDER_INTERVAL, validateReminderInterval } from '@/shared/constants';
import {
  type AlertMenuState,
  AlertType,
  type PerReminderSlot,
  type ReminderInterval,
  type ReminderSetting,
  type ReminderSlot,
} from '@/shared/types';

/**
 * The sound the reminder toggle turns on with. An Off reminder still needs one, and silent is the choice that
 * cannot surprise anyone with a sound they never picked.
 *
 * @param storedReminder The reminder alert saved for the prayer
 * @returns The reminder sound the sheet opens on
 */
export const initialReminderType = (storedReminder: AlertType): AlertType.Silent | AlertType.Sound =>
  storedReminder === AlertType.Sound ? AlertType.Sound : AlertType.Silent;

/**
 * The store's value is a cast over a raw MMKV number, so anything off the list is replaced before the commit can
 * save an offset that has no reminder sound of its own.
 *
 * @param storedInterval The interval saved for the prayer, as MMKV holds it
 * @returns The interval the sheet opens on
 */
export const initialReminderInterval = (storedInterval: number): ReminderInterval =>
  validateReminderInterval(storedInterval) ? (storedInterval as ReminderInterval) : DEFAULT_REMINDER_INTERVAL;

export interface AthanSelection {
  /** The athan type just tapped */
  selected: AlertType;
  /** The athan type the draft holds */
  atTimeAlert: AlertType;
}

/**
 * Only the move from Off to an athan that can fire needs permission. Every other move either keeps an athan that
 * already needed it or turns the athan off. Named fields, because both are alert types and swapped positions would
 * still compile.
 *
 * @returns Whether to ask before moving the selection
 */
export const selectionNeedsPermission = ({ selected, atTimeAlert }: AthanSelection): boolean =>
  selected !== AlertType.Off && atTimeAlert === AlertType.Off;

/**
 * The minute the other reminder holds, which this one must not be able to reach.
 *
 * Only a reminder that is ON reserves its minute: two that are Off may sit on the same stored value, since neither
 * fires, and freeing it back up is what lets the user switch one on without the other's value moving.
 *
 * @param other The other slot's reminder
 * @returns Its interval while it is on, else null
 */
export const takenInterval = (other: ReminderSetting): number | null =>
  other.alert === AlertType.Off ? null : other.interval;

export interface AlertDraft {
  atTimeAlert: AlertType;
  reminders: PerReminderSlot<ReminderSetting>;
  /** The sound each reminder switches back on with, kept while it is Off so the choice survives a toggle */
  sounds: Record<ReminderSlot, AlertType.Silent | AlertType.Sound>;
  /** The reminder choices held while the athan is Off: the stored values at open, re-snapshotted at every in-session move into Off */
  preservedAlerts: PerReminderSlot<AlertType>;
}

/**
 * The draft a fresh open of this prayer shows, from the baseline the stores
 * hold for it. Pure on the baseline so a warm body can re-derive it during
 * render when the open session changes, with the values correct in the reveal
 * frame - the remount a fresh mount used to give, without the mount.
 *
 * While the mounted athan is Off, each reminder drafts Off and a Silent pill
 * whatever the store holds, so the slide-off keeps today's pixels; the stored
 * choices live in preservedAlerts alone until the athan turns back on.
 */
export const initialDraft = (baseline: AlertMenuState): AlertDraft => {
  const reminders: PerReminderSlot<ReminderSetting> = [
    {
      ...baseline.reminders[0],
      alert: baseline.atTimeAlert === AlertType.Off ? AlertType.Off : baseline.reminders[0].alert,
    },
    {
      ...baseline.reminders[1],
      alert: baseline.atTimeAlert === AlertType.Off ? AlertType.Off : baseline.reminders[1].alert,
    },
  ];

  return {
    atTimeAlert: baseline.atTimeAlert,
    reminders,
    sounds: {
      0: initialReminderType(reminders[0].alert),
      1: initialReminderType(reminders[1].alert),
    },
    preservedAlerts: [baseline.reminders[0].alert, baseline.reminders[1].alert],
  };
};
