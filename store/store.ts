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

export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

interface OverlayItem {
  name: string;
  component: React.ReactNode;
  measurements: PageCoordinates;
}

export const overlayContentAtom = atom<OverlayItem[]>([]);

export const absoluteActivePrayerMeasurementsAtom = atom<PageCoordinates | null>(null);

export const absolutePrayerMeasurementsAtom = atom<PageCoordinates[]>([]);
export const relativePrayerMeasurementsAtom = atom<Coordinates[]>([]);

export const absoluteTimerMeasurementsAtom = atom<PageCoordinates | null>(null);
export const absoluteDateMeasurementsAtom = atom<PageCoordinates | null>(null);

export const overlayAnimatingAtom = atom<boolean>(false);
export const overlayClosingAtom = atom<boolean>(false);