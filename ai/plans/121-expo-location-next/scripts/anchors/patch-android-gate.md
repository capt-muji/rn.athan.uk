@@ -651,9 +650,10 @@ class LocationModule : Module(), SensorEventListener, ActivityEventListener {
       val orientation = FloatArray(3)
       SensorManager.getOrientation(rotationMatrix, orientation)
 
-      // Make sure Delta is big enough to warrant an update
-      // Currently: 50ms and ~2 degrees of change (android has a lot of useless updates block up the sending)
-      if (abs(orientation[0] - mLastAzimuth) > DEGREE_DELTA && System.currentTimeMillis() - mLastUpdate > TIME_DELTA) {
+      // Rate-limited only. The upstream 2-degree gate also starved a compass: measured on a OnePlus 3T it
+      // emitted 0.83Hz while a user turned at 2 degrees a second, which is exactly the careful alignment a
+      // qibla compass asks for, and it floored the reported heading's own resolution at 2 degrees.
+      if (System.currentTimeMillis() - mLastUpdate > TIME_DELTA) {
         mLastAzimuth = orientation[0]
         mLastUpdate = System.currentTimeMillis()
         val magneticNorth: Float = calcMagNorth(orientation[0])
