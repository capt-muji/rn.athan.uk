import ExpoModulesCore
import UserNotifications

class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        print("THIS IS WORKING - but only while app open!!!!! - DEBUG: Notification received in foreground")
    }
}

public class AthannotifDelegate: ExpoAppDelegateSubscriber {
    private let notificationDelegate = NotificationDelegate()
    
    public required init() {
        super.init()
        print("THIS WORKS - DEBUG: AthannotifDelegate initialized")
    }
    
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = notificationDelegate
        return true
    }
}
