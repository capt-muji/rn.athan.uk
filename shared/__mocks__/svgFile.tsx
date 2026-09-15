import Svg, { type SvgProps } from 'react-native-svg';

/** Jest has no SVG transformer, so an imported icon draws nothing, but keeps the props the app gave it for a test to read */
export default function SvgFile(props: SvgProps) {
  return <Svg {...props} />;
}
