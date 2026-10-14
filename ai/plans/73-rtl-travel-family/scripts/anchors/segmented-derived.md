  const isFirstEvaluation = useSharedValue(true);
  const translateXPercent = useDerivedValue(() => {
    const slot = isRTL ? -selectedIndex : selectedIndex;
    const target = slot * 100;
    if (isFirstEvaluation.value) {
      isFirstEvaluation.value = false;
      return target;
    }
    return withTiming(target, { duration: ANIMATION.duration });
  });
