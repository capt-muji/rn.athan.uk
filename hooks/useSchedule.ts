import Storage from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType, IScheduleNow } from '@/shared/types';
import { useAtom } from 'jotai';
import { scheduleExtraNextIndexAtom, scheduleExtraSelectedIndexAtom, scheduleExtraTodayAtom, scheduleExtraTomorrowAtom, scheduleStandardNextIndexAtom, scheduleStandardSelectedIndexAtom, scheduleStandardTodayAtom, scheduleStandardTomorrowAtom} from '@/stores/store';

export default function useSchedule(type: PrayerType) {
  const isStandard = type === 'standard';

  const [scheduleStandardToday, setScheduleStandardToday] = useAtom(scheduleStandardTodayAtom);
  const [scheduleExtraToday, setScheduleExtraToday] = useAtom(scheduleExtraTodayAtom);

  const [scheduleStandardTomorrow, setScheduleStandardTomorrow] = useAtom(scheduleStandardTomorrowAtom);
  const [scheduleExtraTomorrow, setScheduleExtraTomorrow] = useAtom(scheduleExtraTomorrowAtom);

  const [scheduleStandardNextIndex, setScheduleStandardNextIndex] = useAtom(scheduleStandardNextIndexAtom);
  const [scheduleExtraNextIndex, setScheduleExtraNextIndex] = useAtom(scheduleExtraNextIndexAtom);

  const [scheduleStandardSelectedIndex, setScheduleStandardSelectedIndex] = useAtom(scheduleStandardSelectedIndexAtom);
  const [scheduleExtraSelectedIndex, setScheduleExtraSelectedIndex] = useAtom(scheduleExtraSelectedIndexAtom);

  const scheduleToday = isStandard ? scheduleStandardToday : scheduleExtraToday;
  const setScheduleToday = isStandard ? setScheduleStandardToday : setScheduleExtraToday;

  const scheduleTomorrow = isStandard ? scheduleStandardTomorrow : scheduleExtraTomorrow
  const setScheduleTomorrow = isStandard ? setScheduleStandardTomorrow : setScheduleExtraTomorrow;

  const nextIndex = isStandard ? scheduleStandardNextIndex : scheduleExtraNextIndex;
  const setNextIndex = isStandard ? setScheduleStandardNextIndex : setScheduleExtraNextIndex;

  const selectedIndex = isStandard ? scheduleStandardSelectedIndex : scheduleExtraSelectedIndex;
  const setSelectedIndex = isStandard ? setScheduleStandardSelectedIndex : setScheduleExtraSelectedIndex;

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
    schedule,
    nextIndex,
    setTodayAndTomorrow,
    updateNextIndex
  };
};