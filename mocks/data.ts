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
    [dayBeforeYesterday]: {
      date: dayBeforeYesterday,
      fajr: "01:00",
      sunrise: "02:00",
      dhuhr: "03:00",
      asr: "04:00",
      magrib: "05:00",
      isha: "05:45",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [yesterday]: {
      date: yesterday,
      fajr: "01:01",
      sunrise: "02:01",
      dhuhr: "03:01",
      asr: "04:01",
      magrib: "05:01",
      isha: "05:46",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [today]: {
      date: today,
      fajr: "01:02",
      sunrise: "02:02", 
      dhuhr: addMinutes(1),
      asr: addMinutes(3),
      magrib: addMinutes(5),
      isha: addMinutes(7),
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [tomorrow]: {
      date: tomorrow,
      fajr: "01:13",
      sunrise: "02:22", 
      dhuhr: "03:33",
      asr: "04:44",
      magrib: "05:55",
      isha: "05:59",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    },
    [dayAfterTomorrow]: {
      date: dayAfterTomorrow,
      fajr: "01:14",
      sunrise: "02:23",
      dhuhr: "03:34",
      asr: "04:45",
      magrib: "05:56",
      isha: "06:00",
      fajr_jamat: "00:00",
      dhuhr_jamat: "00:00",
      asr_2: "00:00",
      asr_jamat: "00:00",
      magrib_jamat: "00:00",
      isha_jamat: "00:00",
    }
  },
};
