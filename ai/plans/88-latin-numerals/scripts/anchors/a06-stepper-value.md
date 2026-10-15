      <View
        accessible={true}
        accessibilityLabel={localizeDigits(t('stepper.value', { value, unit }))}
        style={styles.valueContainer}>
        <Text style={styles.value}>{localizeDigits(visible)}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
