(() => {
  const REAL = Date;
  const TARGET = Date.parse('2026-11-10T12:00:00+05:00');
  function FakeDate(...args) {
    if (args.length === 0) return new REAL(TARGET);
    return new REAL(...args);
  }
  FakeDate.prototype = REAL.prototype;
  FakeDate.now = () => TARGET;
  FakeDate.parse = REAL.parse;
  FakeDate.UTC = REAL.UTC;
  window.Date = FakeDate;
})();
