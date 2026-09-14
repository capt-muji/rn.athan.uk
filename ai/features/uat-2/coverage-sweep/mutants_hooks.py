#!/usr/bin/env python3
"""Mutation pass for the hooks coverage tests: python3 ai/features/uat-2/coverage-sweep/mutants_hooks.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

mutate.MUTATIONS[:] = [
    # --- hooks/useAnimation.ts: useDerivedProgress ---
    ('hooks/useAnimation.ts', 'if (isFirstEvaluation.value || lastResync.value !== resync) {', 'if (lastResync.value !== resync) {', 'first evaluation animates instead of settling'),
    ('hooks/useAnimation.ts', 'if (isFirstEvaluation.value || lastResync.value !== resync) {', 'if (isFirstEvaluation.value) {', 'a resume no longer settles'),
    ('hooks/useAnimation.ts', '      isFirstEvaluation.value = false;\n', '', 'every evaluation settles'),
    ('hooks/useAnimation.ts', '      lastResync.value = resync;\n', '', 'everything after a resume settles'),
    ('hooks/useAnimation.ts', 'if (latched.current.target !== target) latched.current = { target, options };', 'latched.current = { target, options };', 'new options restart a transition mid-flight'),
    ('hooks/useAnimation.ts', 'if (latched.current.target !== target) latched.current = { target, options };', '', 'timing latched at mount forever'),
    ('hooks/useAnimation.ts', 'const easing = latched.current.options?.easing;', 'const easing = options?.easing;', 'easing read past the latch'),
    ('hooks/useAnimation.ts', 'const useDefaultTiming = latched.current.options?.defaultTiming ?? false;', 'const useDefaultTiming = options?.defaultTiming ?? false;', 'defaultTiming read past the latch'),
    ('hooks/useAnimation.ts', 'const duration = latched.current.options?.duration ?? ANIMATION.duration;', 'const duration = latched.current.options?.duration ?? ANIMATION.durationSlow;', 'default derived duration drifts'),
    ('hooks/useAnimation.ts', 'const delay = latched.current.options?.delay ?? 0;', 'const delay = 0;', 'derived delay ignored'),
    ('hooks/useAnimation.ts', 'easing !== undefined ? { duration, easing } : { duration }', '{ duration, easing }', 'undefined easing passed explicitly'),
    ('hooks/useAnimation.ts', 'const useDefaultTiming = latched.current.options?.defaultTiming ?? false;', 'const useDefaultTiming = latched.current.options?.defaultTiming ?? true;', 'defaultTiming on unless asked'),
    ('hooks/useAnimation.ts', 'const config = useDefaultTiming ? undefined : ', 'const config = ', 'defaultTiming ignored'),
    ('hooks/useAnimation.ts', 'return delay > 0 ? withDelay(delay, animation) : animation;', 'return delay >= 0 ? withDelay(delay, animation) : animation;', 'zero delay still wrapped'),

    # --- hooks/useAnimation.ts: derived wrappers ---
    ('hooks/useAnimation.ts', 'const progress = useDerivedProgress(target, options);\n  return useAnimatedStyle(() => ({ opacity: progress.value }));', 'const progress = useDerivedProgress(target);\n  return useAnimatedStyle(() => ({ opacity: progress.value }));', 'opacity wrapper drops its options'),
    ('hooks/useAnimation.ts', 'const progress = useDerivedProgress(target, options);\n  return useAnimatedStyle(() => ({ transform: [{ translateY', 'const progress = useDerivedProgress(target);\n  return useAnimatedStyle(() => ({ transform: [{ translateY', 'translateY wrapper drops its options'),
    ('hooks/useAnimation.ts', '  return useAnimatedStyle(() => ({ transform: [{ translateY: progress.value }] }));', '  return useAnimatedStyle(() => ({ transform: [{ translateY: 0 }] }));', 'translateY wrapper ignores progress'),
    ('hooks/useAnimation.ts', '    color: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),', '    color: interpolateColor(progress.value, [0, 1], [toColor, fromColor]),', 'text colour range reversed'),
    ('hooks/useAnimation.ts', '    backgroundColor: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),', '    backgroundColor: interpolateColor(progress.value, [0, 1], [toColor, fromColor]),', 'background colour range reversed'),
    ('hooks/useAnimation.ts', '    fill: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),', '    fill: interpolateColor(progress.value, [0, 1], [toColor, fromColor]),', 'fill colour range reversed'),
    ('hooks/useAnimation.ts', 'const progress = useDerivedProgress(target, { duration, delay, easing, defaultTiming });\n  return useAnimatedStyle(() => ({\n    color:', 'const progress = useDerivedProgress(target, { duration, easing, defaultTiming });\n  return useAnimatedStyle(() => ({\n    color:', 'colour wrapper drops delay'),
    ('hooks/useAnimation.ts', 'const progress = useDerivedProgress(target, { duration, delay, easing, defaultTiming });\n  return useAnimatedStyle(() => ({\n    backgroundColor', 'const progress = useDerivedProgress(target, { duration, delay, defaultTiming });\n  return useAnimatedStyle(() => ({\n    backgroundColor', 'background wrapper drops easing'),
    ('hooks/useAnimation.ts', 'const progress = useDerivedProgress(target, { duration, delay, easing, defaultTiming });\n  return useAnimatedProps(', 'const progress = useDerivedProgress(target, { duration, delay, easing });\n  return useAnimatedProps(', 'fill wrapper drops defaultTiming'),

    # --- hooks/useAnimation.ts: imperative hooks ---
    ('hooks/useAnimation.ts', 'export const useAnimationOpacity = (initialValue: number = 0)', 'export const useAnimationOpacity = (initialValue: number = 1)', 'opacity mounts visible by default'),
    ('hooks/useAnimation.ts', 'export const useAnimationScale = (initialValue: number = 1)', 'export const useAnimationScale = (initialValue: number = 0.9)', 'scale mounts pressed by default'),
    ('hooks/useAnimation.ts', 'export const useAnimationOpacity = (initialValue: number = 0) => {\n  const value = useSharedValue(initialValue);', 'export const useAnimationOpacity = (initialValue: number = 0) => {\n  const value = useSharedValue(0);', 'opacity ignores its initial value'),
    ('hooks/useAnimation.ts', 'export const useAnimationScale = (initialValue: number = 1) => {\n  const value = useSharedValue(initialValue);', 'export const useAnimationScale = (initialValue: number = 1) => {\n  const value = useSharedValue(1);', 'scale ignores its initial value'),
    ('hooks/useAnimation.ts', '  duration: ANIMATION.durationSlow,\n};', '  duration: ANIMATION.duration,\n};', 'imperative fade default drifts'),
    ('hooks/useAnimation.ts', 'duration: options?.duration ?? customConfig?.duration ?? DEFAULT_TIMING.duration,', 'duration: customConfig?.duration ?? DEFAULT_TIMING.duration,', 'imperative fade ignores its duration'),
    ('hooks/useAnimation.ts', '  });\n\n  return options?.delay ? withDelay(options.delay, animation) : animation;\n}\n\n/**\n * Helper to create a spring', '  });\n\n  return withDelay(options?.delay ?? 0, animation);\n}\n\n/**\n * Helper to create a spring', 'fade always delayed'),
    ('hooks/useAnimation.ts', '  });\n\n  return options?.delay ? withDelay(options.delay, animation) : animation;\n}\n\n/**\n * Hook for animating opacity', '  });\n\n  return animation;\n}\n\n/**\n * Hook for animating opacity', 'spring delay ignored'),
    ('hooks/useAnimation.ts', 'const animation = withTiming(toValue, timing, (finished) => {\n    if (finished && options?.onFinish)', 'const animation = withTiming(toValue, timing, (finished) => {\n    if (options?.onFinish)', 'fade reports a cut-short finish'),
    ('hooks/useAnimation.ts', 'const animation = withTiming(toValue, timing, (finished) => {\n    if (finished && options?.onFinish) runOnJS(options.onFinish)();', 'const animation = withTiming(toValue, timing, (finished) => {\n    if (finished) runOnJS(options?.onFinish as () => void)();', 'fade calls a missing onFinish'),
    ('hooks/useAnimation.ts', 'withSpring(toValue, DEFAULT_SPRING, (finished) => {\n    if (finished && options?.onFinish)', 'withSpring(toValue, DEFAULT_SPRING, (finished) => {\n    if (options?.onFinish)', 'spring reports a cut-short finish'),
    ('hooks/useAnimation.ts', 'withSpring(toValue, DEFAULT_SPRING, (finished) => {\n    if (finished && options?.onFinish) runOnJS(options.onFinish)();', 'withSpring(toValue, DEFAULT_SPRING, (finished) => {\n    if (finished) runOnJS(options?.onFinish as () => void)();', 'spring calls a missing onFinish'),
    ('hooks/useAnimation.ts', '  stiffness: 500,\n', '  stiffness: 400,\n', 'house press spring drifts'),
    ('hooks/useAnimation.ts', '    opacity: value.value,\n', '    opacity: 1,\n', 'opacity style ignores its value'),
    ('hooks/useAnimation.ts', '    transform: [{ scale: value.value }],\n', '    transform: [{ scale: 1 }],\n', 'scale style ignores its value'),

    # --- hooks/useAlertSwapBounce.ts ---
    ('hooks/useAlertSwapBounce.ts', 'const scaleX = useSharedValue(1);', 'const scaleX = useSharedValue(0.6);', 'bounce mounts dipped'),
    ('hooks/useAlertSwapBounce.ts', 'const SCALE_DIP = 0.6;', 'const SCALE_DIP = 0.5;', 'dip depth drifts'),
    ('hooks/useAlertSwapBounce.ts', 'const dip = ANIMATION.alertBounceDip;', 'const dip = ANIMATION.duration;', 'dip duration drifts'),
    ('hooks/useAlertSwapBounce.ts', 'Easing.bezier(0.23, 1, 0.32, 1)', 'Easing.bezier(0.25, 1, 0.5, 1)', 'dip easing drifts'),
    ('hooks/useAlertSwapBounce.ts', '{ damping: 12, stiffness: 500, mass: 0.5 }', '{ damping: 12, stiffness: 400, mass: 0.5 }', 'bounce spring leaves the house spring'),
    ('hooks/useAlertSwapBounce.ts', 'scaleY.value = popSequence(dip, target, null);', 'scaleY.value = popSequence(dip, target, swapGlyph);', 'glyph swapped on both axes'),
    ('hooks/useAlertSwapBounce.ts', 'scaleX.value = popSequence(dip, target, swapGlyph);', 'scaleX.value = popSequence(dip, target, null);', 'glyph never swapped'),
    ('hooks/useAlertSwapBounce.ts', 'scaleX.value = popSequence(dip, target, swapGlyph);', 'swapGlyph(target);\n      scaleX.value = popSequence(dip, target, null);', 'glyph swapped before the dip'),
    ('hooks/useAlertSwapBounce.ts', 'if (finished && swapGlyph) runOnJS(swapGlyph)(target);', 'if (swapGlyph) runOnJS(swapGlyph)(target);', 'a cut-short dip still swaps'),
    ('hooks/useAlertSwapBounce.ts', 'if (finished && swapGlyph) runOnJS(swapGlyph)(target);', 'if (finished && swapGlyph) swapGlyph(target);', 'swap called from the UI thread'),

    # --- hooks/useAlertAnimations.ts ---
    ('hooks/useAlertAnimations.ts', 'const AnimScale = useAnimationScale(1);', 'const AnimScale = useAnimationScale(0.9);', 'bell press scale mounts pressed'),
    ('hooks/useAlertAnimations.ts', 'return { AnimScale, AnimSwap };', 'return { AnimScale: AnimSwap, AnimSwap: AnimScale };', 'press scale and bounce swapped'),

    # --- hooks/useChromeDeferred.ts ---
    ('hooks/useChromeDeferred.ts', 'useState(false)', 'useState(true)', 'chrome in the first commit'),
    ('hooks/useChromeDeferred.ts', '    const handle = requestAnimationFrame(() => {\n      setTimeout(() => setDeferred(true), 0);\n    });', '    const handle = requestAnimationFrame(() => {\n      setDeferred(true);\n    });', 'chrome flips inside the frame'),
    ('hooks/useChromeDeferred.ts', '    const handle = requestAnimationFrame(() => {\n      setTimeout(() => setDeferred(true), 0);\n    });', '    const handle = 0;\n    setTimeout(() => setDeferred(true), 0);', 'chrome waits for no frame'),
    ('hooks/useChromeDeferred.ts', 'setTimeout(() => setDeferred(true), 0);', 'setTimeout(() => setDeferred(true), 1000);', 'chrome waits a second after the frame'),
    ('hooks/useChromeDeferred.ts', '  }, []);', '  });', 'a frame asked for on every render'),
    ('hooks/useChromeDeferred.ts', '    return () => cancelAnimationFrame(handle);\n', '', 'unmount keeps its frame'),

    # --- hooks/usePrevious.ts ---
    ('hooks/usePrevious.ts', '  useEffect(() => {\n    ref.current = value;\n  }, [value]);\n', '', 'previous never recorded'),
    ('hooks/usePrevious.ts', '  useEffect(() => {\n    ref.current = value;\n  }, [value]);\n\n  return ref.current;', '  ref.current = value;\n\n  return ref.current;', 'previous written during render'),
    ('hooks/usePrevious.ts', '}, [value]);', '}, []);', 'previous recorded only at mount'),
    ('hooks/usePrevious.ts', '  return ref.current;', '  return value;', 'returns the current value'),
    ('hooks/usePrevious.ts', '}, [value]);', '});', 'equivalent: record after every render (must SURVIVE)'),

    # --- hooks/useWindowDimensions.ts ---
    ('hooks/useWindowDimensions.ts', "export { useWindowDimensions } from 'react-native';", "import { useWindowDimensions as live } from 'react-native';\n\nlet atLaunch: ReturnType<typeof live> | undefined;\nexport const useWindowDimensions = () => (atLaunch ??= live());", 'window size kept from launch'),

    # --- hooks/useNotification.ts ---
    ('hooks/useNotification.ts', '    shouldPlaySound: true,', '    shouldPlaySound: false,', 'foreground Athan silent'),
    ('hooks/useNotification.ts', '    shouldSetBadge: true,', '    shouldSetBadge: false,', 'foreground badge not set'),
    ('hooks/useNotification.ts', '    shouldShowBanner: true,', '    shouldShowBanner: false,', 'foreground banner hidden'),
    ('hooks/useNotification.ts', '    shouldShowList: true,\n', '', 'foreground list entry dropped'),
    ('hooks/useNotification.ts', "await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS');", "await Linking.sendIntent('android.settings.SETTINGS');", 'Android opens the general settings'),
    ('hooks/useNotification.ts', "if (Platform.OS === 'ios') await Linking.openSettings();", "if (Platform.OS === 'android') await Linking.openSettings();", 'settings destinations swapped'),
    ('hooks/useNotification.ts', "'NOTIFICATION: Failed to check notification permissions:', error);\n      return false;", "'NOTIFICATION: Failed to check notification permissions:', error);\n      return true;", 'a throwing permission API counts as granted'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])
