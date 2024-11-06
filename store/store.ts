import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';
import { COLORS } from '@/constants';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const tomorrowsPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const selectedPrayerDateAtom = atom<'today' | 'tomorrow'>('today');
export const overlayAtom = atom<boolean>(false);
export const selectedPrayerIndexAtom = atom<number | null>(null);

export const backgroundColorsAtom = atom((get) => {
  const isOverlay = get(overlayAtom);
  return isOverlay 
    ? ['black', 'black']
    : [COLORS.gradientStart, COLORS.gradientEnd];
});

export const overlayDateColorAtom = atom((get) => {
  const isOverlay = get(overlayAtom);
  return isOverlay ? COLORS.textSecondary : COLORS.textPrimary;
});