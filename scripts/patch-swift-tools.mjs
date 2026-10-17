#!/usr/bin/env node
/**
 * Patch SwiftPM Package.swift manifests and Swift/C++ sources in node_modules to match Xcode 16.x (Swift tools version 6.0).
 * Aligns swift-tools-version to 6.0, removes trailing commas in argument lists (SE-0437, requires Swift 6.2),
 * patches Swift 6.2-only constructs (weak let, Escapable, CppError library evolution, actor isolation, Task.immediate)
 * and provides C++ static factories / move helpers for foreign reference and move-only types
 * (RuntimeScheduler, HostFunctionClosure, HostObjectCallbacks::addPropNameId)
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

// 3. Patch HostFunctionClosure.h for Xcode 16.x (Swift 6.0 immortal reference static factory)
const hostFunctionClosureHeader = join(
  process.cwd(),
  'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/HostFunctionClosure.h'
);
if (existsSync(hostFunctionClosureHeader)) {
  const original = readFileSync(hostFunctionClosureHeader, 'utf8');
  let content = original;

  if (!content.includes('static HostFunctionClosure *create')) {
    content = content.replace(
      /explicit HostFunctionClosure\(Context context, Closure closure, Deallocator deallocator\)[\s\S]+?\};/,
      `explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator), _closure(closure) {}\n\n  static HostFunctionClosure *create(Context context, Closure closure, Deallocator deallocator) {\n    return new HostFunctionClosure(context, closure, deallocator);\n  }`
    );
  }

  if (content !== original) {
    writeFileSync(hostFunctionClosureHeader, content, 'utf8');
    console.log('[patch-swift-tools] Successfully patched HostFunctionClosure.h for Xcode 16.x C++/Swift compatibility.');
  }
}

// 4. Patch HostObjectCallbacks.h for Xcode 16.x (C++ move helper for vector push_back)
const hostObjectCallbacksHeader = join(
  process.cwd(),
  'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/HostObjectCallbacks.h'
);
if (existsSync(hostObjectCallbacksHeader)) {
  const original = readFileSync(hostObjectCallbacksHeader, 'utf8');
  let content = original;

  if (!content.includes('static inline void addPropNameId')) {
    content = content.replace(
      'using PropNameIds = std::vector<facebook::jsi::PropNameID>;',
      `using PropNameIds = std::vector<facebook::jsi::PropNameID>;\n\n  static inline void addPropNameId(PropNameIds &vector, facebook::jsi::PropNameID propNameId) {\n    vector.push_back(std::move(propNameId));\n  }\n\n  static inline void addPropNameId(PropNameIds &vector, facebook::jsi::IRuntime &runtime, const std::string &name) {\n    vector.push_back(facebook::jsi::PropNameID::forUtf8(runtime, name));\n  }`
    );
  }

  if (content !== original) {
    writeFileSync(hostObjectCallbacksHeader, content, 'utf8');
    console.log('[patch-swift-tools] Successfully patched HostObjectCallbacks.h for Xcode 16.x C++/Swift compatibility.');
  }
}

// 5. Disable precompiled XCFrameworks in expo-modules-autolinking (so Expo modules build from source on Xcode 16.x)
const precompiledModulesRb = join(
  process.cwd(),
  'node_modules/expo-modules-autolinking/scripts/ios/precompiled_modules.rb'
);
if (existsSync(precompiledModulesRb)) {
  const original = readFileSync(precompiledModulesRb, 'utf8');
  let content = original;
  if (!content.includes('def enabled?\n        false\n      end')) {
    content = content.replace(/def enabled\?[\s\S]+?end\b/, 'def enabled?\n        false\n      end');
  }
  if (content !== original) {
    writeFileSync(precompiledModulesRb, content, 'utf8');
    console.log('[patch-swift-tools] Disabled precompiled modules in precompiled_modules.rb for Xcode 16.x compatibility.');
  }
}

// 6. Patch Swift sources in expo-modules-jsi and other expo modules for Swift 6.0 compatibility
const dirsToPatch = [
  join(process.cwd(), 'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI'),
  join(process.cwd(), 'node_modules/expo-modules-core/ios'),
];
const nodeModulesDir = join(process.cwd(), 'node_modules');
if (existsSync(nodeModulesDir)) {
  for (const pkg of readdirSync(nodeModulesDir)) {
    if (pkg.startsWith('expo-') || pkg === 'expo') {
      const iosSubdir = join(nodeModulesDir, pkg, 'ios');
      if (existsSync(iosSubdir) && !dirsToPatch.includes(iosSubdir)) {
        dirsToPatch.push(iosSubdir);
      }
    }
  }
}

function patchDir(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        patchDir(full);
      } else if (entry.name.endsWith('.swift')) {
        const original = readFileSync(full, 'utf8');
        let content = original;

        // a) Convert "weak let" -> "nonisolated(unsafe) weak var" for Sendable compatibility in Swift 6.0
        content = content.replace(
          /(?<!nonisolated\(unsafe\)\s+)(private|internal)\s+(?:weak\s+let|weak\s+var)\s+runtime/g,
          'nonisolated(unsafe) $1 weak var runtime'
        );
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
            /public static func assumeIsolated<T(?:: ~Copyable)?\>[\s\S]+?return runner\(\)/g,
            `public static func assumeIsolated<T>(_ operation: @JavaScriptActor () -> T) -> T {
    checkIsolated()
    return withoutActuallyEscaping(operation) { fn in
      let nonisolatedFn = unsafeBitCast(fn, to: (() -> T).self)
      return nonisolatedFn()
    }`
          );
          content = content.replace(
            /public static func assumeIsolated<T(?:: ~Copyable)?\>[\s\S]+?return runner\(operation\)/g,
            `public static func assumeIsolated<T>(_ operation: @JavaScriptActor () -> T) -> T {
    checkIsolated()
    return withoutActuallyEscaping(operation) { fn in
      let nonisolatedFn = unsafeBitCast(fn, to: (() -> T).self)
      return nonisolatedFn()
    }`
          );
          content = content.replace(
            /public static func assumeIsolated<T: ~Copyable,\s*E: Error>/g,
            'public static func assumeIsolated<T, E: Error>'
          );
          content = content.replace(
            /internal static func runIsolated<T: ~Copyable>/g,
            'internal static func runIsolated<T>'
          );
        }

        // f) Fix Task+immediate.swift (Task.immediate and name: parameter require Swift 6.2)
        if (entry.name === 'Task+immediate.swift') {
          content = content.replace(
            /if #available\(macOS 26[\s\S]+?return Task\(name: name, priority: \.high, operation: operation\)\s*\}/,
            'return Task(priority: .high, operation: operation)'
          );
        }

        // g) Fix JavaScriptRuntime.swift
        if (entry.name === 'JavaScriptRuntime.swift') {
          // Fix push_back of move-only PropNameID by delegating to C++ addPropNameId helper
          content = content.replace(
            /for propertyName in propertyNames \{[\s\S]+?vector\.push_back\([^\)]+\)\s*\}/,
            `for propertyName in propertyNames {\n        expo.HostObjectCallbacks.addPropNameId(&vector, iRuntime, std.string(propertyName))\n      }`
          );
          // Fix HostFunctionClosure initializer call to use static factory
          content = content.replace(
            /expo\.HostFunctionClosure\(context, call, deallocate\)/g,
            'expo.HostFunctionClosure.create(context, call, deallocate)'
          );
          // Fix createClass constructor passing (avoids 'arguments is borrowed and cannot be consumed' in Swift 6.0)
          content = content.replace(
            /public func createClass\(\s*name: String,\s*inheriting baseClass: consuming JavaScriptFunction\? = nil,\s*_ constructor: @escaping SyncFunctionClosure\s*\)/,
            'public func createClass(\n    name: String, inheriting baseClass: consuming JavaScriptFunction? = nil,\n    _ constructor: sending @escaping SyncFunctionClosure\n  )'
          );
          content = content.replace(
            /let nativeConstructor = createFunction\(name\) \{ this, arguments in\s*return try constructor\(this, arguments\)\s*\}/,
            'let nativeConstructor = createFunction(name, constructor)'
          );
        }

        // h) Fix JavaScriptObject.swift (~Copyable delegating initializer triggers Swift 6.0 compiler bug)
        if (entry.name === 'JavaScriptObject.swift') {
          content = content.replace(
            /public\s+init\(_\s+runtime:\s+JavaScriptRuntime\)\s*\{\s*self\.init\(runtime,\s*facebook\.jsi\.Object\(runtime\.pointee\)\)\s*\}/,
            `public init(_ runtime: JavaScriptRuntime) {\n    self.runtime = runtime\n    self.pointee = facebook.jsi.Object(runtime.pointee)\n  }`
          );
        }

        // i) Fix JavaScriptArray.swift (~Copyable delegating initializers trigger Swift 6.0 compiler bug)
        if (entry.name === 'JavaScriptArray.swift') {
          content = content.replace(
            /public\s+init\(_\s+runtime:\s+JavaScriptRuntime,\s*length:\s*Int\s*=\s*0\)\s*\{\s*self\.init\(runtime,\s*facebook\.jsi\.Array\(runtime\.pointee,\s*length\)\)\s*\}/,
            `public init(_ runtime: JavaScriptRuntime, length: Int = 0) {\n    self.runtime = runtime\n    self.pointee = facebook.jsi.Array(runtime.pointee, length)\n  }`
          );
          content = content.replace(
            /public\s+init\(_\s+runtime:\s+JavaScriptRuntime,\s*items:\s*\[JavaScriptValue\]\)\s*\{\s*self\.init\(runtime,\s*length:\s*items\.count\)/,
            `public init(_ runtime: JavaScriptRuntime, items: [JavaScriptValue]) {\n    self.runtime = runtime\n    self.pointee = facebook.jsi.Array(runtime.pointee, items.count)`
          );
          content = content.replace(
            /public\s+init\(_\s+runtime:\s+JavaScriptRuntime,\s*items:\s*JavaScriptValue\.\.\.\)\s*\{\s*self\.init\(runtime,\s*items:\s*items\)\s*\}/,
            `public init(_ runtime: JavaScriptRuntime, items: JavaScriptValue...) {\n    self.runtime = runtime\n    self.pointee = facebook.jsi.Array(runtime.pointee, items.count)\n\n    for (i, item) in items.enumerated() {\n      self[i] = item\n    }\n  }`
          );
          content = content.replace(
            /self\.init\(runtime,\s*length:\s*length\)/,
            `self.runtime = runtime\n    self.pointee = facebook.jsi.Array(runtime.pointee, length)`
          );
        }

        // j) Fix JavaScriptPromise.swift (~Copyable delegating initializer triggers Swift 6.0 compiler bug)
        if (entry.name === 'JavaScriptPromise.swift') {
          content = content.replace(
            /@JavaScriptActor\s*internal\s+init\(_\s+runtime:\s+JavaScriptRuntime,\s*_\s+object:\s+consuming\s+facebook\.jsi\.Object\)\s*throws\s*\{\s*try\s+self\.init\(runtime,\s*JavaScriptObject\(runtime,\s*object\)\)\s*\}/,
            `@JavaScriptActor\n  internal init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.Object) throws {\n    self.runtime = runtime\n    longLivedState.object.reset(JavaScriptValue(runtime, facebook.jsi.Value(runtime.pointee, object)))\n    try setUpCallbacks()\n    runtime.longLivedObjects.add(longLivedState)\n  }`
          );
        }

        if (content !== original) {
          writeFileSync(full, content, 'utf8');
        }
      }
    }
  }

for (const dir of dirsToPatch) {
  patchDir(dir);
}
