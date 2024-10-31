export interface ISingleScheduleTransformed {
  date: string;
  fajr: string;
  sunrise: string;
  duha: string;
  dhuhr: string;
  asr: string;
  magrib: string;
  isha: string;
}

export interface ITransformedPrayer {
  arabic: string;
  english: string;
  index: number;
  time: string;
}

export type ITransformedToday = {
  [number: string]: ITransformedPrayer;
};