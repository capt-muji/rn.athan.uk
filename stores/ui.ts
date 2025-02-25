import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

import { PageCoordinates, ScheduleType } from '@/shared/types';
import { atomWithStorageBoolean, atomWithStorageNumber, atomWithStorageObject } from '@/stores/storage';

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

// Times Explained Modal States:
// 0 = Never shown (initial state)
// 1 = Show modal
// 2 = Never show again (user has closed modal)
export const popupTimesExplainedAtom = atomWithStorageNumber('popup_times_explained_enabled', 0);

export const scrollPositionAtom = atom(0);

export const englishWidthStandardAtom = atomWithStorageNumber('prayer_max_english_width_standard', 0);
export const englishWidthExtraAtom = atomWithStorageNumber('prayer_max_english_width_extra', 0);

export const measurementsListAtom = atomWithStorageObject<PageCoordinates>('measurements_list', emptyCoordinates);
export const measurementsDateAtom = atomWithStorageObject<PageCoordinates>('measurements_date', emptyCoordinates);

export const silentNotificationSentAtom = atomWithStorageBoolean('silent_notification_sent', false);

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
export const getPopupTimesExplained = () => store.get(popupTimesExplainedAtom);
export const showSheet = () => store.get(bottomSheetModalAtom)?.present();
export const hideSheet = () => store.get(bottomSheetModalAtom)?.dismiss();

export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);
export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);
export const setRefreshUI = (timestamp: number) => store.set(refreshUIAtom, timestamp);
export const setPopupTipAthanEnabled = (enabled: boolean) => store.set(popupTipAthanEnabledAtom, enabled);
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);
export const setPopupUpdateLastCheck = (timestamp: number) => store.set(popupUpdateLastCheckAtom, timestamp);
export const setPopupTimesExplained = (enabled: number) => store.set(popupTimesExplainedAtom, enabled);

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

export const setSilentNotificationSent = (sent: boolean) => store.set(silentNotificationSentAtom, sent);
