const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Focus on mobile platforms only
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;