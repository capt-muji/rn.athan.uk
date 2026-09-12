/**
 * Unit tests for device/listeners.ts (AUDIT-FINDINGS #15)
 *
 * The AppState handler is the only thing that catches a resume up to the wall
 * clock: the OS freezes JS in the background, so a suspension that crossed a
 * prayer boundary leaves the overlay open, the countdowns stale and the
 * sequence a day behind until this runs. The finding was that registering the
 * listener inside app/index.tsx's 1500 ms defer made it capture
 * `previousAppState` as 'active' on a resume, so that resume ran none of it.
 *
 * Registration timing itself lives in app/index.tsx and is NOT covered here —
 * jest.config.js matches `.ts` only and the repo has no component-test
 * harness, so there is nothing that can mount the screen.
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockSetStyle = jest.fn();
const mockSetHidden = jest.fn();
jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: {
    setStyle: (...args: unknown[]) => mockSetStyle(...args),
    setHidden: (...args: unknown[]) => mockSetHidden(...args),
  },
}));

const mockInitializeNotifications = jest.fn();
jest.mock('@/shared/notifications', () => ({
  initializeNotifications: (...args: unknown[]) => mockInitializeNotifications(...args),
}));

const mockCheckOverlayBoundary = jest.fn();
const mockResyncCountdowns = jest.fn();
jest.mock('@/stores/countdown', () => ({
  checkOverlayBoundary: () => mockCheckOverlayBoundary(),
  resyncCountdowns: () => mockResyncCountdowns(),
}));

const mockRefreshNotifications = jest.fn();
const mockRegisterBackgroundTask = jest.fn();
jest.mock('@/stores/notifications', () => ({
  refreshNotifications: () => mockRefreshNotifications(),
  registerBackgroundTask: () => mockRegisterBackgroundTask(),
}));

const mockSync = jest.fn(() => Promise.resolve());
jest.mock('@/stores/sync', () => ({
  sync: () => mockSync(),
}));

const mockBumpResync = jest.fn();
jest.mock('@/stores/ui', () => ({
  bumpResync: () => mockBumpResync(),
}));

const mockInitWidgetSettingsSync = jest.fn();
jest.mock('@/stores/widget', () => ({
  initWidgetSettingsSync: () => mockInitWidgetSettingsSync(),
}));

// =============================================================================
// TEST SETUP
// =============================================================================

type AppStateHandler = (state: string) => void;

/**
 * `listenersInitialized` is a module-level latch, so every test needs a fresh
 * module registry — which also re-evaluates the react-native mock, hence
 * re-requiring AppState here rather than importing it at the top.
 */
const loadListeners = () => {
  jest.resetModules();
  const { AppState } = require('react-native');
  const { initializeListeners } = require('../listeners');
  return { AppState, initializeListeners };
};

/** The handler AppState.addEventListener was registered with. */
const registeredHandler = (AppState: { addEventListener: jest.Mock }): AppStateHandler =>
  AppState.addEventListener.mock.calls[0][1];

const checkPermissions = jest.fn(() => Promise.resolve(true));

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// TESTS
// =============================================================================

describe('initializeListeners', () => {
  it('subscribes to AppState changes', () => {
    const { AppState, initializeListeners } = loadListeners();

    initializeListeners(checkPermissions);

    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener.mock.calls[0][0]).toBe('change');
  });

  it('starts the widget settings sync', () => {
    const { initializeListeners } = loadListeners();

    initializeListeners(checkPermissions);

    expect(mockInitWidgetSettingsSync).toHaveBeenCalledTimes(1);
  });

  it('runs every resume action when the app returns from the background', () => {
    const { AppState, initializeListeners } = loadListeners();
    initializeListeners(checkPermissions);
    const handler = registeredHandler(AppState);

    handler('background');
    handler('active');

    expect(mockCheckOverlayBoundary).toHaveBeenCalledTimes(1);
    expect(mockResyncCountdowns).toHaveBeenCalledTimes(1);
    expect(mockBumpResync).toHaveBeenCalledTimes(1);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('re-applies the system bars and re-initializes notifications on that resume', () => {
    const { AppState, initializeListeners } = loadListeners();
    initializeListeners(checkPermissions);
    const handler = registeredHandler(AppState);

    handler('background');
    handler('active');

    expect(mockSetStyle).toHaveBeenCalledWith('light');
    expect(mockSetHidden).toHaveBeenCalledWith({ navigationBar: false });
    expect(mockInitializeNotifications).toHaveBeenCalledWith(
      checkPermissions,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('does nothing while the app is still in the background', () => {
    const { AppState, initializeListeners } = loadListeners();
    initializeListeners(checkPermissions);
    const handler = registeredHandler(AppState);

    handler('background');

    expect(mockCheckOverlayBoundary).not.toHaveBeenCalled();
    expect(mockResyncCountdowns).not.toHaveBeenCalled();
    expect(mockBumpResync).not.toHaveBeenCalled();
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('catches up the UI on an inactive to active resume without re-syncing data', () => {
    // iOS raises 'inactive' for the app switcher and control centre. The
    // countdowns must still snap to the wall clock, but a glance away is not
    // worth a network fetch or a notification reschedule.
    const { AppState, initializeListeners } = loadListeners();
    initializeListeners(checkPermissions);
    const handler = registeredHandler(AppState);

    handler('inactive');
    handler('active');

    expect(mockCheckOverlayBoundary).toHaveBeenCalledTimes(1);
    expect(mockResyncCountdowns).toHaveBeenCalledTimes(1);
    expect(mockBumpResync).toHaveBeenCalledTimes(1);
    expect(mockSync).not.toHaveBeenCalled();
    expect(mockInitializeNotifications).not.toHaveBeenCalled();
  });

  it('runs the resume path again on every subsequent round trip', () => {
    const { AppState, initializeListeners } = loadListeners();
    initializeListeners(checkPermissions);
    const handler = registeredHandler(AppState);

    handler('background');
    handler('active');
    handler('background');
    handler('active');

    expect(mockCheckOverlayBoundary).toHaveBeenCalledTimes(2);
    expect(mockResyncCountdowns).toHaveBeenCalledTimes(2);
    expect(mockBumpResync).toHaveBeenCalledTimes(2);
    expect(mockSync).toHaveBeenCalledTimes(2);
  });

  it('swallows a failing foreground sync so the resume path still completes', async () => {
    mockSync.mockRejectedValueOnce(new Error('network down'));
    const { AppState, initializeListeners } = loadListeners();
    initializeListeners(checkPermissions);
    const handler = registeredHandler(AppState);

    handler('background');
    expect(() => handler('active')).not.toThrow();
    await Promise.resolve();

    expect(mockBumpResync).toHaveBeenCalledTimes(1);
  });

  it('ignores a second call so the handler is never stacked', () => {
    // The subscription is never removed, and React StrictMode double-invokes
    // mount effects in dev — a stacked handler would double every resume action
    const { AppState, initializeListeners } = loadListeners();

    initializeListeners(checkPermissions);
    initializeListeners(checkPermissions);

    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    expect(mockInitWidgetSettingsSync).toHaveBeenCalledTimes(1);

    const handler = registeredHandler(AppState);
    handler('background');
    handler('active');

    expect(mockResyncCountdowns).toHaveBeenCalledTimes(1);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });
});
