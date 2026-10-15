            <View style={styles.panel}>
              <Text style={styles.cause}>{localizeDigits(text)}</Text>

              {steps ? (
                <View style={styles.fix}>
                  {steps.map((step) => (
                    <View key={step} style={styles.stepRow}>
                      <Text style={styles.stepMark}>{directionGlyph('\u00bb', '\u00ab')}</Text>
                      <Text style={styles.stepText}>{localizeDigits(step)}</Text>
                    </View>
