// Helper function to check if a day is today or in the future
export const isTodayOrFuture = (date: string): boolean => {
  const today = new Date();
  const dayDate = new Date(date);
  return dayDate >= today;
};