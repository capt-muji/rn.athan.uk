Pod::Spec.new do |s|
  s.name           = 'Athan'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.subspec 'NotificationService' do |ss|
    ss.source_files = 'NotificationService/*.{swift}'
    ss.resources = 'NotificationService/*.wav'  # Include the audio file
    ss.dependency 'ExpoModulesCore'
  end
end
