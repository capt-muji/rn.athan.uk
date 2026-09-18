/**
 * The prebuild change that posts every Android notification under one shared tag
 * (plugins/replacePreviousNotification.js)
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type ReceiverNode = {
  $: Record<string, string>;
  'intent-filter'?: Array<{ $: Record<string, string>; action: Array<{ $: Record<string, string> }> }>;
};

type ManifestDoc = {
  manifest: {
    $: Record<string, string>;
    application: Array<{ $: Record<string, string>; activity: unknown[]; receiver?: ReceiverNode[] }>;
  };
};

const {
  DELEGATE_SOURCE,
  EXPO_RECEIVER_NAME,
  RECEIVER_NAME,
  SERVICE_SOURCE,
  SHARED_NOTIFICATION_TAG,
  editManifest,
  writeKotlin,
} = require('../replacePreviousNotification') as {
  DELEGATE_SOURCE: string;
  EXPO_RECEIVER_NAME: string;
  RECEIVER_NAME: string;
  SERVICE_SOURCE: string;
  SHARED_NOTIFICATION_TAG: string;
  editManifest: (manifest: ManifestDoc) => ManifestDoc;
  writeKotlin: (projectRoot: string) => void;
};

const manifestWithoutReceivers = (): ManifestDoc => ({
  manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    application: [{ $: { 'android:name': '.MainApplication' }, activity: [] }],
  },
});

// A literal, not the plugin's RECEIVER_ACTIONS export: comparing the plugin's surgery against its own
// export would prove nothing.
const SIX_ACTIONS = [
  'expo.modules.notifications.NOTIFICATION_EVENT',
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.REBOOT',
  'android.intent.action.QUICKBOOT_POWERON',
  'com.htc.intent.action.QUICKBOOT_POWERON',
  'android.intent.action.MY_PACKAGE_REPLACED',
];

const EXPO_MANIFEST = 'node_modules/expo-notifications/android/src/main/AndroidManifest.xml';
const EXPO_DELEGATE =
  'node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoPresentationDelegate.kt';
const EXPO_SERVICE =
  'node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/NotificationsService.kt';

const pluginNames = (config: import('expo/config').ExpoConfig): string[] =>
  (config.plugins ?? [])
    .map((plugin: unknown) => {
      if (typeof plugin === 'string') return plugin;
      if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
      return null;
    })
    .filter((name: string | null): name is string => name !== null);

describe('the shared-tag prebuild plugin', () => {
  it('removes expo notifications receiver and declares the app own one with the same six actions', () => {
    const edited = editManifest(manifestWithoutReceivers());

    const receivers = edited.manifest.application[0].receiver ?? [];
    expect(receivers).toHaveLength(2);

    const ours = receivers.find((node) => node.$['android:name'] === RECEIVER_NAME);
    expect(ours).toBeDefined();
    expect(ours?.$).toMatchObject({ 'android:enabled': 'true', 'android:exported': 'false' });
    expect(ours?.['intent-filter']).toHaveLength(1);
    expect(ours?.['intent-filter']?.[0].$).toEqual({ 'android:priority': '-1' });
    expect(ours?.['intent-filter']?.[0].action.map((action) => action.$['android:name'])).toEqual(SIX_ACTIONS);

    const removal = receivers.find((node) => node.$['android:name'] === EXPO_RECEIVER_NAME);
    expect(removal?.$['tools:node']).toBe('remove');

    expect(edited.manifest.$['xmlns:tools']).toBe('http://schemas.android.com/apk/res/tools');
  });

  it('changes nothing the second time it runs', () => {
    const once = editManifest(manifestWithoutReceivers());
    const twice = editManifest(editManifest(manifestWithoutReceivers()));

    expect(twice).toEqual(once);
  });

  it('keeps an xmlns:tools the manifest already had', () => {
    const manifest = manifestWithoutReceivers();
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/apk/res/tools';

    const edited = editManifest(manifest);

    expect(edited.manifest.$['xmlns:tools']).toBe('http://schemas.android.com/apk/res/tools');
  });

  it('post every notification under the shared tag', () => {
    expect(DELEGATE_SOURCE).toContain(`const val SHARED_NOTIFICATION_TAG = "${SHARED_NOTIFICATION_TAG}"`);
    expect(DELEGATE_SOURCE).toContain('NotificationRequest(SHARED_NOTIFICATION_TAG, request.content, request.trigger)');
    expect(DELEGATE_SOURCE).toContain(
      'super.presentNotification(Notification(sharedRequest, notification.originDate), behavior)'
    );
  });

  it('hand presentation to the shared-tag delegate', () => {
    expect(SERVICE_SOURCE).toContain('class AthanNotificationsService : NotificationsService()');
    expect(SERVICE_SOURCE).toContain(
      'override fun getPresentationDelegate(context: Context): PresentationDelegate = AthanPresentationDelegate(context)'
    );
  });

  it('are written under the app package when prebuild runs', () => {
    const projectRoot = join(tmpdir(), `plan7-plugin-${process.pid}`);
    rmSync(projectRoot, { recursive: true, force: true });
    mkdirSync(projectRoot, { recursive: true });

    try {
      writeKotlin(projectRoot);

      const dir = join(projectRoot, 'android/app/src/main/java/com/mugtaba/athan/notifications');
      const delegatePath = join(dir, 'AthanPresentationDelegate.kt');
      const servicePath = join(dir, 'AthanNotificationsService.kt');
      expect(existsSync(delegatePath)).toBe(true);
      expect(readFileSync(delegatePath, 'utf8')).toEqual(DELEGATE_SOURCE);
      expect(readFileSync(servicePath, 'utf8')).toEqual(SERVICE_SOURCE);
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('the upstream the plugin rides on', () => {
  it('still declares the receiver the plugin removes, under the six actions', () => {
    const upstream = readFileSync(EXPO_MANIFEST, 'utf8');

    expect(upstream).toContain('android:name=".service.NotificationsService"');
    expect(EXPO_RECEIVER_NAME).toBe('expo.modules.notifications.service.NotificationsService');
    for (const action of SIX_ACTIONS) {
      expect(upstream).toContain(`android:name="${action}"`);
    }
  });

  it('still exposes the override seam the Kotlin rides on', () => {
    const delegate = readFileSync(EXPO_DELEGATE, 'utf8');
    const service = readFileSync(EXPO_SERVICE, 'utf8');

    expect(delegate).toContain('open class ExpoPresentationDelegate');
    expect(delegate).toContain(
      'override fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?)'
    );
    expect(delegate).not.toContain('final override fun presentNotification');
    expect(delegate.split('NotificationManagerCompat.from(context).notify')).toHaveLength(2);
    expect(service).toContain('protected open fun getPresentationDelegate');
  });
});

describe('the plugin wiring', () => {
  it('loads the plugin from app.json', () => {
    const appJson = JSON.parse(readFileSync(join(__dirname, '../../app.json'), 'utf8')) as {
      expo: { plugins: unknown[] };
    };

    expect(appJson.expo.plugins).toContain('./plugins/replacePreviousNotification');
  });

  it('keeps the plugin through app.config.ts when the widgets flag strips its own', () => {
    delete process.env.EXPO_PUBLIC_WIDGETS;
    let names: string[] = [];
    jest.isolateModules(() => {
      const loaded = require('../../app.config').default as
        | import('expo/config').ExpoConfig
        | ((ctx: { platform?: string }) => import('expo/config').ExpoConfig);
      const config = typeof loaded === 'function' ? loaded({ platform: 'ios' }) : loaded;
      names = pluginNames(config);
    });

    expect(names).toContain('./plugins/replacePreviousNotification');
    expect(names).not.toContain('expo-widgets');
  });
});
