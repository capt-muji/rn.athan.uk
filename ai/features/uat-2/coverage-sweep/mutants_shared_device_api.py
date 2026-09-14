#!/usr/bin/env python3
"""Mutation pass for the shared, device and api coverage tests: python3 ai/features/uat-2/coverage-sweep/mutants_shared_device_api.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

mutate.MUTATIONS[:] = [
    # --- shared/config.ts: configBuildSwitches.test.ts ---
    ('shared/config.ts', "process.env.NODE_ENV === 'test'", "process.env.NODE_ENV !== 'production'", 'isTest true with no NODE_ENV'),
    ('shared/config.ts', "process.env.NODE_ENV === 'test'", "process.env.NODE_ENV === 'testing'", 'isTest false under jest'),
    ('shared/config.ts', "process.env.NODE_ENV === 'test'", "process.env.NODE_ENV !== 'development'", 'isTest true in production'),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === '1'", 'Boolean(process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW)', "What's New preview on for any value"),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === '1'", 'Number(process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW) === 1', "What's New preview on for ' 1' and '01'"),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === '1'", "process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === 'true'", "What's New preview off for '1'"),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === '1'", "process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW !== '0'", "What's New preview on when unset"),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_BG_DEBUG === '1'", 'process.env.EXPO_PUBLIC_BG_DEBUG !== undefined', 'background debug on for any value'),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_BG_DEBUG === '1'", "process.env.EXPO_PUBLIC_BG_DEBUG === 'true'", "background debug off for '1'"),
    ('shared/config.ts', "process.env.EXPO_PUBLIC_BG_DEBUG === '1'", "process.env.EXPO_PUBLIC_BG_DEBUG !== '0'", 'background debug on when unset'),

    # --- shared/logger.ts: loggerTestGate.test.ts ---
    ('shared/logger.ts', '  if (isTest() && !process.env.DEBUG_TESTS) return false;\n', '', 'jest runs log'),
    ('shared/logger.ts', 'if (isTest() && !process.env.DEBUG_TESTS) return false;', 'if (isTest()) return false;', 'DEBUG_TESTS ignored'),
    ('shared/logger.ts', '  if (isProd() || isPreview()) return false;\n', '  if (isTest() && process.env.DEBUG_TESTS) return true;\n  if (isProd() || isPreview()) return false;\n', 'DEBUG_TESTS beats the production gate'),

    # --- shared/notifications.ts: notificationsInit.test.ts ---
    ('shared/notifications.ts', '      if (registerBackgroundTaskFn) {\n        await registerBackgroundTaskFn();\n      }\n', '', 'background task never registered'),
    ('shared/notifications.ts', "    } else {\n      logger.info('NOTIFICATION: Notifications disabled", "    } else {\n      await registerBackgroundTaskFn?.();\n      logger.info('NOTIFICATION: Notifications disabled", 'background task registered without permission'),
    ('shared/notifications.ts', '    await deleteLegacyAndroidAudioChannels();\n', '', 'legacy channels kept at start-up'),
    ('shared/notifications.ts', '    await createDefaultAndroidChannel();\n', '', 'athan_1_v2 not created at start-up'),
    ('shared/notifications.ts', '    await createExtrasAndroidChannel();\n\n    const hasPermission', '\n    const hasPermission', 'extras channel not created at start-up'),
    ('shared/notifications.ts', '    await createDefaultAndroidChannel();\n    await createExtrasAndroidChannel();\n\n    const hasPermission = await checkPermissions();\n    if (hasPermission) {\n      await refreshFn();\n', '    const hasPermission = await checkPermissions();\n    if (hasPermission) {\n      await refreshFn();\n      await createDefaultAndroidChannel();\n      await createExtrasAndroidChannel();\n', 'channels created after the first refresh'),
    ('shared/notifications.ts', 'Notifications.deleteNotificationChannelAsync(channelId).catch(() => undefined)', 'Notifications.deleteNotificationChannelAsync(channelId)', 'one failed legacy delete aborts start-up'),

    # --- shared/perf.ts: perfBackgroundFlush.test.ts ---
    ('shared/perf.ts', "  if (state === 'background') {", "  if (state !== 'active') {", 'ring flushed on inactive'),
    ('shared/perf.ts', "  if (state === 'background') {", "  if (state !== 'inactive') {", 'ring flushed on active'),
    ('shared/perf.ts', "    flushRing('background');", "    flushRing('init');", 'background flush mislabelled'),
    ('shared/perf.ts', "  AppState.addEventListener('change', handleAppStateChange);\n", '', 'app state never observed'),
    ('shared/perf.ts', '...(detail ? { detail } : {})', '...{}', 'measure detail dropped'),

    # --- shared/time.ts: ramadanSeasonIntl.test.ts ---
    ('shared/time.ts', '  } catch {\n    return false;\n  }\n};', '  } catch {\n    return true;\n  }\n};', 'Intl failure turns the season on'),
    ('shared/time.ts', '  } catch {\n    return false;\n  }\n};', '  } catch (error) {\n    throw error;\n  }\n};', 'Intl failure throws into render'),
    ('shared/time.ts', "if (month === '9') return true;", "if (month === '10') return true;", 'Ramadan read as Shawwal (control)'),
    ('shared/time.ts', 'return day >= 30 - ISLAMIC_DAY.RAMADAN_DECORATION_DAYS_BEFORE;', 'return day > 30;', "Sha'ban window removed (control)"),
    ('shared/time.ts', '    return false;\n  } catch {\n    return false;\n  }\n};', '    return true;\n  } catch {\n    return false;\n  }\n};', 'every month in season (control)'),

    # --- device/notifications.ts: androidChannelUpdate.test.ts ---
    ('device/notifications.ts', 'name: `Athan ${sound + 1}`', 'name: `Athan ${sound}`', 'picked channel named one low'),
    ('device/notifications.ts', 'sound: `athan${sound + 1}.mp3`', 'sound: `athan${sound}.mp3`', 'picked channel plays the athan before'),
    ('device/notifications.ts', 'importance: Notifications.AndroidImportance.MAX,', 'importance: Notifications.AndroidImportance.HIGH,', 'picked channel at HIGH importance'),
    ('device/notifications.ts', 'bypassDnd: true,', 'bypassDnd: false,', 'picked channel silenced by Do Not Disturb'),
    ('device/notifications.ts', 'const channelId = NotificationUtils.athanAndroidChannelId(sound);', 'const channelId = NotificationUtils.athanAndroidChannelId(sound + 1);', 'picked channel id one high'),
    ('device/notifications.ts', "  if (Platform.OS !== 'android') return;\n\n  const channelId = NotificationUtils.athanAndroidChannelId(sound);", '  const channelId = NotificationUtils.athanAndroidChannelId(sound);', 'channel created on iOS'),
    ('device/notifications.ts', 'vibrationPattern: [0, 250, 250, 250],\n    bypassDnd: true,\n  });\n\n  return channelId;', 'vibrationPattern: [0, 500],\n    bypassDnd: true,\n  });\n\n  return channelId;', 'picked channel vibrates differently'),
    ('shared/notifications.ts', '    importance: Notifications.AndroidImportance.MAX,\n    enableVibrate: true,\n    vibrationPattern: [0, 250, 250, 250],\n    bypassDnd: true,\n  });\n\n  createdAthanChannels.add(channelId);', '    importance: Notifications.AndroidImportance.HIGH,\n    enableVibrate: true,\n    vibrationPattern: [0, 250, 250, 250],\n    bypassDnd: true,\n  });\n\n  createdAthanChannels.add(channelId);', 'schedule-time athan channel drifts'),

    # --- device/notifications.ts: reminderCancelFailure.test.ts ---
    ('device/notifications.ts', "Notifications.cancelScheduledNotificationAsync(reminder.id).catch((error) =>\n      logger.warn('REMINDER SYSTEM: Failed to cancel reminder:', { id: reminder.id, error })\n    )", 'Notifications.cancelScheduledNotificationAsync(reminder.id)', 'one failed reminder cancel rejects'),
    ('device/notifications.ts', '{ id: reminder.id, error }', '{ error }', 'failed cancel logged without its id'),
    ('device/notifications.ts', "  const promises = reminders.map((reminder) =>\n    Notifications.cancelScheduledNotificationAsync(reminder.id).catch((error) =>\n      logger.warn('REMINDER SYSTEM: Failed to cancel reminder:', { id: reminder.id, error })\n    )\n  );\n  await Promise.all(promises);", "  for (const reminder of reminders) {\n    try {\n      await Notifications.cancelScheduledNotificationAsync(reminder.id);\n    } catch (error) {\n      logger.warn('REMINDER SYSTEM: Failed to cancel reminder:', { id: reminder.id, error });\n      break;\n    }\n  }", 'cancels stop at the first failure'),

    # --- api/client.ts: clientProductionBuild.test.ts ---
    ('api/client.ts', 'if (!isProd() && !isPreview()) return MOCK_DATA_SIMPLE;', 'if (!isPreview()) return MOCK_DATA_SIMPLE;', 'production build serves the mock year'),
    ('api/client.ts', 'if (!isProd() && !isPreview()) {\n    const mockDay', 'if (!isPreview()) {\n    const mockDay', 'production build serves the mock day'),
    ('api/client.ts', 'if (!isProd() && !isPreview()) return MOCK_DATA_SIMPLE;', 'if (!isProd()) return MOCK_DATA_SIMPLE;', 'preview build serves the mock year'),
    ('api/client.ts', 'if (!isProd() && !isPreview()) {\n    const mockDay', 'if (!isProd()) {\n    const mockDay', 'preview build serves the mock day'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])
