import { atom } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

export const todaysPrayersAtom = atom<ITransformedToday>({});
export const tomorrowsPrayersAtom = atom<ITransformedToday>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const lastValidPositionAtom = atom<number>(0);

interface PrayerMeasurements {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const activePrayerMeasurementsAtom = atom<PrayerMeasurements | null>(null);

export const prayerMeasurementsAtom = atom<Record<number, PrayerMeasurements>>({});

export const timerMeasurementsAtom = atom<PrayerMeasurements | null>(null);
export const dateMeasurementsAtom = atom<PrayerMeasurements | null>(null);