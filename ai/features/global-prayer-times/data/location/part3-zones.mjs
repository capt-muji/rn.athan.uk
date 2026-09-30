// R14 part 3: can a coordinate be resolved to a JAKIM zone through a district polygon set?
//
// JAKIM's 60 zones are lists of named districts (`daerah`) read from e-solat.gov.my's own
// zone selector on 2026-09-30. geoBoundaries gbOpen MYS ADM2 carries 159 district polygons.
// The test: does every district name JAKIM names appear in the ADM2 name set?
import fs from 'node:fs';
import { table } from './lib.mjs';

// Read verbatim from the `Tukar Zon` selector of https://www.e-solat.gov.my/index.php?siteId=24&pageId=24
// fetched 2026-09-30.
const JAKIM = [
  ['JHR01', 'Pulau Aur dan Pulau Pemanggil'],
  ['JHR02', 'Johor Bahru, Kota Tinggi, Mersing, Kulai'],
  ['JHR03', 'Kluang, Pontian'],
  ['JHR04', 'Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak'],
  ['KDH01', 'Kota Setar, Kubang Pasu, Pokok Sena (Daerah Kecil)'],
  ['KDH02', 'Kuala Muda, Yan, Pendang'],
  ['KDH03', 'Padang Terap, Sik'],
  ['KDH04', 'Baling'],
  ['KDH05', 'Bandar Baharu, Kulim'],
  ['KDH06', 'Langkawi'],
  ['KDH07', 'Puncak Gunung Jerai'],
  ['KTN01', 'Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku'],
  ['KTN02', 'Gua Musang (Daerah Galas Dan Bertam), Jeli, Jajahan Kecil Lojing'],
  ['MLK01', 'SELURUH NEGERI MELAKA'],
  ['NGS01', 'Tampin, Jempol'],
  ['NGS02', 'Jelebu, Kuala Pilah, Rembau'],
  ['NGS03', 'Port Dickson, Seremban'],
  ['PHG01', 'Pulau Tioman'],
  ['PHG02', 'Kuantan, Pekan, Muadzam Shah'],
  ['PHG03', 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka'],
  ['PHG04', 'Bentong, Lipis, Raub'],
  ['PHG05', 'Genting Sempah, Janda Baik, Bukit Tinggi'],
  ['PHG06', 'Cameron Highlands, Genting Higlands, Bukit Fraser'],
  ['PHG07', 'Zon Khas Daerah Rompin, (Mukim Rompin, Mukim Endau, Mukim Pontian)'],
  ['PLS01', 'Kangar, Padang Besar, Arau'],
  ['PNG01', 'Seluruh Negeri Pulau Pinang'],
  ['PRK01', 'Tapah, Slim River, Tanjung Malim'],
  ['PRK02', 'Kuala Kangsar, Sg. Siput , Ipoh, Batu Gajah, Kampar'],
  ['PRK03', 'Lenggong, Pengkalan Hulu, Grik'],
  ['PRK04', 'Temengor, Belum'],
  ['PRK05', 'Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor'],
  ['PRK06', 'Selama, Taiping, Bagan Serai, Parit Buntar'],
  ['PRK07', 'Bukit Larut'],
  ['SBH01', 'Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Sukau'],
  ['SBH02', 'Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)'],
  ['SBH03', 'Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)'],
  ['SBH04', 'Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Barat)'],
  ['SBH05', 'Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat'],
  ['SBH06', 'Gunung Kinabalu'],
  ['SBH07', 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat'],
  ['SBH08', 'Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pendalaman (Atas)'],
  ['SBH09', 'Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston, Bahagian Pendalaman (Bawah)'],
  ['SGR01', 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, S.Alam'],
  ['SGR02', 'Kuala Selangor, Sabak Bernam'],
  ['SGR03', 'Klang, Kuala Langat'],
  ['SWK01', 'Limbang, Lawas, Sundar, Trusan'],
  ['SWK02', 'Miri, Niah, Bekenu, Sibuti, Marudi'],
  ['SWK03', 'Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu'],
  ['SWK04', 'Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit'],
  ['SWK05', 'Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai'],
  ['SWK06', 'Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok'],
  ['SWK07', 'Serian, Simunjan, Samarahan, Sebuyau, Meludam'],
  ['SWK08', 'Kuching, Bau, Lundu, Sematan'],
  ['SWK09', 'Zon Khas (Kampung Patarikan)'],
  ['TRG01', 'Kuala Terengganu, Marang, Kuala Nerus'],
  ['TRG02', 'Besut, Setiu'],
  ['TRG03', 'Hulu Terengganu'],
  ['TRG04', 'Dungun, Kemaman'],
  ['WLY01', 'Kuala Lumpur, Putrajaya'],
  ['WLY02', 'Labuan'],
];

const gj = JSON.parse(fs.readFileSync('bounds/MYS-adm2.geojson', 'utf8'));
const adm2 = gj.features.map((f) => f.properties.shapeName);
const adm2Norm = new Set(adm2.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')));

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 3: resolving a coordinate to a JAKIM zone');
say('');
say(`JAKIM zones read from e-solat.gov.my: ${JAKIM.length}.`);
say(`geoBoundaries gbOpen MYS ADM2 polygons: ${adm2.length}.`);
say('');

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const rows = [];
let totalNames = 0;
let matched = 0;
const unmatchedAll = [];
for (const [code, desc] of JAKIM) {
  const names = desc
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const miss = [];
  for (const n of names) {
    totalNames++;
    const cleaned = n
      .replace(/\(.*?\)/g, '')
      .replace(/^(Bahagian|Mukim|Jajahan Kecil|Daerah Kecil|Zon Khas|Zon Khas Daerah|Pulau|Bandar|Puncak|Gunung|Kg|Sg\.?)\s+/i, '')
      .trim();
    if (adm2Norm.has(norm(n)) || adm2Norm.has(norm(cleaned))) matched++;
    else miss.push(n);
  }
  if (miss.length) {
    unmatchedAll.push(...miss);
    rows.push([code, String(names.length), String(names.length - miss.length), miss.join('; ')]);
  }
}
say('## 3A. Do JAKIM zone district names match the ADM2 polygon names?');
say('');
say(`Named places across all 60 zones: ${totalNames}. Matched to an ADM2 \`shapeName\`: ${matched} (${((100 * matched) / totalNames).toFixed(1)}%).`);
say(`Zones with at least one unmatched name: ${rows.length} of ${JAKIM.length}.`);
say('');
say(table(['zone', 'names', 'matched', 'unmatched names'], rows));
say('');
say('## 3B. The ADM2 polygons JAKIM never names');
say('');
{
  const namedNorm = new Set();
  for (const [, desc] of JAKIM) {
    for (const n of desc.split(',')) {
      namedNorm.add(norm(n.trim()));
      namedNorm.add(norm(n.replace(/\(.*?\)/g, '').trim()));
    }
  }
  const orphan = adm2.filter((a) => !namedNorm.has(norm(a)));
  say(`ADM2 districts not named by any JAKIM zone: ${orphan.length} of ${adm2.length}.`);
  say('');
  say('```');
  say(orphan.sort().join(', '));
  say('```');
  say('');
}
fs.writeFileSync('part3-unmatched.txt', unmatchedAll.join('\n'));
console.log(out.join('\n'));
