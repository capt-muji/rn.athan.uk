/**
 * The fasting-days selection model: the four options, the six valid sets, the
 * tap rule, and the description's six states. The shape is the sheet's own
 * FastingSelection (no second shape): everyDay excludes everything, muhammad
 * and dawood replace each other, and the white days combine with either
 * regimen but never with everyDay. A tap that would create an invalid set
 * silently unselects the options it conflicts with; tapping the only selected
 * option does nothing. Storage decides the seed: any pair the atoms may hold
 * from an older writing reads onto the six sets before the sheet drafts it.
 */

import type { TranslationKey } from '@/shared/i18n';
import type { FastingMode, FastingSelection } from '@/shared/types';

/** The four options in sheet order: Every day, Muhammad, Dawood, Three white days */
export type FastingOption = FastingMode;

/** Any stored pair read onto the six sets: the add-on only rides the two regimens */
export const sanitizeFastingSelection = (selection: FastingSelection): FastingSelection =>
  selection.mode === 'muhammad' || selection.mode === 'dawood'
    ? selection
    : { mode: selection.mode, whiteDaysAddOn: false };

/** Whether the white days are part of the selection, as the white-only set or as the add-on */
const armsWhiteDays = (selection: FastingSelection): boolean =>
  selection.mode === 'whiteDays' || selection.whiteDaysAddOn;

/**
 * The tap rule: conflicting options silently unselect, the only selected
 * option does nothing, and at least one option always stays selected.
 */
export const nextFastingSelection = (current: FastingSelection, option: FastingOption): FastingSelection => {
  if (option === 'everyDay') {
    return current.mode === 'everyDay' ? current : { mode: 'everyDay', whiteDaysAddOn: false };
  }
  if (option === 'whiteDays') {
    if (current.mode === 'everyDay') return { mode: 'whiteDays', whiteDaysAddOn: false };
    if (current.mode === 'whiteDays') return current;
    return { mode: current.mode, whiteDaysAddOn: !current.whiteDaysAddOn };
  }
  // muhammad and dawood replace each other and every day, never dropping the white days
  if (current.mode === option) {
    return armsWhiteDays(current) ? { mode: 'whiteDays', whiteDaysAddOn: false } : current;
  }
  return { mode: option, whiteDaysAddOn: armsWhiteDays(current) };
};

/** The description's six states: the whole selection in one line, per regimen pair */
const DESCRIPTION_KEYS: Record<FastingMode, readonly [TranslationKey, TranslationKey]> = {
  everyDay: ['fasting.description.everyDay', 'fasting.description.everyDay'],
  muhammad: ['fasting.description.muhammad', 'fasting.description.muhammadWhiteDays'],
  dawood: ['fasting.description.dawood', 'fasting.description.dawoodWhiteDays'],
  whiteDays: ['fasting.description.whiteDays', 'fasting.description.whiteDays'],
};

/** The catalog key speaking the whole selection, the add-on state picking the column */
export const fastingDescriptionKey = (selection: FastingSelection): TranslationKey =>
  DESCRIPTION_KEYS[selection.mode][selection.whiteDaysAddOn ? 1 : 0];
