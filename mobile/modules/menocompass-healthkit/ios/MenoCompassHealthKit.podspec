Pod::Spec.new do |s|
  s.name           = 'MenoCompassHealthKit'
  s.version        = '1.0.0'
  s.summary        = 'Privacy-preserving, read-only HealthKit summaries for MenoCompass'
  s.description    = 'Reads user-authorized aggregate steps, sleep, and latest body weight without writing to HealthKit.'
  s.author         = 'MenoCompass'
  s.homepage       = 'https://menocompass.app/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
