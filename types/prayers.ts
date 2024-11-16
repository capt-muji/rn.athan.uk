export interface ISingleApiResponseTransformed {
  date: string;
  fajr: string;
  sunrise: string;
  duha: string;
  dhuhr: string;
  asr: string;
  magrib: string;
  isha: string;
  thirdOfNight: string;
}

export interface ITransformedPrayer {
  index: number;
  date: string;
  english: string;
  arabic: string;
  time: string;
  passed: boolean;
  isNext: boolean;
}

export interface IScheduleNow {
  [number: string]: ITransformedPrayer;
};

export interface IPrayerInfo {
  timerName: string;
  timeDisplay: string;
  timeDifference?: number;
  currentPrayer?: ITransformedPrayer;
}

export type DaySelection = 'today' | 'tomorrow';

export interface ITimeString {
  time: string;
}

export interface IDateString {
  date: string;
}

export interface IMinutesConfig {
  time: string;
  minutes: number;
}

export interface IPrayerConfig {
  prayers: IScheduleNow;
  prayerIndex: number;
  selectedDate?: DaySelection;
}

export interface ITimeDifferenceConfig {
  targetTime: string;
  date?: string;
}