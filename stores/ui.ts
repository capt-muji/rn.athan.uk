import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

import { PageCoordinates, ScheduleType } from '@/shared/types';
import { atomWithStorageBoolean, atomWithStorageNumber } from '@/stores/storage';

const store = getDefaultStore();

const emptyCoordinates: PageCoordinates = { pageX: 0, pageY: 0, width: 0, height: 0 };

// --- Atoms ---
export const pagePositionAtom = atom(0);
export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);
export const playingSoundIndexAtom = atom<number | null>(null);
export const refreshUIAtom = atom<number>(Date.now());
export const popupTipAthanEnabledAtom = atomWithStorageBoolean('popup_tip_athan_enabled', true);
export const popupUpdateEnabledAtom = atom(false);
export const popupUpdateLastCheckAtom = atomWithStorageNumber('popup_update_last_check', 0);

export const scrollPositionAtom = atom(0);

export const englishWidthStandardAtom = atomWithStorageNumber('prayer_max_english_width_standard', 0);
export const englishWidthExtraAtom = atomWithStorageNumber('prayer_max_english_width_extra', 0);

export const measurementsListAtom = atom<PageCoordinates>(emptyCoordinates);
export const measurementsDateAtom = atom<PageCoordinates>(emptyCoordinates);

export const progressBarHiddenAtom = atomWithStorageBoolean('preference_progressbar_hidden', false);

// New preference atoms for settings
export const hijriDateEnabledAtom = atomWithStorageBoolean('preference_hijri_date', false);
export const settingsSheetModalAtom = atom<BottomSheetModal | null>(null);

export const tempStandardMutedAtom = atom<boolean | null>(null);
export const tempExtraMutedAtom = atom<boolean | null>(null);

export const getTempMutedAtom = (type: ScheduleType) =>
  type === ScheduleType.Standard ? tempStandardMutedAtom : tempExtraMutedAtom;

export const setTempMutedState = (type: ScheduleType, value: boolean | null) => {
  const atom = type === ScheduleType.Standard ? tempStandardMutedAtom : tempExtraMutedAtom;
  store.set(atom, value);
};

// --- Actions ---
export const getPopupUpdateLastCheck = () => store.get(popupUpdateLastCheckAtom);
export const showSheet = () => store.get(bottomSheetModalAtom)?.present();
export const hideSheet = () => store.get(bottomSheetModalAtom)?.dismiss();
export const showSettingsSheet = () => store.get(settingsSheetModalAtom)?.present();
export const hideSettingsSheet = () => store.get(settingsSheetModalAtom)?.dismiss();

export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);
export const setSettingsSheetModal = (modal: BottomSheetModal | null) => store.set(settingsSheetModalAtom, modal);
export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);
export const setRefreshUI = (timestamp: number) => store.set(refreshUIAtom, timestamp);
export const setPopupTipAthanEnabled = (enabled: boolean) => store.set(popupTipAthanEnabledAtom, enabled);
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);
export const setPopupUpdateLastCheck = (timestamp: number) => store.set(popupUpdateLastCheckAtom, timestamp);

export const setEnglishWidth = (type: ScheduleType, width: number) => {
  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? englishWidthStandardAtom : englishWidthExtraAtom;

  store.set(atom, width);
};

export const setScrollPosition = (position: number) => store.set(scrollPositionAtom, position);
export const getMeasurementsList = () => store.get(measurementsListAtom);
export const setMeasurementsList = (measurements: PageCoordinates) => store.set(measurementsListAtom, measurements);
export const getMeasurementsDate = () => store.get(measurementsDateAtom);
export const setMeasurementsDate = (measurements: PageCoordinates) => store.set(measurementsDateAtom, measurements);
