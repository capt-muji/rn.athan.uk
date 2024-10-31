import { IApiAllTimes, IApiSingleTime } from "@/types/api";

// Check if a day is today or in the future
const isValidDate = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight

  const dayDate = new Date(date);
  dayDate.setHours(0, 0, 0, 0); // Set time to midnight for comparison

  return dayDate >= today;
};

// Return prayer times for today and future days as single records
export const filterValidDates = (times: IApiAllTimes): IApiSingleTime[] => {
  const validDates = Object.keys(times)
    .filter(date => isValidDate(date)) // Filter dates that are today or in the future
    .map(date => times[date]); // Map the filteresd dates to their corresponding prayer records

  return validDates;
};