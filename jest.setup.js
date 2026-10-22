jest.mock('expo-file-system/legacy', () => {
  const files = {};
  return {
    __esModule: true,
    documentDirectory: 'file:///data/user/0/pl.lukasz.napar/files/',
    cacheDirectory: 'file:///data/user/0/pl.lukasz.napar/cache/',
    getInfoAsync: jest.fn(async (path) => ({
      exists: path in files || path.endsWith('/'),
      isDirectory: path.endsWith('/'),
    })),
    makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
    readAsStringAsync: jest.fn(async (path) => files[path] || ''),
    writeAsStringAsync: jest.fn(async (path, content) => {
      files[path] = content;
    }),
    deleteAsync: jest.fn(async (path) => {
      delete files[path];
    }),
    readDirectoryAsync: jest.fn(async () =>
      Object.keys(files).map((p) => p.split('/').pop())
    ),
    __files: files,
    __reset: () => {
      for (const k of Object.keys(files)) {
        delete files[k];
      }
    },
  };
});

jest.mock('expo-file-system', () => {
  return require('expo-file-system/legacy');
});

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    addListener: jest.fn((event, callback) => {
      if (typeof callback === 'function') {
        callback({ didJustFinish: true });
      }
      return { remove: jest.fn() };
    }),
  })),
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props) =>
      React.createElement(View, { ...props, testID: props.testID || 'camera-view' }),
    useCameraPermissions: jest.fn(() => [
      { granted: true, canAskAgain: true },
      jest.fn().mockResolvedValue({ granted: true }),
    ]),
  };
});

jest.mock(
  'expo-asset',
  () => ({
    Asset: {
      fromModule: jest.fn(),
    },
  }),
  { virtual: true }
);

// Global deterministic locale mock for Jest across OS platforms (Linux CI, macOS, Windows)
const OriginalDateTimeFormat = Intl.DateTimeFormat;
Intl.DateTimeFormat = function (locales, options) {
  const instance = new OriginalDateTimeFormat(locales || 'pl-PL', options);
  return {
    ...instance,
    resolvedOptions: () => ({
      ...instance.resolvedOptions(),
      locale: locales ? String(locales) : 'pl-PL',
    }),
    format: instance.format.bind(instance),
  };
};
Intl.DateTimeFormat.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf
  ? OriginalDateTimeFormat.supportedLocalesOf.bind(OriginalDateTimeFormat)
  : undefined;

// Strict console.error and console.warn interceptor (BR-TEST-018 / FAZA 5.2)
const origError = console.error;
const origWarn = console.warn;

console.error = function (...args) {
  const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  origError.apply(console, args);
  throw new Error(`[STRICT CONSOLE.ERROR] Wykryto nieoczekiwany console.error w trakcie testu:\n${msg}`);
};

console.warn = function (...args) {
  const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  origWarn.apply(console, args);
  throw new Error(`[STRICT CONSOLE.WARN] Wykryto nieoczekiwany console.warn w trakcie testu:\n${msg}`);
};



// Adaptery platformy w testach: baza (expo-sqlite, ładowany leniwie, więc mocki z testów działają)
// oraz magazyn kopii zapasowych (expo-file-system/legacy z mockiem powyżej).
const { configureDatabase } = require('./src/core/database');
const { configureBackupStorage } = require('./src/core/backup');
configureDatabase(() => require('./src/platform/sqlite-adapter').openNaparDatabase());
// Magazyn leniwy: moduł adaptera ładujemy dopiero przy użyciu, żeby mocki z testów (np. expo-sharing) działały.
const platformBackupStorage = () => require('./src/platform/backup-storage').expoBackupStorage;
configureBackupStorage({
  get documentDirectory() {
    return platformBackupStorage().documentDirectory;
  },
  get cacheDirectory() {
    return platformBackupStorage().cacheDirectory;
  },
  exists: (path) => platformBackupStorage().exists(path),
  makeDirectory: (path) => platformBackupStorage().makeDirectory(path),
  writeText: (path, text) => platformBackupStorage().writeText(path, text),
  readText: (path) => platformBackupStorage().readText(path),
  listDirectory: (path) => platformBackupStorage().listDirectory(path),
  remove: (path) => platformBackupStorage().remove(path),
  share: (path, options) => platformBackupStorage().share(path, options),
});
