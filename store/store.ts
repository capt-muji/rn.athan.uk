import { atom } from 'jotai';
import { Animated } from 'react-native';

import { ITransformedToday } from '@/types/prayers';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const overlayVisibleAtom = atom<number>(-1);
export const overlayAnimationAtom = atom<Animated.Value>(new Animated.Value(0));

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const tomorrowsPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const selectedPrayerDateAtom = atom<'today' | 'tomorrow'>('today');