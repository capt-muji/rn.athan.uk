// Metro compiles every .svg file into a component (react-native-svg-transformer), and Jest has no such step. Each file
// becomes an empty drawing that keeps the props the app passed and carries its own file name, so a test can tell one
// icon from another: `screen.getByTestId('svg:apple')`
const path = require('node:path');

module.exports = {
  process: (_source, filename) => {
    const name = JSON.stringify(`svg:${path.basename(filename, '.svg')}`);
    return {
      code: [
        "const { createElement } = require('react');",
        "const Svg = require('react-native-svg').default;",
        // A caller passing testID={undefined} would otherwise overwrite the name with undefined
        `const SvgFile = (props) => createElement(Svg, { ...props, testID: props.testID ?? ${name} });`,
        'module.exports = { __esModule: true, default: SvgFile };',
      ].join('\n'),
    };
  },
  // Jest's own cache key covers the .svg file and the config but not this transformer, so without this an edit here
  // would keep serving drawings compiled by the old version
  getCacheKey: require('@jest/create-cache-key-function').default([__filename]),
};
