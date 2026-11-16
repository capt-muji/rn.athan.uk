/**
 * Pager atom - the page the pager is showing, as one atom so the overlay
 * store can read it without importing the navigation tree
 */

import { atom } from 'jotai';

import { ScheduleType } from '@/shared/types';

/**
 * The page the pager has settled on, written at the snap (the pager's own
 * pageSelected event): 0 Standard, 1 Extras
 */
export const pagerPageAtom = atom(0);

/**
 * The schedule a pager position shows. The pager's pages are fixed, so the
 * mapping is total: position 0 is Standard, every other position Extra
 */
export const pageSchedule = (position: number): ScheduleType =>
  position === 0 ? ScheduleType.Standard : ScheduleType.Extra;
