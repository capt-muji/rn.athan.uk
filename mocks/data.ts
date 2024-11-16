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
      asr: "13:50",
      magrib: "16:15",
      isha: "17:48",
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
      asr: "13:49",
      magrib: "16:14",
      isha: "17:47",  
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
      asr: "13:48",
      magrib: "16:12",
      isha: "17:45",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [tomorrow]: {  // Nov 17
      date: tomorrow,
      fajr: "05:38",
      sunrise: "07:20",
      dhuhr: "11:51",
      asr: "13:47",
      magrib: "16:11",
      isha: "17:44",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [dayAfterTomorrow]: {  // Nov 18
      date: dayAfterTomorrow,
      fajr: "05:39",
      sunrise: "07:22",
      dhuhr: "11:51",
      asr: "13:46",
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
