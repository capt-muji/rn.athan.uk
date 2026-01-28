/**
 * Storage atom factories for Jotai with MMKV persistence
 *
 * These factories create atoms that automatically sync with MMKV storage.
 * Values are loaded on initialization (getOnInit: true).
 */

import { atomWithStorage } from 'jotai/utils';

import { database } from '@/stores/database';

const defaultOpts = { getOnInit: true };

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
