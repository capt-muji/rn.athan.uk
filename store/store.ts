import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const tomorrowsPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const selectedPrayerDateAtom = atom<'today' | 'tomorrow'>('today');
export const overlayAtom = atom<boolean>(false);
export const selectedPrayerIndexAtom = atom<number | null>(null);