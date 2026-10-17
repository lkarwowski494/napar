#!/usr/bin/env node
/**
 * Patch SwiftPM Package.swift manifests in node_modules to match Xcode 16.x (Swift tools version 6.0).
 * Prevents: "package 'apple' is using Swift tools version 6.2.0 but the installed version is 6.0.0"
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
    if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
      content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
      writeFileSync(full, content, 'utf8');
      console.log(`[patch-swift-tools] Patched ${rel} -> swift-tools-version: 6.0`);
    }
  }
}
