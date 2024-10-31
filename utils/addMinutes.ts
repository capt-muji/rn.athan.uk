
// Adds a fixed number of minutes to a given time string in HH:mm format
export const addMinutes = (time: string, incMinutes: number): string => {
  let [hours, minutes] = time.split(':').map(Number);
  
  // Add minutes
  minutes += incMinutes;

  // Handle minutes overflow
  if (minutes >= 60) {
    minutes -= 60;
    hours += 1;
  };

  // Handle hours overflow (24-hour format)
  if (hours >= 24) {
    hours -= 24;
  };

  // Format hours and minutes to always have two digits
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  // Return the new time as a string
  return `${formattedHours}:${formattedMinutes}`;
}