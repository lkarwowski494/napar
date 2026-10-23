require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'NaparWatchLink'
  s.version        = package['version']
  s.summary        = 'WatchConnectivity po stronie iPhone dla zegarka Napar'
  s.description    = 'Most Expo do WCSession: stan stoptera do zegarka i polecenia z zegarka. Bez zegarka i w Expo Go moduł nie istnieje (null w JS).'
  s.license        = 'UNLICENSED'
  s.author         = 'Napar'
  s.homepage       = 'https://github.com/lkarwowski494/napar'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
end
