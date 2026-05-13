const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  "native.ts",
  "native.tsx",
  ...config.resolver.sourceExts,
];

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
