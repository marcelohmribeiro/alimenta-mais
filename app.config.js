const appJson = require('./app.json');

module.exports = ({ config }) => {
  const baseConfig = appJson.expo ?? config;
  const isEasBuild = process.env.EAS_BUILD === 'true' || Boolean(process.env.EAS_BUILD_PROFILE);
  const { updates: baseUpdates, runtimeVersion, ...restConfig } = baseConfig;

  const updates = isEasBuild
    ? baseUpdates
    : (() => {
        const { url, ...restUpdates } = baseUpdates ?? {};
        return { ...restUpdates, enabled: false };
      })();

  return {
    ...restConfig,
    ...(isEasBuild ? { runtimeVersion } : {}),
    ...(updates ? { updates } : {}),
  };
};
