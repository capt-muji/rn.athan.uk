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
        return value ? Number(value) : initialValue;
      },
      setItem: (key, value) => database.set(key, value.toString()),
      removeItem: (key) => database.delete(key),
    },
    defaultOpts
  );

export const atomWithStorageBoolean = (key: string, initialValue: boolean) =>
  atomWithStorage(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => database.getBoolean(key) ?? initialValue,
      setItem: (key, value) => database.set(key, value),
      removeItem: (key) => database.delete(key),
    },
    defaultOpts
  );

export const atomWithStorageString = (key: string, initialValue: string) =>
  atomWithStorage(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => database.getString(key) ?? initialValue,
      setItem: (key, value) => database.set(key, value),
      removeItem: (key) => database.delete(key),
    },
    defaultOpts
  );

export const atomWithStorageArray = <T = unknown>(key: string, initialValue: T[]) =>
  atomWithStorage<T[]>(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => {
        const value = database.getString(key);
        return value ? (JSON.parse(value) as T[]) : initialValue;
      },
      setItem: (key, value) => database.set(key, JSON.stringify(value)),
      removeItem: (key) => database.delete(key),
    },
    defaultOpts
  );

export const atomWithStorageObject = <T extends object = Record<string, unknown>>(key: string, initialValue: T) =>
  atomWithStorage<T>(
    key,
    initialValue,
    {
      getItem: (key, initialValue) => {
        const value = database.getString(key);
        return value ? (JSON.parse(value) as T) : initialValue;
      },
      setItem: (key, value) => database.set(key, JSON.stringify(value)),
      removeItem: (key) => database.delete(key),
    },
    defaultOpts
  );
