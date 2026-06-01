module.exports = ({ config }) => {
  const { runtimeVersion, ...rest } = config;
  return {
    ...rest,
    updates: {
      ...config.updates,
      url: "https://u.expo.dev/301ef7fb-d473-401e-909b-012454d38ee2",
      enabled: true,
    },
    android: {
      ...config.android,
      runtimeVersion: {
        policy: "appVersion",
      },
    },
    ios: {
      ...config.ios,
      runtimeVersion: {
        policy: "appVersion",
      },
    },
  };
};
