Pod::Spec.new do |s|
  s.name           = 'QiblaHeading'
  s.version        = '0.1.0'
  s.summary        = 'The heading with its uncertainty in degrees'
  s.description    = 'Reads CLHeading.headingAccuracy in degrees, which expo-location buckets away.'
  s.author         = ''
  s.homepage       = 'https://athan.uk'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
