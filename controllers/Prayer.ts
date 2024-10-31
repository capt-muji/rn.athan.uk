import * as Api from "../api";
import { ARABIC, ENGLISH } from "../constants";
import type { IPrayerItem, IUseStoreState } from "!stores";
import { getCache, getPrayersByDateCache, setCache } from "!utils/cache";
import { forceAppRefresh } from "!utils/application";
import { convert24hrToMillisecond, getToday } from "!utils/time";

export class PrayerController {
  private Store: IUseStoreState;

  constructor(Store: IUseStoreState) {
    this.Store = Store;
  }

  public async init(): Promise<void> {
    await this._fetchPrayers();

    this._setPrayersForToday();
    this._setNextPrayerIndex();
  }

  /**
   * Fetches the prayer times from the API and returns them as a Promise.
   * If there is a valid cache available, it returns the cached result.
   * If the cache is outdated, it clears the cache and reloads the page.
  */
  private async _fetchPrayers(): Promise<Api.IGetPrayersApiResponse> {
    const cache = getCache("data");

    if (!cache) {
      // get prayers times and set new cache cache
      const apiResult = await Api.get();
      setCache("data", { result: apiResult, updatedAt: new Date().getFullYear() });

      return apiResult;
    }

    // prepare date check
    const currentYear = new Date().getFullYear();
    if (currentYear === cache.updatedAt) return cache.result;

    // new year, old cache. clear cache and reload page
    forceAppRefresh();

    // this will never be reached - forceAppRefresh will reload the page
    throw new Error("Cache outdated");
  }

  /**
   * This method is responsible for fetching and setting the daily prayer times for today's date.
   * It first gets today's date in the YYYY-MM-DD format and then retrieves the cached prayer times for this date.
   * It then maps over the English prayer names to create an array of prayer objects, where each object contains the index, Arabic name,
   * English name, prayer time, and whether the prayer has passed or not.
   * The prayer time is retrieved from the cached prayer times and converted from 24-hour format to milliseconds, and the "passed" property is set
   * to true if the current time is after the prayer time.
   * Finally, the prayers array is set in the store for the current day.
  */
  private _setPrayersForToday = (): void => {
    const today = getToday();
    const todayPrayerTimes = getPrayersByDateCache(today);

    const prayers = prayerNamesEnglish.map((name, index): IPrayerItem => {
      const prayer = {
        index,
        arabic: prayerNamesArabic[index],
        english: name,
        passed: false,
        time: todayPrayerTimes[name.toLocaleLowerCase()],
        timeLeft: "..."
      };

      const time = convert24hrToMillisecond(prayer.time);
      const now = new Date().getTime();

      prayer.passed = now > time;

      return prayer;
    });

    this.Store.prayers = prayers;
    this.Store.prayersDate = todayPrayerTimes.date;
  };

  /**
   * Sets the index of the next prayer in the prayers array.
   * The index is determined by finding the first prayer in the array
   * that has not yet passed. If all prayers have passed, the index is set to -1.
  */
  private _setNextPrayerIndex = (): void => {
    this.Store.nextPrayerIndex = this.Store.prayers.findIndex((prayer) => !prayer.passed);
  };
}
