// API
export interface IApiSingleTime {
  date: string;
  fajr: string;
  fajr_jamat: string;
  sunrise: string;
  dhuhr: string;
  dhuhr_jamat: string;
  asr: string;
  asr_2: string;
  asr_jamat: string;
  magrib: string;
  magrib_jamat: string;
  isha: string;
  isha_jamat: string;
}

export interface IApiTimes {
  [date: string]: IApiSingleTime;
}

export interface IApiResponse {
  city: string;
  times: Record<string, IApiSingleTime>;
}

// Prayers
export interface ISingleApiResponseTransformed {
  date: string;
  fajr: string;
  sunrise: string;
  duha: string;
  dhuhr: string;
  asr: string;
  magrib: string;
  isha: string;
  "last third": string;
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
  [number: number]: ITransformedPrayer;
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