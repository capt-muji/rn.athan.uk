  it('declares a usable version in app.json, the only one the app reads', () => {
    // Guards the assertions below from passing on two matching undefineds if the
    // key is ever moved or renamed.
    expect(typeof appJsonVersion()).toBe('string');
    expect(appJsonVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
