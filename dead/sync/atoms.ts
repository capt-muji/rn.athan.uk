import { atom } from 'jotai';
import { atomWithStorage, loadable } from 'jotai/utils';

import { refresh } from './actions';
import { mmkvStorage } from '../../stores/core/store';

import { FetchedYears } from '@/shared/types';

/** Atom for storing current date */
export const dateAtom = atomWithStorage('date', '', mmkvStorage, {
  getOnInit: true,
});

/** Atom for tracking fetched years */
export const fetchedYearsAtom = atomWithStorage<FetchedYears>('fetchedYears', {}, mmkvStorage, { getOnInit: true });

/** Loadable atom for initializing prayer data */
export const initialiseLoadable = loadable(atom(async () => refresh()));
