      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: optionWidth,
              transform: [{ translateX: `${(isRTL ? -selectedIndex : selectedIndex) * 100}%` }],
            },
            indicatorStyle,
          ]}
        />
      )}
