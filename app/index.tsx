import * as SplashScreen from 'expo-splash-screen';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import Navigation from '@/app/Navigation';
import { ModalUpdate, ModalWhatsNew } from '@/components/modals';
import { Overlay } from '@/components/overlay';
import { ErrorScreen } from '@/components/ui';
import { runBackgroundTaskDebugSequence } from '@/device/backgroundTaskDebug';
import { initializeListeners } from '@/device/listeners';
import { checkForUpdates, openStore } from '@/device/updates';
import { useChromeDeferred } from '@/hooks/useChromeDeferred';
import { useNotification } from '@/hooks/useNotification';
import { APP_CONFIG } from '@/shared/config';
import { COLORS, SIZE } from '@/shared/constants';
import { FEATURE_FLAGS } from '@/shared/flags';
import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { perfMark, perfMeasure } from '@/shared/perf';
import { isRamadan } from '@/shared/time';
import { shouldShowWhatsNew, VISIBLE_WHATS_NEW } from '@/shared/whatsNew';
import { refreshNotifications, registerBackgroundTask } from '@/stores/notifications';
import { standardSequenceAtom } from '@/stores/schedule';
import { syncLoadable } from '@/stores/sync';
import {
  decorationsEnabledAtom,
  decorationsLoadedAtom,
  masjidIconLoadedAtom,
  popupUpdateEnabledAtom,
  popupWhatsNewEnabledAtom,
  setPopupUpdateEnabled,
  setPopupWhatsNewEnabled,
} from '@/stores/ui';
import { getInstalledVersion, getWhatsNewShownVersion, setWhatsNewShownVersion } from '@/stores/version';

export default function Index() {
  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  // Warm-cache launches hydrate sequences synchronously (stores/bootstrap) —
  // content paints on the first commit and sync() completes in the background
  const sequenceReady = useAtomValue(standardSequenceAtom) !== null;
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);
  const whatsNewVisible = useAtomValue(popupWhatsNewEnabledAtom);
  // Splash gate: the Masjid icon's PNG arrives async (Fresco) after the first
  // content commit — hold the splash until its bitmap exists so the first
  // revealed frame is complete (no icon pop-in)
  const masjidIconLoaded = useAtomValue(masjidIconLoadedAtom);
  // Same race on the ~12 Ramadan decoration sprites: wait only when the
  // decorations are expected this session (mirrors RamadanDecorations'
  // visibility condition, computed synchronously so the gate knows at the
  // first commit — the component itself mounts chrome-deferred a frame later)
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  const decorationsExpected = isRamadan() && decorationsEnabled;
  const decorationsLoaded = useAtomValue(decorationsLoadedAtom);
  const installedVersion = getInstalledVersion();
  // Overlay + modals mount past the first content frame (launch chrome defer)
  const chromeDeferred = useChromeDeferred();
  const contentCommittedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only initialization — checkInitialPermissions is a per-render function, intentionally captured once; re-adding it would re-register listeners on every render
  useEffect(() => {
    // Self-describing builds: every log capture names its flag set
    logger.info('APP: feature flags resolved', FEATURE_FLAGS);

    // Post-paint settling window: the first moments after content commit are
    // when users swipe to the extras page. Notification init (bridge +
    // channel work), listeners, and the update check add nothing visible —
    // deferring them past that window keeps the first swipes on an idle JS
    // thread. The 12-hour refresh gate makes a ~1.5s delay immaterial.
    const initHandle = setTimeout(() => {
      // Initialize notifications, register background task, and create channel on first load
      initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask).catch((error) =>
        logger.error('Failed to initialize notifications:', error)
      );

      // Initialize background/foreground state listeners (sync UI as needed)
      initializeListeners(checkInitialPermissions);

      // Debug instrumentation for the notification-refresh background task (ISSUES.md #8)
      runBackgroundTaskDebugSequence();

      // Check for updates in background
      checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate));
    }, 1500);

    // Show the What's New modal once after an update (never on fresh installs -
    // stores/version.ts seeds the shown-version for new users). Marking shown
    // on display (not dismiss) makes a mid-display crash unable to re-loop it
    if (shouldShowWhatsNew(installedVersion, getWhatsNewShownVersion(), VISIBLE_WHATS_NEW)) {
      setWhatsNewShownVersion(installedVersion);
      setPopupWhatsNewEnabled(true);
    } else if (__DEV__ && APP_CONFIG.whatsNewPreview) {
      setPopupWhatsNewEnabled(true);
    }

    return () => clearTimeout(initHandle);
  }, []);

  // Hide the splash screen once content exists AND the launch art has loaded:
  // either the synchronous cache bootstrap already hydrated the sequences
  // (first commit paints content) or the async sync atom left its loading
  // state. The perf mark keeps its content-only semantics; only the reveal
  // waits for the Masjid icon and, in Ramadan mode, the decoration sprites.
  useEffect(() => {
    const contentExists = sequenceReady || state !== 'loading';
    if (contentExists && !contentCommittedRef.current) {
      contentCommittedRef.current = true;

      // JS-clock only: native marks live on a skewed timeline (see perf.ts),
      // so cross-clock launch spans are reconstructed offline from ring ts
      perfMark('home_content');
      perfMeasure('js_to_content', 'perf_monitor_init');
    }
    const revealReady = contentExists && masjidIconLoaded && (!decorationsExpected || decorationsLoaded);
    if (revealReady) {
      SplashScreen.hideAsync();
    }
  }, [sequenceReady, state, masjidIconLoaded, decorationsExpected, decorationsLoaded]);

  const handleCloseUpdate = () => {
    setPopupUpdateEnabled(false);
  };

  const handleUpdate = () => {
    openStore();
    setPopupUpdateEnabled(false);
  };

  const handleContinueWhatsNew = () => {
    setPopupWhatsNewEnabled(false);
  };

  // Loading state only covers genuinely cache-less launches (fresh install,
  // upgrade wipe, year gap) — warm-cache launches render content immediately
  if (!sequenceReady && state === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      </View>
    );
  }
  if (state === 'hasError') return <ErrorScreen />;

  return (
    <>
      {chromeDeferred && VISIBLE_WHATS_NEW ? (
        <ModalWhatsNew
          visible={whatsNewVisible}
          version={installedVersion}
          items={VISIBLE_WHATS_NEW.items}
          onContinue={handleContinueWhatsNew}
        />
      ) : null}
      {/* Gated so the nag never stacks on top of the What's New modal */}
      {chromeDeferred && (
        <ModalUpdate
          visible={updateAvailable && !whatsNewVisible}
          onClose={handleCloseUpdate}
          onUpdate={handleUpdate}
        />
      )}
      <Navigation />
      {chromeDeferred && <Overlay />}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
