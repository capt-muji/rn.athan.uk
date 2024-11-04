import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';
import { Animated } from 'react-native';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const overlayVisibleAtom = atom<number>(-1);
export const overlayAnimationAtom = atom<Animated.Value>(new Animated.Value(0));

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);