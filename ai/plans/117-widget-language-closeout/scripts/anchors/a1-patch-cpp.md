+      if (!locale.empty()) {
+        rt.global().setProperty(rt, "__expoWidgetDeviceLocale", jsi::String::createFromUtf8(rt, locale));
+      }
