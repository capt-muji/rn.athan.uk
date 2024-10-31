import { ISingleScheduleTransformed } from '../types/prayers';
import { ENGLISH, ARABIC } from '../constants';
import { ITransformedToday } from '../types/prayers';

export const transformTodaysStructure = (day: ISingleScheduleTransformed): ITransformedToday => {
  const transformedDay: ITransformedToday = {};

  ENGLISH.forEach((name, index) => {
    const prayerName = name.toLowerCase() as keyof ISingleScheduleTransformed;

    transformedDay[index.toString()] = {
      index,
      english: name,
      arabic: ARABIC[index],
      time: day[prayerName],
    };
  });

  return transformedDay;
};