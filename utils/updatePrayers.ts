import { storage } from '../storage/mmkv';
import { transformTodaysStructure } from './transformTodaysStructure';
import { SetStateAction } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const updatePrayers = (
  setTodaysPrayers: (update: SetStateAction<ITransformedToday>) => void,
  setNextPrayerIndex: (update: SetStateAction<number>) => void
) => {
  const todaysPrayersRaw = storage.getTodaysPrayers();
  if (!todaysPrayersRaw) return;

  const updatedPrayers = transformTodaysStructure(todaysPrayersRaw);
  
  // Find next prayer
  const nextPrayer = Object.values(updatedPrayers).find(p => !p.passed);
  
  // Update states
  setTodaysPrayers(updatedPrayers);
  setNextPrayerIndex(nextPrayer ? nextPrayer.index : -1);
};
