// R11 Part 5: sizing the high-latitude problem honestly, by latitude band.
//
// R7's number was "about 4 million above the Arctic Circle", sourced to secondary tourism and
// geography sites and flagged UNVERIFIED as a census aggregate. This script builds the bands
// bottom-up instead, from named administrative regions with their own statistical-office
// figures, so every row is auditable and every gap is visible.
//
// METHOD AND ITS LIMIT, stated up front. No statistical office publishes population by
// latitude. What they publish is population by administrative region. So each region is placed
// in the band containing the latitude of its POPULATION CENTRE, which is its largest city
// unless noted. That is an approximation and it is the honest one available: a region
// straddling a band boundary is assigned whole to one band and the row says so. Every figure is
// CITED to its source. Nothing here is measured by this report except the arithmetic.
//
// The bands are the ones the rule question actually turns on, taken from R7's and this report's
// own measurements rather than from geography convention:
//   48 to 55     the deep angles start failing; 18 deg first loses a day at 48.6 N (R7)
//   55 to 60     every angle from 12 deg up fails for part of the year
//   60 to 66.5   no day of the year on which the rules agree (R7, reproduced in R11 Part 2)
//   above 66.5   polar day and polar night, so every portion rule is undefined
const M = 1_000_000;

// Muslim population SHARES, national, all CITED. These are national shares applied to regional
// populations, which is the weakest step in the whole calculation and is flagged as such: the
// Muslim population of a country is concentrated in its large cities, and the far-northern
// regions are not representative of the national share in either direction.
const SHARE = {
  UK: 0.065, IE: 0.014, FR: 0.087, BE: 0.071, NL: 0.060, DE: 0.067, PL: 0.001, CZ: 0.002,
  AT: 0.080, CH: 0.062, DK: 0.055, SE: 0.081, NO: 0.057, FI: 0.029, IS: 0.005, EE: 0.002,
  LV: 0.002, LT: 0.001, RU: 0.100, BY: 0.001, UA: 0.010, CA: 0.049, US: 0.013, KZ: 0.700,
  MN: 0.050, CN: 0.020, JP: 0.001, RO: 0.003, HU: 0.004, SK: 0.001, SI: 0.037, HR: 0.015,
};

// [band, region or city, country, population, latitude of its population centre, source note]
const ROWS = [
  // --- band 48 to 55: the large European populations, which is where the users actually are
  ['48-55', 'England and Wales', 'UK', 60.9 * M, 52.5, 'ONS mid-2023, cited. Placed at 52.5 N, roughly the population-weighted centre'],
  ['48-55', 'Northern Ireland', 'UK', 1.9 * M, 54.6, 'NISRA 2021 census, cited'],
  ['48-55', 'Ireland', 'IE', 5.3 * M, 53.3, 'CSO 2023, cited'],
  ['48-55', 'Netherlands', 'NL', 17.9 * M, 52.1, 'CBS 2024, cited'],
  ['48-55', 'Belgium', 'BE', 11.8 * M, 50.8, 'Statbel 2024, cited'],
  ['48-55', 'Germany', 'DE', 83.4 * M, 51.0, 'Destatis 2024, cited. Germany spans 47.3 to 55.1 N, centre near 51'],
  ['48-55', 'northern France, Hauts-de-France and Normandy and Ile-de-France', 'FR', 26.0 * M, 49.3, 'INSEE 2023 regional, cited'],
  ['48-55', 'Poland', 'PL', 37.6 * M, 52.0, 'GUS 2024, cited'],
  ['48-55', 'Czechia', 'CZ', 10.9 * M, 50.0, 'CZSO 2024, cited'],
  ['48-55', 'Austria and Switzerland', 'AT', 18.1 * M, 47.6, 'Statistik Austria and BFS 2024, cited. BELOW 48; included as the boundary case and excluded from the band total'],
  ['48-55', 'Denmark', 'DK', 5.9 * M, 55.6, 'Danmarks Statistik 2024, cited. Copenhagen is at 55.68, so Denmark sits ON the 55 boundary'],
  ['48-55', 'southern Sweden, Skane and Vastra Gotaland and Halland', 'SE', 3.6 * M, 56.5, 'SCB 2025 county, cited'],
  ['48-55', 'Belarus', 'BY', 9.2 * M, 53.9, 'Belstat 2024, cited'],
  ['48-55', 'Baltic states', 'EE', 6.1 * M, 56.3, 'Statistics Estonia, Latvia and Lithuania 2024, cited'],
  ['48-55', 'Moscow and central Russia', 'RU', 25.0 * M, 55.8, 'Rosstat 2025, cited. Moscow is at 55.75 N'],
  ['48-55', 'Kazakhstan northern oblasts', 'KZ', 5.0 * M, 52.3, 'Bureau of National Statistics 2024, cited'],
  ['48-55', 'southern Canada, Vancouver to Montreal corridor', 'CA', 33.0 * M, 45.5, 'StatCan 2024, cited. BELOW 48; excluded from the band total'],
  ['48-55', 'Canadian prairies, Edmonton and Calgary and Saskatoon and Winnipeg metros', 'CA', 4.4 * M, 52.0, 'StatCan 2021 census metropolitan areas, cited. R7 named Edmonton and Calgary the worst-affected North American cities'],
  ['48-55', 'Mongolia and northern China, Heilongjiang and Inner Mongolia', 'CN', 60.0 * M, 47.0, 'NBS 2020 census, cited. BELOW 48 at its centre; excluded'],

  // --- band 55 to 60
  ['55-60', 'Scotland', 'UK', 5.4 * M, 55.9, 'NRS 2022 census, cited. Glasgow 55.86, Edinburgh 55.95, Aberdeen 57.15'],
  ['55-60', 'central Sweden including Stockholm and Uppsala', 'SE', 4.2 * M, 59.3, 'SCB 2025 county, cited'],
  ['55-60', 'southern Norway including Oslo and Bergen', 'NO', 4.3 * M, 59.9, 'SSB 2025 county, cited'],
  ['55-60', 'Saint Petersburg city and Leningrad Oblast', 'RU', 7.5 * M, 59.9, 'Rosstat 2025: city 5.6m, oblast 1.9m, cited. The largest single population in this band on earth'],
  ['55-60', 'Russian northwest and Urals, Perm and Yekaterinburg and Tyumen belt', 'RU', 8.0 * M, 57.0, 'Rosstat 2025 oblast, cited'],
  ['55-60', 'Denmark, if counted here rather than in 48-55', 'DK', 0, 55.6, 'assigned to 48-55 above; zero here to avoid double counting'],

  // --- band 60 to 66.5
  ['60-66.5', 'Finland', 'FI', 5.6 * M, 61.5, 'Tilastokeskus 2024, cited. Helsinki 60.17, Tampere 61.50, Oulu 65.01'],
  ['60-66.5', 'northern Sweden, Vasterbotten and Norrbotten below the Circle', 'SE', 0.4 * M, 64.0, 'SCB 2025: Vasterbotten 281,138 and the sub-Circle part of Norrbotten, cited'],
  ['60-66.5', 'central Norway, Trondelag and Nordland below the Circle', 'NO', 0.6 * M, 63.4, 'SSB 2025 county, cited'],
  ['60-66.5', 'Iceland', 'IS', 0.39 * M, 64.1, 'Statistics Iceland 2024, cited'],
  ['60-66.5', 'Russian north below the Circle, Arkhangelsk and Komi and Karelia and Khanty-Mansi', 'RU', 4.5 * M, 62.5, 'Rosstat 2025 oblast and okrug, cited'],
  ['60-66.5', 'Alaska, Anchorage and Fairbanks and the interior', 'US', 0.6 * M, 61.5, 'US Census Bureau 2023 estimate, cited. Anchorage 61.22, Fairbanks 64.84'],
  ['60-66.5', 'Canadian territories below the Circle, Whitehorse and Yellowknife', 'CA', 0.07 * M, 62.5, 'StatCan 2021, cited'],
  ['60-66.5', 'Russian Siberia at this latitude, Yakutsk and Surgut and Nizhnevartovsk', 'RU', 1.3 * M, 62.0, 'Rosstat 2025, cited'],

  // --- band above 66.5, the Arctic Circle
  ['66.5+', 'Murmansk Oblast', 'RU', 0.651 * M, 68.0, 'Rosstat 2025-01-01 estimate 651,363, cited via citypopulation.de'],
  ['66.5+', 'Norilsk and Taymyr, Krasnoyarsk Krai', 'RU', 0.19 * M, 69.3, 'Rosstat 2021 census: Norilsk 178,018, cited'],
  ['66.5+', 'Vorkuta and Komi above the Circle', 'RU', 0.06 * M, 67.5, 'Rosstat: Vorkuta 58,133, cited'],
  ['66.5+', 'Yamalo-Nenets and Nenets autonomous okrugs', 'RU', 0.6 * M, 66.9, 'Rosstat 2025: YaNAO about 511,000 and NAO about 41,000, cited. Salekhard is at 66.53 N'],
  ['66.5+', 'Sakha Republic above the Circle', 'RU', 0.1 * M, 68.0, 'Rosstat 2021, cited, approximate share of the republic'],
  ['66.5+', 'Chukotka and Magadan above the Circle', 'RU', 0.03 * M, 67.5, 'Rosstat 2025, cited'],
  ['66.5+', 'Troms and Finnmark, Norway', 'NO', 0.31 * M, 69.6, 'SSB 2025 county, cited. Tromso 75,638, Alta, Hammerfest'],
  ['66.5+', 'Nordland above the Circle, Bodo and Narvik', 'NO', 0.13 * M, 67.3, 'SSB 2025 municipality, cited. Bodo 52,357'],
  ['66.5+', 'Norrbotten above the Circle, Kiruna and Gallivare and Jokkmokk and Pajala', 'SE', 0.05 * M, 67.5, 'SCB 2025-12-31: Kiruna 22,402, Gallivare 17,135, Jokkmokk 4,695, Pajala 5,706, cited'],
  ['66.5+', 'Lapland, Finland, above the Circle', 'FI', 0.06 * M, 67.0, 'Tilastokeskus 2024: Rovaniemi is at 66.50, so only its northern municipalities count, cited'],
  ['66.5+', 'Iceland above the Circle', 'IS', 0.0, 67.0, 'Grimsey only, about 60 people. Iceland mainland is entirely below 66.5'],
  ['66.5+', 'Alaska North Slope and Northwest Arctic boroughs', 'US', 0.02 * M, 70.0, 'US Census 2023: Utqiagvik about 4,900, Kotzebue about 3,100, cited'],
  ['66.5+', 'Canadian Arctic, Nunavut and Inuvik region', 'CA', 0.04 * M, 68.0, 'StatCan 2021: Iqaluit is at 63.75 and BELOW the Circle; this row is Nunavut above the Circle plus Inuvik, cited'],
  ['66.5+', 'Greenland', 'DK', 0.02 * M, 69.0, 'Statistics Greenland 2024: Nuuk is at 64.18 and below the Circle; Ilulissat and north, cited'],
  ['66.5+', 'Svalbard, Longyearbyen', 'NO', 0.0026 * M, 78.2, 'SSB 2024: about 2,600, cited'],
];

const BANDS = ['48-55', '55-60', '60-66.5', '66.5+'];
const inBand = (b, lat) => {
  if (b === '48-55') return lat >= 48 && lat < 55;
  if (b === '55-60') return lat >= 55 && lat < 60;
  if (b === '60-66.5') return lat >= 60 && lat < 66.5;
  return lat >= 66.5;
};

console.log('=== R11 Part 5: population by latitude band, built from named administrative regions ===');
console.log('Every population figure is CITED to a statistical office. Every band total is arithmetic');
console.log('on those citations. The Muslim column applies a NATIONAL share to a REGIONAL population,');
console.log('which is the weakest step and is flagged on every row.\n');

const totals = {};
for (const b of BANDS) {
  const rows = ROWS.filter(r => r[0] === b && inBand(b, r[4]) && r[3] > 0);
  const excluded = ROWS.filter(r => r[0] === b && !inBand(b, r[4]));
  const pop = rows.reduce((a, r) => a + r[3], 0);
  const mus = rows.reduce((a, r) => a + r[3] * (SHARE[r[2]] ?? 0), 0);
  totals[b] = { pop, mus, rows: rows.length };
  console.log(`--- band ${b} N: ${rows.length} regions, total ${(pop / M).toFixed(2)} million people ---`);
  for (const r of rows) console.log(`  ${(r[3] / M).toFixed(3).padStart(8)} m  ${r[4].toFixed(1).padStart(5)}N  share ${((SHARE[r[2]] ?? 0) * 100).toFixed(1).padStart(4)}%  ${r[1]}`);
  if (excluded.length) for (const r of excluded) console.log(`  EXCLUDED, centre at ${r[4].toFixed(1)}N is outside the band: ${r[1]}`);
  console.log(`  band population  ${(pop / M).toFixed(2)} million`);
  console.log(`  band Muslims, national shares applied  ${(mus / M).toFixed(2)} million\n`);
}

console.log('=== the four bands side by side ===');
console.log('band        regions   population(m)   Muslims(m), national shares   share of the four-band total');
const grandPop = Object.values(totals).reduce((a, t) => a + t.pop, 0);
const grandMus = Object.values(totals).reduce((a, t) => a + t.mus, 0);
for (const b of BANDS) {
  const t = totals[b];
  console.log(`${b.padEnd(11)} ${String(t.rows).padStart(6)}   ${(t.pop / M).toFixed(2).padStart(12)}   ${(t.mus / M).toFixed(2).padStart(27)}   ${(100 * t.mus / grandMus).toFixed(1).padStart(24)}%`);
}
console.log(`${'total'.padEnd(11)} ${String(Object.values(totals).reduce((a, t) => a + t.rows, 0)).padStart(6)}   ${(grandPop / M).toFixed(2).padStart(12)}   ${(grandMus / M).toFixed(2).padStart(27)}`);

console.log('\n=== the ratio that decides the engineering priority ===');
console.log(`Muslims in 48 to 60 N, where a rule binds but no polar day ever occurs: ${((totals['48-55'].mus + totals['55-60'].mus) / M).toFixed(2)} million`);
console.log(`Muslims in 60 to 66.5 N, where no day of the year has all rules agreeing: ${(totals['60-66.5'].mus / M).toFixed(2)} million`);
console.log(`Muslims above 66.5 N, where every portion rule is undefined for part of the year: ${(totals['66.5+'].mus / M).toFixed(2)} million`);
const r1 = (totals['48-55'].mus + totals['55-60'].mus) / totals['66.5+'].mus;
console.log(`ratio, 48-to-60 against above-66.5: ${r1.toFixed(0)} to 1`);
console.log(`ratio, 60-to-66.5 against above-66.5: ${(totals['60-66.5'].mus / totals['66.5+'].mus).toFixed(1)} to 1`);

console.log('\n=== against R7 number, which this replaces ===');
console.log(`R7: "about 4 million people live above the Arctic Circle", secondary sources, flagged UNVERIFIED as a census aggregate.`);
console.log(`R11, built from named statistical-office regions: ${(totals['66.5+'].pop / M).toFixed(2)} million total population above 66.5 N.`);
console.log(`Russia alone supplies ${(ROWS.filter(r => r[0] === '66.5+' && r[2] === 'RU').reduce((a, r) => a + r[3], 0) / M).toFixed(2)} million of it, which is ${(100 * ROWS.filter(r => r[0] === '66.5+' && r[2] === 'RU').reduce((a, r) => a + r[3], 0) / totals['66.5+'].pop).toFixed(0)}% of the band.`);
console.log(`The Nordic countries together supply only ${(ROWS.filter(r => r[0] === '66.5+' && ['NO', 'SE', 'FI', 'IS', 'DK'].includes(r[2])).reduce((a, r) => a + r[3], 0) / M).toFixed(2)} million.`);
