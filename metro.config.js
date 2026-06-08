const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.tsx', 'web.ts', 'web.js'];

// Block react-native-url-polyfill on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
