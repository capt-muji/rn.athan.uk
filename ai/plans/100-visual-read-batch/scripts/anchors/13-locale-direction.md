/** Every shipped locale that reads right to left; a new RTL language joins this set and every
 * direction-keyed surface follows without further code */
const RTL_IDS: ReadonlySet<LocaleId> = new Set(['ar']);

export const localeDirection = (id: LocaleId): 'ltr' | 'rtl' => (RTL_IDS.has(id) ? 'rtl' : 'ltr');

/** A glyph that points with the reading direction: the LTR form under LTR, the RTL form under RTL.
 * Reads the live locale at call time, so it follows a switch without a reload */
export const directionGlyph = (ltr: string, rtl: string): string =>
  localeDirection(currentLocaleId()) === 'rtl' ? rtl : ltr;
