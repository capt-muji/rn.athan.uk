import Storage from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType, IScheduleNow } from '@/shared/types';
import { useAtom } from 'jotai';
import { scheduleExtraNextIndexAtom, scheduleExtraSelectedIndexAtom, scheduleExtraTodayAtom, scheduleExtraTomorrowAtom, scheduleStandardNextIndexAtom, scheduleStandardSelectedIndexAtom, scheduleStandardTodayAtom, scheduleStandardTomorrowAtom, absoluteStandardMeasurementsAtom, absoluteStandardNextIndexMeasurementsAtom, absoluteExtraNextIndexMeasurementsAtom, absoluteExtraMeasurementsAtom } from '@/stores/store';

export default function useSchedule(type: PrayerType) {
  const isStandard = type === 'standard';

  const [standardToday, setStandardToday] = useAtom(scheduleStandardTodayAtom);
  const [scheduleExtraToday, setScheduleExtraToday] = useAtom(scheduleExtraTodayAtom);

  const [standardTomorrow, setStandardTomorrow] = useAtom(scheduleStandardTomorrowAtom);
  const [extraTomorrow, setExtraTomorrow] = useAtom(scheduleExtraTomorrowAtom);

  const [standardNextIndex, setStandardNextIndex] = useAtom(scheduleStandardNextIndexAtom);
  const [extraNextIndex, setExtraNextIndex] = useAtom(scheduleExtraNextIndexAtom);

  const [standardSelectedIndex, setStandardSelectedIndex] = useAtom(scheduleStandardSelectedIndexAtom);
  const [extraSelectedIndex, setExtraSelectedIndex] = useAtom(scheduleExtraSelectedIndexAtom);

  const [standardMeasurements, setStandardMeasurements] = useAtom(absoluteStandardMeasurementsAtom);
  const [extraMeasurements, setExtraMeasurements] = useAtom(absoluteExtraMeasurementsAtom);

  const [standardNextIndexMeasurements, setStandardNextIndexMeasurements] = useAtom(absoluteStandardNextIndexMeasurementsAtom);
  const [extraNextIndexMeasurements, setExtraNextIndexMeasurements] = useAtom(absoluteExtraNextIndexMeasurementsAtom);

  const scheduleToday = isStandard ? standardToday : scheduleExtraToday;
  const setScheduleToday = isStandard ? setStandardToday : setScheduleExtraToday;

  const scheduleTomorrow = isStandard ? standardTomorrow : extraTomorrow
  const setScheduleTomorrow = isStandard ? setStandardTomorrow : setExtraTomorrow;

  const nextIndex = isStandard ? standardNextIndex : extraNextIndex;
  const setNextIndex = isStandard ? setStandardNextIndex : setExtraNextIndex;

  const selectedIndex = isStandard ? standardSelectedIndex : extraSelectedIndex;
  const setSelectedIndex = isStandard ? setStandardSelectedIndex : setExtraSelectedIndex;

  const measurements = isStandard ? standardMeasurements : extraMeasurements;
  const setMeasurements = isStandard ? setStandardMeasurements : setExtraMeasurements;

  const nextIndexMeasurements = isStandard ? standardNextIndexMeasurements : extraNextIndexMeasurements;
  const setNextIndexMeasurements = isStandard ? setStandardNextIndexMeasurements : setExtraNextIndexMeasurements;

  // Set today and tomorrow prayers in the store
  const setTodayAndTomorrow = () => {
    console.log(`Setting ${type} schedule`);

    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');

    if (!todayRaw || !tomorrowRaw) throw new Error('Data not found');
    
    const todaySchedule = createSchedule(todayRaw, type);
    const tomorrowSchedule = createSchedule(tomorrowRaw, type);

    setScheduleToday(todaySchedule);
    setScheduleTomorrow(tomorrowSchedule);

    console.log(`Finished setting ${type} schedule`);
    return { today: todaySchedule, tomorrow: tomorrowSchedule };
  }

  // Initialize next prayer index
  const updateNextIndex = (prayers: IScheduleNow) => {
    console.log('Setting next prayer');

    const schedule = Object.values(prayers);
    const nextPrayer = schedule.find(prayer => !prayer.passed) || prayers[0];
    
    setNextIndex(nextPrayer.index);

    console.log('Finished setting next prayer');
    return nextPrayer;
  };
  
  // Mark next prayer as passed and set next prayer index
  // setPrayersNextIndex(nextPrayer.index === 5 ? 0 : prayersNextIndex + 1);
  // Reset to Fajr if last prayer has passed
  // console.log('Finished setting next prayer');

  return {
    scheduleToday,
    scheduleTomorrow,
    nextIndex,
    selectedIndex,
    measurements,
    nextIndexMeasurements,
    setMeasurements,
    setNextIndexMeasurements,
    setTodayAndTomorrow,
    setSelectedIndex,
    updateNextIndex
  };
};