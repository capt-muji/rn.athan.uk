/**
 * expo-localization under Jest: the en-US device the package's own published mock
 * reports, so locale resolution answers the same in both projects and no suite
 * depends on the machine's language
 */

export interface MockLocaleInfo {
  languageTag: string;
  languageCode: string;
  languageScriptCode: string;
  regionCode: string;
  languageRegionCode: string;
  currencyCode: string;
  currencySymbol: string;
  languageCurrencyCode: string;
  languageCurrencySymbol: string;
  decimalSeparator: string;
  digitGroupingSeparator: string;
  textDirection: 'ltr' | 'rtl';
  measurementSystem: string;
  temperatureUnit: string;
}

const EN_US: MockLocaleInfo = {
  languageTag: 'en-US',
  languageCode: 'en',
  languageScriptCode: 'Latn',
  regionCode: 'US',
  languageRegionCode: 'US',
  currencyCode: 'USD',
  currencySymbol: '$',
  languageCurrencyCode: 'USD',
  languageCurrencySymbol: '$',
  decimalSeparator: '.',
  digitGroupingSeparator: ',',
  textDirection: 'ltr',
  measurementSystem: 'us',
  temperatureUnit: 'fahrenheit',
};

/** The only call the app makes (shared/i18n/locale.ts) */
export const getLocales = (): MockLocaleInfo[] => [EN_US];
