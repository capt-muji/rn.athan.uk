/**
 * React's dev runtime errors at module scope when a forwardRef render declares only props -
 * the red strip every development build shows on launch (the settings row's own behaviour
 * suites live in LabeledToggle.test.tsx). Kept in its own file: the guard must reset the
 * module registry to re-evaluate the component, which no shared suite tolerates.
 */
it("declares LabeledToggle's forwardRef render with both parameters, silent in React's dev runtime", async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    jest.resetModules();
    require('../LabeledToggle');

    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('forwardRef render functions'),
      expect.anything()
    );
  } finally {
    errorSpy.mockRestore();
  }
});
