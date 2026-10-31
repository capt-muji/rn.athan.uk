const { withAndroidManifest } = require('expo/config-plugins');

// expo-notifications depends on firebase-messaging, whose firebase-common AAR merges
// FirebaseInitProvider into every build. No Firebase is configured here (remote
// notifications are off, notifications are local-only), so the provider fails fast
// on every launch and initialises nothing the app reads (digest 5119 finding 7).
// The dependency itself stays (expo-notifications' Kotlin references it); this
// surgery marks the provider tools:node="remove", which the manifest merger
// answers by dropping the library's entry from the merged manifest.
const FIREBASE_INIT_PROVIDER = 'com.google.firebase.provider.FirebaseInitProvider';
// biome-ignore lint/suspicious/noTemplateCurlyInString: a manifest placeholder gradle substitutes at merge time, not a JS template
const FIREBASE_INIT_PROVIDER_AUTHORITY = '${applicationId}.firebaseinitprovider';

/** Marks the dead provider for removal in the app manifest, idempotently */
const editManifest = (manifest) => {
  const application = manifest.application?.[0];
  if (application === undefined) return manifest;

  const alreadyRemoved = (application.provider ?? []).some(
    (entry) => entry.$?.['android:name'] === FIREBASE_INIT_PROVIDER && entry.$?.['tools:node'] === 'remove'
  );
  if (!alreadyRemoved) {
    application.provider = [
      ...(application.provider ?? []),
      {
        $: {
          'android:name': FIREBASE_INIT_PROVIDER,
          'android:authorities': FIREBASE_INIT_PROVIDER_AUTHORITY,
          'tools:node': 'remove',
        },
      },
    ];
  }

  // The removal node binds to the tools namespace: declared by the prebuild
  // template today, re-declared here so the surgery stands alone
  manifest.$ = { 'xmlns:tools': 'http://schemas.android.com/tools', ...manifest.$ };

  return manifest;
};

const withFirebaseInitProviderRemoved = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest = editManifest(config.modResults.manifest);
    return config;
  });
};

// module.exports is the plugin itself because app.json names the plugin as a string, which resolves
// module.exports; the rest ride on it as properties.
module.exports = withFirebaseInitProviderRemoved;
module.exports.editManifest = editManifest;
module.exports.FIREBASE_INIT_PROVIDER = FIREBASE_INIT_PROVIDER;
module.exports.FIREBASE_INIT_PROVIDER_AUTHORITY = FIREBASE_INIT_PROVIDER_AUTHORITY;
