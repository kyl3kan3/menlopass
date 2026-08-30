require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'MenoCompassTikTokBusiness'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = { :type => 'Proprietary' }
  s.author         = 'MenoCompass'
  s.homepage       = 'https://menlopass.vercel.app'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '6.0'
  s.source         = { :git => 'https://github.com/tiktok/tiktok-business-ios-sdk.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'TikTokBusinessSDK', '1.7.2'

  s.source_files = '*.{h,m,mm,swift}'
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -ObjC -lc++'
  }
end
