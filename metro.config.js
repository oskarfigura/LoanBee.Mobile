const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const exclusionList = require(
  path.join(
    path.dirname(require.resolve('metro-config/package.json')),
    'src/defaults/exclusionList',
  ),
).default;

const config = getDefaultConfig(__dirname);

config.resolver.blockList = exclusionList([
  /android\/.*\/build\/.*/,
  /ios\/build\/.*/,
]);

module.exports = config;
