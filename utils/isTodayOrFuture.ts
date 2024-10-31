// Helper function to check if a day is today or in the future
export const isTodayOrFuture = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight

  const dayDate = new Date(date);
  dayDate.setHours(0, 0, 0, 0); // Set time to midnight for comparison

  return dayDate >= today;
};