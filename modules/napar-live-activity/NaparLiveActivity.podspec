require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'NaparLiveActivity'
  s.version        = package['version']
  s.summary        = 'Live Activity (ActivityKit) dla stoptera parzenia Napar'
  s.description    = 'Most Expo do ActivityKit. Na systemach bez ActivityKit i w Expo Go moduł nie istnieje (null w JS).'
  s.license        = 'UNLICENSED'
  s.author         = 'Napar'
  s.homepage       = 'https://github.com/lkarwowski494/napar'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
end
