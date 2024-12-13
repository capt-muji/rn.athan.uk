import UserNotifications   // Handles notifications
import AVFoundation        // Plays audio

class NotificationService: UNNotificationServiceExtension {
  var player: AVAudioPlayer?  // Audio player instance

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    // Play the audio file named "athan.wav" from the extension's bundle
    if let path = Bundle.main.path(forResource: "athan", ofType: "wav") {
      let url = URL(fileURLWithPath: path)
      do {
        player = try AVAudioPlayer(contentsOf: url)
        player?.play()  // Start playback
      } catch {
        // Handle any errors during playback
      }
    }

    // Deliver the notification without changes
    contentHandler(request.content)
  }

  override func serviceExtensionTimeWillExpire() {
    // Called when the system is about to terminate the extension
    player?.stop()  // Stop audio playback
  }
}