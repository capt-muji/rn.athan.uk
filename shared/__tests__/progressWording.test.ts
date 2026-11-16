/**
 * The T-557 progress wording and T-561's shortening: the countdown bar reads as
 * progress in every catalog, and the settings row drops its bar word. The card title
 * row, the show row and the color row - the three strings the owner's orders named
 * (2026-11-01) - are pinned literal-for-literal per locale, the loan and translation
 * chains carrying the same frame they carried for the countdown wording. The progress
 * word must ride all three rows (parallel vocabulary), the countdown wording must
 * survive in none, and the bar word must stay in the title row and never return to
 * the show row. Red-first: this suite failed against all 75 catalogs the day each
 * change landed, naming every locale.
 */

import { catalogFor } from '@/shared/i18n/loader';
import { LOCALE_IDS } from '@/shared/i18n/locale';

/** The frozen wording table: each locale's three literals, its progress word (the substring all three rows carry), its countdown word (the substring none may) and its bar word (the noun the title row keeps and the shortened show row drops) */
const PINNED: Readonly<
  Record<string, { title: string; show: string; color: string; progressWord: string; oldWord: string; barWord: string }>
> = {
  am: {
    title: 'የእድገት አሞሌ',
    show: 'እድገት አሳይ',
    color: 'የእድገት አሞሌ ቀለም',
    progressWord: 'እድገት',
    oldWord: 'ቆጣሪ',
    barWord: 'አሞሌ',
  },
  ar: {
    title: 'شريط التقدم',
    show: 'إظهار التقدم',
    color: 'لون شريط التقدم',
    progressWord: 'التقدم',
    oldWord: 'التنازلي',
    barWord: 'شريط',
  },
  az: {
    title: 'İrəliləyiş Zolağı',
    show: 'İrəliləyişi göstər',
    color: 'İrəliləyiş zolağının rəngi',
    progressWord: 'rəliləyiş',
    oldWord: 'sayım',
    barWord: 'zolağ',
  },
  bal: {
    title: 'پروگریس بار',
    show: 'پروگریس دِست کَن',
    color: 'پروگریس بارءِ رنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
    barWord: 'بار',
  },
  bcl: {
    title: 'Bar kan pag-uswag',
    show: 'Ipahiling an pag-uswag',
    color: 'Kulay kan bar kan pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pagbilang',
    barWord: 'bar',
  },
  bm: {
    title: 'Progresi bar',
    show: 'Progresi jira',
    color: 'Progresi bar kulɛr',
    progressWord: 'rogresi',
    oldWord: 'alanni',
    barWord: 'bar',
  },
  bn: {
    title: 'অগ্রগতি বার',
    show: 'অগ্রগতি দেখান',
    color: 'অগ্রগতি বারের রং',
    progressWord: 'অগ্রগতি',
    oldWord: 'কাউন্টডাউন',
    barWord: 'বার',
  },
  bs: {
    title: 'Traka napretka',
    show: 'Prikaži napredak',
    color: 'Boja trake napretka',
    progressWord: 'napre',
    oldWord: 'odbrojavanja',
    barWord: 'trak',
  },
  bug: {
    title: 'Baro progres',
    show: 'Taro progres',
    color: 'Warna baro progres',
    progressWord: 'progres',
    oldWord: 'mongka',
    barWord: 'baro',
  },
  ceb: {
    title: 'Bar sa pag-uswag',
    show: 'Ipakita ang pag-uswag',
    color: 'Kolor sa bar sa pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pag-ihap',
    barWord: 'bar',
  },
  ckb: {
    title: 'شریتی پێشکەوتن',
    show: 'پێشکەوتن پیشان بدە',
    color: 'ڕەنگی شریتی پێشکەوتن',
    progressWord: 'پێشکەوتن',
    oldWord: 'ژماردنەوە',
    barWord: 'شریتی',
  },
  de: {
    title: 'Fortschrittsbalken',
    show: 'Fortschritt anzeigen',
    color: 'Farbe des Fortschrittsbalkens',
    progressWord: 'Fortschritt',
    oldWord: 'Countdown',
    barWord: 'balken',
  },
  en: {
    title: 'Progress Bar',
    show: 'Show progress',
    color: 'Progress color',
    progressWord: 'progress',
    oldWord: 'countdown',
    barWord: 'bar',
  },
  es: {
    title: 'Barra de progreso',
    show: 'Mostrar progreso',
    color: 'Color de la barra de progreso',
    progressWord: 'progreso',
    oldWord: 'cuenta',
    barWord: 'barra',
  },
  fa: {
    title: 'نوار پیشرفت',
    show: 'نمایش پیشرفت',
    color: 'رنگ نوار پیشرفت',
    progressWord: 'پیشرفت',
    oldWord: 'معکوس',
    barWord: 'نوار',
  },
  ff: {
    title: 'Bar ɓamtaare',
    show: 'Hollu ɓamtaare',
    color: 'Noone bar ɓamtaare',
    progressWord: 'ɓamtaare',
    oldWord: 'limto',
    barWord: 'bar',
  },
  fr: {
    title: 'Barre de progression',
    show: 'Afficher la progression',
    color: 'Couleur de la barre de progression',
    progressWord: 'progression',
    oldWord: 'rebours',
    barWord: 'barre',
  },
  gu: {
    title: 'પ્રગતિ બાર',
    show: 'પ્રગતિ દર્શાવો',
    color: 'પ્રગતિ બારનો રંગ',
    progressWord: 'પ્રગતિ',
    oldWord: 'કાઉન્ટડાઉન',
    barWord: 'બાર',
  },
  ha: {
    title: 'Layin Ci Gaba',
    show: 'Nuna ci gaba',
    color: 'Launin layin ci gaba',
    progressWord: 'aba',
    oldWord: 'ƙidaya',
    barWord: 'layin',
  },
  hi: {
    title: 'प्रगति पट्टी',
    show: 'प्रगति दिखाएँ',
    color: 'प्रगति पट्टी का रंग',
    progressWord: 'प्रगति',
    oldWord: 'काउंटडाउन',
    barWord: 'पट्टी',
  },
  hil: {
    title: 'Bar sang pag-uswag',
    show: 'Ipakita ang pag-uswag',
    color: 'Kolor sang bar sang pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pag-ihap',
    barWord: 'bar',
  },
  id: {
    title: 'Bilah Kemajuan',
    show: 'Tampilkan kemajuan',
    color: 'Warna bilah kemajuan',
    progressWord: 'emajuan',
    oldWord: 'itung',
    barWord: 'bilah',
  },
  ilo: {
    title: 'Barra ti panagrang-ay',
    show: 'Ipakita ti panagrang-ay',
    color: 'Kolor ti barra ti panagrang-ay',
    progressWord: 'rang-ay',
    oldWord: 'panagbilang',
    barWord: 'barra',
  },
  it: {
    title: 'Barra di avanzamento',
    show: 'Mostra avanzamento',
    color: 'Colore della barra di avanzamento',
    progressWord: 'avanzamento',
    oldWord: 'rovescia',
    barWord: 'barra',
  },
  ja: {
    title: 'プログレスバー',
    show: 'プログレスを表示',
    color: 'プログレスバーの色',
    progressWord: 'プログレス',
    oldWord: 'カウントダウン',
    barWord: 'バー',
  },
  jv: {
    title: 'Bar kamajuan',
    show: 'Tampilna kamajuan',
    color: 'Werna bar kamajuan',
    progressWord: 'amajuan',
    oldWord: 'cacah',
    barWord: 'bar',
  },
  kas: {
    title: 'پروگریس بار',
    show: 'پروگریس ہٲویو',
    color: 'پروگریس بارٕچئے رَنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
    barWord: 'بار',
  },
  kk: {
    title: 'Прогресс жолағы',
    show: 'Прогрессті көрсету',
    color: 'Прогресс жолағының түсі',
    progressWord: 'Прогресс',
    oldWord: 'санақ',
    barWord: 'жолағ',
  },
  kn: {
    title: 'ಪ್ರಗತಿ ಪಟ್ಟಿ',
    show: 'ಪ್ರಗತಿ ತೋರಿಸಿ',
    color: 'ಪ್ರಗತಿ ಪಟ್ಟಿ ಬಣ್ಣ',
    progressWord: 'ಪ್ರಗತಿ',
    oldWord: 'ಕೌಂಟ್',
    barWord: 'ಪಟ್ಟಿ',
  },
  ko: {
    title: '진행 바',
    show: '진행 표시',
    color: '진행 바 색상',
    progressWord: '진행',
    oldWord: '카운트다운',
    barWord: '바',
  },
  kr: {
    title: 'Progres bar',
    show: 'Progres bayanna',
    color: 'Progres bar rangi',
    progressWord: 'rogres',
    oldWord: 'auntidaun',
    barWord: 'bar',
  },
  ku: {
    title: 'Şerîta Pêşketinê',
    show: 'Pêşketinê nîşan bide',
    color: 'Rengê şerîta pêşketinê',
    progressWord: 'êşketin',
    oldWord: 'hejmartin',
    barWord: 'şerîta',
  },
  ky: {
    title: 'Прогресс тилкеси',
    show: 'Прогрессти көрсөтүү',
    color: 'Прогресс тилкесинин түсү',
    progressWord: 'Прогресс',
    oldWord: 'эсептөө',
    barWord: 'тилке',
  },
  mad: {
    title: 'Bâḍâna progres',
    show: 'Epataragi progres',
    color: 'Warna bâḍâna progres',
    progressWord: 'progres',
    oldWord: 'angèbâna',
    barWord: 'bâḍâna',
  },
  mdh: {
    title: 'Bar ng progress',
    show: 'Ipakita ang progress',
    color: 'Kulay ng bar ng progress',
    progressWord: 'progress',
    oldWord: 'kawnangdown',
    barWord: 'bar',
  },
  mfa: {
    title: 'Bar kemajuan',
    show: 'Tunjuk kemajuan',
    color: 'Warna bar kemajuan',
    progressWord: 'emajuan',
    oldWord: 'iraan',
    barWord: 'bar',
  },
  min: {
    title: 'Bar kamajuan',
    show: 'Tampilkan kamajuan',
    color: 'Warna bar kamajuan',
    progressWord: 'amajuan',
    oldWord: 'aliwaik',
    barWord: 'bar',
  },
  ml: {
    title: 'പുരോഗതി ബാർ',
    show: 'പുരോഗതി കാണിക്കുക',
    color: 'പുരോഗതി ബാർ നിറം',
    progressWord: 'പുരോഗതി',
    oldWord: 'കൗണ്ട',
    barWord: 'ബാർ',
  },
  mr: {
    title: 'प्रगती पट्टी',
    show: 'प्रगती दाखवा',
    color: 'प्रगती पट्टीचा रंग',
    progressWord: 'प्रगती',
    oldWord: 'गणती',
    barWord: 'पट्टी',
  },
  mrw: {
    title: 'Bar ng progress',
    show: 'Ipakita ang progress',
    color: 'Kulay ng bar ng progress',
    progressWord: 'progress',
    oldWord: 'kawnangdown',
    barWord: 'bar',
  },
  ms: {
    title: 'Bar kemajuan',
    show: 'Tunjukkan kemajuan',
    color: 'Warna bar kemajuan',
    progressWord: 'emajuan',
    oldWord: 'iraan',
    barWord: 'bar',
  },
  my: {
    title: 'တိုးတက်မှု ဘား',
    show: 'တိုးတက်မှု ပြရန်',
    color: 'တိုးတက်မှု ဘား အရောင်',
    progressWord: 'တိုးတက်',
    oldWord: 'ရေတွက်',
    barWord: 'ဘား',
  },
  nl: {
    title: 'Voortgangsbalk',
    show: 'Voortgang tonen',
    color: 'Kleur van de voortgangsbalk',
    progressWord: 'oortgang',
    oldWord: 'ftelbalk',
    barWord: 'balk',
  },
  om: {
    title: 'Bar guddina',
    show: 'Guddina agarsiisi',
    color: 'Halluu bar guddina',
    progressWord: 'guddina',
    oldWord: 'lakkoofsaa',
    barWord: 'bar',
  },
  'pa-Arab': {
    title: 'ترقی پٹی',
    show: 'ترقی دکھاؤ',
    color: 'ترقی پٹی دا رنگ',
    progressWord: 'ترقی',
    oldWord: 'الٹی',
    barWord: 'پٹی',
  },
  pl: {
    title: 'Pasek postępu',
    show: 'Pokaż postęp',
    color: 'Kolor paska postępu',
    progressWord: 'ostęp',
    oldWord: 'dliczania',
    barWord: 'pasek',
  },
  ps: {
    title: 'د پرمختګ بار',
    show: 'پرمختګ وښایه',
    color: 'د پرمختګ بار رنګ',
    progressWord: 'پرمختګ',
    oldWord: 'پاتې',
    barWord: 'بار',
  },
  pt: {
    title: 'Barra de Progresso',
    show: 'Mostrar progresso',
    color: 'Cor da barra de progresso',
    progressWord: 'rogress',
    oldWord: 'ontagem',
    barWord: 'barra',
  },
  qu: {
    title: 'Progreso siq’i',
    show: 'Progresota qawachiy',
    color: 'Progreso siq’ip llimp’in',
    progressWord: 'rogreso',
    oldWord: 'utichiy',
    barWord: 'siq’i',
  },
  ro: {
    title: 'Bara de progres',
    show: 'Afișează progresul',
    color: 'Culoarea barei de progres',
    progressWord: 'progres',
    oldWord: 'numărătoare',
    barWord: 'bara',
  },
  ru: {
    title: 'Полоса прогресса',
    show: 'Показывать прогресс',
    color: 'Цвет полосы прогресса',
    progressWord: 'прогресс',
    oldWord: 'отсчёт',
    barWord: 'полос',
  },
  sd: {
    title: 'ترقي پٽي',
    show: 'ترقي ڏيکاريو',
    color: 'ترقي پٽي جو رنگ',
    progressWord: 'ترقي',
    oldWord: 'ڳڻپ',
    barWord: 'پٽي',
  },
  skr: {
    title: 'پروگریس بار',
    show: 'پروگریس ݙکاؤ',
    color: 'پروگریس بار دا رنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
    barWord: 'بار',
  },
  so: {
    title: 'Shaxda horumarka',
    show: 'Muuji horumarka',
    color: 'Midabka shaxda horumarka',
    progressWord: 'horumar',
    oldWord: 'tiris',
    barWord: 'shaxda',
  },
  sq: {
    title: 'Shiriti i përparimit',
    show: 'Shfaq përparimin',
    color: 'Ngjyra e shiritit të përparimit',
    progressWord: 'përparim',
    oldWord: 'umërimit',
    barWord: 'shirit',
  },
  su: {
    title: 'Bar kamajuan',
    show: 'Témbongkeun kamajuan',
    color: 'Warna bar kamajuan',
    progressWord: 'amajuan',
    oldWord: 'itungan',
    barWord: 'bar',
  },
  sw: {
    title: 'Mstari wa Maendeleo',
    show: 'Onyesha maendeleo',
    color: 'Rangi ya mstari wa maendeleo',
    progressWord: 'aendeleo',
    oldWord: 'uhesabu',
    barWord: 'mstari',
  },
  ta: {
    title: 'முன்னேற்றப் பட்டை',
    show: 'முன்னேற்றத்தைக் காட்டு',
    color: 'முன்னேற்றப் பட்டை நிறம்',
    progressWord: 'முன்னேற்ற',
    oldWord: 'கவுண்டவுன்',
    barWord: 'பட்டை',
  },
  te: {
    title: 'పురోగతి పట్టీ',
    show: 'పురోగతి చూపించు',
    color: 'పురోగతి పట్టీ రంగు',
    progressWord: 'పురోగతి',
    oldWord: 'కౌంట్',
    barWord: 'పట్టీ',
  },
  tg: {
    title: 'Хати пешрафт',
    show: 'Нишон додани пешрафт',
    color: 'Ранги хати пешрафт',
    progressWord: 'пешрафт',
    oldWord: 'аръакс',
    barWord: 'хати',
  },
  th: {
    title: 'แถบความคืบหน้า',
    show: 'แสดงความคืบหน้า',
    color: 'สีแถบความคืบหน้า',
    progressWord: 'คืบหน้า',
    oldWord: 'นับถอยหลัง',
    barWord: 'แถบ',
  },
  ti: {
    title: 'ናይ ድገት ኣሞሌ',
    show: 'ድገት ኣርኣዩ',
    color: 'ሕብረ-ለብሲ ኣሞሌ ድገት',
    progressWord: 'ድገት',
    oldWord: 'ቆጸራ',
    barWord: 'ኣሞሌ',
  },
  tk: {
    title: 'Ösüş zolagy',
    show: 'Ösüşi görkez',
    color: 'Ösüş zolagynyň reňki',
    progressWord: 'süş',
    oldWord: 'asaplama',
    barWord: 'zolag',
  },
  tl: {
    title: 'Bar ng progress',
    show: 'Ipakita ang progress',
    color: 'Kulay ng bar ng progress',
    progressWord: 'progress',
    oldWord: 'countdown',
    barWord: 'bar',
  },
  tr: {
    title: 'İlerleme Çubuğu',
    show: 'İlerlemeyi göster',
    color: 'İlerleme çubuğu rengi',
    progressWord: 'lerleme',
    oldWord: 'eri sayım',
    barWord: 'çubuğ',
  },
  tt: {
    title: 'Прогресс полосасы',
    show: 'Прогрессны күрсәтергә',
    color: 'Прогресс полосасы төсе',
    progressWord: 'Прогресс',
    oldWord: 'санагыч',
    barWord: 'полоса',
  },
  ug: {
    title: 'ئىلگىرىلەش بالدىقى',
    show: 'ئىلگىرىلەشنى كۆرسەت',
    color: 'ئىلگىرىلەش بالدىقىنىڭ رەڭگى',
    progressWord: 'ئىلگىرىلەش',
    oldWord: 'چېكىش',
    barWord: 'بالدىق',
  },
  uk: {
    title: 'Смуга прогресу',
    show: 'Показувати прогрес',
    color: 'Колір смуги прогресу',
    progressWord: 'прогрес',
    oldWord: 'відліку',
    barWord: 'смуг',
  },
  ur: {
    title: 'پروگریس بار',
    show: 'پروگریس دکھائیں',
    color: 'پروگریس بار کا رنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
    barWord: 'بار',
  },
  uz: {
    title: 'Taraqqiyot paneli',
    show: "Taraqqiyotni ko'rsatish",
    color: 'Taraqqiyot paneli rangi',
    progressWord: 'araqqiyot',
    oldWord: 'eskari',
    barWord: 'panel',
  },
  vi: {
    title: 'Thanh tiến trình',
    show: 'Hiện tiến trình',
    color: 'Màu thanh tiến trình',
    progressWord: 'tiến trình',
    oldWord: 'đếm ngược',
    barWord: 'thanh',
  },
  war: {
    title: 'Bar han pag-uswag',
    show: 'Igpakita an pag-uswag',
    color: 'Kolor han bar han pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pag-ihap',
    barWord: 'bar',
  },
  wo: {
    title: 'Bàndu progres',
    show: 'Wone progres',
    color: 'Melokaanu bàndu progres',
    progressWord: 'progres',
    oldWord: 'des',
    barWord: 'bàndu',
  },
  yo: {
    title: 'Ìlà Ìlọsíwájú',
    show: 'Fi ìlọsíwájú hàn',
    color: 'Àwọ̀ ìlà ìlọsíwájú',
    progressWord: 'ọsíwájú',
    oldWord: 'ìkàsí',
    barWord: 'ìlà',
  },
  'zh-Hans': {
    title: '进度条',
    show: '显示进度',
    color: '进度条颜色',
    progressWord: '进度',
    oldWord: '倒计时',
    barWord: '条',
  },
};

/** A locale whose show construction cannot embed the progress word records here: locale -> the grammatical reason and the attestation source. The list starts empty. */
const PROGRESS_WORD_EXEMPT: Readonly<Record<string, string>> = {};

const KEY_FOR = {
  title: 'settings.countdownBar',
  show: 'settings.showCountdownBar',
  color: 'colorPicker.label',
} as const;

type Row = keyof typeof KEY_FOR;

const ROWS: readonly Row[] = ['title', 'show', 'color'];

describe('the progress wording', () => {
  it('pins a wording row for every locale the app ships', () => {
    expect([...LOCALE_IDS].sort()).toEqual(Object.keys(PINNED).sort());
  });

  it.each(LOCALE_IDS)('%s prints the pinned progress wording on all three rows', (loc) => {
    const pinned = PINNED[loc];
    for (const row of ROWS) {
      expect(catalogFor(loc)[KEY_FOR[row]]).toBe(pinned[row]);
    }
  });

  it.each(LOCALE_IDS)('%s carries its progress word on all three rows', (loc) => {
    if (PROGRESS_WORD_EXEMPT[loc]) return;
    const pinned = PINNED[loc];
    for (const row of ROWS) {
      expect(pinned[row].toLowerCase()).toContain(pinned.progressWord.toLowerCase());
    }
  });

  it.each(LOCALE_IDS)('%s drops its bar word from the show row but keeps it in the title row', (loc) => {
    const pinned = PINNED[loc];
    expect(catalogFor(loc)[KEY_FOR.title].toLowerCase()).toContain(pinned.barWord.toLowerCase());
    expect(catalogFor(loc)[KEY_FOR.show].toLowerCase()).not.toContain(pinned.barWord.toLowerCase());
  });

  it.each(LOCALE_IDS)('%s keeps its countdown wording out of all three rows', (loc) => {
    const pinned = PINNED[loc];
    for (const row of ROWS) {
      expect(pinned[row].toLowerCase()).not.toContain(pinned.oldWord.toLowerCase());
    }
  });
});
