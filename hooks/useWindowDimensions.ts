import { useMemo } from 'react';
import { Dimensions } from 'react-native';

/**
 * Hook for accessing window dimensions
 *
 * Returns memoized window dimensions to prevent unnecessary recalculations.
 * Dimensions are captured once at mount time.
 *
 * @returns Window dimensions object with width and height
 *
 * @example
 * const { width, height } = useWindowDimensions();
 */
export const useWindowDimensions = () => {
  return useMemo(() => Dimensions.get('window'), []);
};
