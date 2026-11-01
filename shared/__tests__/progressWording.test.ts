/**
 * The T-557 progress wording: the countdown bar reads as progress in every catalog.
 * The card title row, the show row and the color row - the three strings the owner's
 * order named (2026-11-01) - are pinned literal-for-literal per locale, the loan and
 * translation chains carrying the same frame they carried for the countdown wording.
 * The progress word must ride all three rows (parallel vocabulary), and the countdown
 * wording must survive in none. Red-first: this suite failed against all 75 catalogs
 * the day it landed, naming every locale.
 */

import { catalogFor } from '@/shared/i18n/loader';
import { LOCALE_IDS } from '@/shared/i18n/locale';

/** The frozen wording table: each locale's three literals, its progress word (the substring all three rows carry) and its countdown word (the substring none may) */
const PINNED: Readonly<
  Record<string, { title: string; show: string; color: string; progressWord: string; oldWord: string }>
> = {
  am: { title: 'የእድገት አሞሌ', show: 'የእድገት አሞሌ አሳይ', color: 'የእድገት አሞሌ ቀለም', progressWord: 'እድገት', oldWord: 'ቆጣሪ' },
  ar: {
    title: 'شريط التقدم',
    show: 'إظهار شريط التقدم',
    color: 'لون شريط التقدم',
    progressWord: 'التقدم',
    oldWord: 'التنازلي',
  },
  az: {
    title: 'İrəliləyiş Zolağı',
    show: 'İrəliləyiş zolağını göstər',
    color: 'İrəliləyiş zolağının rəngi',
    progressWord: 'rəliləyiş',
    oldWord: 'sayım',
  },
  bal: {
    title: 'پروگریس بار',
    show: 'پروگریس بار دِست کَن',
    color: 'پروگریس بارءِ رنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
  },
  bcl: {
    title: 'Bar kan pag-uswag',
    show: 'Ipahiling an bar kan pag-uswag',
    color: 'Kulay kan bar kan pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pagbilang',
  },
  bm: {
    title: 'Progresi bar',
    show: 'Progresi bar jira',
    color: 'Progresi bar kulɛr',
    progressWord: 'rogresi',
    oldWord: 'alanni',
  },
  bn: {
    title: 'অগ্রগতি বার',
    show: 'অগ্রগতি বার দেখান',
    color: 'অগ্রগতি বারের রং',
    progressWord: 'অগ্রগতি',
    oldWord: 'কাউন্টডাউন',
  },
  bs: {
    title: 'Traka napretka',
    show: 'Prikaži traku napretka',
    color: 'Boja trake napretka',
    progressWord: 'napretk',
    oldWord: 'odbrojavanja',
  },
  bug: {
    title: 'Baro progres',
    show: 'Taro baro progres',
    color: 'Warna baro progres',
    progressWord: 'progres',
    oldWord: 'mongka',
  },
  ceb: {
    title: 'Bar sa pag-uswag',
    show: 'Ipakita ang bar sa pag-uswag',
    color: 'Kolor sa bar sa pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pag-ihap',
  },
  ckb: {
    title: 'شریتی پێشکەوتن',
    show: 'شریتی پێشکەوتن پیشان بدە',
    color: 'ڕەنگی شریتی پێشکەوتن',
    progressWord: 'پێشکەوتن',
    oldWord: 'ژماردنەوە',
  },
  de: {
    title: 'Fortschrittsbalken',
    show: 'Fortschrittsbalken anzeigen',
    color: 'Farbe des Fortschrittsbalkens',
    progressWord: 'Fortschrittsbalken',
    oldWord: 'Countdown',
  },
  en: {
    title: 'Progress Bar',
    show: 'Show progress bar',
    color: 'Progress color',
    progressWord: 'progress',
    oldWord: 'countdown',
  },
  es: {
    title: 'Barra de progreso',
    show: 'Mostrar la barra de progreso',
    color: 'Color de la barra de progreso',
    progressWord: 'progreso',
    oldWord: 'cuenta',
  },
  fa: {
    title: 'نوار پیشرفت',
    show: 'نمایش نوار پیشرفت',
    color: 'رنگ نوار پیشرفت',
    progressWord: 'پیشرفت',
    oldWord: 'معکوس',
  },
  ff: {
    title: 'Bar ɓamtaare',
    show: 'Hollu bar ɓamtaare',
    color: 'Noone bar ɓamtaare',
    progressWord: 'ɓamtaare',
    oldWord: 'limto',
  },
  fr: {
    title: 'Barre de progression',
    show: 'Afficher la barre de progression',
    color: 'Couleur de la barre de progression',
    progressWord: 'progression',
    oldWord: 'rebours',
  },
  gu: {
    title: 'પ્રગતિ બાર',
    show: 'પ્રગતિ બાર દર્શાવો',
    color: 'પ્રગતિ બારનો રંગ',
    progressWord: 'પ્રગતિ',
    oldWord: 'કાઉન્ટડાઉન',
  },
  ha: {
    title: 'Layin Ci Gaba',
    show: 'Nuna layin ci gaba',
    color: 'Launin layin ci gaba',
    progressWord: 'aba',
    oldWord: 'ƙidaya',
  },
  hi: {
    title: 'प्रगति पट्टी',
    show: 'प्रगति पट्टी दिखाएँ',
    color: 'प्रगति पट्टी का रंग',
    progressWord: 'प्रगति',
    oldWord: 'काउंटडाउन',
  },
  hil: {
    title: 'Bar sang pag-uswag',
    show: 'Ipakita ang bar sang pag-uswag',
    color: 'Kolor sang bar sang pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pag-ihap',
  },
  id: {
    title: 'Bilah Kemajuan',
    show: 'Tampilkan bilah kemajuan',
    color: 'Warna bilah kemajuan',
    progressWord: 'emajuan',
    oldWord: 'itung',
  },
  ilo: {
    title: 'Barra ti panagrang-ay',
    show: 'Ipakita ti barra ti panagrang-ay',
    color: 'Kolor ti barra ti panagrang-ay',
    progressWord: 'rang-ay',
    oldWord: 'panagbilang',
  },
  it: {
    title: 'Barra di avanzamento',
    show: 'Mostra la barra di avanzamento',
    color: 'Colore della barra di avanzamento',
    progressWord: 'avanzamento',
    oldWord: 'rovescia',
  },
  ja: {
    title: 'プログレスバー',
    show: 'プログレスバーを表示',
    color: 'プログレスバーの色',
    progressWord: 'プログレス',
    oldWord: 'カウントダウン',
  },
  jv: {
    title: 'Bar kamajuan',
    show: 'Tampilna bar kamajuan',
    color: 'Werna bar kamajuan',
    progressWord: 'amajuan',
    oldWord: 'cacah',
  },
  kas: {
    title: 'پروگریس بار',
    show: 'پروگریس بار ہٲویو',
    color: 'پروگریس بارٕچئے رَنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
  },
  kk: {
    title: 'Прогресс жолағы',
    show: 'Прогресс жолағын көрсету',
    color: 'Прогресс жолағының түсі',
    progressWord: 'Прогресс',
    oldWord: 'санақ',
  },
  kn: { title: 'ಪ್ರಗತಿ ಪಟ್ಟಿ', show: 'ಪ್ರಗತಿ ಪಟ್ಟಿ ತೋರಿಸಿ', color: 'ಪ್ರಗತಿ ಪಟ್ಟಿ ಬಣ್ಣ', progressWord: 'ಪ್ರಗತಿ', oldWord: 'ಕೌಂಟ್' },
  ko: { title: '진행 바', show: '진행 바 표시', color: '진행 바 색상', progressWord: '진행', oldWord: '카운트다운' },
  kr: {
    title: 'Progres bar',
    show: 'Progres bar bayanna',
    color: 'Progres bar rangi',
    progressWord: 'rogres',
    oldWord: 'auntidaun',
  },
  ku: {
    title: 'Şerîta Pêşketinê',
    show: 'Şerîta pêşketinê nîşan bide',
    color: 'Rengê şerîta pêşketinê',
    progressWord: 'êşketin',
    oldWord: 'hejmartin',
  },
  ky: {
    title: 'Прогресс тилкеси',
    show: 'Прогресс тилкесин көрсөтүү',
    color: 'Прогресс тилкесинин түсү',
    progressWord: 'Прогресс',
    oldWord: 'эсептөө',
  },
  mad: {
    title: 'Bâḍâna progres',
    show: 'Epataragi bâḍâna progres',
    color: 'Warna bâḍâna progres',
    progressWord: 'progres',
    oldWord: 'angèbâna',
  },
  mdh: {
    title: 'Bar ng progress',
    show: 'Ipakita ang bar ng progress',
    color: 'Kulay ng bar ng progress',
    progressWord: 'progress',
    oldWord: 'kawnangdown',
  },
  mfa: {
    title: 'Bar kemajuan',
    show: 'Tunjuk bar kemajuan',
    color: 'Warna bar kemajuan',
    progressWord: 'emajuan',
    oldWord: 'iraan',
  },
  min: {
    title: 'Bar kamajuan',
    show: 'Tampilkan bar kamajuan',
    color: 'Warna bar kamajuan',
    progressWord: 'amajuan',
    oldWord: 'aliwaik',
  },
  ml: { title: 'പുരോഗതി ബാർ', show: 'പുരോഗതി ബാർ കാണിക്കുക', color: 'പുരോഗതി ബാർ നിറം', progressWord: 'പുരോഗതി', oldWord: 'കൗണ്ട' },
  mr: {
    title: 'प्रगती पट्टी',
    show: 'प्रगती पट्टी दाखवा',
    color: 'प्रगती पट्टीचा रंग',
    progressWord: 'प्रगती',
    oldWord: 'गणती',
  },
  mrw: {
    title: 'Bar ng progress',
    show: 'Ipakita ang bar ng progress',
    color: 'Kulay ng bar ng progress',
    progressWord: 'progress',
    oldWord: 'kawnangdown',
  },
  ms: {
    title: 'Bar kemajuan',
    show: 'Tunjukkan bar kemajuan',
    color: 'Warna bar kemajuan',
    progressWord: 'emajuan',
    oldWord: 'iraan',
  },
  my: { title: 'တိုးတက်မှု ဘား', show: 'တိုးတက်မှု ဘား ပြရန်', color: 'တိုးတက်မှု ဘား အရောင်', progressWord: 'တိုးတက်', oldWord: 'ရေတွက်' },
  nl: {
    title: 'Voortgangsbalk',
    show: 'Voortgangsbalk tonen',
    color: 'Kleur van de voortgangsbalk',
    progressWord: 'oortgangsbalk',
    oldWord: 'ftelbalk',
  },
  om: {
    title: 'Bar guddina',
    show: 'Bar guddina agarsiisi',
    color: 'Halluu bar guddina',
    progressWord: 'guddina',
    oldWord: 'lakkoofsaa',
  },
  'pa-Arab': {
    title: 'ترقی پٹی',
    show: 'ترقی پٹی دکھاؤ',
    color: 'ترقی پٹی دا رنگ',
    progressWord: 'ترقی',
    oldWord: 'الٹی',
  },
  pl: {
    title: 'Pasek postępu',
    show: 'Pokaż pasek postępu',
    color: 'Kolor paska postępu',
    progressWord: 'ostęp',
    oldWord: 'dliczania',
  },
  ps: {
    title: 'د پرمختګ بار',
    show: 'د پرمختګ بار وښایه',
    color: 'د پرمختګ بار رنګ',
    progressWord: 'پرمختګ',
    oldWord: 'پاتې',
  },
  pt: {
    title: 'Barra de Progresso',
    show: 'Mostrar barra de progresso',
    color: 'Cor da barra de progresso',
    progressWord: 'rogress',
    oldWord: 'ontagem',
  },
  qu: {
    title: 'Progreso siq’i',
    show: 'Progreso siq’ita qawachiy',
    color: 'Progreso siq’ip llimp’in',
    progressWord: 'rogreso',
    oldWord: 'utichiy',
  },
  ro: {
    title: 'Bara de progres',
    show: 'Afișează bara de progres',
    color: 'Culoarea barei de progres',
    progressWord: 'progres',
    oldWord: 'numărătoare',
  },
  ru: {
    title: 'Полоса прогресса',
    show: 'Показывать полосу прогресса',
    color: 'Цвет полосы прогресса',
    progressWord: 'прогресс',
    oldWord: 'отсчёт',
  },
  sd: { title: 'ترقي پٽي', show: 'ترقي پٽي ڏيکاريو', color: 'ترقي پٽي جو رنگ', progressWord: 'ترقي', oldWord: 'ڳڻپ' },
  skr: {
    title: 'پروگریس بار',
    show: 'پروگریس بار ݙکاؤ',
    color: 'پروگریس بار دا رنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
  },
  so: {
    title: 'Shaxda horumarka',
    show: 'Muuji shaxda horumarka',
    color: 'Midabka shaxda horumarka',
    progressWord: 'horumar',
    oldWord: 'tiris',
  },
  sq: {
    title: 'Shiriti i përparimit',
    show: 'Shfaq shiritin e përparimit',
    color: 'Ngjyra e shiritit të përparimit',
    progressWord: 'ërparimit',
    oldWord: 'umërimit',
  },
  su: {
    title: 'Bar kamajuan',
    show: 'Témbongkeun bar kamajuan',
    color: 'Warna bar kamajuan',
    progressWord: 'amajuan',
    oldWord: 'itungan',
  },
  sw: {
    title: 'Mstari wa Maendeleo',
    show: 'Onyesha mstari wa maendeleo',
    color: 'Rangi ya mstari wa maendeleo',
    progressWord: 'aendeleo',
    oldWord: 'uhesabu',
  },
  ta: {
    title: 'முன்னேற்றப் பட்டை',
    show: 'முன்னேற்றப் பட்டையைக் காட்டு',
    color: 'முன்னேற்றப் பட்டை நிறம்',
    progressWord: 'முன்னேற்ற',
    oldWord: 'கவுண்டவுன்',
  },
  te: { title: 'పురోగతి పట్టీ', show: 'పురోగతి పట్టీ చూపించు', color: 'పురోగతి పట్టీ రంగు', progressWord: 'పురోగతి', oldWord: 'కౌంట్' },
  tg: {
    title: 'Хати пешрафт',
    show: 'Нишон додани хати пешрафт',
    color: 'Ранги хати пешрафт',
    progressWord: 'пешрафт',
    oldWord: 'аръакс',
  },
  th: {
    title: 'แถบความคืบหน้า',
    show: 'แสดงแถบความคืบหน้า',
    color: 'สีแถบความคืบหน้า',
    progressWord: 'คืบหน้า',
    oldWord: 'นับถอยหลัง',
  },
  ti: { title: 'ናይ ድገት ኣሞሌ', show: 'ናይ ድገት ኣሞሌ ኣርኣዩ', color: 'ሕብረ-ለብሲ ኣሞሌ ድገት', progressWord: 'ድገት', oldWord: 'ቆጸራ' },
  tk: {
    title: 'Ösüş zolagy',
    show: 'Ösüş zolagyny görkez',
    color: 'Ösüş zolagynyň reňki',
    progressWord: 'süş',
    oldWord: 'asaplama',
  },
  tl: {
    title: 'Bar ng progress',
    show: 'Ipakita ang bar ng progress',
    color: 'Kulay ng bar ng progress',
    progressWord: 'progress',
    oldWord: 'countdown',
  },
  tr: {
    title: 'İlerleme Çubuğu',
    show: 'İlerleme çubuğunu göster',
    color: 'İlerleme çubuğu rengi',
    progressWord: 'lerleme',
    oldWord: 'eri sayım',
  },
  tt: {
    title: 'Прогресс полосасы',
    show: 'Прогресс полосасын күрсәтергә',
    color: 'Прогресс полосасы төсе',
    progressWord: 'Прогресс',
    oldWord: 'санагыч',
  },
  ug: {
    title: 'ئىلگىرىلەش بالدىقى',
    show: 'ئىلگىرىلەش بالدىقىنى كۆرسەت',
    color: 'ئىلگىرىلەش بالدىقىنىڭ رەڭگى',
    progressWord: 'ئىلگىرىلەش',
    oldWord: 'چېكىش',
  },
  uk: {
    title: 'Смуга прогресу',
    show: 'Показувати смугу прогресу',
    color: 'Колір смуги прогресу',
    progressWord: 'прогрес',
    oldWord: 'відліку',
  },
  ur: {
    title: 'پروگریس بار',
    show: 'پروگریس بار دکھائیں',
    color: 'پروگریس بار کا رنگ',
    progressWord: 'پروگریس',
    oldWord: 'کاؤنٹ',
  },
  uz: {
    title: 'Taraqqiyot paneli',
    show: "Taraqqiyot panelini ko'rsatish",
    color: 'Taraqqiyot paneli rangi',
    progressWord: 'araqqiyot',
    oldWord: 'eskari',
  },
  vi: {
    title: 'Thanh tiến trình',
    show: 'Hiện thanh tiến trình',
    color: 'Màu thanh tiến trình',
    progressWord: 'tiến trình',
    oldWord: 'đếm ngược',
  },
  war: {
    title: 'Bar han pag-uswag',
    show: 'Igpakita an bar han pag-uswag',
    color: 'Kolor han bar han pag-uswag',
    progressWord: 'uswag',
    oldWord: 'pag-ihap',
  },
  wo: {
    title: 'Bàndu progres',
    show: 'Wone bàndu progres',
    color: 'Melokaanu bàndu progres',
    progressWord: 'progres',
    oldWord: 'des',
  },
  yo: {
    title: 'Ìlà Ìlọsíwájú',
    show: 'Fi ìlà ìlọsíwájú hàn',
    color: 'Àwọ̀ ìlà ìlọsíwájú',
    progressWord: 'ọsíwájú',
    oldWord: 'ìkàsí',
  },
  'zh-Hans': { title: '进度条', show: '显示进度条', color: '进度条颜色', progressWord: '进度', oldWord: '倒计时' },
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

  it.each(LOCALE_IDS)('%s keeps its countdown wording out of all three rows', (loc) => {
    const pinned = PINNED[loc];
    for (const row of ROWS) {
      expect(pinned[row].toLowerCase()).not.toContain(pinned.oldWord.toLowerCase());
    }
  });
});
