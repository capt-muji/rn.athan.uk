/**
 * JS binding for the native heading module (modules/qiblaheading).
 *
 * `expo-location` reads both platforms' sensors and then keeps back what the qibla needs from them: on iOS it buckets
 * `CLHeading.headingAccuracy` from degrees into 0 to 3, and on Android it never offers Google's Fused Orientation
 * Provider. This module exposes both.
 *
 * Each platform's native side carries one of the two, so a caller asks what the phone HAS rather than which system
 * it runs. That also covers a build whose native side is missing: every export here is then inert.
