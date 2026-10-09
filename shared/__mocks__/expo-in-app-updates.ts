/**
 * Play In-App Updates, which resolves a native module at import and throws off a device
 *
 * Answers "no update" so a suite that merely renders a screen never reaches Play. Suites that test the flow itself
 * replace this with their own jest.mock (device/__tests__/updates.test.ts).
 */

export const checkForUpdate = jest.fn(async () => ({ updateAvailable: false }));

export const startUpdate = jest.fn(async () => false);
