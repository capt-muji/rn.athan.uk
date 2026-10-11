#!/usr/bin/env bash
# Extracts job 39's anchors from the tree at the planned-at sha.
# Each anchor is a verbatim 3-to-15-line excerpt of a region a step edits.
# Usage: bash extract-anchors-39.sh   (from the repository root)
set -eu
folder="ai/plans/39-localisation/scripts/anchors"
mkdir -p "$folder"

py() { python3 - "$@"; }

py <<'EOF'
import pathlib, sys

root = pathlib.Path('.')
out = root / 'ai/plans/39-localisation/scripts/anchors'
out.mkdir(parents=True, exist_ok=True)

# (name, file, marker text, lines from marker)
ANCHORS = [
    ('i18n-locale-const', 'shared/i18n/index.ts', "export const CURRENT_LOCALE_ID = 'en'", 3),
    ('loader-body', 'shared/i18n/loader.ts', 'perfMark(\'catalog_require_start\')', 7),
    ('en-catalog-head', 'shared/i18n/en.ts', 'export const en = {', 6),
    ('bridge-import-mode', 'shared/__tests__/i18nBridge.test.ts', "if (mode === 'import') {", 10),
    ('ui-width-atoms', 'stores/ui.ts', 'export const englishWidthStandardAtom', 8),
    ('ui-legacy-seed', 'stores/ui.ts', 'const localeKey', 6),
    ('alert-options-capture', 'components/sheets/screens/Alert.tsx', 'const ALERT_OPTIONS', 6),
    ('alert-unavailable-capture', 'components/sheets/screens/Alert.tsx', 'const UNAVAILABLE_MESSAGE', 3),
    ('reminder-sound-capture', 'components/sheets/screens/ReminderCard.tsx', 'const SOUND_OPTIONS', 5),
    ('help-action-capture', 'shared/help.ts', 'export const HELP_ACTION_LABELS', 4),
    ('whatsnew-visible-capture', 'shared/whatsNew.ts', 'export const VISIBLE_WHATS_NEW', 3),
    ('width-measure-pick', 'components/ui/InitialWidthMeasurement.tsx', 'getLongestPrayerNameIndex', 6),
    ('appjson-plugins-head', 'app.json', '"plugins"', 4),
    ('appjson-infoplist', 'app.json', '"infoPlist"', 6),
    ('settings-display-card', 'components/sheets/screens/Settings.tsx', '{/* Display Card */}', 8),
    ('sound-commit-dismiss', 'components/sheets/screens/Sound.tsx', 'const handleDismiss', 8),
    ('reschedule-driver-head', 'stores/notifications.ts', 'const _rescheduleAllNotifications = async', 6),
    ('commit-sound-shape', 'stores/notifications.ts', 'export const commitSoundSelection', 6),
    ('channel-caches', 'shared/notifications.ts', 'const createdReminderChannels', 6),
    ('reminder-channel-name', 'shared/notifications.ts', 'export const createReminderAndroidChannel', 12),
    ('listeners-foreground', 'device/listeners.ts', 'returningToForeground', 8),
    ('app-init-timeout', 'app/index.tsx', 'initializeNotifications', 6),
    ('update-android-channel', 'device/notifications.ts', 'export const updateAndroidChannel', 10),
    ('format-date-long', 'shared/time.ts', 'export const formatDateLong', 6),
    ('format-hijri-long', 'shared/time.ts', 'export const formatHijriDateLong', 12),
    ('shown-date-format', 'components/day/shownDate.ts', 'export const formatShownDate', 6),
    ('widget-date-label', 'shared/widgetTimeline.ts', 'const formatDateLabel', 5),
    ('widget-versions', 'shared/widgetTypes.ts', 'export const WIDGET_PROPS_VERSION', 4),
    ('widget-android-footer', 'widgets/PrayerWidget.tsx', 'label.split', 8),
    ('widget-ios-footer', 'widgets/PrayerWidget.tsx', 'entry.dateLabel.split', 8),
    ('widget-android-neutral', 'widgets/PrayerWidget.tsx', 'Prayer times for London', 6),
    ('widget-stale-card', 'widgets/PrayerWidget.tsx', '>Out of date<', 8),
    ('lock-layout-countdown', 'widgets/LockPrayerWidget.tsx', 'const AthanLockWidgetCountdownPair', 4),
    ('lock-layout-centred', 'widgets/LockPrayerWidget.tsx', 'const AthanLockWidgetCentred', 4),
    ('lock-layout-stacked', 'widgets/LockPrayerWidget.tsx', 'const AthanLockWidgetStacked', 4),
    ('patch-file-head', 'patches/expo-widgets+58.0.14.patch', 'diff --git', 4),
    ('ios-runtime-context', 'node_modules/expo-widgets/ios/Widgets/WidgetsJSRuntime.swift', 'context.evaluateScript(script)', 6),
    ('android-runtime-global', 'node_modules/expo-widgets/android/src/main/cpp/WidgetsHermesRuntime.cpp', '__expoWidgetLayout', 4),
    ('whatsnew-archive-head', 'shared/whatsNew.ts', 'export const WHATS_NEW', 6),
    ('qibla-cardinals', 'shared/qiblaCompass.ts', 'export const CARDINALS', 6),
    ('flows-sheets-head', 'e2e/flows/sheets-x10.yaml', 'appId', 4),
    ('scan-guard-suite', 'shared/__tests__/stringGuard.test.ts', "execFileSync('node', ['scripts/scan-strings.mjs', '', '--guard'", 4),
    ('gradle-default-config', 'android/app/build.gradle', "applicationId 'com.mugtaba.athan'", 4),
]

for name, file, marker, length in ANCHORS:
    text = (root / file).read_text()
    idx = text.find(marker)
    if idx < 0:
        sys.exit(f'anchor {name}: marker not found in {file}: {marker!r}')
    lines = text[idx:].splitlines()[:length]
    if len(lines) < 3:
        sys.exit(f'anchor {name}: only {len(lines)} lines')
    (out / f'{name}.txt').write_text('\n'.join(lines) + '\n')
    print(f'{name}: {len(lines)} lines from {file}')
EOF
echo "EXTRACT OK"
