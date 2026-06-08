const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve = config.resolve || {};
  config.resolve.mainFields = ['react-native', 'browser', 'main'];
  config.resolve.conditionNames = ['react-native', 'browser', 'import', 'default'];
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native-url-polyfill/auto': false,
  };

  return config;
};
