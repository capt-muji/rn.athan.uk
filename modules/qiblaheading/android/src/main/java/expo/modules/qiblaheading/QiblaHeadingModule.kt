package expo.modules.qiblaheading

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.DeviceOrientation
import com.google.android.gms.location.DeviceOrientationListener
import com.google.android.gms.location.DeviceOrientationRequest
import com.google.android.gms.location.FusedOrientationProviderClient
import com.google.android.gms.location.LocationServices
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class QiblaHeadingModule : Module() {
    private var client: FusedOrientationProviderClient? = null
    private var executor: ExecutorService? = null

    // Held so removeOrientationUpdates is passed the SAME instance: a different one removes nothing
    private var listener: DeviceOrientationListener? = null

    override fun definition() = ModuleDefinition {
        Name("ExpoQiblaHeading")

        Events(EVENT_NAME)

        Function("isFusedOrientationAvailable") {
            val context = appContext.reactContext ?: return@Function false
            isAvailable(context)
        }

        AsyncFunction("startFusedOrientation") {
            val context = appContext.reactContext ?: return@AsyncFunction false
            if (!isAvailable(context)) return@AsyncFunction false

            stopUpdates()

            val onOrientation = DeviceOrientationListener { orientation -> emit(orientation) }
            val pool = Executors.newSingleThreadExecutor()
            val fused = LocationServices.getFusedOrientationProviderClient(context)
            val request = DeviceOrientationRequest.Builder(DeviceOrientationRequest.OUTPUT_PERIOD_DEFAULT).build()

            fused.requestOrientationUpdates(request, pool, onOrientation)

            client = fused
            executor = pool
            listener = onOrientation

            true
        }

        AsyncFunction("stopFusedOrientation") {
            stopUpdates()
        }

        OnDestroy {
            stopUpdates()
        }
    }

    /**
     * FOP fuses all three sensors, so a device missing any one of them is served silence rather than an error.
     */
    private fun isAvailable(context: Context): Boolean {
        val playServices = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context)
        if (playServices != ConnectionResult.SUCCESS) return false

        val sensors = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return false

        return sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null &&
            sensors.getDefaultSensor(Sensor.TYPE_GYROSCOPE) != null &&
            sensors.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD) != null
    }

    private fun emit(orientation: DeviceOrientation) {
        // FOP applies declination itself and reports geographic north when a fix is known, so any term of
        // ours would double-count it
        val payload = mutableMapOf<String, Any>("headingDegrees" to orientation.headingDegrees)

        // The cone is optional per sample, so an unguarded read would publish a default dressed as an
        // accuracy. An absent key reads as undefined in JS, which keeps a null off the bridge entirely
        if (orientation.hasConservativeHeadingErrorDegrees()) {
            payload["headingErrorDegrees"] = orientation.conservativeHeadingErrorDegrees
        }

        sendEvent(EVENT_NAME, payload)
    }

    private fun stopUpdates() {
        listener?.let { client?.removeOrientationUpdates(it) }
        executor?.shutdown()
        listener = null
        client = null
        executor = null
    }

    companion object {
        private const val EVENT_NAME = "onFusedOrientation"
    }
}
