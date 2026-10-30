/**
 * One-shot scheduling past the next paint: the frame that queued the work has
 * drawn before the work runs. A dismiss-time commit that starts scheduling
 * calls saturates the JS thread for the close haptic's window, so the haptic's
 * dispatch has left the thread before any heavy call begins.
 */
export const deferPastNextPaint = (): Promise<void> =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
