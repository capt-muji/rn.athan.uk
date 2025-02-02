import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

import { ScheduleType } from '@/shared/types';
import { atomWithStorageBoolean, atomWithStorageNumber } from '@/stores/storage';

const store = getDefaultStore();

// --- Atoms ---
export const pagePositionAtom = atom(0);
export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);
export const playingSoundIndexAtom = atom<number | null>(null);
export const refreshUIAtom = atom<number>(Date.now());
export const popupTipAthanEnabledAtom = atomWithStorageBoolean('popup_tip_athan_enabled', true);
export const popupUpdateEnabledAtom = atom(false);

export const englishWidthStandardAtom = atomWithStorageNumber('prayer_max_english_width_standard', 0);
export const englishWidthExtraAtom = atomWithStorageNumber('prayer_max_english_width_extra', 0);

// --- Actions ---
export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);
export const showSheet = () => store.get(bottomSheetModalAtom)?.present();
export const hideSheet = () => store.get(bottomSheetModalAtom)?.dismiss();
export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);
export const setRefreshUI = (timestamp: number) => store.set(refreshUIAtom, timestamp);
export const setPopupTipAthanEnabled = (enabled: boolean) => store.set(popupTipAthanEnabledAtom, enabled);
export const setPopupUpdateEnabled = (enabled: boolean) => store.set(popupUpdateEnabledAtom, enabled);

export const setEnglishWidth = (type: ScheduleType, width: number) => {
  const isStandard = type === ScheduleType.Standard;
  const atom = isStandard ? englishWidthStandardAtom : englishWidthExtraAtom;
  const currentWidth = store.get(atom);

  if (width > currentWidth) store.set(atom, width);
};
