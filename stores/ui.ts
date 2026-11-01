import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore, type PrimitiveAtom } from 'jotai';

import type { PrayerId } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { perfMark } from '@/shared/perf';
import { type PageCoordinates, ScheduleType } from '@/shared/types';
import { clearPrefix } from '@/stores/database';
import { atomWithStorageBoolean, atomWithStorageNumber, atomWithStorageString } from '@/stores/storage';

const store = getDefaultStore();

const emptyCoordinates: PageCoordinates = { pageX: 0, pageY: 0, width: 0, height: 0 };

// =============================================================================
// ALERT SHEET STATE
// =============================================================================

export interface AlertSheetState {
  type: ScheduleType;
  index: number;
  prayerId: PrayerId;
  /** The occurrence on screen has no readable time, so the sheet explains that instead of offering options */
  isUnavailable: boolean;
  /**
   * Advances on every open. The sheet's tree stays mounted once it has opened
   * (enableDismissOnClose false), so the body re-derives its draft from the
   * stores during render when this changes - the warm-sheet stand-in for the
   * remount a fresh mount used to give.
   */
  session: number;
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

/**
 * Bumped on every foreground return. Derived animation mappers depend on it so
 * they re-run and snap on resume, replacing the old `refreshUI` re-fire effects.
 */
export const resyncAtom = atom<number>(0);

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
 * Whether the Ramadan decoration sprites have all loaded (session-scoped).
 *
 * The decorations render ~12 async PNG sprites that arrive through Fresco
 * after the first content commit — without a gate they pop in a few hundred
 * ms after the splash reveals (the mosque-icon race, on every sprite). The
 * splash holds until every sprite's onLoadEnd fires; the launch gate skips
 * the wait entirely when decorations are not expected this session.
 */
export const decorationsLoadedAtom = atom(false);

/**
 * Whether the mosque icon's bitmap has decoded this session (T-541, the owner's 2.43.1 read).
 *
 * The icon renders from the first content commit, but its PNG decodes through
 * Fresco after that frame has drawn: the owner read a ~300ms gap and a snap on
 * every launch. The reveal holds the splash through the decode - the decoration
 * sprites' own precedent - so the first frame the owner sees carries the icon.
 * Session-scoped and one-way, exactly like the sprite gate.
 */
export const masjidLoadedAtom = atom(false);

/** Whether the What's New popup should be shown (post-update announcement) */
export const popupWhatsNewEnabledAtom = atom(false);

/** Whether the Help modal should be shown */
export const popupHelpEnabledAtom = atom(false);

/** Timestamp of last update check (persisted) */
export const popupUpdateLastCheckAtom = atomWithStorageNumber('popup_update_last_check', 0);

/** Reference to the sound selection bottom sheet modal */
export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);

/** Reference to the settings bottom sheet modal */
export const settingsSheetModalAtom = atom<BottomSheetModal | null>(null);

/** Reference to the qibla bottom sheet modal */
export const qiblaSheetModalAtom = atom<BottomSheetModal | null>(null);

/** Reference to the language bottom sheet modal */
export const languageSheetModalAtom = atom<BottomSheetModal | null>(null);

// =============================================================================
// ATOMS - Layout Measurements
// =============================================================================

// The 59 re-key: every `prayer_max_english_width_` key is removed
// unconditionally at module evaluation, before the atoms below first read
// storage, so the reserve re-measures against the shortened names (P8).
clearPrefix('prayer_max_english_width_');

/** One width atom per locale and list, created on first access and cached */
const widthAtoms = new Map<string, PrimitiveAtom<number>>();

/**
 * The width atom of the active locale's list: per-locale keys default 0 and widen on
 * the first measure, so a switch reflows once against the new locale's key (R5.1, R5.2)
 *
 * @param type Schedule type (Standard or Extra)
 */
export const nameWidthAtomFor = (type: ScheduleType): PrimitiveAtom<number> => {
  const side = type === ScheduleType.Standard ? 'standard' : 'extra';
  const key = `prayer_max_name_width_${currentLocaleId()}_${side}`;
  const cached = widthAtoms.get(key);
  if (cached) return cached;

  const widthAtom = atomWithStorageNumber(key, 0);
  widthAtoms.set(key, widthAtom);
  return widthAtom;
};

/** Page coordinates of the prayer list component (for animations) */
export const measurementsListAtom = atom<PageCoordinates>(emptyCoordinates);

// =============================================================================
// ATOMS - User Preferences (persisted)
// =============================================================================

/** Whether the countdown bar is visible */
export const countdownBarShownAtom = atomWithStorageBoolean('preference_countdownbar_shown', false);

/** Color of the countdown bar (hex string) */
export const countdownBarColorAtom = atomWithStorageString('preference_countdownbar_color', '#00ff88');

/** Whether to display dates in Hijri (Islamic) calendar format */
export const hijriDateEnabledAtom = atomWithStorageBoolean('preference_hijri_date', false);

/** Whether to show seconds in the countdown display */
export const showSecondsAtom = atomWithStorageBoolean('preference_show_seconds', false);

/** Whether to show "time passed" info below countdown */
export const showTimePassedAtom = atomWithStorageBoolean('preference_show_time_passed', false);

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

/** Presents the qibla bottom sheet */
export const showQiblaSheet = () => {
  perfMark('sheet_qibla_present');
  store.get(qiblaSheetModalAtom)?.present();
};

/** Presents the language bottom sheet */
export const showLanguageSheet = () => {
  perfMark('sheet_language_present');
  store.get(languageSheetModalAtom)?.present();
};

/** Closes the settings bottom sheet: close, never dismiss - a dismiss unmounts the warm tree */
export const hideSettingsSheet = () => store.get(settingsSheetModalAtom)?.close();

/** Sets the sound selection bottom sheet modal reference */
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);

/** Sets the settings bottom sheet modal reference */
export const setSettingsSheetModal = (modal: BottomSheetModal | null) => store.set(settingsSheetModalAtom, modal);

/** Sets the qibla bottom sheet modal reference */
export const setQiblaSheetModal = (modal: BottomSheetModal | null) => store.set(qiblaSheetModalAtom, modal);

/** Sets the language bottom sheet modal reference */
export const setLanguageSheetModal = (modal: BottomSheetModal | null) => store.set(languageSheetModalAtom, modal);

/** Sets the alert bottom sheet modal reference */
export const setAlertSheetModal = (modal: BottomSheetModal | null) => store.set(alertSheetModalAtom, modal);

/** Shows the alert bottom sheet for a specific prayer, opening a new draft session */
export const showAlertSheet = (state: Omit<AlertSheetState, 'session'>) => {
  perfMark('sheet_alert_present');
  store.set(alertSheetStateAtom, { ...state, session: (store.get(alertSheetStateAtom)?.session ?? 0) + 1 });
  store.get(alertSheetModalAtom)?.present();
};

/** Sets the index of the currently playing sound preview */
export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);

/** Triggers a UI refresh by advancing the resume counter */
export const bumpResync = () => store.set(resyncAtom, (value) => value + 1);

/** Allows the sound sheet's list to mount (set when the settings sheet first fully opens) */
export const setSoundListReady = () => store.set(soundListReadyAtom, true);

/** Marks all Ramadan decoration sprites as loaded (splash gate) */
export const markDecorationsLoaded = () => store.set(decorationsLoadedAtom, true);

/** Marks the mosque icon's bitmap decoded (the splash's icon gate) */
export const markMasjidLoaded = () => store.set(masjidLoadedAtom, true);

/** Sets whether the app update popup should be shown */
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);

/** Sets whether the What's New popup should be shown */
export const setPopupWhatsNewEnabled = (enabled: boolean) => store.set(popupWhatsNewEnabledAtom, enabled);

/** Sets whether the Help modal should be shown */
export const setPopupHelpEnabled = (enabled: boolean) => store.set(popupHelpEnabledAtom, enabled);

/** Sets the timestamp of the last app update check */
export const setPopupUpdateLastCheck = (timestamp: number) => store.set(popupUpdateLastCheckAtom, timestamp);

/**
 * Sets the measured width of the widest active-locale prayer name
 * @param type Schedule type (Standard or Extra)
 * @param width Measured width in pixels
 */
export const setNameWidth = (type: ScheduleType, width: number) => {
  // Grow-toward-truth: a first-launch measurement can land before the custom
  // font registers (fallback-font metrics are narrower) and write-once
  // caching would pin that wrong width forever (ISSUES #22 - "Sunrise"
  // wrapping until the user cleared data). Accepting only measurements that
  // WIDEN the cache self-heals a bad value on the next launch's measure
  // while correct values never change (no reflow churn after settle).
  if (width <= 0) return;

  const atom = nameWidthAtomFor(type);
  const cached = store.get(atom);
  if (width <= cached) return;

  store.set(atom, width);
};

/** Gets the page coordinates of the prayer list component */
export const getMeasurementsList = () => store.get(measurementsListAtom);

/** Sets the page coordinates of the prayer list component */
export const setMeasurementsList = (measurements: PageCoordinates) => store.set(measurementsListAtom, measurements);
