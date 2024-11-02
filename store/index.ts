import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const isLoadingAtom = atom(true);
export const hasErrorAtom = atom(false);

export const overlayVisibleAtom = atom(-1);

export const todaysPrayersAtom = atom<ITransformedToday>({});