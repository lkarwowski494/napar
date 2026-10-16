// jest.setup.js — Global mocks for native Expo modules in Jest (Apps4Brew Studio)
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
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

