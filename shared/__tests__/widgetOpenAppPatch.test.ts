/**
 * The patch that lets an Android widget tap open the app
 * (patches/expo-widgets+58.0.3.patch)
 *
 * The widget layout wraps every Android card in a Button carrying `openApp`,
 * a prop the patch adds to expo-widgets. Nothing else in the repository
 * fails if the patch stops applying: the widget would simply go inert
 * again. These tests are what notice.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const read = (relative: string): string => readFileSync(join(ROOT, relative), 'utf8');

const CONVERTER = 'node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt';

const installedVersion = (): string =>
  (JSON.parse(read('node_modules/expo-widgets/package.json')) as { version: string }).version;

describe('the open-the-app patch', () => {
  it('names the installed expo-widgets version', () => {
    // patch-package silently skips a patch whose version does not match, so a
    // dependency bump must fail here rather than go quiet on the phone
    expect(existsSync(join(ROOT, 'patches', `expo-widgets+${installedVersion()}.patch`))).toBe(true);
  });

  it('applies to the installed converter', () => {
    const converter = read(CONVERTER);

    expect(converter).toContain('val openApp: Boolean = false,');
    expect(converter).toContain('actionStartActivity(intent)');
  });

  it('patches one file, under android/src', () => {
    const patch = read(`patches/expo-widgets+${installedVersion()}.patch`);
    const headers = patch.split('\n').filter((line) => line.startsWith('diff --git'));

    expect(headers).toHaveLength(1);
    expect(headers[0]).toContain('node_modules/expo-widgets/android/src/');
    expect(patch).not.toContain('/Users/');
  });

  it('keeps the library\u2019s own interaction path for a button that does not open the app', () => {
    expect(read(CONVERTER)).toContain('WidgetInteraction(source, target).toGlanceAction(context)');
  });

  it('rides a Glance API that still exists', () => {
    // A Glance upgrade that renamed this would break the patch at compile time
    // only, which no Jest run would otherwise catch. The newline matters: a
    // renamed import still contains the shorter name as a prefix
    expect(read(CONVERTER)).toContain('import androidx.glance.appwidget.action.actionStartActivity\n');
  });

  it('keeps every Android card wrapped in the tap target', () => {
    const layout = read('widgets/PrayerWidget.tsx');

    // The whole opening tag, because the cast's own `openApp?: boolean;` field
    // would satisfy a bare substring check while the prop went unset
    expect(layout).toContain('<AButtonEl openApp modifiers={[fillMaxSize()]}>');
    expect(layout).toContain("import { Box, Button, Column, Row } from '@expo/ui/jetpack-compose';");
  });
});
