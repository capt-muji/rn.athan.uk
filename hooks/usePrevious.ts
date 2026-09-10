import { useEffect, useRef } from 'react';

/**
 * Previous-render value, read during render so a one-shot transition (the list
 * date roll) can drive a derived stagger without an effect writing a target.
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
