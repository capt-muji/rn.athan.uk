import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';
import { Animated } from 'react-native';

export const isLoadingAtom = atom(true);
export const hasErrorAtom = atom(false);

export const overlayVisibleAtom = atom(-1);
export const overlayAnimationAtom = atom(new Animated.Value(0));

export const todaysPrayersAtom = atom<ITransformedToday>({});