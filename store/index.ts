import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const isLoadingAtom = atom(true);
export const hasErrorAtom = atom(false);

export const overlayVisibleAtom = atom(false);

export const todaysPrayersAtom = atom<ITransformedToday>({});