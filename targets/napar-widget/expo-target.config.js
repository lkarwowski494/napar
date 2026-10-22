/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'NaparWidget',
  displayName: 'Napar',
  // Live Activity wymaga ActivityKit (iOS 16.2+). Bez App Group: widżet czyta tylko atrybuty aktywności.
  bundleIdentifier: '.liveactivity',
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
};
