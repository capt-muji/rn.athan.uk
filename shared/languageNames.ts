/**
 * The D26 picker names: each language in its own name, sorted by codepoint,
 * so a reader scans for the name they know rather than an English gloss.
 * Latin before Cyrillic before Arabic before Devanagari before Bengali
 * before Tamil before Malayalam before Thai before Chinese. Names
 * data, not copy: the scanner's data-module rule allows this module's `name`
 * and `english` fields. The English name is never drawn: the picker's search
 * matches it, so a reader who knows only the English gloss can still land,
 * and the variant spellings speakers type (Farsi, Bangla, Pulaar) ride the
 * gloss while the drawn endonym stays the language's own name (T-451).
 */

import type { LocaleId } from '@/shared/i18n/locale';

export const LANGUAGE_NAMES: ReadonlyArray<{ id: LocaleId; name: string; english: string }> = [
  { id: 'az', name: 'Azərbaycanca', english: 'Azerbaijani (Azeri)' },
  { id: 'id', name: 'Bahasa Indonesia', english: 'Indonesian' },
  { id: 'ms', name: 'Bahasa Melayu', english: 'Malay' },
  { id: 'bm', name: 'Bamanankan', english: 'Bambara' },
  { id: 'jv', name: 'Basa Jawa', english: 'Javanese' },
  { id: 'su', name: 'Basa Sunda', english: 'Sundanese' },
  { id: 'bs', name: 'Bosanski', english: 'Bosnian' },
  { id: 'de', name: 'Deutsch', english: 'German' },
  { id: 'en', name: 'English', english: 'English' },
  { id: 'es', name: 'Español', english: 'Spanish' },
  { id: 'fr', name: 'Français', english: 'French' },
  { id: 'ff', name: 'Fulfulde', english: 'Fulfulde (Fulani, Pulaar)' },
  { id: 'ha', name: 'Hausa', english: 'Hausa' },
  { id: 'sw', name: 'Kiswahili', english: 'Swahili' },
  { id: 'ku', name: 'Kurdî', english: 'Kurdish (Kurmanji)' },
  { id: 'nl', name: 'Nederlands', english: 'Dutch' },
  { id: 'om', name: 'Oromoo', english: 'Oromo' },
  { id: 'uz', name: 'Oʻzbekcha', english: 'Uzbek' },
  { id: 'pt', name: 'Português', english: 'Portuguese' },
  { id: 'sq', name: 'Shqip', english: 'Albanian' },
  { id: 'so', name: 'Soomaali', english: 'Somali' },
  { id: 'tl', name: 'Tagalog', english: 'Tagalog' },
  { id: 'tk', name: 'Türkmençe', english: 'Turkmen' },
  { id: 'tr', name: 'Türkçe', english: 'Turkish' },
  { id: 'wo', name: 'Wolof', english: 'Wolof' },
  { id: 'yo', name: 'Yorùbá', english: 'Yoruba' },
  { id: 'ky', name: 'Кыргызча', english: 'Kyrgyz' },
  { id: 'ru', name: 'Русский', english: 'Russian' },
  { id: 'tg', name: 'Тоҷикӣ', english: 'Tajik' },
  { id: 'kk', name: 'Қазақша', english: 'Kazakh' },
  { id: 'ug', name: 'ئۇيغۇرچە', english: 'Uyghur (Uighur)' },
  { id: 'ur', name: 'اردو', english: 'Urdu' },
  { id: 'ar', name: 'العربية', english: 'Arabic' },
  { id: 'sd', name: 'سنڌي', english: 'Sindhi' },
  { id: 'fa', name: 'فارسی', english: 'Persian (Farsi)' },
  { id: 'pa-Arab', name: 'پنجابی', english: 'Punjabi' },
  { id: 'ps', name: 'پښتو', english: 'Pashto (Pushto)' },
  { id: 'ckb', name: 'کوردی', english: 'Kurdish (Sorani)' },
  { id: 'mr', name: 'मराठी', english: 'Marathi' },
  { id: 'hi', name: 'हिन्दी', english: 'Hindi' },
  { id: 'bn', name: 'বাংলা', english: 'Bengali (Bangla)' },
  { id: 'gu', name: 'ગુજરાતી', english: 'Gujarati' },
  { id: 'ta', name: 'தமிழ்', english: 'Tamil' },
  { id: 'te', name: 'తెలుగు', english: 'Telugu' },
  { id: 'kn', name: 'ಕನ್ನಡ', english: 'Kannada' },
  { id: 'ml', name: 'മലയാളം', english: 'Malayalam' },
  { id: 'th', name: 'ไทย', english: 'Thai' },
  { id: 'my', name: 'မြန်မာ', english: 'Burmese (Myanmar)' },
  { id: 'am', name: 'አማርኛ', english: 'Amharic' },
  { id: 'zh-Hans', name: '简体中文', english: 'Chinese (Simplified)' },
  { id: 'zh-Hant', name: '繁體中文', english: 'Chinese (Traditional)' },
];

const NAMES_BY_ID = Object.fromEntries(LANGUAGE_NAMES.map((entry) => [entry.id, entry.name])) as Record<
  LocaleId,
  string
>;

/** The locale's own name, exactly as its picker row reads it */
export const nativeLanguageName = (id: LocaleId): string => NAMES_BY_ID[id];
