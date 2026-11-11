import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

export const TZ = 'Asia/Jakarta';

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

export function times(dateISO, lat, lon, opts = {}) {
  const p = new adhan.CalculationParameters();
  p.fajrAngle = opts.fajr ?? 20;
  p.ishaAngle = opts.isha ?? 18;
  p.madhab = opts.hanafi ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  p.rounding = adhan.Rounding.None;
  const [y, m, d] = dateISO.split('-').map(Number);
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, d, 12)), p);
  const out = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    out[k] = fmt.format(pt[k]);
  }
  return out;
}

export function mins(hms) {
  const [h, m, s] = hms.split(':').map(Number);
  return h * 60 + m + (s || 0) / 60;
}

export function diff(a, b) {
  let d = mins(a) - mins(b);
  while (d > 720) d -= 1440;
  while (d < -720) d += 1440;
  return d;
}

export const CITIES = {
  banda_aceh: [5.5483, 95.3238, 12],
  bandung: [-6.9175, 107.6191, 768],
  surabaya: [-7.2575, 112.7521, 5],
  medan: [3.5952, 98.6722, 25],
  makassar: [-5.1477, 119.4327, 8],
  jayapura: [-2.5337, 140.7181, 19],
  yogyakarta: [-7.7956, 110.3695, 113],
  semarang: [-6.9932, 110.4203, 5],
  denpasar: [-8.6705, 115.2126, 4],
  pontianak: [-0.0263, 109.3425, 3],
  padang: [-0.9471, 100.4172, 8],
  palembang: [-2.9761, 104.7754, 8],
  banjarmasin: [-3.3186, 114.5944, 5],
  manado: [1.4748, 124.8421, 5],
  mataram: [-8.5833, 116.1167, 15],
  kupang: [-10.1772, 123.6070, 20],
  ambon: [-3.6954, 128.1814, 5],
  ternate: [0.7900, 127.3800, 15],
  pekanbaru: [0.5071, 101.4478, 12],
  samarinda: [-0.5022, 117.1536, 8],
  tanjung_pinang: [0.9186, 104.4467, 5],
  serang: [-6.1100, 106.1503, 10],
  bengkulu: [-3.8004, 102.2655, 8],
  bandar_lampung: [-5.4292, 105.2610, 15],
  pangkal_pinang: [-2.1316, 106.1169, 20],
  gorontalo: [0.5435, 123.0568, 10],
  jambi: [-1.6101, 103.6131, 8],
  kendari: [-3.9722, 122.5947, 10],
  palu: [-0.8917, 119.8707, 10],
  mamuju: [-2.6748, 118.8885, 10],
  tanjung_selor: [2.8375, 117.3661, 10],
  sorong: [-0.8762, 131.2558, 10],
  manokwari: [-0.8615, 134.0620, 10],
  nabire: [-3.3500, 135.4833, 10],
  wamena: [-4.1000, 138.9500, 1668],
  merauke: [-8.4932, 140.4018, 5],
  jakarta_pusat: [-6.1800, 106.8300, 8],
  sleman: [-7.7167, 110.3500, 150],
};
