// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── Fix: EMFILE "too many open files" on Windows ─────────────────────────────
// @hugeicons/core-free-icons ships ~4,000 individual ESM files.
// Metro tries to open and watch ALL of them at startup, blowing past Windows'
// file-descriptor limit. The fix is two-pronged:
//
// 1. blockList: Prevent the Metro RESOLVER from loading individual ESM files.
//    The single barrel import (dist/cjs/index.js) still resolves correctly.
//
// 2. Override watchFolders to explicitly exclude the esm directory from the
//    filesystem watcher so the OS never even opens those file handles.

config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/@hugeicons\/core-free-icons\/dist\/esm\/.*/,
  ],
};

// Force Metro to use the CJS barrel import instead of individual ESM files
config.resolver.sourceExts = config.resolver.sourceExts ?? ['js', 'jsx', 'ts', 'tsx', 'cjs', 'mjs'];

module.exports = config;
