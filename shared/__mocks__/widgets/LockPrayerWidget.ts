// Mock for the LockPrayerWidget layout module (native widget registration is a
// side effect we don't want in tests)
export default {
  reload: jest.fn(),
  updateSnapshot: jest.fn(),
  updateTimeline: jest.fn(),
  getTimeline: jest.fn(async () => []),
};
