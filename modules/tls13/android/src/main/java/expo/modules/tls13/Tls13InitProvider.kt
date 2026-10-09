package expo.modules.tls13

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.Build
import com.google.android.gms.security.ProviderInstaller

/**
 * Installs Google Play Services' TLS 1.3 security provider before ANY
 * application code builds an HTTP client.
 *
 * www.londonprayertimes.com accepts TLS 1.3 only; Android 9 and older ship
 * TLS 1.3 disabled (the platform enables it from Android 10). OkHttp-based
 * clients snapshot SSLContext.getDefault() when they are built, so patching
 * the provider after client construction (e.g. from JS) cannot retrofit
 * them. ContentProviders initialize before Application.onCreate, which is
 * before React Native and every network module exist - the earliest
 * reliable injection point in a CNG app.
 *
 * Best-effort: when Play Services cannot install (missing/stale GMS), the
 * platform provider stays and TLS behaves exactly as before this module.
 */
class Tls13InitProvider : ContentProvider() {
    override fun onCreate(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            try {
                ProviderInstaller.installIfNeeded(context!!)
            } catch (_: Exception) {
                // GMS unavailable: stay on the platform provider
            }
        }
        return true
    }

    override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? = null

    override fun getType(uri: Uri): String? = null

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int = 0
}
