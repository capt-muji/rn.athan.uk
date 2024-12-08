import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

const store = getDefaultStore();

// --- Atoms ---

export const pagePositionAtom = atom(0);

// --- Actions ---

export const setPagePosition = (position: number) => store.set(pagePositionAtom, position);
