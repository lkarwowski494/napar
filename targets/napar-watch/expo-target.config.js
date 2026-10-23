/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'watch',
  name: 'NaparWatch',
  displayName: 'Napar',
  // Zegarek nie ma HealthKit ani uprawnień zdrowia. Minimum watchOS 10 (zakres z pozycji 22 MVP).
  bundleIdentifier: '.watchkitapp',
  deploymentTarget: '10.0',
  icon: '../../assets/icon.png',
  frameworks: ['SwiftUI', 'WatchConnectivity', 'WatchKit'],
};
