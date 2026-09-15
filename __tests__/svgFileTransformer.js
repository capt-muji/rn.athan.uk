// Metro compiles every .svg file into a component (react-native-svg-transformer), and Jest has no such step. Each file
// becomes an empty drawing that keeps the props the app passed and carries its own file name, so a test can tell one
// icon from another: `screen.getByTestId('svg:apple')`
const path = require('node:path');

module.exports = {
  process: (_source, filename) => {
    const testID = JSON.stringify(`svg:${path.basename(filename, '.svg')}`);
    return {
      code: [
        "const { createElement } = require('react');",
        "const Svg = require('react-native-svg').default;",
        `const SvgFile = (props) => createElement(Svg, { testID: ${testID}, ...props });`,
        'module.exports = { __esModule: true, default: SvgFile };',
      ].join('\n'),
    };
  },
};
