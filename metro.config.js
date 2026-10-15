// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// three's CommonJS entry (what react-three-fiber requires) calls
// process.emitWarning, which doesn't exist in React Native and crashes on
// load. Always resolve `three` to its ES module build instead, which also
// keeps a single copy of three in the bundle.
const threeModule = path.join(__dirname, 'node_modules/three/build/three.module.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: threeModule };
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
