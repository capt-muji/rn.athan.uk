describe('the Athan control under RTL', () => {
  beforeEach(() => {
    jest
      .spyOn(I18nManager, 'getConstants')
      .mockReturnValue({ isRTL: true, doLeftAndRightSwapInRTL: true, localeIdentifier: 'ar' });
  });
