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

export interface ISingleApiResponseTransformed {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  magrib: string;
  isha: string;
  'last third': string;
  suhoor: string;
  duha: string;
  istijaba: string;
}

export enum ScheduleType {
  Standard = 'standard',
  Extra = 'extra',
}

export interface ITransformedPrayer {
  index: number;
  date: string;
  english: string;
  arabic: string;
  time: string;
  type: ScheduleType;
}

export interface IScheduleNow {
  [number: number]: ITransformedPrayer;
}

export interface IPrayerInfo {
  timerName: string;
  timeDisplay: string;
  timeDifference?: number;
  currentPrayer?: ITransformedPrayer;
}

export enum DaySelection {
  Today = 'today',
  Tomorrow = 'tomorrow',
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

export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

export interface ListStore {
  standard: PageCoordinates | null;
  extra: PageCoordinates | null;
}

export interface Measurements {
  date: PageCoordinates | null;
  list: PageCoordinates | null;
}

export enum AlertType {
  Off = 0,
  Notification = 1,
  Vibrate = 2,
  Sound = 3,
}

export enum AlertIcon {
  BELL_RING = 'BELL_RING',
  BELL_SLASH = 'BELL_SLASH',
  VIBRATE = 'VIBRATE',
  SPEAKER = 'SPEAKER',
}

export interface AlertPreferences {
  [prayerIndex: number]: AlertType;
}

export interface SoundPreferences {
  selected: number;
}

export interface Preferences {
  alert: AlertPreferences;
  athan: number;
}

export interface ScheduleStore {
  type: ScheduleType;
  today: IScheduleNow;
  tomorrow: IScheduleNow;
  nextIndex: number;
}

export interface PreferencesStore {
  preferences: Preferences;
}

export interface OverlayStore {
  isOn: boolean;
  selectedPrayerIndex: number;
  scheduleType: ScheduleType;
}

export interface FetchedYears {
  [year: number]: boolean;
}

export interface CountdownStore {
  time: string;
  name: string;
}
