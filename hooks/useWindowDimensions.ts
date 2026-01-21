import { useMemo } from 'react';
import { Dimensions } from 'react-native';

export const useWindowDimensions = () => {
  return useMemo(() => Dimensions.get('window'), []);
};
