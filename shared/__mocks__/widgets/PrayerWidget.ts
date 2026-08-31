// Mock for the home widget layout module (native widget registration is a
// side effect we don't want in tests). One mock object per registered kind
// so tests can assert each kind's pushes independently — the module
// registers PrayerWidget and ExtrasWidget on the same layout.

const makeWidgetMock = () => ({
  reload: jest.fn(),
  updateSnapshot: jest.fn(),
  updateTimeline: jest.fn(),
  getTimeline: jest.fn(async () => []),
});

export const PrayerWidget = makeWidgetMock();
export const ExtrasWidget = makeWidgetMock();
