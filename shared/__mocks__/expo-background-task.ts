// Mock for expo-background-task

export const BackgroundTaskStatus = {
  Restricted: 1,
  Available: 2,
};

export const BackgroundTaskResult = {
  Success: 1,
  Failed: 2,
};

export const registerTaskAsync = jest.fn().mockResolvedValue(undefined);
export const unregisterTaskAsync = jest.fn().mockResolvedValue(undefined);
export const getStatusAsync = jest.fn().mockResolvedValue(BackgroundTaskStatus.Available);
export const triggerTaskWorkerForTestingAsync = jest.fn().mockResolvedValue(undefined);
