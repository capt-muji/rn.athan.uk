// Mock for the Lock Screen widget layout module (native widget registration
// is a side effect we don't want in tests). One mock object per registered
// kind so tests can assert each kind's pushes independently — the module
// registers five layouts under eight kinds.

const makeWidgetMock = () => ({
  reload: jest.fn(),
  updateSnapshot: jest.fn(),
  updateTimeline: jest.fn(),
  getTimeline: jest.fn(async () => []),
});

export const PrayerLockWidget = makeWidgetMock();
export const ExtrasLockWidget = makeWidgetMock();
export const PrayerLockWidget2 = makeWidgetMock();
export const ExtrasLockWidget2 = makeWidgetMock();
export const PrayerLockWidget3 = makeWidgetMock();
export const ExtrasLockWidget3 = makeWidgetMock();
export const ExtrasLockWidget4 = makeWidgetMock();
export const PrayerLockWidget5 = makeWidgetMock();
