const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block temporary directories created by expo-notifications post-install scripts.
// These directories are created and immediately deleted during pnpm install;
// Metro's FallbackWatcher must not attempt to watch them.
const defaultBlockList = config.resolver.blockList ?? [];
const blockListArr = Array.isArray(defaultBlockList)
  ? defaultBlockList
  : [defaultBlockList];

config.resolver.blockList = [
  ...blockListArr,
  /.*\/expo-notifications_tmp_\d+\/.*/,
];

module.exports = config;
