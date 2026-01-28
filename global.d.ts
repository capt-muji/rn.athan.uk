declare module '*.ttf';
declare module '*.svg' {
  import { StyleProp, TextStyle } from 'react-native';
  import { SvgProps } from 'react-native-svg';
  interface CustomSvgProps extends SvgProps {
    style?: StyleProp<TextStyle>;
  }
  const content: React.FC<CustomSvgProps>;
  export default content;
}

declare module '@env' {
  export const EXPO_PUBLIC_ENV: string;
  export const EXPO_PUBLIC_API_KEY: string;
}
