Pod::Spec.new do |s|
  s.name           = 'MenoCompassShortcuts'
  s.version        = '1.0.0'
  s.summary        = 'MenoCompass App Shortcuts and native invocation bridge'
  s.description    = 'Provides privacy-safe App Intents for opening check-in and pattern screens.'
  s.author         = 'MenoCompass'
  s.homepage       = 'https://menlopass.vercel.app/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
