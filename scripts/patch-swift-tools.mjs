#!/usr/bin/env node
/**
 * Patch SwiftPM Package.swift manifests and Swift/C++ sources in node_modules to match Xcode 16.x (Swift tools version 6.0).
 * Aligns swift-tools-version to 6.0, removes trailing commas in argument lists (SE-0437, requires Swift 6.2),
 * patches Swift 6.2-only constructs (weak let, Escapable, CppError library evolution, actor isolation)
 * so that ExpoModulesJSI builds cleanly on Xcode 16.2 / Swift 6.0.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// 1. Package.swift manifests
const filesToPatch = [
  'node_modules/expo-modules-jsi/apple/Package.swift',
  'node_modules/@expo/expo-modules-macros-plugin/apple/Package.swift',
];

for (const rel of filesToPatch) {
  const full = join(process.cwd(), rel);
  if (existsSync(full)) {
    const original = readFileSync(full, 'utf8');
    let content = original;

    // 1. Lower swift-tools-version: 6.2 -> 6.0 for Xcode 16.x compatibility
    if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
      content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
    }

    // 2. Remove trailing commas in argument lists
    content = content.replace(/,(\s*[\)\]])/g, '$1');

    if (content !== original) {
      writeFileSync(full, content, 'utf8');
      console.log(`[patch-swift-tools] Successfully patched ${rel} for Swift 6.0 compatibility.`);
    }
  }
}

// 2. Patch RuntimeScheduler.h for Xcode 16.x (Swift 6.0 / Clang C++ interop)
const runtimeSchedulerHeader = join(
  process.cwd(),
  'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h'
);
if (existsSync(runtimeSchedulerHeader)) {
  const original = readFileSync(runtimeSchedulerHeader, 'utf8');
  let content = original;

  // Ensure fallback definition exists after <swift/bridging>
  if (!content.includes('#ifndef SWIFT_RETURNS_RETAINED')) {
    content = content.replace(
      '#include <swift/bridging>',
      '#include <swift/bridging>\n\n#ifndef SWIFT_RETURNS_RETAINED\n#define SWIFT_RETURNS_RETAINED\n#endif'
    );
  }

  // Remove the keyword from create method signatures where Clang in Xcode 16 fails to parse it
  content = content.replace(/(static RuntimeScheduler \*create[^{]+?)\s*\bSWIFT_RETURNS_RETAINED\s*/g, '$1 ');

  if (content !== original) {
    writeFileSync(runtimeSchedulerHeader, content, 'utf8');
    console.log('[patch-swift-tools] Successfully patched RuntimeScheduler.h for Xcode 16.x C++/Swift compatibility.');
  }
}

// 3. Patch Swift sources in expo-modules-jsi for Swift 6.0 compatibility
const jsiSourcesDir = join(process.cwd(), 'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI');
if (existsSync(jsiSourcesDir)) {
  function patchDir(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        patchDir(full);
      } else if (entry.name.endsWith('.swift')) {
        const original = readFileSync(full, 'utf8');
        let content = original;

        // a) Convert "weak let" -> "weak var" (weak let requires Swift 6.2+)
        content = content.replace(/\bweak\s+let\b/g, 'weak var');

        // b) Remove trailing commas before closing paren / bracket
        content = content.replace(/,(\s*[\)\]])/g, '$1');

        // c) Remove ", Escapable" protocol conformance (classes are already escapable in Swift)
        content = content.replace(/,\s*Escapable\b/g, '');

        // d) Fix CppError extension in JavaScriptError.swift (public extension on C++ struct under library evolution)
        if (entry.name === 'JavaScriptError.swift') {
          content = content.replace(/public\s+var\s+message:\s*String/g, 'internal var message: String');
        }

        // e) Fix JavaScriptActor.assumeIsolated in JavaScriptActor.swift
        if (entry.name === 'JavaScriptActor.swift') {
          content = content.replace(
            /let runner = unsafeBitCast\(runIsolated as IsolatedRunner, to: NonisolatedRunner\.self\)\s+return runner\(operation\)/g,
            'typealias NonisolatedOp = () -> T\n    let runner = unsafeBitCast(operation, to: NonisolatedOp.self)\n    return runner()'
          );
        }

        if (content !== original) {
          writeFileSync(full, content, 'utf8');
          console.log(`[patch-swift-tools] Patched ${entry.name} for Swift 6.0 compatibility.`);
        }
      }
    }
  }
  patchDir(jsiSourcesDir);
}
