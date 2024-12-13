import ExpoModulesCore
import UserNotifications

// Define a class to handle local notifications
public class AthannotifDelegate: ExpoAppDelegateSubscriber {
    // This function is triggered when a notification is received
    public func application(_ application: UIApplication, didReceive notification: UNNotification) {
        print("DEBUG: Local notification received: \(notification.request.content.body)")
    }
}