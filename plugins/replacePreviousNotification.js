const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const SHARED_NOTIFICATION_TAG = 'athan-notification';
const RECEIVER_NAME = 'com.mugtaba.athan.notifications.AthanNotificationsService';
// Fully qualified: the library declares a relative name that resolves against its own package.
const EXPO_RECEIVER_NAME = 'expo.modules.notifications.service.NotificationsService';
const RECEIVER_ACTIONS = [
  'expo.modules.notifications.NOTIFICATION_EVENT',
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.REBOOT',
  'android.intent.action.QUICKBOOT_POWERON',
  'com.htc.intent.action.QUICKBOOT_POWERON',
  'android.intent.action.MY_PACKAGE_REPLACED',
];

// The package is fixed, not derived from config.android.package: EXPO_ANDROID_SUFFIX=fleettest builds
// change the package id while this class must not move.
const DELEGATE_SOURCE = `package com.mugtaba.athan.notifications

import android.content.Context

import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate

/**
 * Posts every notification under one shared tag, so the newest replaces the one before it (finding 78).
 *
 * The identifier is swapped only here at the posting layer: scheduling, cancelling and the stored
 * request all keep the app's own unique identifiers, so nothing else changes.
 */
class AthanPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  companion object {
    const val SHARED_NOTIFICATION_TAG = "athan-notification"
  }

  override fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?) {
    val request = notification.notificationRequest
    val sharedRequest = NotificationRequest(SHARED_NOTIFICATION_TAG, request.content, request.trigger)
    super.presentNotification(Notification(sharedRequest, notification.originDate), behavior)
  }
}
`;

const SERVICE_SOURCE = `package com.mugtaba.athan.notifications

import android.content.Context

import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.PresentationDelegate

/** The app's designated notifications receiver, whose delegate posts under one shared tag. */
class AthanNotificationsService : NotificationsService() {
  override fun getPresentationDelegate(context: Context): PresentationDelegate = AthanPresentationDelegate(context)
}
`;

// expo's receiver must go: its companion picks the first receiver matching the action, so two would
// make routing nondeterministic between the stacking and the replacing delegate.
const editManifest = (manifest) => {
  const application = manifest.manifest.application[0];
  if (!Array.isArray(application.receiver)) {
    application.receiver = [];
  }
  // Prebuild re-runs over an existing android/ at every version bump, so each addition is guarded
  // and the edit stays idempotent.
  const hasOurs = application.receiver.some((node) => node.$ && node.$['android:name'] === RECEIVER_NAME);
  const hasRemoval = application.receiver.some((node) => node.$ && node.$['android:name'] === EXPO_RECEIVER_NAME);
  if (!hasOurs) {
    application.receiver.push({
      $: { 'android:name': RECEIVER_NAME, 'android:enabled': 'true', 'android:exported': 'false' },
      'intent-filter': [
        { $: { 'android:priority': '-1' }, action: RECEIVER_ACTIONS.map((name) => ({ $: { 'android:name': name } })) },
      ],
    });
  }
  if (!hasRemoval) {
    application.receiver.push({ $: { 'android:name': EXPO_RECEIVER_NAME, 'tools:node': 'remove' } });
  }
  if (!manifest.manifest.$['xmlns:tools']) {
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/apk/res/tools';
  }
  return manifest;
};

const writeKotlin = (projectRoot) => {
  const dir = join(projectRoot, 'android/app/src/main/java/com/mugtaba/athan/notifications');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'AthanPresentationDelegate.kt'), DELEGATE_SOURCE);
  writeFileSync(join(dir, 'AthanNotificationsService.kt'), SERVICE_SOURCE);
};

const withReplacePreviousNotification = (config) => {
  const withManifest = withAndroidManifest(config, (cfg) => {
    editManifest(cfg.modResults);
    return cfg;
  });
  return withDangerousMod(withManifest, [
    'android',
    (modConfig) => {
      writeKotlin(modConfig.modRequest.projectRoot);
      return modConfig;
    },
  ]);
};

// module.exports is the composer itself because app.json names the plugin as a string, which resolves
// module.exports; the rest ride on it as properties.
module.exports = withReplacePreviousNotification;
module.exports.editManifest = editManifest;
module.exports.writeKotlin = writeKotlin;
module.exports.EXPO_RECEIVER_NAME = EXPO_RECEIVER_NAME;
module.exports.RECEIVER_NAME = RECEIVER_NAME;
module.exports.RECEIVER_ACTIONS = RECEIVER_ACTIONS;
module.exports.SHARED_NOTIFICATION_TAG = SHARED_NOTIFICATION_TAG;
module.exports.DELEGATE_SOURCE = DELEGATE_SOURCE;
module.exports.SERVICE_SOURCE = SERVICE_SOURCE;
