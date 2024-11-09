import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const tomorrowsPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const lastValidPositionAtom = atom<number>(0);

export const overlayVisibleAtom = atom<boolean>(false);
export const selectedPrayerIndexAtom = atom<number | null>(null);

interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

export const activePrayerMeasurementsAtom = atom<PageCoordinates | null>(null);
export const prayerMeasurementsAtom = atom<Record<number, PageCoordinates>>({});
export const timerMeasurementsAtom = atom<PageCoordinates | null>(null);
export const dateMeasurementsAtom = atom<PageCoordinates | null>(null);