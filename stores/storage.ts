import { atomWithStorage } from 'jotai/utils';

import { database } from '@/stores/database';

const defaultOpts = { getOnInit: true };

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
