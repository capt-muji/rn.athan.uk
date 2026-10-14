  const isFirstEvaluation = useSharedValue(true);
  const translateX = useDerivedValue(() => {
    const target = value ? (isRTL ? -SIZE.toggle.translateX : SIZE.toggle.translateX) : 0;
    if (isFirstEvaluation.value) {
      isFirstEvaluation.value = false;
      return target;
    }
    return withTiming(target, { duration: ANIMATION.duration });
  });
