import { storage } from '../storage/mmkv';
import { filterValidDates } from '@/utils/filterValidDates';
import { transformPrayerSchedule } from '@/utils/transformPrayerSchedule';
import { transformTodaysStructure } from '@/utils/transformTodaysStructure';
import { MOCK_DATA_SIMPLE } from '../mocks/data';

// @ts-ignore
export const init = async (setIsLoading, setHasError, setTodaysPrayers, setNextPrayerIndex) => {
  try {
    // Step 1: Filter the data to only include today's and future prayer times
    const filteredDays = filterValidDates(MOCK_DATA_SIMPLE.times);

    // Step 2: Modify the schedules to remove unwanted keys and include duha prayer
    const transformedSchedules = transformPrayerSchedule(filteredDays);

    // Step 3: Store the transformed schedules in storage
    storage.storeManyDays(transformedSchedules);

    // Step 4: Retrieve today's prayers from storage
    const todaysPrayers = storage.getTodaysPrayers();

    // Step 5: Handle the case where no today's prayers are found
    if (!todaysPrayers) {
      console.log('No prayers found for today');
      setHasError(true);
      return;
    }

    // Step 6: Transform today's prayers into a structured format
    const todaysPrayersStructured = transformTodaysStructure(todaysPrayers);

    // Step 7: Find the first non-passed prayer to set as next
    const firstNonPassedPrayer = Object.values(todaysPrayersStructured)
      .find(prayer => !prayer.passed);

    // Set nextPrayerIndex to the found prayer's index or -1 if all passed
    setNextPrayerIndex(firstNonPassedPrayer ? firstNonPassedPrayer.index : -1);

    // Step 8: Update the state with today's structured prayers
    setTodaysPrayers(todaysPrayersStructured);
    setHasError(false);
  } catch (error) {
    console.log('Error fetching prayers:', error);
    setHasError(true);
  } finally {
    // Delay the loading state change by 1 second
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }
};
