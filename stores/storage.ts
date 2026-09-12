/**
 * Storage atom factories for Jotai with MMKV persistence
 *
 * These factories create atoms that automatically sync with MMKV storage.
 * Values are loaded on initialization (getOnInit: true).
 *
 * THE RULE: never write MMKV behind one of these atoms. `getOnInit: true` reads
 * storage once, at atom creation, which is module evaluation. `onMount` re-reads
 * only when React subscribes, so an atom no component renders keeps that first
 * snapshot for the life of the process. A `database.set` or `database.remove` on
 * the key is therefore invisible to every `store.get` of the atom that fronts
 * it. Use `resetStoredAtom` to change a persisted value from outside React.
 */

import type { WritableAtom } from 'jotai';
import { atomWithStorage, RESET } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import logger from '@/shared/logger';
import { database } from '@/stores/database';

const defaultOpts = { getOnInit: true };

/** What the factories below return: writable, and accepting RESET. */
type StoredAtom<Value> = WritableAtom<Value, [Value | typeof RESET], void>;

/**
 * Clears a persisted atom from outside React: removes the stored key AND puts
 * the atom back to its initial value, so the next `store.get` sees the change.
 *
 * This is the only sanctioned way to reset a persisted value outside React. See
 * THE RULE above for why removing the key on its own does nothing.
 *
 * @param atom Atom from one of the factories in this file
 * @param key The MMKV key it is backed by, for the log
 *
 * @example
 * resetStoredAtom(lastNotificationScheduleAtom, 'preference_last_notification_schedule_check');
 */
export const resetStoredAtom = <Value>(atom: StoredAtom<Value>, key: string): void => {
  // Resolved on use, not at module scope: this file is near the root of the
  // import graph and creating the default store here would move when every
  // other module's `getDefaultStore()` resolves. The call is memoised by jotai.
  getDefaultStore().set(atom, RESET);
  logger.info('STORAGE: Reset persisted atom', { key });
};

/**
 * Creates a Jotai atom backed by MMKV storage for number values
 * @param key Storage key
 * @param initialValue Default value if not found in storage
 * @returns Jotai atom with MMKV persistence
 */
export const atomWithStorageNumber = (key: string, initialValue: number) =>
  atomWithStorage(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => {
        const value = database.getString(key);
        return value === undefined ? initialValue : Number(value);
      },
      setItem: (key, value) => database.set(key, value.toString()),
      removeItem: (key) => database.remove(key),
    },
    defaultOpts
  );

/**
 * Creates a Jotai atom backed by MMKV storage for boolean values
 * @param key Storage key
 * @param initialValue Default value if not found in storage
 * @returns Jotai atom with MMKV persistence
 */
export const atomWithStorageBoolean = (key: string, initialValue: boolean) =>
  atomWithStorage(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => {
        const value = database.getBoolean(key);
        return value === undefined ? initialValue : value;
      },
      setItem: (key, value) => database.set(key, value),
      removeItem: (key) => database.remove(key),
    },
    defaultOpts
  );

/**
 * Creates a Jotai atom backed by MMKV storage for string values
 * @param key Storage key
 * @param initialValue Default value if not found in storage
 * @returns Jotai atom with MMKV persistence
 */
export const atomWithStorageString = (key: string, initialValue: string) =>
  atomWithStorage(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => {
        const value = database.getString(key);
        return value === undefined ? initialValue : value;
      },
      setItem: (key, value) => database.set(key, value),
      removeItem: (key) => database.remove(key),
    },
    defaultOpts
  );
