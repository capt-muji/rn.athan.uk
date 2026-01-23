import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

import { PageCoordinates, ScheduleType } from '@/shared/types';
import { atomWithStorageBoolean, atomWithStorageNumber, atomWithStorageString } from '@/stores/storage';

const store = getDefaultStore();

const emptyCoordinates: PageCoordinates = { pageX: 0, pageY: 0, width: 0, height: 0 };

// --- Atoms ---
export const playingSoundIndexAtom = atom<number | null>(null);
export const refreshUIAtom = atom<number>(Date.now());
export const popupUpdateEnabledAtom = atom(false);
export const popupUpdateLastCheckAtom = atomWithStorageNumber('popup_update_last_check', 0);

export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);
export const settingsSheetModalAtom = atom<BottomSheetModal | null>(null);

export const englishWidthStandardAtom = atomWithStorageNumber('prayer_max_english_width_standard', 0);
export const englishWidthExtraAtom = atomWithStorageNumber('prayer_max_english_width_extra', 0);

export const measurementsListAtom = atom<PageCoordinates>(emptyCoordinates);
export const measurementsDateAtom = atom<PageCoordinates>(emptyCoordinates);
export const measurementsMasjidAtom = atom<PageCoordinates>(emptyCoordinates);

export const countdownBarShownAtom = atomWithStorageBoolean('preference_countdownbar_shown', true);
export const countdownBarColorAtom = atomWithStorageString('preference_countdownbar_color', '#00ffea');

// New preference atoms for settings
export const hijriDateEnabledAtom = atomWithStorageBoolean('preference_hijri_date', false);
export const showSecondsAtom = atomWithStorageBoolean('preference_show_seconds', false);
export const showTimePassedAtom = atomWithStorageBoolean('preference_show_time_passed', true);

// --- Actions ---
export const getPopupUpdateLastCheck = () => store.get(popupUpdateLastCheckAtom);
export const showSheet = () => store.get(bottomSheetModalAtom)?.present();
export const showSettingsSheet = () => store.get(settingsSheetModalAtom)?.present();
export const hideSettingsSheet = () => store.get(settingsSheetModalAtom)?.dismiss();
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);
export const setSettingsSheetModal = (modal: BottomSheetModal | null) => store.set(settingsSheetModalAtom, modal);
export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);
export const setRefreshUI = (timestamp: number) => store.set(refreshUIAtom, timestamp);
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);
export const setPopupUpdateLastCheck = (timestamp: number) => store.set(popupUpdateLastCheckAtom, timestamp);

export const setEnglishWidth = (type: ScheduleType, width: number) => {
  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? englishWidthStandardAtom : englishWidthExtraAtom;

  store.set(atom, width);
};

export const getMeasurementsList = () => store.get(measurementsListAtom);
export const setMeasurementsList = (measurements: PageCoordinates) => store.set(measurementsListAtom, measurements);
export const getMeasurementsDate = () => store.get(measurementsDateAtom);
export const setMeasurementsDate = (measurements: PageCoordinates) => store.set(measurementsDateAtom, measurements);
export const getMeasurementsMasjid = () => store.get(measurementsMasjidAtom);
export const setMeasurementsMasjid = (measurements: PageCoordinates) => store.set(measurementsMasjidAtom, measurements);
