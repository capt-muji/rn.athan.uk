import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

import { perfMark } from '@/shared/perf';
import { type PageCoordinates, ScheduleType } from '@/shared/types';
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

/**
 * Whether the sound sheet's 32-row list may mount (session-scoped).
 *
 * The list is invisible until the sound sheet opens, and the only path to it
 * runs through the settings sheet, so building it on launch was pure
 * first-paint-adjacent waste — but building it on the sound sheet's own first
 * present showed a visible ~300ms pop-in (header arrives, list mounts during
 * the present). The settings sheet flipping fully open is the natural warm
 * point: the user is one tap away from the sound sheet and sees nothing.
 */
export const soundListReadyAtom = atom(false);

/**
 * Whether the Masjid header icon's bitmap has loaded (session-scoped).
 *
 * The icon renders from a PNG, so its bitmap arrives through Fresco's async
 * pipeline after the first content commit — perf22 pulled first paint early
 * enough to win that race, and the icon popped in ~200ms after the splash
 * revealed the screen. The splash now holds until this flips (onLoadEnd on
 * the Image), so the first visible frame is complete by construction.
 */
export const masjidIconLoadedAtom = atom(false);

/**
 * Whether the Ramadan decoration sprites have all loaded (session-scoped).
 *
 * The decorations render ~12 async PNG sprites that arrive through Fresco
 * after the first content commit — without a gate they pop in a few hundred
 * ms after the splash reveals (the mosque-icon race, on every sprite). The
 * splash holds until every sprite's onLoadEnd fires; the launch gate skips
 * the wait entirely when decorations are not expected this session.
 */
export const decorationsLoadedAtom = atom(false);

/** Whether the What's New popup should be shown (post-update announcement) */
export const popupWhatsNewEnabledAtom = atom(false);

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
export const countdownBarColorAtom = atomWithStorageString('preference_countdownbar_color', '#00ff88');

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
export const showSheet = () => {
  perfMark('sheet_sound_present');
  store.get(bottomSheetModalAtom)?.present();
};

/** Presents the settings bottom sheet */
export const showSettingsSheet = () => {
  perfMark('sheet_settings_present');
  store.get(settingsSheetModalAtom)?.present();
};

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
  perfMark('sheet_alert_present');
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

/** Allows the sound sheet's list to mount (set when the settings sheet first fully opens) */
export const setSoundListReady = () => store.set(soundListReadyAtom, true);

/** Marks the Masjid header icon's bitmap as loaded (splash gate) */
export const markMasjidIconLoaded = () => store.set(masjidIconLoadedAtom, true);

/** Marks all Ramadan decoration sprites as loaded (splash gate) */
export const markDecorationsLoaded = () => store.set(decorationsLoadedAtom, true);

/** Sets whether the app update popup should be shown */
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);

/** Sets whether the What's New popup should be shown */
export const setPopupWhatsNewEnabled = (enabled: boolean) => store.set(popupWhatsNewEnabledAtom, enabled);

/** Sets the timestamp of the last app update check */
export const setPopupUpdateLastCheck = (timestamp: number) => store.set(popupUpdateLastCheckAtom, timestamp);

/**
 * Sets the measured width of the longest English prayer name
 * @param type Schedule type (Standard or Extra)
 * @param width Measured width in pixels
 */
export const setEnglishWidth = (type: ScheduleType, width: number) => {
  // Grow-toward-truth: a first-launch measurement can land before the custom
  // font registers (fallback-font metrics are narrower) and write-once
  // caching would pin that wrong width forever (ISSUES #22 - "Sunrise"
  // wrapping until the user cleared data). Accepting only measurements that
  // WIDEN the cache self-heals a bad value on the next launch's measure
  // while correct values never change (no reflow churn after settle).
  if (width <= 0) return;

  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? englishWidthStandardAtom : englishWidthExtraAtom;
  const cached = store.get(atom);
  if (width <= cached) return;

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
