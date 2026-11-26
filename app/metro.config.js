// 앱 폴더 밖의 공통 정의(../shared)를 읽도록 Metro에 알린다.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../shared")];

module.exports = config;
