/**
 * The prebuild surgery that strips the dead FirebaseInitProvider from the merged
 * manifest (plugins/removeFirebaseInitProvider.js)
 *
 * expo-notifications pulls firebase-messaging, whose firebase-common AAR merges
 * FirebaseInitProvider into every build; no Firebase is configured (remote
 * notifications off, local scheduling only), so the provider fails fast at every
 * launch (digest 5119 finding 7). The plugin marks it tools:node="remove", which
 * the manifest merger answers by dropping the library's entry.
 */

type ProviderNode = { $: Record<string, string> };

type ManifestDoc = {
  manifest: {
    $: Record<string, string>;
    application: Array<{ $: Record<string, string>; provider?: ProviderNode[] }>;
  };
};

const manifestWithApplication = (): ManifestDoc => ({
  manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    application: [{ $: { 'android:name': '.MainApplication' }, provider: [] }],
  },
});

// module.exports is the plugin itself (app.json names the plugin as a string, which resolves
// module.exports); the surgery and the constants ride on it as properties
const { editManifest, FIREBASE_INIT_PROVIDER, FIREBASE_INIT_PROVIDER_AUTHORITY } =
  require('../removeFirebaseInitProvider') as {
    editManifest: (manifest: ManifestDoc['manifest']) => ManifestDoc['manifest'];
    FIREBASE_INIT_PROVIDER: string;
    FIREBASE_INIT_PROVIDER_AUTHORITY: string;
  };

/** Runs the plugin's surgery over a doc's manifest, the way the wired mod does */
const applyTo = (doc: ManifestDoc): ManifestDoc => ({ manifest: editManifest(doc.manifest) });

describe('withFirebaseInitProviderRemoved', () => {
  it('marks the FirebaseInitProvider for removal, matched by the authority the firebase-common AAR declares', () => {
    const doc = applyTo(manifestWithApplication());
    const entry = doc.manifest.application[0].provider?.[0];

    expect(entry?.$['android:name']).toBe('com.google.firebase.provider.FirebaseInitProvider');
    expect(entry?.$['android:authorities']).toBe(FIREBASE_INIT_PROVIDER_AUTHORITY);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a manifest placeholder, not a JS template
    expect(entry?.$['android:authorities']).toContain('${applicationId}');
    expect(entry?.$['tools:node']).toBe('remove');
    expect(FIREBASE_INIT_PROVIDER).toBe('com.google.firebase.provider.FirebaseInitProvider');
  });

  it('declares the tools namespace the removal node binds to, without dropping one already present', () => {
    const doc = applyTo(manifestWithApplication());

    expect(doc.manifest.$['xmlns:tools']).toBe('http://schemas.android.com/tools');
    expect(doc.manifest.$['xmlns:android']).toBe('http://schemas.android.com/apk/res/android');

    const namespaced = manifestWithApplication();
    namespaced.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const redoc = applyTo(namespaced);
    expect(redoc.manifest.$['xmlns:tools']).toBe('http://schemas.android.com/tools');
  });

  it('never duplicates its own removal entry, and never touches existing providers', () => {
    const doc = manifestWithApplication();
    doc.manifest.application[0].provider = [
      { $: { 'android:name': 'expo.modules.other.SomeProvider', 'android:authorities': 'expo.other' } },
    ];

    const once = applyTo(doc);
    const twice = applyTo(once);

    expect(twice.manifest.application[0].provider).toHaveLength(2);
    expect(twice.manifest.application[0].provider?.[0].$['android:name']).toBe('expo.modules.other.SomeProvider');
    expect(twice.manifest.application[0].provider?.filter((p) => p.$['tools:node'] === 'remove')).toHaveLength(1);
  });
});
