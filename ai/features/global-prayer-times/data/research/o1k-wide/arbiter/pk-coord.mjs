// Coordinate identifiability: how far the dawn minute moves across the district.
import { pathToFileURL } from 'node:url';
const A = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(A + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(A + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(A + 'TimeComponents.js'));
const secOf = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
const at = (lat, lng, m, d, angle = 18) => {
  const date = new Date(2028, m - 1, d);
  const st = new SolarTime(date, new mod.Coordinates(lat, lng));
  return secOf(new TimeComponents(st.hourAngle(-angle, false)).utcDate(2028, m - 1, d)) / 60;
};
const base = [33.6844, 73.0479];
console.log('fajr shift (minutes) vs the published point, across plausible district points');
for (const [lat, lng, label] of [[33.55, 73.10, 'district centroid S'], [33.75, 73.15, 'NE district'], [33.60, 72.95, 'SW district'], [33.60, 73.06, 'Rawalpindi']]) {
  const diffs = [3, 6, 9, 12].map((m) => at(lat, lng, m, 15) - at(base[0], base[1], m, 15));
  console.log(` ${label.padEnd(20)}`, diffs.map((x) => x.toFixed(2)).join(' '), '(Mar Jun Sep Dec)');
}
console.log('0.10 deg latitude  :', (at(33.7844, 73.0479, 3, 15) - at(33.6844, 73.0479, 3, 15)).toFixed(2), 'min in March');
console.log('0.10 deg longitude :', (at(33.6844, 73.1479, 3, 15) - at(33.6844, 73.0479, 3, 15)).toFixed(2), 'min in March');
