// The per-wilaya minute-offset table printed on every month page of the 1448
// Alger calendar (page 7, Jumada al-Thaniya): minutes to ADD to Algiers' printed
// times. Algiers is the base and carries no column.
import { writeFileSync } from 'node:fs';

const wilayas = [
  // [name, fajr, sunrise, dhuhr, asr, maghrib, isha]
  ['الطارف', -21, -21, -21, -21, -21, -21],
  ['سوق أهراس', -20, -20, -19, -18, -18, -18],
  ['عنابة', -18, -18, -18, -19, -19, -18],
  ['قالمة', -17, -18, -17, -16, -16, -17],
  ['أم البواقي', -16, -17, -16, -13, -13, -14],
  ['سكيكدة', -15, -15, -15, -15, -15, -15],
  ['قسنطينة', -14, -15, -14, -13, -13, -13],
  ['ميلة', -13, -13, -12, -12, -12, -12],
  ['جيجل', -10, -10, -10, -10, -10, -10],
  ['سطيف', -9, -10, -9, -7, -7, -8],
  ['بجاية', -8, -8, -8, -8, -8, -8],
  ['برج بوعريريج', -7, -8, -6, -5, -4, -5],
  ['المسيلة', -6, -8, -5, -3, -3, -4],
  ['تيزي وزو', -4, -4, -4, -3, -3, -3],
  ['دلس', -3, -3, -3, -3, -3, -3],
  ['البويرة', -3, -4, -3, -2, -2, -2],
  ['بومرداس', -1, -1, -1, -1, -1, -1],
  ['البليدة', 1, 1, 1, 2, 2, 2],
  ['المدية', 1, 1, 2, 3, 3, 2],
  ['تيارت', 3, 3, 3, 3, 3, 3],
  ['عين الدفلى', 4, 4, 5, 6, 6, 6],
  ['الشلف', 7, 6, 7, 9, 9, 8],
  ['غليزان', 10, 9, 11, 13, 13, 12],
  ['مستغانم', 12, 11, 12, 15, 15, 14],
  ['وهران', 14, 13, 15, 18, 18, 17],
];

const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const table = wilayas.map(([name, ...v]) => ({ wilaya: name, minutes: Object.fromEntries(KEYS.map((k, i) => [k, v[i]])) }));

writeFileSync(
  './dz-wilaya-offsets-1448.json',
  JSON.stringify(
    {
      _meta: {
        source: 'dz-marw-calendrier-1448-alger.pdf, page 7 (Jumada al-Thaniya 1448 / 2026)',
        caption: 'الفروق الزمنية لمدينة الجزائر والولايات المرتبطة بها زيادة ونقصانا لشهر جمادى الثانية 1448هـ / 2026م',
        reading: 'printed minutes to add to the ALGIERS column for each wilaya; Algiers is the base (0) and has no column',
        scope: 'northern wilayas only, 25 columns; southern wilayas are not in this table',
        structure: '6 prayer rows x N wilaya columns, repeated on every month page',
        precision: '1 minute as printed; offsets are month-specific by caption, and the printed values track longitude at 4 min/degree',
      },
      wilayas: table,
    },
    null,
    1,
  ) + '\n',
);
console.log('wrote offsets for', table.length, 'wilayas');
