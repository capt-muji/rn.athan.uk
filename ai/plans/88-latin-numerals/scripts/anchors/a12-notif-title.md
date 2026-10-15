
describe('genReminderNotificationContent', () => {
  it('creates content with correct title format', () => {
    const content = genReminderNotificationContent('fajr', 15, AlertType.Sound);
    expect(content.title).toBe('Fajr in 15m');
    expect(content.body).toBeUndefined();
  });

  it('creates content with different intervals', () => {
    expect(genReminderNotificationContent('dhuhr', 5, AlertType.Sound).title).toBe('Dhuhr in 5m');
    expect(genReminderNotificationContent('asr', 30, AlertType.Sound).title).toBe('Asr in 30m');
  });
