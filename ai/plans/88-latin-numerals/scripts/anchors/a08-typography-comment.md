
/** One record per shipped locale: a new language adds its entry here, its numerals to
 * NATIVE_DIGITS in the locale module if it has none of Latin's, and its id to RTL_IDS if it reads right to left */
const RECORDS: Record<LocaleId, LocaleTypography> = {
  en: LATIN,
  ar: ARABIC,
