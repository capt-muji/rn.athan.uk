import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';
import { SheetManager } from 'react-native-actions-sheet';

const store = getDefaultStore();

// --- Atoms ---
export const pagePositionAtom = atom<number>(0);

// --- Actions ---
export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);

export const openSoundSheet = () => {
  SheetManager.show('sound-sheet');
};
