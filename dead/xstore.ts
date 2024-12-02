import { atom } from 'jotai';
import { createJSONStorage } from 'jotai/utils';

import { ScheduleStore, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

// --- Storage Configuration ---
/** Custom storage implementation for MMKV with JSON serialization */
export const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = Database.database.getString(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key: string, value: unknown) => {
    Database.database.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    Database.database.delete(key);
  },
}));

// --- Prayer Schedule Atoms ---
/** Creates initial prayer data */
const initialPrayer = (scheduleType: ScheduleType) => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '05:35',
  type: scheduleType,
});

/** Creates a prayer schedule atom with initial state */
const createScheduleAtom = (scheduleType: ScheduleType) =>
  atom<ScheduleStore>({
    type: scheduleType,
    today: {
      0: initialPrayer(scheduleType),
    },
    tomorrow: {
      0: initialPrayer(scheduleType),
    },
    nextIndex: 0,
  });

/** Atom for standard prayer schedule */
export const standardScheduleAtom = createScheduleAtom(ScheduleType.Standard);

/** Atom for extra prayer schedule */
export const extraScheduleAtom = createScheduleAtom(ScheduleType.Extra);
