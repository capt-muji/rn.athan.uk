import { IApiResponse } from "@/shared/types";
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
    [dayBeforeYesterday]: {
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
    [yesterday]: {
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
    [today]: {
      date: today,
      fajr: addMinutes(1),
      sunrise: addMinutes(2),
      dhuhr: addMinutes(3),
      asr: addMinutes(4),
      magrib: addMinutes(5),
      isha: addMinutes(6),
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [tomorrow]: {
      date: tomorrow,
      fajr: "01:38",
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
    [dayAfterTomorrow]: {
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
