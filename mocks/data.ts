import { IApiResponse } from "@/types/api";
import { addDays, subDays, format } from "date-fns";

const now = new Date();

const addMinutes = (minutesToAdd: number) => {
  const date = new Date(now.getTime() + minutesToAdd * 60000);
  return date.toLocaleTimeString('en-GB', {  hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const dayBeforeYesterday = formatDate(subDays(now, 2));
const yesterday = formatDate(subDays(now, 1));
const today = formatDate(now);
const tomorrow = formatDate(addDays(now, 1));
const dayAfterTomorrow = formatDate(addDays(now, 2));

export const MOCK_DATA_SIMPLE: IApiResponse = {
  city: "london",
  times: {
    [dayBeforeYesterday]: {  // Nov 14
      date: dayBeforeYesterday,
      fajr: "05:34",
      sunrise: "07:15",
      dhuhr: "11:50",
      asr: "13:50",    // Using 1 Mithl time (1:50PM)
      magrib: "16:15", // Using begins time (4:15PM)
      isha: "17:48",   // Using begins time (5:48PM)
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [yesterday]: {  // Nov 15
      date: yesterday,
      fajr: "05:35",
      sunrise: "07:16",
      dhuhr: "11:50",
      asr: "13:49",    // Using 1 Mithl time (1:49PM)
      magrib: "16:14", // Using begins time (4:14PM)
      isha: "17:47",   // Using begins time (5:47PM)
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [today]: {  // Nov 16
      date: today,
      fajr: "05:36",
      sunrise: "07:18",
      dhuhr: "11:51",
      asr: "13:48",    // Using 1 Mithl time (1:48PM)
      magrib: "16:12", // Using begins time (4:12PM)
      isha: "17:45",   // Using begins time (5:45PM)
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [tomorrow]: {  // Nov 17 (estimated)
      date: tomorrow,
      fajr: "05:38",
      sunrise: "07:20",
      dhuhr: "11:51",
      asr: "13:47",    // Following the pattern
      magrib: "16:11",
      isha: "17:44",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [dayAfterTomorrow]: {  // Nov 18 (estimated)
      date: dayAfterTomorrow,
      fajr: "05:39",
      sunrise: "07:22",
      dhuhr: "11:51",
      asr: "13:46",    // Following the pattern
      magrib: "16:09",
      isha: "17:43",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    }
  },
};
