const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  // Route every JSX-runtime import through jsx-runtime-shim.ts, which restores
  // global Text defaults (allowFontScaling: false) that React 19 removed with
  // defaultProps. The shim itself resolves the real runtimes via the specifier
  // below to avoid a redirect loop.
  const reactRoot = path.dirname(require.resolve('react/package.json'));
  config.resolver.resolveRequest = (context, request, platform) => {
    const isShim = context.originModulePath?.endsWith('jsx-runtime-shim.ts');

    if (isShim && request.startsWith('athan-jsx-runtime/')) {
      const target = request.endsWith('/dev') ? 'jsx-dev-runtime.js' : 'jsx-runtime.js';
      return context.resolveRequest(context, path.join(reactRoot, target), platform);
    }

    if ((request === 'react/jsx-runtime' || request === 'react/jsx-dev-runtime') && !isShim) {
      return { filePath: path.join(__dirname, 'jsx-runtime-shim.ts'), type: 'sourceFile' };
    }

    return context.resolveRequest(context, request, platform);
  };

  return config;
})();
