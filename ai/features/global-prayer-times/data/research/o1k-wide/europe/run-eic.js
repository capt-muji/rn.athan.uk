// Runs the captured eestiislamikeskus.org app.js engine headlessly (DOM stubs).
const stub = { appendChild(){}, addEventListener(){}, querySelector(){return {innerHTML:''};}, getElementById(){return {textContent:'',value:'',appendChild(){},addEventListener(){}};}, createElement(){return {value:'',textContent:'',className:'',appendChild(){}};} };
global.document = { ...stub, querySelector: () => ({ innerHTML: '', appendChild(){} }) };
global.window = { print(){} };
global.URL = { createObjectURL(){return '';}, revokeObjectURL(){} };
global.Blob = function(){};
const fs = require('fs');
let api = {};
{
  const src = fs.readFileSync('captures/ee-eic-app.js','utf8').replace('"use strict";','')
    .replace(/init\(\);\s*$/, '');
  const wrapped = src + `
;module.exports = { CITIES, METHOD, calculatePrayerTimes, formatPrayerTime };`;
  fs.writeFileSync('eic-engine.tmp.js', wrapped);
  api = require('./eic-engine.tmp.js');
}
const out = {};
for (const [key, city] of Object.entries(api.CITIES)) {
  for (const year of [2026, 2027]) {
    for (let month = 1; month <= 12; month++) {
      const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      for (let day = 1; day <= days; day++) {
        const p = api.calculatePrayerTimes({ year, month, day, city });
        const iso = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        (out[key] ||= {})[iso] = {
          fajr: api.formatPrayerTime(p.fajr.time, 'round'),
          sunrise: api.formatPrayerTime(p.sunrise, 'round'),
          dhuhr: api.formatPrayerTime(p.dhuhr, 'ceil'),
          asr: api.formatPrayerTime(p.asr, 'ceil'),
          magrib: api.formatPrayerTime(p.maghrib, 'ceil'),
          isha: api.formatPrayerTime(p.isha.time, 'ceil'),
          fajrRule: p.fajr.ruleType, ishaRule: p.isha.ruleType
        };
      }
    }
  }
}
fs.unlinkSync('eic-engine.tmp.js');
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/ee-eic-both-cities-2026-2027.json', JSON.stringify(out, null, 1));
for (const c of Object.keys(out)) console.log(c, Object.keys(out[c]).length, 'rows');
console.log('sample tallinn 2026-06-21:', JSON.stringify(out.tallinn['2026-06-21']));
console.log('sample tallinn 2026-11-10:', JSON.stringify(out.tallinn['2026-11-10']));
