            <ColorPicker value={selectedColor} onChangeJS={handleColorPreview} style={styles.colorPicker}>
              <Panel1 style={styles.panel} />
              <HueSlider style={styles.hueSlider} />
              <Swatches colors={[...COLOR_PICKER_SWATCHES]} style={styles.swatches} />
              <Swatches colors={[...COLOR_PICKER_SWATCHES_2]} style={styles.swatches} />
            </ColorPicker>
