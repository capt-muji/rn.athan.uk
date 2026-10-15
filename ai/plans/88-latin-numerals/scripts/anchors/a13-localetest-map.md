describe('localizeDigits', () => {
  it('maps Latin digits to Arabic-Indic under ar and leaves every other locale Latin', () => {
    setActiveLocale('ar');
    try {
      expect(localizeDigits('1448')).toBe('١٤٤٨');
      expect(localizeDigits('30, 1448')).toBe('٣٠, ١٤٤٨');
    } finally {
      setActiveLocale('en');
    }
    expect(localizeDigits('1448')).toBe('1448');
  });
});
