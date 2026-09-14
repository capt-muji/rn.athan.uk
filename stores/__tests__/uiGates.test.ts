/**
 * The splash gates, the resume counter and the What's New flag in stores/ui.ts
 *
 * The splash holds until the Masjid icon has loaded and, in Ramadan, every decoration sprite, so each loader must
 * open only its own gate: a crossed write reveals a half-drawn first frame. The gates last one launch, so the next
 * launch waits again. The sound list mounts once the settings sheet first opens. The resume counter must move on
 * every foreground, since the animation mappers that snap on resume re-run only when it changes. And raising the
 * What's New modal must never raise the update prompt with it.
 */

import { getDefaultStore } from 'jotai';

import * as Database from '@/stores/database';
import {
  bumpResync,
  decorationsLoadedAtom,
  markDecorationsLoaded,
  markMasjidIconLoaded,
  masjidIconLoadedAtom,
  popupUpdateEnabledAtom,
  popupWhatsNewEnabledAtom,
  resyncAtom,
  setPopupWhatsNewEnabled,
  setSoundListReady,
  soundListReadyAtom,
} from '@/stores/ui';

const store = getDefaultStore();

const GATES = [
  { gate: 'the Masjid icon', open: markMasjidIconLoaded, atom: masjidIconLoadedAtom },
  { gate: 'the decoration sprites', open: markDecorationsLoaded, atom: decorationsLoadedAtom },
  { gate: 'the sound list', open: setSoundListReady, atom: soundListReadyAtom },
];

const gateStates = () => GATES.map(({ atom }) => store.get(atom));

beforeEach(() => {
  Database.database.clearAll();
  for (const { atom } of GATES) store.set(atom, false);
  store.set(resyncAtom, 0);
  store.set(popupWhatsNewEnabledAtom, false);
  store.set(popupUpdateEnabledAtom, false);
});

describe('the one-way launch gates', () => {
  it.each(GATES.map((entry, position) => ({ ...entry, position })))(
    'opening $gate opens that gate alone, keeps it open when opened again, and stores nothing for the next launch',
    ({ open, position }) => {
      const expected = GATES.map((_, index) => index === position);

      open();
      expect(gateStates()).toEqual(expected);

      open();
      expect(gateStates()).toEqual(expected);

      expect(Database.database.getAllKeys()).toEqual([]);
    }
  );
});

describe('bumpResync', () => {
  it('moves the counter on by one on every foreground, telling a subscribed mapper each time', () => {
    const seen: number[] = [];
    const unsubscribe = store.sub(resyncAtom, () => seen.push(store.get(resyncAtom)));

    bumpResync();
    bumpResync();
    bumpResync();

    expect(seen).toEqual([1, 2, 3]);
    unsubscribe();
  });

  it('counts on from wherever the counter stands', () => {
    store.set(resyncAtom, 41);

    bumpResync();

    expect(store.get(resyncAtom)).toBe(42);
  });
});

describe('setPopupWhatsNewEnabled', () => {
  it('raises and dismisses What’s New without touching the update prompt', () => {
    setPopupWhatsNewEnabled(true);
    expect([store.get(popupWhatsNewEnabledAtom), store.get(popupUpdateEnabledAtom)]).toEqual([true, false]);

    store.set(popupUpdateEnabledAtom, true);
    setPopupWhatsNewEnabled(false);
    expect([store.get(popupWhatsNewEnabledAtom), store.get(popupUpdateEnabledAtom)]).toEqual([false, true]);
  });
});
