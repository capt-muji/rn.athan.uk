import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom, getDefaultStore } from 'jotai';

const store = getDefaultStore();

// --- Atoms ---
export const pagePositionAtom = atom(0);
export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);
export const playingSoundIndexAtom = atom<number | null>(null);
export const refreshUIAtom = atom<number>(Date.now());

// --- Actions ---
export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);

export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);

export const showSheet = () => store.get(bottomSheetModalAtom)?.present();
export const hideSheet = () => store.get(bottomSheetModalAtom)?.dismiss();

export const setPlayingSoundIndex = (index: number | null) => store.set(playingSoundIndexAtom, index);
export const setRefreshUI = (timestamp: number) => store.set(refreshUIAtom, timestamp);
