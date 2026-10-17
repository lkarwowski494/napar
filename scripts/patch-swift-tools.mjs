#!/usr/bin/env node
/**
 * Patch SwiftPM Package.swift manifests in node_modules to match Xcode 16.x (Swift tools version 6.0).
 * Aligns swift-tools-version to 6.0 and removes trailing commas in argument lists (SE-0437, requires Swift 6.2).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const filesToPatch = [
  'node_modules/expo-modules-jsi/apple/Package.swift',
  'node_modules/@expo/expo-modules-macros-plugin/apple/Package.swift',
];

for (const rel of filesToPatch) {
  const full = join(process.cwd(), rel);
  if (existsSync(full)) {
    let content = readFileSync(full, 'utf8');
    let modified = false;

    // 1. Lower swift-tools-version: 6.2 -> 6.0 for Xcode 16.x compatibility
    if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
      content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
      modified = true;
    }

    // 2. Remove trailing commas in argument lists (only supported in Swift 6.2+)
    if (/,(\s*\))/.test(content)) {
      content = content.replace(/,(\s*\))/g, '$1');
      modified = true;
    }

    if (modified) {
      writeFileSync(full, content, 'utf8');
      console.log(`[patch-swift-tools] Successfully patched ${rel} for Swift 6.0 compatibility.`);
    }
  }
}
