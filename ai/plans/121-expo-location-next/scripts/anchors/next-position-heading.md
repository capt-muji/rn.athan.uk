  mocked: boolean;
  /**
   * The direction in which the device is traveling, in degrees clockwise from true north,
   * from `0` to `360`. It is unrelated to the device's orientation.
   */
  heading: number | null;
  /**
   * The uncertainty of `heading`, in degrees.
   *
   * @platform android 8+
   * @platform ios
   */
  headingAccuracy: number | null;
