/**
 * Overlay atom - extracted to break circular dependency
 * between stores/overlay.ts and stores/countdown.ts
 *
 */

import { type Atom, atom } from 'jotai';

import { type OverlayStore, ScheduleType } from '@/shared/types';

/**
 * Overlay state atom
 *
 * Tracks whether the full-screen prayer overlay is visible,
 * which prayer is selected, and which schedule type is active.
 *
 * @property isOn - Whether overlay is currently visible
 * @property selectedPrayerIndex - Index of selected prayer in schedule
 * @property scheduleType - Current schedule type (Standard or Extra)
 */
export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});

/**
 * Whether the overlay family's most recent fade has truly settled.
 *
 * One flag for every subtree the overlay holds displayable through a fade —
 * the input layer, the explanation box, the hidden rows, the ago badge. The
 * writers of `isOn` drop it in the same store batch as their flip, so every
 * held subtree re-renders once with the state change itself; the layer's own
 * fade raises it again from the ANIMATION's completion (never a wall timer:
 * a timer phase-locked to the JS call fires before a commit-stalled fade has
 * finished and cuts it mid-travel — the 3T's close-path snap, step 10's
 * Defect B). Display rules read it as:
 *
 *   layer, explanation box:  isOn || !settled  ? 'flex' : 'none'
 *   hidden rows, ago badge:  hidden && settled ? 'none' : 'flex'
 *
 * True at rest: nothing is in flight.
 */
export const overlayFadeSettledAtom = atom(true);

/**
 * The overlay family's fade generation. Every isOn writer stamps the next
 * number beside its fade-hold drop, and a settle only counts while it carries
 * the generation of the fade still in flight: without that, the open fade's
 * completion — posted to the JS thread while the close tap's handler already
 * ran — would raise the hold over the whole close fade and cut the layer to
 * display:none at close-start, the hold-then-snap the shared flag exists to
 * kill.
 */
let fadeGeneration = 0;

/** Stamped by every isOn writer, in the same store batch as its fade-hold drop */
export const nextFadeGeneration = (): number => {
  fadeGeneration += 1;
  return fadeGeneration;
};

/** The generation of the fade in flight, read by the render that starts it */
export const currentFadeGeneration = (): number => fadeGeneration;

/**
 * Derived boolean: whether the overlay is open
 *
 * Primitive-valued so overlay toggles re-render only components that care
 * about openness — not every subscriber of the full overlay object.
 */
export const overlayIsOnAtom = atom((get) => get(overlayAtom).isOn);

/**
 * Derived per-row selection atoms: whether THIS prayer row is the one
 * highlighted by the open overlay (Prayer/Time/Alert all animate on it).
 *
 * Bounded key space (schedule rows are fixed), so atoms are cached at module
 * level — a toggle re-renders only the rows whose selection actually flipped.
 */
const selectedAtoms = new Map<string, Atom<boolean>>();

export const getOverlaySelectedAtom = (type: ScheduleType, index: number): Atom<boolean> => {
  const key = `${type}:${index}`;
  const cached = selectedAtoms.get(key);
  if (cached) return cached;

  const selectedAtom: Atom<boolean> = atom((get) => {
    const overlay = get(overlayAtom);
    return overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type;
  });
  selectedAtoms.set(key, selectedAtom);
  return selectedAtom;
};

const activeForTypeAtoms = new Map<ScheduleType, Atom<boolean>>();

/**
 * Derived per-schedule overlay-active boolean (ADR-014): whether the open
 * overlay highlights a prayer on THIS schedule. Lets schedule-scoped
 * components (e.g. Day) subscribe without re-rendering on every overlay
 * write — the other schedule's instance never flips.
 */
export const getOverlayActiveForTypeAtom = (type: ScheduleType): Atom<boolean> => {
  const cached = activeForTypeAtoms.get(type);
  if (cached) return cached;

  const activeAtom: Atom<boolean> = atom((get) => {
    const overlay = get(overlayAtom);
    return overlay.isOn && overlay.scheduleType === type;
  });
  activeForTypeAtoms.set(type, activeAtom);
  return activeAtom;
};

const selectedIndexForTypeAtoms = new Map<ScheduleType, Atom<number>>();

/**
 * Derived per-schedule selected index (ADR-014): the overlay's
 * selectedPrayerIndex when active on THIS schedule, 0 otherwise. Emits only
 * when the value actually changes — schedule-scoped consumers re-render on
 * open/close/selection-advance only.
 */
export const getOverlaySelectedIndexForTypeAtom = (type: ScheduleType): Atom<number> => {
  const cached = selectedIndexForTypeAtoms.get(type);
  if (cached) return cached;

  const indexAtom: Atom<number> = atom((get) => {
    const overlay = get(overlayAtom);
    return overlay.isOn && overlay.scheduleType === type ? overlay.selectedPrayerIndex : 0;
  });
  selectedIndexForTypeAtoms.set(type, indexAtom);
  return indexAtom;
};

const hiddenAtoms = new Map<string, Atom<boolean>>();

/**
 * Derived per-row hidden atoms (ADR-014 per-element): whether THIS row is
 * veiled by the open overlay — non-selected rows fade themselves out.
 *
 * Bounded key space, module-cached like the selected atoms: a toggle
 * re-renders only the rows whose visibility actually flipped (the selected
 * row's hidden state is false before and after — no re-render). Schedule-
 * gated so the off-screen page's rows stay cold.
 */
export const getOverlayHiddenAtom = (type: ScheduleType, index: number): Atom<boolean> => {
  const key = `${type}:${index}`;
  const cached = hiddenAtoms.get(key);
  if (cached) return cached;

  const hiddenAtom: Atom<boolean> = atom((get) => {
    const overlay = get(overlayAtom);
    return overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== index;
  });
  hiddenAtoms.set(key, hiddenAtom);
  return hiddenAtom;
};
