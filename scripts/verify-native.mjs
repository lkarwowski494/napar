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
  // Sprawdzenie koloru tła dark-mode dla splash screen i adaptive icon (TASK-P7-10-WYD)
  check(
    appJson.splash?.backgroundColor === '#121214',
    `app.json -> expo.splash.backgroundColor musi być równe '#121214' (otrzymano '${appJson.splash?.backgroundColor}')`
  );
  check(
    appJson.android?.adaptiveIcon?.backgroundColor === '#121214',
    `app.json -> expo.android.adaptiveIcon.backgroundColor musi być równe '#121214' (otrzymano '${appJson.android?.adaptiveIcon?.backgroundColor}')`
  );

  // Niezmienniki orientacji, stylu i urządzeń (TASK-P8-10-WYD, TASK-P34-10-WYD)
  check(
    appJson.orientation === 'portrait',
    `app.json -> expo.orientation musi być równe 'portrait' (otrzymano '${appJson.orientation}')`
  );
  check(
    !appJson.ios?.orientation || appJson.ios.orientation === 'portrait',
    `app.json -> expo.ios.orientation musi być 'portrait' jeśli zdefiniowane (otrzymano '${appJson.ios?.orientation}')`
  );
  check(
    !appJson.android?.orientation || appJson.android.orientation === 'portrait',
    `app.json -> expo.android.orientation musi być 'portrait' jeśli zdefiniowane (otrzymano '${appJson.android?.orientation}')`
  );
  check(
    appJson.userInterfaceStyle === 'dark',
    `app.json -> expo.userInterfaceStyle musi być równe 'dark' (otrzymano '${appJson.userInterfaceStyle}')`
  );
  check(
    !appJson.ios?.userInterfaceStyle || appJson.ios.userInterfaceStyle === 'dark',
    `app.json -> expo.ios.userInterfaceStyle musi być 'dark' jeśli zdefiniowane (otrzymano '${appJson.ios?.userInterfaceStyle}')`
  );
  check(
    !appJson.android?.userInterfaceStyle || appJson.android.userInterfaceStyle === 'dark',
    `app.json -> expo.android.userInterfaceStyle musi być 'dark' jeśli zdefiniowane (otrzymano '${appJson.android?.userInterfaceStyle}')`
  );
  check(
    appJson.ios?.supportsTablet === false,
    `app.json -> expo.ios.supportsTablet musi być równe false (otrzymano '${appJson.ios?.supportsTablet}')`
  );

  const expectedBundleId = appJson.ios?.bundleIdentifier;
  check(Boolean(expectedBundleId), 'Brak bundleIdentifier w app.json -> expo.ios');
  check(
    typeof appJson.ios?.appleTeamId === 'string' && /^[A-Z0-9]{10}$/.test(appJson.ios.appleTeamId),
    `app.json -> expo.ios.appleTeamId musi być 10-znakowym identyfikatorem zespołu Apple (otrzymano '${appJson.ios?.appleTeamId}')`
  );
  check(
    appJson.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false,
    'app.json -> expo.ios.infoPlist musi mieć ITSAppUsesNonExemptEncryption: false'
  );

  // Dostęp do plików kopii zapasowej w aplikacji Pliki iOS (DEC-09, TASK-P9-10-WYD)
  check(
    appJson.ios?.infoPlist?.UIFileSharingEnabled === true,
    'app.json -> expo.ios.infoPlist musi mieć UIFileSharingEnabled: true (wymóg DEC-09)'
  );
  check(
    appJson.ios?.infoPlist?.LSSupportsOpeningDocumentsInPlace === true,
    'app.json -> expo.ios.infoPlist musi mieć LSSupportsOpeningDocumentsInPlace: true (wymóg DEC-09)'
  );

  // Schemat deep-linkingu URL napar:// (TASK-P10-10-WYD)
  check(
    appJson.scheme === 'napar',
    `app.json -> expo.scheme musi być równe 'napar' (otrzymano '${appJson.scheme}')`
  );

  // Niezmienność slug projektu oraz pełnoekranowy tryb iOS (TASK-P11-10-WYD)
  check(
    appJson.slug === 'napar',
    `app.json -> expo.slug musi być równe 'napar' (otrzymano '${appJson.slug}')`
  );
  check(
    appJson.ios?.requireFullScreen === true,
    'app.json -> expo.ios.requireFullScreen musi być równe true'
  );

  // Weryfikacja formatu expo.ios.bundleIdentifier w app.json (TASK-P20-10-WYD)
  const iosBundleId = appJson.ios?.bundleIdentifier;
  check(
    typeof iosBundleId === 'string' && /^[a-zA-Z0-9.-]+$/.test(iosBundleId) && iosBundleId === 'pl.lukasz.napar',
    `app.json -> expo.ios.bundleIdentifier musi być równe 'pl.lukasz.napar' (otrzymano '${iosBundleId}')`
  );

  // Spójność międzyplatformowych identyfikatorów pakietu i schematu URL (TASK-P37-10-WYD)
  check(
    appJson.ios?.bundleIdentifier === appJson.android?.package,
    `app.json -> expo.ios.bundleIdentifier ('${appJson.ios?.bundleIdentifier}') musi być tożsame z expo.android.package ('${appJson.android?.package}')`
  );
  check(
    appJson.scheme === appJson.slug,
    `app.json -> expo.scheme ('${appJson.scheme}') musi być tożsame z expo.slug ('${appJson.slug}')`
  );

  // Weryfikacja nazwy aplikacji w app.json (TASK-P21-10-WYD)
  check(
    appJson.name === 'Napar',
    `app.json -> expo.name musi być równe 'Napar' (otrzymano '${appJson.name}')`
  );

  // Weryfikacja spójności nazwy wyświetlanej iOS w app.json (TASK-P35-10-WYD)
  check(
    appJson.ios?.infoPlist?.CFBundleDisplayName === 'Napar',
    `app.json -> expo.ios.infoPlist.CFBundleDisplayName musi być równe 'Napar' (otrzymano '${appJson.ios?.infoPlist?.CFBundleDisplayName}')`
  );
  check(
    appJson.ios?.infoPlist?.CFBundleDisplayName === appJson.name,
    `app.json -> expo.ios.infoPlist.CFBundleDisplayName musi odpowiadać expo.name ('${appJson.name}')`
  );

  // Weryfikacja semver wersji aplikacji w app.json (TASK-P22-10-WYD)
  check(
    typeof appJson.version === 'string' && /^\d+\.\d+\.\d+$/.test(appJson.version),
    `app.json -> expo.version musi być w formacie semver X.Y.Z (otrzymano '${appJson.version}')`
  );

  // Weryfikacja formatu expo.android.package w app.json (TASK-P23-10-WYD)
  check(
    typeof appJson.android?.package === 'string' && /^[a-zA-Z0-9._]+$/.test(appJson.android.package) && appJson.android.package === 'pl.lukasz.napar',
    `app.json -> expo.android.package musi być równe 'pl.lukasz.napar' (otrzymano '${appJson.android?.package}')`
  );

  // Weryfikacja formatu expo.android.versionCode w app.json (TASK-P24-10-WYD)
  check(
    typeof appJson.android?.versionCode === 'number' && Number.isInteger(appJson.android.versionCode) && appJson.android.versionCode >= 1,
    `app.json -> expo.android.versionCode musi być dodatnią liczbą całkowitą (otrzymano '${appJson.android?.versionCode}')`
  );

  // Weryfikacja wymaganych uprawnień Androida w app.json (TASK-P25-10-WYD)
  const androidPerms = Array.isArray(appJson.android?.permissions) ? appJson.android.permissions : [];
  for (const requiredPerm of ['android.permission.CAMERA', 'android.permission.VIBRATE', 'android.permission.WAKE_LOCK']) {
    check(
      androidPerms.includes(requiredPerm),
      'app.json -> expo.android.permissions musi zawierać ' + requiredPerm
    );
  }

  // Weryfikacja braku inwazyjnych uprawnień Androida (Zero Telemetry & Privacy, TASK-P29-10-WYD)
  const forbiddenPerms = [
    'android.permission.RECORD_AUDIO',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.READ_CONTACTS',
    'android.permission.READ_CALENDAR',
    'android.permission.SEND_SMS',
  ];
  for (const forbidden of forbiddenPerms) {
    check(
      !androidPerms.includes(forbidden),
      `app.json -> expo.android.permissions nie może zawierać inwazyjnego uprawnienia '${forbidden}' (wymóg Zero Telemetry)`
    );
  }
  // Weryfikacja ścieżki ikony oraz numerycznego buildNumber (TASK-P12-10-WYD)
  check(
    appJson.icon === './assets/icon.png',
    `app.json -> expo.icon musi wskazywać na './assets/icon.png' (otrzymano '${appJson.icon}')`
  );
  check(
    typeof appJson.ios?.buildNumber === 'string' && /^\d+$/.test(appJson.ios?.buildNumber),
    `app.json -> expo.ios.buildNumber musi być ciągiem cyfr (otrzymano '${appJson.ios?.buildNumber}')`
  );

  // Weryfikacja flag lokalizacyjnych i pełnoekranowych w infoPlist (TASK-P13-10-WYD)
  check(
    appJson.ios?.infoPlist?.CFBundleAllowMixedLocalizations === true,
    'app.json -> expo.ios.infoPlist musi mieć CFBundleAllowMixedLocalizations: true (wymóg lokalizacji 35 języków)'
  );
  check(
    appJson.ios?.infoPlist?.UIRequiresFullScreen === true,
    'app.json -> expo.ios.infoPlist musi mieć UIRequiresFullScreen: true'
  );

  // Weryfikacja CFBundleDisplayName, android.package i 35 języków CFBundleLocalizations (TASK-P14-10-WYD)
  check(
    appJson.ios?.infoPlist?.CFBundleDisplayName === 'Napar',
    `app.json -> expo.ios.infoPlist.CFBundleDisplayName musi być równe 'Napar' (otrzymano '${appJson.ios?.infoPlist?.CFBundleDisplayName}')`
  );
  check(
    appJson.android?.package === 'pl.lukasz.napar',
    `app.json -> expo.android.package musi być równe 'pl.lukasz.napar' (otrzymano '${appJson.android?.package}')`
  );
  const localizations = appJson.ios?.infoPlist?.CFBundleLocalizations;
  check(
    Array.isArray(localizations) && localizations.length === 35 && localizations.includes('pl') && localizations.includes('en'),
    `app.json -> expo.ios.infoPlist.CFBundleLocalizations musi zawierać dokładnie 35 języków, w tym 'pl' i 'en' (otrzymano ${localizations?.length})`
  );

  // Weryfikacja obecności krytycznych pluginów bazodanowych i nawigacyjnych (TASK-P26-10-WYD)
  check(
    Array.isArray(appJson.plugins) && appJson.plugins.includes('expo-router'),
    "app.json -> expo.plugins musi zawierać 'expo-router'"
  );
  check(
    Array.isArray(appJson.plugins) && appJson.plugins.includes('expo-sqlite'),
    "app.json -> expo.plugins musi zawierać 'expo-sqlite'"
  );

  // Weryfikacja braku uprawnień mikrofonowych w pluginie expo-camera (Zero Audio / Privacy)
  const cameraPlugin = appJson.plugins?.find(
    (p) => Array.isArray(p) && p[0] === 'expo-camera'
  );
  check(
    Boolean(cameraPlugin && cameraPlugin[1]?.microphonePermission === false),
    'app.json -> expo.plugins expo-camera musi mieć jawnie microphonePermission: false'
  );

  // Weryfikacja spójności uprawnień kamery iOS infoPlist oraz expo-camera plugin (TASK-P19-10-WYD)
  const cameraDesc = appJson.ios?.infoPlist?.NSCameraUsageDescription;
  const pluginCameraPermission = cameraPlugin && cameraPlugin[1]?.cameraPermission;
  check(
    typeof cameraDesc === 'string' && cameraDesc.trim().length > 0,
    'app.json -> expo.ios.infoPlist.NSCameraUsageDescription musi być niepustym ciągiem tekstowym'
  );
  check(
    cameraDesc === pluginCameraPermission,
    `app.json -> expo.ios.infoPlist.NSCameraUsageDescription musi być identyczne jak expo-camera plugin cameraPermission (otrzymano '${cameraDesc}' vs '${pluginCameraPermission}')`
  );

  // Weryfikacja konfiguracji zasobów wizualnych i pluginu lokalizacji (TASK-P17-10-WYD)
  check(
    appJson.android?.adaptiveIcon?.foregroundImage === './assets/adaptive-icon.png' &&
      existsSync(join(root, 'assets/adaptive-icon.png')),
    "app.json -> expo.android.adaptiveIcon.foregroundImage musi wskazywać na istniejący plik './assets/adaptive-icon.png'"
  );
  check(
    appJson.splash?.image === './assets/splash.png' &&
      existsSync(join(root, 'assets/splash.png')),
    "app.json -> expo.splash.image musi wskazywać na istniejący plik './assets/splash.png'"
  );
  check(
    appJson.splash?.resizeMode === 'contain',
    "app.json -> expo.splash.resizeMode musi być równe 'contain'"
  );

  // Weryfikacja ciemnego tła ekranu powitalnego i spójności z ikoną adaptacyjną (TASK-P36-10-WYD)
  check(
    appJson.splash?.backgroundColor === '#121214',
    `app.json -> expo.splash.backgroundColor musi być '#121214' (ciemne tło zapobiegające rozbłyskom, otrzymano '${appJson.splash?.backgroundColor}')`
  );
  check(
    appJson.splash?.backgroundColor === appJson.android?.adaptiveIcon?.backgroundColor,
    'app.json -> expo.splash.backgroundColor musi być spójne z expo.android.adaptiveIcon.backgroundColor'
  );

  const localizationPlugin = appJson.plugins?.find(
    (p) => Array.isArray(p) && p[0] === 'expo-localization'
  );
  const supportedLocales = localizationPlugin && localizationPlugin[1]?.supportedLocales;
  check(
    Array.isArray(supportedLocales) &&
      supportedLocales.length === 35 &&
      supportedLocales.includes('pl') &&
      supportedLocales.includes('en'),
    `app.json -> expo.plugins expo-localization musi deklarować 35 języków, w tym 'pl' i 'en' (otrzymano ${supportedLocales?.length})`
  );

  // Weryfikacja 1:1 spójności supportedLocales z CFBundleLocalizations i plikami locales/*.json (TASK-P27-10-WYD)
  if (Array.isArray(supportedLocales) && Array.isArray(localizations)) {
    const missingInPlugin = localizations.filter((l) => !supportedLocales.includes(l));
    const missingInPlist = supportedLocales.filter((l) => !localizations.includes(l));
    check(
      missingInPlugin.length === 0 && missingInPlist.length === 0,
      `app.json -> expo-localization supportedLocales musi być w 100% tożsame z CFBundleLocalizations (różnice: +${missingInPlugin.join(',')}/-${missingInPlist.join(',')})`
    );
    for (const loc of supportedLocales) {
      check(
        existsSync(join(root, `locales/${loc}.json`)),
        `app.json -> expo-localization deklaruje język '${loc}', ale brak pliku locales/${loc}.json`
      );
    }
  }

  const ver = appJson.version;
  check(/^\d+\.\d+(\.\d+)?$/.test(ver), `Wersja '${ver}' w app.json musi mieć format X.Y lub X.Y.Z`);

  // Weryfikacja spójności wersji i zależności z package.json (TASK-P28-10-WYD)
  const pkgJsonPath = join(root, 'package.json');
  check(existsSync(pkgJsonPath), 'Brak pliku package.json w katalogu głównym projektu');
  if (existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    check(
      pkgJson.version === appJson.version,
      `Wersja w package.json (${pkgJson.version}) musi być identyczna z app.json (${appJson.version})`
    );
    check(
      pkgJson.name === appJson.slug,
      `Nazwa w package.json (${pkgJson.name}) musi odpowiadać slug w app.json (${appJson.slug})`
    );
    check(
      pkgJson.private === true,
      'package.json musi mieć flagę private: true (ochrona przed przypadkową publikacją do publicznego rejestru npm)'
    );
    check(
      pkgJson.main === 'expo-router/entry',
      `package.json main musi wskazywać na 'expo-router/entry' (otrzymano '${pkgJson.main}')`
    );
    const deps = pkgJson.dependencies || {};
    const criticalPlugins = ['expo', 'react-native', 'react', 'expo-router', 'expo-sqlite', 'expo-camera', 'expo-localization'];
    for (const plugin of criticalPlugins) {
      check(
        Boolean(deps[plugin]),
        `Krytyczny pakiet '${plugin}' musi znajdować się w dependencies package.json`
      );
    }
  }

  const forbiddenPermissions = [
    'NSMicrophoneUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSLocationUsageDescription',
    'NSContactsUsageDescription',
    'NSCalendarsUsageDescription',
    'NSRemindersUsageDescription',
    'NSMotionUsageDescription',
    'NSSpeechRecognitionUsageDescription',
    'NSBluetoothAlwaysUsageDescription',
    'NSUserTrackingUsageDescription',
    'NSAppleMusicUsageDescription',
  ];
  for (const perm of forbiddenPermissions) {
    check(!appJson.ios?.infoPlist?.[perm], `app.json zawiera niedozwolone uprawnienie: ${perm}`);
  }

  const manifests = appJson.ios?.privacyManifests;
  check(manifests?.NSPrivacyTracking === false, 'app.json privacyManifests musi mieć NSPrivacyTracking: false');
  check(
    Array.isArray(manifests?.NSPrivacyCollectedDataTypes) && manifests.NSPrivacyCollectedDataTypes.length === 0,
    'app.json privacyManifests.NSPrivacyCollectedDataTypes musi być pustą tablicą (100% Zero Data Collected / Privacy nutrition labels)'
  );
  check(
    Array.isArray(manifests?.NSPrivacyTrackingDomains) && manifests.NSPrivacyTrackingDomains.length === 0,
    'app.json privacyManifests.NSPrivacyTrackingDomains musi być pustą tablicą (Zero Tracking Domains)'
  );
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

  // Statyczna walidacja Android (RD-ENG-11 / BRD-QA-REL 1.0)
  const androidPackage = appJson.android?.package;
  check(
    androidPackage === 'pl.lukasz.napar',
    `Nieprawidłowy android.package: '${androidPackage}' (wymagane 'pl.lukasz.napar')`
  );
  const versionCode = appJson.android?.versionCode;
  check(
    typeof versionCode === 'number' && Number.isInteger(versionCode) && versionCode >= 1,
    `Nieprawidłowy android.versionCode: '${versionCode}' (musi być liczbą całkowitą >= 1)`
  );

  const allowedAndroidPermissions = new Set([
    'android.permission.CAMERA',
    'android.permission.VIBRATE',
    'android.permission.WAKE_LOCK',
  ]);
  const declaredAndroidPermissions = appJson.android?.permissions || [];
  check(
    Array.isArray(declaredAndroidPermissions),
    'app.json -> expo.android.permissions musi być tablicą'
  );
  for (const perm of declaredAndroidPermissions) {
    check(
      allowedAndroidPermissions.has(perm),
      `app.json zawiera niedozwolone uprawnienie Android: ${perm}`
    );
  }

  // Weryfikacja obecności wszystkich wymaganych uprawnień Android (TASK-P15-10-WYD)
  for (const reqPerm of allowedAndroidPermissions) {
    check(
      declaredAndroidPermissions.includes(reqPerm),
      `app.json -> expo.android.permissions musi zawierać wymagane uprawnienie: ${reqPerm}`
    );
  }

  const forbiddenAndroidPermissions = [
    'android.permission.RECORD_AUDIO',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.READ_CONTACTS',
    'android.permission.WRITE_CONTACTS',
    'android.permission.READ_CALENDAR',
    'android.permission.WRITE_CALENDAR',
    'android.permission.READ_SMS',
    'android.permission.SEND_SMS',
    'android.permission.RECEIVE_SMS',
    'android.permission.READ_PHONE_STATE',
    'android.permission.READ_CALL_LOG',
    'android.permission.BODY_SENSORS',
    'android.permission.ACTIVITY_RECOGNITION',
  ];
  for (const forbidden of forbiddenAndroidPermissions) {
    check(
      !declaredAndroidPermissions.includes(forbidden),
      `app.json zawiera zabronione uprawnienie Android (Zero Telemetry/Privacy): ${forbidden}`
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

  // 1b. Weryfikacja binarnego nagłówka PNG ikony adaptacyjnej Androida (TASK-P5-10-WYD)
  const adaptiveIconPath = join(root, 'assets', 'adaptive-icon.png');
  check(existsSync(adaptiveIconPath), 'Brak pliku assets/adaptive-icon.png');
  if (existsSync(adaptiveIconPath)) {
    const buf = readFileSync(adaptiveIconPath);
    check(buf.length >= 26, 'Plik assets/adaptive-icon.png jest zbyt krótki');
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
      check(isPng, 'assets/adaptive-icon.png nie posiada prawidłowej sygnatury PNG (89 50 4E 47)');
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      check(w >= 512 && h >= 512, `Ikona adaptacyjna Androida ma wymiary ${w}x${h} (wymagane min. 512x512)`);
    }
  }

  // 1c. Weryfikacja binarnego nagłówka PNG ekranu powitalnego splash.png (TASK-P6-10-WYD)
  const splashPath = join(root, 'assets', 'splash.png');
  check(existsSync(splashPath), 'Brak pliku assets/splash.png');
  if (existsSync(splashPath)) {
    const buf = readFileSync(splashPath);
    check(buf.length >= 26, 'Plik assets/splash.png jest zbyt krótki');
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
      check(isPng, 'assets/splash.png nie posiada prawidłowej sygnatury PNG (89 50 4E 47)');
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      check(w >= 512 && h >= 512, `Ekran powitalny splash ma wymiary ${w}x${h} (wymagane min. 512x512)`);
    }
  }

  // 1d. Weryfikacja binarnego nagłówka PNG favicon.png (TASK-P32-10-WYD)
  const faviconPath = join(root, 'assets', 'favicon.png');
  check(existsSync(faviconPath), 'Brak pliku assets/favicon.png');
  if (existsSync(faviconPath)) {
    const buf = readFileSync(faviconPath);
    check(buf.length >= 26, 'Plik assets/favicon.png jest zbyt krótki');
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
      check(isPng, 'assets/favicon.png nie posiada prawidłowej sygnatury PNG (89 50 4E 47)');
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      check(w >= 32 && h >= 32, `Favicon ma wymiary ${w}x${h} (wymagane min. 32x32)`);
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
