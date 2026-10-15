  it('composes the label from the ar calendar keys with Arabic-Indic digits', () => {
    setActiveLocale('ar');
    expect(formatDateLocalized('2026-10-11')).toBe('الأحد, ١١ أكتوبر ٢٠٢٦');
  });
