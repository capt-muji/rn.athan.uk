/**
 * The round-2 fasting selection model (T-623): the owner's spec as code.
 * Four options, six valid sets, at least one always selected. Every day is
 * the default and excludes everything; Muhammad and Dawood exclude each
 * other and Every day; the white days combine with Muhammad and/or Dawood
 * but never with Every day. A tap that would create an invalid set silently
 * unselects the options it conflicts with; tapping the only selected option
 * does nothing. The description speaks the whole selection, its tense
 * following the saved state. Dev-only: nothing shipped imports here.
 */

export type R2Key = 'every' | 'muhammad' | 'dawood' | 'white';

export type R2Mode = 'every' | 'muhammad' | 'dawood';

export interface R2Selection {
  readonly mode: R2Mode | null;
  readonly white: boolean;
}

export const R2_DEFAULT: R2Selection = { mode: 'every', white: false };

const SETS: readonly R2Selection[] = [
  { mode: 'every', white: false },
  { mode: 'muhammad', white: false },
  { mode: 'dawood', white: false },
  { mode: null, white: true },
  { mode: 'muhammad', white: true },
  { mode: 'dawood', white: true },
];

export const r2Same = (a: R2Selection, b: R2Selection): boolean => a.mode === b.mode && a.white === b.white;

/** The catalog's open seed read back to its set; unreadable values open the default */
export const r2Seed = (open: string): R2Selection => {
  const found = SETS.find((one) => one.mode !== null && one.mode === open);
  if (found) return found;
  if (open === 'white') return { mode: null, white: true };
  if (open === 'muhammad+white') return { mode: 'muhammad', white: true };
  if (open === 'dawood+white') return { mode: 'dawood', white: true };
  return R2_DEFAULT;
};

/**
 * The tap rule: conflicting options silently unselect, the only selected
 * option does nothing, and at least one option always stays selected.
 */
export const nextR2Selection = (current: R2Selection, key: R2Key): R2Selection => {
  if (key === 'every') return r2Same(current, R2_DEFAULT) ? current : { mode: 'every', white: false };
  if (key === 'white') {
    if (current.mode === 'every') return { mode: null, white: true };
    if (current.white && current.mode === null) return current;
    return { mode: current.mode, white: !current.white };
  }
  // muhammad and dawood replace each other and Every day, never touching the white days
  const mode: R2Mode = key;
  if (current.mode === mode) {
    return current.white ? { mode: null, white: true } : current;
  }
  return { mode, white: current.white };
};

const R2_TITLES: Record<R2Key, string> = {
  every: 'Every day',
  muhammad: 'Muhammad',
  dawood: 'Dawood',
  white: 'Three white days',
};

const R2_SUBTITLES: Record<R2Key, string> = {
  every: 'Sahur every day',
  muhammad: 'Mondays and Thursdays',
  dawood: 'One day on, one day off',
  white: '13th, 14th and 15th of each Hijri month',
};

export interface R2Option {
  readonly key: R2Key;
  readonly title: string;
  readonly subtitle: string;
}

/** The four options in sheet order: titles first, descriptions second */
export const R2_OPTIONS: readonly R2Option[] = (['every', 'muhammad', 'dawood', 'white'] as const).map((key) => ({
  key,
  title: R2_TITLES[key],
  subtitle: R2_SUBTITLES[key],
}));

const BODY_BY_MODE: Record<R2Mode, string> = {
  every: 'every day',
  muhammad: 'Mondays and Thursdays',
  dawood: 'alternate days, one on and one off',
};

const WHITE_BODY = 'the three white days';

/** The whole current selection in one compact sentence, tense following the saved set */
export const r2Description = (selection: R2Selection, saved: R2Selection): string => {
  const tense = r2Same(selection, saved) ? 'Sahur is scheduled for ' : 'Sahur will be scheduled for ';
  if (selection.mode === null) return `${tense}${WHITE_BODY}.`;
  if (!selection.white) return `${tense}${BODY_BY_MODE[selection.mode]}.`;
  // the owner's own examples: Muhammad joins plainly, Dawood carries the pause
  const join = selection.mode === 'dawood' ? ', and ' : ' and ';
  return `${tense}${BODY_BY_MODE[selection.mode]}${join}${WHITE_BODY}.`;
};
