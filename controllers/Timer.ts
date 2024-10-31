import dayjs from "dayjs";
import TinyTimer from "tiny-timer";
import { IUseStoreState } from "!stores";
import { convert24hrToMillisecond, loopUntilMidnight } from '!utils/time';

export class TimerController {
  private _timer = new TinyTimer();
  private Store: IUseStoreState;
  private prayerIndex: number;

  constructor(Store: IUseStoreState, prayerIndex) {
    this.Store = Store;
    this.prayerIndex = prayerIndex;
  }

  public start = (): void => {
    const prayer = this.Store.prayers[this.prayerIndex];
    const nextPrayerTime = convert24hrToMillisecond(prayer.time);
    const remainder = nextPrayerTime - new Date().getTime();

    this._timer.start(remainder);
    this._timer.on("tick", this._onTick);
    this._timer.on("done", this._onDone);
  };

  private _onTick = (tick: number): void => {
    const timeLeft = dayjs("2000-01-01 00:00:00").add(tick, "ms");

    let format = [""];
    timeLeft.hour() && format.push("H[h]");
    timeLeft.minute() && format.push("m[m]");
    format.push("s[s]");

    this.Store.prayers[this.prayerIndex].timeLeft = timeLeft.format(format.join(" "));
  };

  private _onDone = (): void => {
    this.Store.prayers[this.prayerIndex].passed = true;

    const isLastPrayer = this.prayerIndex === this.Store.prayers.length - 1;

    if (!isLastPrayer) {
      this.Store.nextPrayerIndex++;
      return;
    }

    this.Store.nextPrayerIndex = -1
    loopUntilMidnight();
  };
}
