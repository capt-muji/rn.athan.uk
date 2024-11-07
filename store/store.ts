import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';
import { COLORS } from '@/constants';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const tomorrowsPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const lastValidPositionAtom = atom<number>(0);

export const backgroundColorsAtom = atom((get) => {
  return [COLORS.gradientStart, COLORS.gradientEnd];
});