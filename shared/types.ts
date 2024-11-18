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

export type PrayerType = 'standard' | 'extra';

export interface ITransformedPrayer {
  index: number;
  date: string;
  english: string;
  arabic: string;
  time: string;
  passed: boolean;
  isNext: boolean;
  type: PrayerType;
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

export enum DaySelection {
  Today = 'today',
  Tomorrow = 'tomorrow'
}

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

// Store Types
export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

// Preferences Types
export enum AlertType {
  Off = 0,
  Notification = 1,
  Vibrate = 2,
  Sound = 3
}

export interface AlertPreferences {
  [prayerIndex: number]: AlertType;
}

export interface Preferences {
  alert: AlertPreferences;
  language: Language;
  athan: number;
}
export type Language = 'en' | 'ar';

// ScheduleStore and StoreState interfaces
export interface ScheduleStore {
  today: IScheduleNow;
  tomorrow: IScheduleNow;
  nextIndex: number;
  selectedIndex: number;
  measurements: Record<number, PageCoordinates>;
  nextIndexMeasurements: PageCoordinates | null;
  setToday: (value: IScheduleNow) => void;
  setTomorrow: (value: IScheduleNow) => void;
  setNextIndex: (value: number) => void;
  setSelectedIndex: (value: number) => void;
  setMeasurements: (value: Record<number, PageCoordinates>) => void;
  setNextIndexMeasurements: (value: PageCoordinates | null) => void;
}
// Remove this interface as it's duplicated
// export interface StoreState {
//   app: {
//     isLoading: boolean;
//     isOverlayOn: boolean;
//     hasError: boolean;
//     setIsLoading: (value: boolean) => void;
//     setIsOverlayOn: (value: boolean) => void;
//     setHasError: (value: boolean) => void;
//   };
//   date: {
//     current: string;
//     measurements: PageCoordinates | null;
//     setCurrent: (value: string) => void;
//     setMeasurements: (value: PageCoordinates | null) => void;
//   };
//   preferences: Preferences;
//   setPreferences: (value: Preferences) => void;
//   schedules: {
//     standard: ScheduleStore;
//     extra: ScheduleStore;
//   };
// }

// New store interfaces
export interface PreferencesStore {
  preferences: Preferences;
  setPreferences: (value: Preferences) => void;
}

export interface AppStore {
  isLoading: boolean;
  isOverlayOn: boolean;
  hasError: boolean;
  setIsLoading: (value: boolean) => void;
  setIsOverlayOn: (value: boolean) => void;
  setHasError: (value: boolean) => void;
}

export interface DateStore {
  current: string;
  measurements: PageCoordinates | null;
  setCurrent: (value: string) => void;
  setMeasurements: (value: PageCoordinates | null) => void;
}

export interface SchedulesStore {
  standard: ScheduleStore;
  extra: ScheduleStore;
}

export interface OverlayStore {
  isOn: boolean;
  setIsOn: (value: boolean) => void;
}

// Update the final StoreState interface
export interface StoreState {
  app: AppStore;
  date: DateStore;
  preferences: PreferencesStore;
  schedules: SchedulesStore;
  overlay: OverlayStore;
}