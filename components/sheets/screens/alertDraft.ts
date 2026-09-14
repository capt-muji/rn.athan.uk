/**
 * The alert sheet's draft rules, pure so they can be tested without a renderer (same split as
 * components/countdown/tipGeometry.ts).
 *
 * The draft is what closing the sheet commits. A stored value read wrongly into it does not stay on screen alone:
 * the next change the user makes commits the misread value alongside their own.
 */

import { DEFAULT_REMINDER_INTERVAL, validateReminderInterval } from '@/shared/constants';
import { AlertType, type ReminderInterval } from '@/shared/types';

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
 * The store's ReminderInterval is a cast over a raw MMKV number, so a value outside REMINDER_INTERVALS is replaced
 * here rather than reaching the stepper, where no arrow steps back onto the list, and the commit.
 *
 * @param storedInterval The interval saved for the prayer, as MMKV holds it
 * @returns The interval the sheet opens on
 */
export const initialReminderInterval = (storedInterval: number): ReminderInterval =>
  validateReminderInterval(storedInterval) ? (storedInterval as ReminderInterval) : DEFAULT_REMINDER_INTERVAL;

/**
 * Only the move from Off to an athan that can fire needs permission. Every other move either keeps an athan that
 * already needed it or turns the athan off.
 *
 * @param selected The athan type just tapped
 * @param atTimeAlert The athan type the draft holds
 * @returns Whether to ask before moving the selection
 */
export const selectionNeedsPermission = (selected: AlertType, atTimeAlert: AlertType): boolean =>
  selected !== AlertType.Off && atTimeAlert === AlertType.Off;

/**
 * A reminder without an athan never fires, so the toggle is locked while the athan is Off. Switching the reminder
 * back on restores the sound last chosen for it.
 *
 * @param canEnableReminder Whether the athan is on
 * @param isReminderOn Whether the reminder is on
 * @param reminderType The reminder sound last chosen
 * @returns The reminder after the press, or null when the press changes nothing
 */
export const toggledReminder = (
  canEnableReminder: boolean,
  isReminderOn: boolean,
  reminderType: AlertType.Silent | AlertType.Sound
): AlertType | null => {
  if (!canEnableReminder) return null;
  return isReminderOn ? AlertType.Off : reminderType;
};
