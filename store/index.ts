import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const todaysPrayersAtom = atom<ITransformedToday>({});