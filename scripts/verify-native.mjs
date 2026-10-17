#!/usr/bin/env node
/**
 * Weryfikuje wygenerowany projekt natywny iOS (expo prebuild --no-install)
 * na Linuksie, Windowsie lub macOS bez konieczności uruchamiania Xcode.
 * Zgodność z BR-REL-009..013 / Rozdział 12.4 BRD-QA-REL 1.0 oraz RD-ENG-11.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
const appName = appJson.name;
const iosScheme = process.env.IOS_SCHEME || appName.replace(/[^a-zA-Z0-9]/g, '');
const iosDir = join(root, 'ios');
const hadIos = existsSync(iosDir);

const errors = [];
const check = (cond, msg) => {
  if (!cond) errors.push(msg);
};

try {
  // 0. Statyczna walidacja app.json (zawsze działa we wszystkich środowiskach)
  const expectedBundleId = appJson.ios?.bundleIdentifier;
  check(Boolean(expectedBundleId), 'Brak bundleIdentifier w app.json -> expo.ios');
  check(
    appJson.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false,
    'app.json -> expo.ios.infoPlist musi mieć ITSAppUsesNonExemptEncryption: false'
  );

  const ver = appJson.version;
  check(/^\d+\.\d+(\.\d+)?$/.test(ver), `Wersja '${ver}' w app.json musi mieć format X.Y lub X.Y.Z`);

  const forbiddenPermissions = [
    'NSMicrophoneUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysUsageDescription',
    'NSContactsUsageDescription',
    'NSBluetoothAlwaysUsageDescription',
    'NSUserTrackingUsageDescription',
    'NSAppleMusicUsageDescription',
  ];
  for (const perm of forbiddenPermissions) {
    check(!appJson.ios?.infoPlist?.[perm], `app.json zawiera niedozwolone uprawnienie: ${perm}`);
  }

  const manifests = appJson.ios?.privacyManifests;
  check(manifests?.NSPrivacyTracking === false, 'app.json privacyManifests musi mieć NSPrivacyTracking: false');
  const declaredCategories = manifests?.NSPrivacyAccessedAPITypes?.map((t) => t.NSPrivacyAccessedAPIType) || [];
  for (const cat of [
    'NSPrivacyAccessedAPICategoryUserDefaults',
    'NSPrivacyAccessedAPICategoryFileTimestamp',
    'NSPrivacyAccessedAPICategorySystemBootTime',
    'NSPrivacyAccessedAPICategoryDiskSpace',
  ]) {
    check(
      declaredCategories.includes(cat),
      `app.json privacyManifests musi deklarować kategorię Required Reason API: ${cat}`
    );
  }

  // 1. Weryfikacja binarnego nagłówka PNG ikony App Store (RD-ENG-11)
  const iconPath = join(root, 'assets', 'icon.png');
  check(existsSync(iconPath), 'Brak pliku assets/icon.png');
  if (existsSync(iconPath)) {
    const buf = readFileSync(iconPath);
    check(buf.length >= 26, 'Plik assets/icon.png jest zbyt krótki');
    if (buf.length >= 26) {
      const isPng =
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a;
      check(isPng, 'assets/icon.png nie posiada prawidłowej sygnatury PNG (89 50 4E 47)');
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      const bitDepth = buf[24];
      const colorType = buf[25];
      check(w === 1024 && h === 1024, `Ikona ma wymiary ${w}x${h} (wymagane 1024x1024)`);
      check(bitDepth === 8, `Ikona ma bitDepth=${bitDepth} (wymagane 8)`);
      check(
        colorType === 2,
        `Ikona ma colorType=${colorType} (wymagane 2 = RGB bez kanału przezroczystości alfa!)`
      );
    }
  }

  // 2. Prebuild na Linuksie / macOS (jeśli nie jesteśmy na czystym Windows bez narzędzi Cocoa)
  if (!hadIos) {
    if (process.platform === 'win32') {
      console.log(
        '[verify-native] Środowisko Windows: sprawdzone statyczne niezmienniki natywne w app.json i assets/icon.png (prebuild w CI na ubuntu/macos).'
      );
    } else {
      console.log('[verify-native] Generowanie katalogu ios/ przez expo prebuild --no-install...');
      execSync('npx expo prebuild --platform ios --no-install --clean', {
        cwd: root,
        stdio: 'inherit',
      });
    }
  }

  if (existsSync(iosDir)) {
    const pbxPath = join(iosDir, `${iosScheme}.xcodeproj`, 'project.pbxproj');
    const plistPath = join(iosDir, iosScheme, 'Info.plist');
    const privPath = join(iosDir, iosScheme, 'PrivacyInfo.xcprivacy');

    check(existsSync(pbxPath), `Brak pliku projektu Xcode: ${pbxPath}`);
    check(existsSync(plistPath), `Brak pliku Info.plist: ${plistPath}`);
    check(existsSync(privPath), `Brak pliku PrivacyInfo.xcprivacy: ${privPath}`);

    if (existsSync(pbxPath) && existsSync(plistPath)) {
      const pbx = readFileSync(pbxPath, 'utf8');
      const plist = readFileSync(plistPath, 'utf8');

      // Bundle Identifier
      check(
        pbx.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${expectedBundleId};`) ||
          pbx.includes(`PRODUCT_BUNDLE_IDENTIFIER = "${expectedBundleId}";`),
        `PRODUCT_BUNDLE_IDENTIFIER w project.pbxproj nie zgadza się z ${expectedBundleId}`
      );

      // ITSAppUsesNonExemptEncryption = false
      check(
        /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(plist),
        'Info.plist musi mieć ITSAppUsesNonExemptEncryption = false'
      );

      // Format wersji
      const matchesVersion =
        pbx.includes(`MARKETING_VERSION = ${ver};`) ||
        pbx.includes(`MARKETING_VERSION = "${ver}";`) ||
        (ver === '1.0.0' && (pbx.includes('MARKETING_VERSION = 1.0;') || pbx.includes('MARKETING_VERSION = "1.0";')));
      check(
        matchesVersion,
        `MARKETING_VERSION w project.pbxproj nie zgadza się z ${ver}`
      );

      // Zakaz niechcianych uprawnień śledzących
      for (const perm of forbiddenPermissions) {
        check(!plist.includes(`<key>${perm}</key>`), `Info.plist zawiera niedozwolone uprawnienie: ${perm}`);
      }

      // Orientacja pionowa i pełny ekran
      if (appJson.ios?.supportsTablet === false) {
        check(
          /<key>UIRequiresFullScreen<\/key>\s*<true\/>/.test(plist) ||
            appJson.ios?.requireFullScreen === true,
          'Info.plist musi mieć UIRequiresFullScreen = true przy supportsTablet: false'
        );
        check(
          pbx.includes('TARGETED_DEVICE_FAMILY = "1";') || pbx.includes('TARGETED_DEVICE_FAMILY = 1;'),
          'project.pbxproj musi mieć TARGETED_DEVICE_FAMILY = "1" (tylko iPhone)'
        );
      }
    }

    if (existsSync(privPath)) {
      const priv = readFileSync(privPath, 'utf8');
      check(
        /<key>NSPrivacyTracking<\/key>\s*<false\/>/.test(priv),
        'PrivacyInfo.xcprivacy musi mieć NSPrivacyTracking = false'
      );
      for (const cat of [
        'NSPrivacyAccessedAPICategoryUserDefaults',
        'NSPrivacyAccessedAPICategoryFileTimestamp',
        'NSPrivacyAccessedAPICategorySystemBootTime',
        'NSPrivacyAccessedAPICategoryDiskSpace',
      ]) {
        check(priv.includes(cat), `PrivacyInfo.xcprivacy musi deklarować kategorię Required Reason API: ${cat}`);
      }
    }
  }
} finally {
  if (!hadIos && existsSync(iosDir)) {
    rmSync(iosDir, { recursive: true, force: true });
  }
}

if (errors.length > 0) {
  console.error('\n[verify-native] BŁĘDY KONFIGURACJI NATYWNEJ iOS:');
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}
console.log('[verify-native] Wszystkie niezmienniki natywnego projektu iOS spełnione.');
