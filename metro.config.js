const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    '@protobufjs/inquire': path.resolve(__dirname, 'shims/protobufjs-inquire.js'),
  },
};

module.exports = withNativeWind(config, { input: './styles/global.css' });
