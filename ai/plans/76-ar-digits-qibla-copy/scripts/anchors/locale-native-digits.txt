/** The locale's own numerals for digits the app draws as data (dates, sentences); Latin where
 * the locale has none. A new language with native numerals adds one entry here */
const NATIVE_DIGITS: Partial<Record<LocaleId, string>> = { ar: '٠١٢٣٤٥٦٧٨٩' };

export const localizeDigits = (value: string): string => {
  const native = NATIVE_DIGITS[currentLocaleId()];
  return native === undefined ? value : value.replace(/[0-9]/g, (digit) => native[Number(digit)]);
};
