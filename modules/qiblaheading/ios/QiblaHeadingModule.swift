import CoreLocation
import ExpoModulesCore

public class QiblaHeadingModule: Module {
  private var streamer: HeadingAccuracyStreamer?

  public func definition() -> ModuleDefinition {
    Name("ExpoQiblaHeading")

    Events(eventName)

    Function("isHeadingAccuracyAvailable") { () -> Bool in
      CLLocationManager.headingAvailable()
    }

    AsyncFunction("startHeadingAccuracy") { () -> Bool in
      guard CLLocationManager.headingAvailable() else {
        return false
      }

      self.streamer?.stop()

      let streamer = HeadingAccuracyStreamer { [weak self] heading, wantsCalibration in
        guard let self else {
          return
        }
        self.sendEvent(
          self.eventName,
          [
            "trueHeading": heading.trueHeading,
            "magneticHeading": heading.magneticHeading,
            // Untouched, negatives included: Apple uses a negative value for a reading it considers
            // invalid, and expo-location's bucketing collapses that into the same band as a merely poor one
            "accuracyDegrees": heading.headingAccuracy,
            "wantsCalibration": wantsCalibration,
          ]
        )
      }
      streamer.start()
      self.streamer = streamer

      return true
    }
    // CLLocationManager delivers its delegate callbacks only on a thread with a live run loop, and an
    // AsyncFunction runs off the main queue by default: built there it starts cleanly and never calls back
    .runOnQueue(.main)

    AsyncFunction("stopHeadingAccuracy") {
      self.streamer?.stop()
      self.streamer = nil
    }
    .runOnQueue(.main)

    OnDestroy {
      self.streamer?.stop()
      self.streamer = nil
    }
  }

  private let eventName = "onHeadingAccuracy"
}

private class HeadingAccuracyStreamer: NSObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  private let onHeading: (CLHeading, Bool) -> Void
  private var askedForCalibration = false

  init(onHeading: @escaping (CLHeading, Bool) -> Void) {
    self.onHeading = onHeading
    super.init()
    manager.delegate = self
  }

  func start() {
    // Apple requires location updates on the SAME manager for trueHeading to be valid, which
    // expo-location's own streamer never does
    manager.startUpdatingLocation()
    // CoreLocation's default 1-degree filter rejected every reading of a stationary phone on the XS
    manager.headingFilter = kCLHeadingFilterNone
    manager.startUpdatingHeading()
  }

  func stop() {
    manager.stopUpdatingHeading()
    manager.stopUpdatingLocation()
  }

  func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
    onHeading(newHeading, askedForCalibration)
  }

  /**
   The app owns every pixel of this screen and the system HUD can appear over the sheet at a moment the
   app does not choose, so the question is recorded and answered no.
   */
  func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
    askedForCalibration = true

    return false
  }
}
