// Mock for the home widget layout module (native widget registration is a
// side effect we don't want in tests). One mock object per registered kind
// so tests can assert each kind's pushes independently — the module
// registers the light pair (PrayerWidget, ExtrasWidget), the dark pair
// (PrayerWidgetDark, ExtrasWidgetDark), and each pair's medium kinds
// (PrayerWidgetMedium, ExtrasWidgetMedium, PrayerWidgetDarkMedium,
// ExtrasWidgetDarkMedium) on the same layout.

const makeWidgetMock = () => ({
  reload: jest.fn(),
  updateSnapshot: jest.fn(),
  updateTimeline: jest.fn(),
  getTimeline: jest.fn(async () => []),
});

export const PrayerWidget = makeWidgetMock();
export const ExtrasWidget = makeWidgetMock();
export const PrayerWidgetMedium = makeWidgetMock();
export const ExtrasWidgetMedium = makeWidgetMock();
export const PrayerWidgetDark = makeWidgetMock();
export const ExtrasWidgetDark = makeWidgetMock();
export const PrayerWidgetDarkMedium = makeWidgetMock();
export const ExtrasWidgetDarkMedium = makeWidgetMock();
