import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

const store = getDefaultStore();

// --- Atoms ---
export const pagePositionAtom = atom(0);
export const bottomSheetModalAtom = atom<BottomSheetModal | null>(null);

// --- Actions ---
export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);
export const setBottomSheetModal = (modal: BottomSheetModal | null) => store.set(bottomSheetModalAtom, modal);

export const showSheet = () => store.get(bottomSheetModalAtom)?.present();
export const hideSheet = () => store.get(bottomSheetModalAtom)?.dismiss();
