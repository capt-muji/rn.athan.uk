// Era scan: per captured Hijri year, interval histograms + raw residuals vs adhan.
const fs = require('fs');
const path = require('path');
const CAP = path.join(__dirname, '..', 'captures');
const ADHAN = process.env.ADHAN_PATH || path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const { Coordinates, CalculationMethod, CalculationParameters, PrayerTimes, Madhab, Rounding } = require(ADHAN);

const files = fs.readdirSync(CAP).filter(f => f.startsWith('sa-') && f.endsWith('.json') && /hijri-(\d+)\.json/.test(f));
const cities = {
  makkah: { lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh' },
  medina: { lat: 24.4672, lon: 39.6111, tz: 'Asia/Riyadh' },
};

function hhmmToMin(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

for (const f of files.sort()) {
  const m = f.match(/sa-(\w+)-hijri-(\d+)\.json/);
  const tag = m[1], yh = m[2];
  const rows = JSON.parse(fs.readFileSync(path.join(CAP, f), 'utf8'));
  const city = cities[tag];
  const coords = new Coordinates(city.lat, city.lon);
  // interval histogram
  const iv = {};
  for (const r of rows) {
    const d = hhmmToMin(r.prayerTimes.isha) - hhmmToMin(r.prayerTimes.maghrib);
    iv[d] = (iv[d] || 0) + 1;
  }
  // Ramadan identification from the API's own hijri month 9
  let ramadanDays = rows.filter(r => r.hijriDate.month === 9).length;
  let ramadanIv = new Set(rows.filter(r => r.hijriDate.month === 9).map(r => hhmmToMin(r.prayerTimes.isha) - hhmmToMin(r.prayerTimes.maghrib)));
  let otherIv = new Set(rows.filter(r => r.hijriDate.month !== 9).map(r => hhmmToMin(r.prayerTimes.isha) - hhmmToMin(r.prayerTimes.maghrib)));
  // residual scan vs modern recipe (fajr 18.5, Shafi, +1 margins floor)
  let res = { fajr: [], sunrise: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
  for (const r of rows) {
    const [Y, Mo, D] = r.date.split('T')[0].split('-').map(Number);
    const date = new Date(Date.UTC(Y, Mo - 1, D, 12, 0, 0));
    const params = new CalculationMethod.MuslimWorldLeague();
    // build custom: fajr 18.5, isha angle irrelevant (interval rule), Shafi asr
    params.fajrAngle = 18.5;
    params.ishaAngle = 18.0;
    params.madhab = Madhab.Shafi;
    params.rounding = Rounding.None;
    const pt = new PrayerTimes(coords, date, params);
    // adhan returns Date objects in UTC anchored to the date; minutes-of-day in +3
    const toMin = (dt) => {
      const utcMin = dt.getUTCHours() * 60 + dt.getUTCMinutes() + dt.getUTCSeconds() / 60;
      let m = utcMin + 180; // zone 3
      return m;
    };
    res.fajr.push(hhmmToMin(r.prayerTimes.fajr) - toMin(pt.fajr));
    res.sunrise.push(hhmmToMin(r.prayerTimes.sunrise) - toMin(pt.sunrise));
    res.dhuhr.push(hhmmToMin(r.prayerTimes.dhuhr) - toMin(pt.dhuhr));
    res.asr.push(hhmmToMin(r.prayerTimes.asr) - toMin(pt.asr));
    res.maghrib.push(hhmmToMin(r.prayerTimes.maghrib) - toMin(pt.maghrib));
  }
  const stats = {};
  for (const k of Object.keys(res)) {
    const a = res[k];
    const mean = a.reduce((x, y) => x + y, 0) / a.length;
    const sd = Math.sqrt(a.reduce((x, y) => x + (y - mean) ** 2, 0) / a.length);
    stats[k] = `${mean.toFixed(2)}±${sd.toFixed(2)} [${Math.min(...a).toFixed(1)}..${Math.max(...a).toFixed(1)}]`;
  }
  console.log(`${tag} ${yh}H rows=${rows.length} ram=${ramadanDays} ramIv=[${[...ramadanIv]}] otherIv=${JSON.stringify(iv)} `);
  console.log(`   resid vs MWL18.5(+3): fajr ${stats.fajr} | sunrise ${stats.sunrise} | dhuhr ${stats.dhuhr} | asr ${stats.asr} | maghrib ${stats.maghrib}`);
}
