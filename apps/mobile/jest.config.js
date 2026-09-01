module.exports = {
  preset: '@react-native/jest-preset',
  // react-native-ble-plx (and its BLE-adapter deps) ship untranspiled ESM
  // source in node_modules — the default preset only transforms RN's own
  // packages, so without this the test suite fails on the first `export`
  // it hits, pre-existing and unrelated to any test's own code.
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native[\\w-]*|react-native-ble-plx|react-native-safe-area-context|react-native-get-random-values)/)',
  ],
};
