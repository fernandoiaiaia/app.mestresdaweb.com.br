const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.resolver = config.resolver || {};

// Resolve modules from the app's own node_modules only
// This prevents Metro from walking up into the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];

// Stub out react-native-worklets (not needed for Expo Go)
config.resolver.extraNodeModules = {
  "react-native-worklets": path.resolve(projectRoot, "stubs/react-native-worklets"),
};

const { withTamagui } = require("@tamagui/metro-plugin");

const configWithTW = withNativeWind(config, { input: "./global.css" });

module.exports = withTamagui(configWithTW, {
  components: ["tamagui"],
  config: "./tamagui.config.ts",
  outputCSS: "./tamagui-output.css",
});
