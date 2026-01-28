/** Mapping of English digits to Arabic-Indic numerals */
const ENGLISH_TO_ARABIC: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

/**
 * Converts English digits (0-9) to Arabic-Indic numerals (٠-٩)
 *
 * @param text - Input text containing English digits
 * @returns Text with English digits replaced by Arabic numerals
 *
 * @example
 * toArabicNumbers('Prayer at 5:30') // 'Prayer at ٥:٣٠'
 * toArabicNumbers('Test') // 'Test'
 */
export const toArabicNumbers = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => ENGLISH_TO_ARABIC[digit] || digit);
};
