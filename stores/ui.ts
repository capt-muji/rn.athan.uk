import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

import { PageCoordinates, ScheduleType } from '@/shared/types';
import { atomWithStorageBoolean, atomWithStorageNumber, atomWithStorageString } from '@/stores/storage';

const store = getDefaultStore();

const emptyCoordinates: PageCoordinates = { pageX: 0, pageY: 0, width: 0, height: 0 };

// =============================================================================
// ALERT SHEET STATE
// =============================================================================

export interface AlertSheetState {
  type: ScheduleType;
  index: number;
  prayerEnglish: string;
  prayerArabic: string;
}

/** Current alert sheet state (which prayer is being edited) */
export const alertSheetStateAtom = atom<AlertSheetState | null>(null);

/** Reference to the alert bottom sheet modal */
export const alertSheetModalAtom = atom<BottomSheetModal | null>(null);

// =============================================================================
// ATOMS - Ephemeral State
// =============================================================================

/** Index of currently playing sound preview in bottom sheet (null if none) */
export const playingSoundIndexAtom = atom<number | null>(null);

/** Timestamp to trigger UI refresh (used for cascade animations) */
export const refreshUIAtom = atom<number>(Date.now());

/** Whether the app update popup should be shown */
export const popupUpdateEnabledAtom = atom(false);

/** Timestamp of last update check (persisted) */
export const popupUpdateLastCheckAtom = atomWithStorageNumber('popup_update_last_check', 0);

/** Reference to the sound selection bottom sheet modal */
export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);

/** Reference to the settings bottom sheet modal */
export const settingsSheetModalAtom = atom<BottomSheetModal | null>(null);

// =============================================================================
// ATOMS - Layout Measurements
// =============================================================================

/** Measured width of longest English prayer name for Standard schedule */
export const englishWidthStandardAtom = atomWithStorageNumber('prayer_max_english_width_standard', 0);

/** Measured width of longest English prayer name for Extra schedule */
export const englishWidthExtraAtom = atomWithStorageNumber('prayer_max_english_width_extra', 0);

/** Page coordinates of the prayer list component (for animations) */
export const measurementsListAtom = atom<PageCoordinates>(emptyCoordinates);

/** Page coordinates of the date component (for animations) */
export const measurementsDateAtom = atom<PageCoordinates>(emptyCoordinates);

// =============================================================================
// ATOMS - User Preferences (persisted)
// =============================================================================

/** Whether the countdown bar is visible */
export const countdownBarShownAtom = atomWithStorageBoolean('preference_countdownbar_shown', true);

/** Color of the countdown bar (hex string) */
export const countdownBarColorAtom = atomWithStorageString('preference_countdownbar_color', '#ffd000');

/** Whether to display dates in Hijri (Islamic) calendar format */
export const hijriDateEnabledAtom = atomWithStorageBoolean('preference_hijri_date', false);

/** Whether to show seconds in the countdown display */
export const showSecondsAtom = atomWithStorageBoolean('preference_show_seconds', false);

/** Whether to show "time passed" info below countdown */
export const showTimePassedAtom = atomWithStorageBoolean('preference_show_time_passed', true);

/** Whether to show Arabic prayer names alongside English */
export const showArabicNamesAtom = atomWithStorageBoolean('preference_show_arabic_names', true);

/** Whether seasonal decorations (Ramadan, Eid, etc.) are shown */
export const decorationsEnabledAtom = atomWithStorageBoolean('preference_decorations_enabled', true);

// =============================================================================
// ACTIONS
// =============================================================================

/** Gets the timestamp of the last app update check */
export const getPopupUpdateLastCheck = () => store.get(popupUpdateLastCheckAtom);

/** Presents the sound selection bottom sheet */
export const showSheet = () => store.get(bottomSheetModalAtom)?.present();

/** Presents the settings bottom sheet */
export const showSettingsSheet = () => store.get(settingsSheetModalAtom)?.present();

/** Dismisses the settings bottom sheet */
export const hideSettingsSheet = () => store.get(settingsSheetModalAtom)?.dismiss();

/** Sets the sound selection bottom sheet modal reference */
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);

/** Sets the settings bottom sheet modal reference */
export const setSettingsSheetModal = (modal: BottomSheetModal | null) => store.set(settingsSheetModalAtom, modal);

/** Sets the alert bottom sheet modal reference */
export const setAlertSheetModal = (modal: BottomSheetModal | null) => store.set(alertSheetModalAtom, modal);

/** Shows the alert bottom sheet for a specific prayer */
export const showAlertSheet = (state: AlertSheetState) => {
  store.set(alertSheetStateAtom, state);
  store.get(alertSheetModalAtom)?.present();
};

/** Hides the alert bottom sheet */
export const hideAlertSheet = () => store.get(alertSheetModalAtom)?.dismiss();

/** Gets the current alert sheet state */
export const getAlertSheetState = () => store.get(alertSheetStateAtom);

/** Sets the index of the currently playing sound preview */
export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);

/** Triggers a UI refresh by updating the timestamp */
export const setRefreshUI = (timestamp: number) => store.set(refreshUIAtom, timestamp);

/** Sets whether the app update popup should be shown */
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);

/** Sets the timestamp of the last app update check */
export const setPopupUpdateLastCheck = (timestamp: number) => store.set(popupUpdateLastCheckAtom, timestamp);

/**
 * Sets the measured width of the longest English prayer name
 * @param type Schedule type (Standard or Extra)
 * @param width Measured width in pixels
 */
export const setEnglishWidth = (type: ScheduleType, width: number) => {
  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? englishWidthStandardAtom : englishWidthExtraAtom;

  store.set(atom, width);
};

/** Gets the page coordinates of the prayer list component */
export const getMeasurementsList = () => store.get(measurementsListAtom);

/** Sets the page coordinates of the prayer list component */
export const setMeasurementsList = (measurements: PageCoordinates) => store.set(measurementsListAtom, measurements);

/** Gets the page coordinates of the date component */
export const getMeasurementsDate = () => store.get(measurementsDateAtom);

/** Sets the page coordinates of the date component */
export const setMeasurementsDate = (measurements: PageCoordinates) => store.set(measurementsDateAtom, measurements);
