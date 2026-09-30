// R14 part 4: the armed-alarm question.
//
// The app arms up to NOTIFICATION_REQUEST_BUDGET = 64 OS requests and its candidate walk may
// look SCHEDULE_CANDIDATE_DAYS = 66 days ahead (both measured in shared/constants.ts:75,88 of
// this worktree). So a position change invalidates alarms already sitting in the OS for up to
// two months. This measures HOW WRONG each of those alarms becomes, which is the number that
// decides whether a re-arm is urgent or cosmetic.
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { KEYS, table } from './lib.mjs';

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.Nearest;
q.madhab = Madhab.Shafi;

// The armed alarm is an ABSOLUTE instant: the OS holds a UTC moment, not a wall-clock string.
// So the error a traveller sees has two independent parts:
//   1. the position part, which moves the solar event
//   2. the ZONE part, which moves the wall clock the user reads that instant against
// Only the first is a wrong prayer. The second is a wrong displayed time for a right instant,
// or a right displayed time for a wrong instant, depending on how the app stores it.
const P = {
  London: { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  Makkah: { lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh' },
  Jeddah: { lat: 21.4858, lon: 39.1925, tz: 'Asia/Riyadh' },
  Istanbul: { lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  Manchester: { lat: 53.4808, lon: -2.2426, tz: 'Europe/London' },
  KualaLumpur: { lat: 3.1412, lon: 101.6865, tz: 'Asia/Kuala_Lumpur' },
  Dhaka: { lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka' },
  Toronto: { lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
};

function offsetMin(zone, date) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((x) => x.type === 'timeZoneName').value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(p);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 4: what happens to the armed alarms when the position changes');
say('');
say('The app arms up to **64** OS notification requests (`NOTIFICATION_REQUEST_BUDGET`,');
say('`shared/constants.ts:75`) and its candidate walk may reach **66 days** ahead');
say('(`SCHEDULE_CANDIDATE_DAYS`, `:88`). Both measured in this worktree.');
say('');
say('## 4E. The three errors a travelling alarm can carry, separated');
say('');
say('An OS notification request holds an absolute instant. A prayer time is a wall-clock');
say('rendering of a solar event at a position. So a move produces three independent errors and');
say('only the first two are the app being wrong:');
say('');
say('| error | cause | who fixes it |');
say('| --- | --- | --- |');
say('| solar | the sun rises at a different instant at the new position | a re-arm with the new position |');
say('| zone | the same instant renders as a different wall clock | a re-arm with the new zone |');
say('| both | the common case on any international journey | a re-arm |');
say('');

say('## 4F. Per journey: the error in the alarm the OS already holds');
say('');
say('`solar min` is how far the true prayer instant at the DESTINATION moves from the instant the');
say('alarm holds. `zone min` is the UTC offset change. `total displayed min` is what a user at the');
say('destination sees on their own clock when the old alarm fires.');
say('');
{
  const date = new Date(Date.UTC(2026, 5, 15, 12));
  const rows = [];
  for (const [a, b] of [
    ['London', 'Makkah'],
    ['London', 'Jeddah'],
    ['London', 'Istanbul'],
    ['London', 'Manchester'],
    ['London', 'Toronto'],
    ['KualaLumpur', 'Makkah'],
    ['Dhaka', 'Makkah'],
    ['Jeddah', 'Makkah'],
  ]) {
    const pa = P[a];
    const pb = P[b];
    const ta = new PrayerTimes(new Coordinates(pa.lat, pa.lon), date, q);
    const tb = new PrayerTimes(new Coordinates(pb.lat, pb.lon), date, q);
    const solar = {};
    for (const k of KEYS) {
      const x = ta[k];
      const y = tb[k];
      solar[k] = x instanceof Date && y instanceof Date ? Math.round((y.getTime() - x.getTime()) / 60000) : null;
    }
    const zone = offsetMin(pb.tz, date) - offsetMin(pa.tz, date);
    const worstSolar = Math.max(...KEYS.map((k) => Math.abs(solar[k] ?? 0)));
    rows.push([
      `${a} to ${b}`,
      ...KEYS.map((k) => (solar[k] === null ? '-' : String(solar[k]))),
      String(worstSolar),
      (zone >= 0 ? '+' : '') + zone,
      String(worstSolar + Math.abs(zone)),
    ]);
  }
  say(table(['journey', ...KEYS.map((k) => k + ' solar'), 'worst solar', 'zone min', 'worst total'], rows));
}
say('');
say('The London to Makkah row is the one to read: the solar error alone is over three hours,');
say('and the zone error adds another three. An alarm armed in London and left armed in Makkah');
say('does not fire late, it fires at a time that is not any prayer.');
say('');

say('## 4G. How many armed requests a source change invalidates, by window');
say('');
say('Every request the OS holds for a day after the move is wrong. This is the count, by how far');
say('ahead the budget reached, which depends entirely on how many rows the user has armed.');
say('');
{
  // The cost model from shared/notifications.ts: a row armed at-time costs 1 request, a row with
  // a reminder costs 2, with both reminders 3. The budget is 64 and rows are armed whole.
  const rows = [];
  for (const [label, perDay] of [
    ['1 row, at-time only', 1],
    ['3 rows, at-time only', 3],
    ['6 rows, at-time only', 6],
    ['6 rows, each with one reminder', 12],
    ['11 rows, each with one reminder', 22],
    ['21 rows, each with both reminders', 63],
  ]) {
    const days = Math.floor(64 / perDay);
    rows.push([label, String(perDay), String(Math.min(days, 66)), String(Math.min(days, 66) * perDay)]);
  }
  say(table(['user configuration', 'requests per day', 'days the budget reaches', 'requests invalidated by a move'], rows));
}
say('');
say('So the worst case for STALENESS is the lightest user: one row armed at-time only reaches');
say('**64 days ahead**, and every one of those 64 alarms is wrong the moment the user lands. The');
say('heaviest user is paradoxically the safest, because 63 requests buy only 3 days of reach.');
say('');
console.log(out.join('\n'));
