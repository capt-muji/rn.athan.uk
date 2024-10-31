import { IApiAllTimes, IApiSingleTime } from "@/types/api";
import { isTodayOrFuture } from "./isTodayOrFuture";

// return prayer times for today and future days as single records
export const filterTodayOrFutureDays = (times: IApiAllTimes): IApiSingleTime[] => {
  return Object.keys(times)
    .filter(date => isTodayOrFuture(date)) // Filter dates that are today or in the future
    .map(date => times[date]); // Map the filteresd dates to their corresponding prayer records
};