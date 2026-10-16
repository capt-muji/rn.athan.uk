/**
 * The coarsest fix the platform offers, because 3 km of error moves the qibla under 0.15 degrees.
 *
 * The cached fix is preferred and is usually instant: waiting on a fresh one leaves the sheet empty for seconds,
 * and at this tolerance a stale position is as good as a new one.
 */
export const readPosition = async (): Promise<Coordinates> => {
  const cached = await Location.getLastKnownPositionAsync();
  const { coords } = cached ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }));

  return { latitude: coords.latitude, longitude: coords.longitude };
};
