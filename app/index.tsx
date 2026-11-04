import * as SplashScreen from 'expo-splash-screen';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import Navigation from '@/app/Navigation';
import { ModalHelp, ModalUpdate, ModalWhatsNew } from '@/components/modals';
import { Overlay } from '@/components/overlay';
import { ErrorScreen } from '@/components/ui';
import IdleLadder from '@/components/warmup/IdleLadder';
import { initializeListeners } from '@/device/listeners';
import { hideSwitchCover } from '@/device/switchCover';
import { checkForUpdates, openStore } from '@/device/updates';
import { useChromeDeferred } from '@/hooks/useChromeDeferred';
import { useNotification } from '@/hooks/useNotification';
import { APP_CONFIG } from '@/shared/config';
import { COLORS, SIZE } from '@/shared/constants';
import { FEATURE_FLAGS } from '@/shared/flags';
import { t } from '@/shared/i18n';
import { isRevealReady, isWaitingForData } from '@/shared/launchGate';
import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { perfMark, perfMeasure } from '@/shared/perf';
import { decorationsVisible, isRamadan } from '@/shared/time';
import { currentVisibleWhatsNew, shouldShowWhatsNew } from '@/shared/whatsNew';
import { consumeRelaunchHandoff, languageCommitBusyAtom, reconcileLanguageSurfaces } from '@/stores/language';
import { refreshNotifications, registerBackgroundTask, reopenRefreshGateOnColdLaunch } from '@/stores/notifications';
import { standardSequenceAtom } from '@/stores/schedule';
import { syncLoadable } from '@/stores/sync';
import {
  decorationsEnabledAtom,
  decorationsLoadedAtom,
  masjidLoadedAtom,
  popupHelpEnabledAtom,
  popupUpdateEnabledAtom,
  popupWhatsNewEnabledAtom,
  setPopupHelpEnabled,
  setPopupUpdateEnabled,
  setPopupWhatsNewEnabled,
} from '@/stores/ui';
import { getInstalledVersion, getWhatsNewShownVersion, setWhatsNewShownVersion } from '@/stores/version';

// Measurement-only: fires when this module's BODY runs, so every import above
// has already evaluated. Between perf_monitor_init (app/_layout.tsx, which runs
// once _layout's own imports are done) and index_first_render below, it splits
// the launch window into "router bootstrap + this module's import graph" and
// "React render" — the fork that decides what is worth deferring (ISSUES #32).
perfMark('index_module');

// Measurement-only latch: splits the JS→content window into "render started"
// vs "content committed" (home_content). perfMark is a no-op unless
// EXPO_PUBLIC_PERF_MONITOR=1, so this costs a boolean check in production.
let firstRenderMarked = false;

// The remount key on the root re-mounts Index per language switch; the launch
// init is once per process or every switch re-runs a full reschedule ~1.5s
// after the convergence pass already armed everything.
let launchInitRan = false;

// The index suite renders a fresh launch per test from one module instance.
export const __resetLaunchInitForTests = (): void => {
  launchInitRan = false;
};

// The backstop for a first frame that never comes (a tree that never lays
// out): the reveal always lands, at worst 2s late — the chrome defer's own
// degenerate bound (hooks/useChromeDeferred.ts), which exceeds the slowest
// phone's whole mount burst.
const CONTENT_DRAWN_BACKSTOP_MS = 2000;

export default function Index() {
  if (!firstRenderMarked) {
    firstRenderMarked = true;
    perfMark('index_first_render');
  }

  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  // Warm-cache launches hydrate sequences synchronously (stores/bootstrap) —
  // content paints on the first commit and sync() completes in the background
  const sequenceReady = useAtomValue(standardSequenceAtom) !== null;
  // The switch cover lifts only outside a commit: the remount this very commit triggers
  // lands with busy still held, and its content commit would otherwise lift the cover
  // between its show and the reload
  const languageBusy = useAtomValue(languageCommitBusyAtom);
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);
  const whatsNewVisible = useAtomValue(popupWhatsNewEnabledAtom);
  const helpVisible = useAtomValue(popupHelpEnabledAtom);
  // Same race on the ~12 Ramadan decoration sprites: wait only when the
  // decorations are expected this session (mirrors RamadanDecorations'
  // visibility condition, computed synchronously so the gate knows at the
  // first commit — the component itself mounts chrome-deferred a frame later)
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  // The error screen never mounts the decorations, so waiting for their sprites there would hold the splash over the
  // one screen whose Refresh can recover the app
  const decorationsExpected = decorationsVisible(isRamadan(), decorationsEnabled) && state !== 'hasError';
  const decorationsLoaded = useAtomValue(decorationsLoadedAtom);
  // The icon gate (T-541): the bitmap decodes behind the first drawn frame, so the reveal
  // waits for it - except on the error screen, whose own Refresh must not sit under a splash
  const masjidLoaded = useAtomValue(masjidLoadedAtom);
  const installedVersion = getInstalledVersion();
  const visibleWhatsNew = currentVisibleWhatsNew();
  // Overlay + modals mount past the first content frame (launch chrome defer)
  const chromeDeferred = useChromeDeferred();
  const contentCommittedRef = useRef(false);
  // The reveal's drawn-frame latch: onLayout rides the native layout pass,
  // so the content root's first layout event IS its first drawn frame — past
  // Fabric's mount burst, which on a launch-busy phone (the 3T) trails the
  // commit by 1-2s under load, the gap where the window background (the
  // splash purple) showed through when the reveal rode the commit instead
  const [contentDrawn, setContentDrawn] = useState(false);

  useEffect(() => {
    const backstop = setTimeout(() => setContentDrawn(true), CONTENT_DRAWN_BACKSTOP_MS);
    return () => clearTimeout(backstop);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only initialization — checkInitialPermissions is a per-render function, intentionally captured once; re-adding it would re-register listeners on every render
  useEffect(() => {
    // Self-describing builds: every log capture names its flag set
    logger.info('APP: feature flags resolved', FEATURE_FLAGS);

    // Armed at mount, never deferred: the timeout below is cancelled by a
    // background inside its window, and when it does fire on a LATER resume it
    // captures `previousAppState` as 'active' — so that resume silently loses
    // the whole foreground path (overlay boundary, countdown resync, sync).
    // Cost is one AppState.addEventListener plus initWidgetSettingsSync, which
    // returns immediately off iOS and behind the widgets flag.
    initializeListeners(checkInitialPermissions);

    // Post-paint settling window: the first moments after content commit are
    // when users swipe to the extras page. Notification init (bridge +
    // channel work) and the update check add nothing visible — deferring them
    // past that window keeps the first swipes on an idle JS thread. The
    // 2-hour refresh gate makes a ~1.5s delay immaterial.
    const initHandle = setTimeout(() => {
      // The remount key re-mounts Index per language switch, and each remount
      // re-arms this timeout: the latch keeps one process to one init pass.
      if (launchInitRan) return;
      launchInitRan = true;

      // This effect runs once per cold launch, and on Android a cold launch may
      // follow a force-stop that cancelled every armed alarm without touching
      // the refresh timestamp. Reopen the gate before the refresh reads it.
      // A language relaunch is not that launch: the process lived through it and
      // the alarms with it, so the handoff marker skips the reopen and the gate
      // answers within its window.
      if (consumeRelaunchHandoff()) {
        logger.info('APP: context began as a language relaunch, skipping the cold-launch gate reopen');
      } else {
        reopenRefreshGateOnColdLaunch();
      }

      // Initialize notifications, register background task, and create channel on first load.
      // The convergence pass runs after init resolves: the scheduling lock serialises it
      // behind the init reschedule, and it catches its own failures.
      initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask)
        .then(() => reconcileLanguageSurfaces())
        .catch((error) => logger.error('Failed to initialize notifications:', error));

      // Debug instrumentation for the notification-refresh background task (ledger #8 (git history)).
      // The gate mirrors the module's own enable predicate; the env constants metro inlines
      // keep the module out of store bundles entirely.
      if (__DEV__ || process.env.EXPO_PUBLIC_BG_DEBUG === '1') {
        const { runBackgroundTaskDebugSequence } =
          require('@/device/backgroundTaskDebug') as typeof import('@/device/backgroundTaskDebug');
        runBackgroundTaskDebugSequence();
      }

      // Check for updates in background
      checkForUpdates().then((result) => setPopupUpdateEnabled(result.modal));
    }, 1500);

    // Show the What's New modal only when the archive stamps an item newer
    // than the stored shown-version - a release that adds nothing stays
    // silent, and fresh installs never qualify (stores/version.ts seeds the
    // shown-version for new users). Marking shown on display (not dismiss)
    // makes a mid-display crash unable to re-loop it
    if (shouldShowWhatsNew(installedVersion, getWhatsNewShownVersion(), currentVisibleWhatsNew())) {
      setWhatsNewShownVersion(installedVersion);
      setPopupWhatsNewEnabled(true);
    } else if (__DEV__ && APP_CONFIG.whatsNewPreview) {
      setPopupWhatsNewEnabled(true);
    }

    return () => clearTimeout(initHandle);
  }, []);

  // A reschedule that runs before the first fetch lands bails on an empty cache and
  // deliberately leaves the gate unstamped so it can run again — but nothing re-ran it
  // inside the session, and the next attempt was a background-and-foreground away. The
  // upgrade launch is where that bites: bootstrap refuses to hydrate, sync() has real
  // fetch work to do, and the post-paint refresh fires ~1.5s in, so the app could sit
  // foregrounded showing armed alerts with no alarms armed at all. Retrying once when
  // data lands closes it, and the gate makes it a no-op whenever the first attempt
  // already succeeded.
  useEffect(() => {
    if (state !== 'hasData') return;

    refreshNotifications().catch((error) => logger.error('Failed to refresh notifications after sync:', error));
  }, [state]);

  // Hide the splash screen once content exists AND the launch art has loaded:
  // either the synchronous cache bootstrap already hydrated the sequences
  // (first commit paints content) or the async sync atom left its loading
  // state. The perf mark keeps its content-only semantics; only the reveal
  // waits, and only in Ramadan mode, for the decoration sprites.
  //
  // Two paths (ledger #24 (git history)): cold launches (no cache at mount — fresh
  // install, upgrade wipe, year gap) hide the splash as soon as the spinner
  // frame commits instead of holding through the entire network fetch;
  // warm launches lift on the content's first DRAWN frame, not the commit —
  // the app straight from cache (owner order 2026-10-30), Fabric's mount
  // burst landing behind the splash instead of the window background showing
  // through, and the Masjid icon's bitmap decoding behind the revealed frame.
  // The snapshot is taken during
  // the first render only — sync completing later can never re-latch the gate.
  const waitingForData = isWaitingForData(sequenceReady, state);
  const coldLaunchRef = useRef(waitingForData);

  useEffect(() => {
    if (coldLaunchRef.current) {
      // Cold launch: the spinner branch owns the first committed frame —
      // reveal it immediately; content swaps in when the fetch completes
      SplashScreen.hideAsync();
    }

    const contentExists = !isWaitingForData(sequenceReady, state);
    if (contentExists && !contentCommittedRef.current) {
      contentCommittedRef.current = true;

      // JS-clock only: native marks live on a skewed timeline (see perf.ts),
      // so cross-clock launch spans are reconstructed offline from ring ts
      perfMark('home_content');
      // A switch's native cover hands to content here; in a context that never
      // showed one this lifts nothing
      if (!languageBusy) hideSwitchCover();
      perfMeasure('js_to_content', 'perf_monitor_init');
    }
    const revealReady = isRevealReady({
      coldLaunch: coldLaunchRef.current,
      contentExists,
      contentDrawn,
      decorationsExpected,
      decorationsLoaded,
      iconExpected: state !== 'hasError',
      iconLoaded: masjidLoaded,
    });
    if (revealReady) {
      SplashScreen.hideAsync();
    }
  }, [sequenceReady, state, contentDrawn, decorationsExpected, decorationsLoaded, masjidLoaded, languageBusy]);

  const handleCloseUpdate = () => {
    setPopupUpdateEnabled(false);
  };

  const handleUpdate = () => {
    openStore();
    setPopupUpdateEnabled(false);
  };

  const handleCloseWhatsNew = () => {
    setPopupWhatsNewEnabled(false);
  };

  const handleCloseHelp = () => {
    setPopupHelpEnabled(false);
  };

  // Loading state only covers genuinely cache-less launches (fresh install,
  // upgrade wipe, year gap) — warm-cache launches render content immediately
  if (waitingForData) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityRole={'progressbar'}
        accessibilityLabel={t('app.loadingLabel')}>
        <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      </View>
    );
  }

  // The content tree's root carries the reveal's drawn-frame latch (see
  // contentDrawn): its onLayout fires at the tree's first native layout,
  // which on Fabric is the first drawn frame
  return (
    <View style={styles.contentRoot} onLayout={() => setContentDrawn(true)} testID={'launch-content'}>
      {state === 'hasError' ? (
        <ErrorScreen />
      ) : (
        <>
          {chromeDeferred && visibleWhatsNew ? (
            <ModalWhatsNew visible={whatsNewVisible} items={visibleWhatsNew.items} onClose={handleCloseWhatsNew} />
          ) : null}
          {chromeDeferred && <ModalHelp visible={helpVisible} onClose={handleCloseHelp} />}
          {/* iOS only in effect: Android never resolves an update here, because Play's own overlay owns that flow */}
          {/* Gated so the nag never stacks on the What's New or Help modal */}
          {chromeDeferred && (
            <ModalUpdate
              visible={updateAvailable && !whatsNewVisible && !helpVisible}
              onClose={handleCloseUpdate}
              onUpdate={handleUpdate}
            />
          )}
          <Navigation />
          {chromeDeferred && <Overlay />}
          {/* The idle ladder warms behind the init burst; its stages mount here */}
          {chromeDeferred && <IdleLadder />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRoot: {
    flex: 1,
  },
});
