import { storage } from '../storage/storage';
import { transformApiData, createTodayStructure } from '../utils/prayer';
import { SetStateAction } from 'jotai';
import { ITransformedToday } from '@/types/prayers';

export const initializePrayers = async (
  setIsLoading: any,
  setHasError: any,
  setTodaysPrayers: any,
  setNextPrayerIndex: any,
  apiData: any
) => {
  try {
    const transformedPrayers = transformApiData(apiData);
    storage.storePrayers(transformedPrayers);

    const todayRaw = storage.getTodaysPrayers();
    if (!todayRaw) throw new Error('No prayers found for today');

    const todaysPrayers = createTodayStructure(todayRaw);
    const nextPrayer = Object.values(todaysPrayers).find(p => !p.passed);
    const nextPrayerIndex = nextPrayer?.index ?? -1;

    setIsLoading(false);
    setHasError(false);
    setTodaysPrayers(todaysPrayers);
    setNextPrayerIndex(nextPrayerIndex);

    console.log('🙏 Todays prayers');
    return { todaysPrayers, nextPrayerIndex };
  } catch (error) {
    console.error('Prayer initialization failed:', error);
    setIsLoading(false);
    setHasError(true);
    return null;
  }
};

export const updatePrayerStates = (
  setTodaysPrayers: (update: SetStateAction<ITransformedToday>) => void,
  setNextPrayerIndex: (update: SetStateAction<number>) => void
) => {
  const todayRaw = storage.getTodaysPrayers();
  if (!todayRaw) return;

  const prayers = createTodayStructure(todayRaw);
  const nextPrayer = Object.values(prayers).find(p => !p.passed);
  
  setTodaysPrayers(prayers);
  setNextPrayerIndex(nextPrayer?.index ?? -1);
};
