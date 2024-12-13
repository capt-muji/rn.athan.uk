import ExpoModulesCore
import UserNotifications

public class AthannotifDelegate: ExpoAppDelegateSubscriber {
    public required init() {
        super.init()
        print("THIS WORKS - DEBUG: AthannotifDelegate initialized")
    }
    
    // This method is called when a notification is delivered while the app is in the foreground
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        print("NOT WORKING - DEBUG: Notification received in foreground")
    }
}
