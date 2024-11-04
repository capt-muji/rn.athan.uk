import storage from '@/storage/storage';
import { transformApiData, createTodayStructure } from '@/utils/prayer';

// import setAtom from jotai and setAtom from jotai
export const initializePrayers = async (
  setIsLoading: setAtom,
  setHasError: any,
  setTodaysPrayers: any,
  setNextPrayerIndex: any,
  apiData: any
) => {
  try {
    const transformedPrayers = transformApiData(apiData);
    storage.prayers.storePrayers(transformedPrayers);

    const todayRaw = storage.prayers.getTodaysPrayers();
    if (!todayRaw) throw new Error('No prayers found for today');

    const todaysPrayers = createTodayStructure(todayRaw);
    const nextPrayer = Object.values(todaysPrayers).find(p => !p.passed);
    const nextPrayerIndex = nextPrayer?.index ?? -1;

    setIsLoading(false);
    setHasError(false);
    setTodaysPrayers(todaysPrayers);
    setNextPrayerIndex(nextPrayerIndex);

    return { todaysPrayers, nextPrayerIndex };
  } catch (error) {
    console.error('Prayer initialization failed:', error);

    setIsLoading(false);
    setHasError(true);

    return null;
  }
};