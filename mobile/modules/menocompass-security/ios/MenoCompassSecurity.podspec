Pod::Spec.new do |s|
  s.name           = 'MenoCompassSecurity'
  s.version        = '1.0.0'
  s.summary        = 'MenoCompass iOS encryption bridge'
  s.description    = 'Device-bound state encryption and password-encrypted portable backups for MenoCompass.'
  s.author         = 'MenoCompass'
  s.homepage       = 'https://menlopass.vercel.app'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: 'https://menlopass.vercel.app' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
