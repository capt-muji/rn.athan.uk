import { useState, useRef, useCallback, useEffect } from 'react';

import { ANIMATION } from '@/shared/constants';

interface PopupCallbacks {
  /** Called when popup becomes active */
  onShow?: () => void;
  /** Called when popup is hidden */
  onHide?: () => void;
}

interface UseAlertPopupStateReturn {
  /** Whether popup is currently visible */
  isPopupActive: boolean;
  /** Show the popup with auto-hide timeout */
  showPopup: () => void;
  /** Clear all pending timeouts (for cleanup) */
  clearTimeouts: () => void;
}

/**
 * Hook managing Alert popup visibility and timing
 *
 * Handles:
 * - Popup show/hide with auto-dismiss timeout
 * - Cleanup of pending timeouts
 *
 * @param callbacks Optional callbacks for show/hide events
 * @returns Popup state and control functions
 *
 * @example
 * const { isPopupActive, showPopup, clearTimeouts } = useAlertPopupState({
 *   onShow: () => AnimOpacity.animate(1),
 *   onHide: () => AnimOpacity.animate(0),
 * });
 */
export const useAlertPopupState = (callbacks?: PopupCallbacks): UseAlertPopupStateReturn => {
  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showPopup = useCallback(() => {
    clearTimeouts();

    setIsPopupActive(true);
    callbacks?.onShow?.();

    // Auto-hide after popup duration
    timeoutRef.current = setTimeout(() => {
      callbacks?.onHide?.();
      setIsPopupActive(false);
    }, ANIMATION.popupDuration);
  }, [callbacks, clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return {
    isPopupActive,
    showPopup,
    clearTimeouts,
  };
};
