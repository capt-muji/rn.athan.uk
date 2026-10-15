    <Animated.Text style={[styles.prayerAgo, prayerAgoOpacityStyle, prayerAgoColorStyle, prayerAgoBackgroundStyle]}>
      {parts === null ? (
        prayerAgo
      ) : (
        <>
          {parts.before}
          {parts.groups.map((group, index) => (
            <Fragment key={group.letter}>
              {index > 0 ? ' ' : null}
              {group.digits}
              <Text style={styles.gap}> </Text>
              <Text style={styles.unitLetter}>{group.letter}</Text>
            </Fragment>
