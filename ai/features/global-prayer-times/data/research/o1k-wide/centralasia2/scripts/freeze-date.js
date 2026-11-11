(() => {
  const REAL = Date;
  const TARGET = window.__FREEZE_MS__;
  if (typeof TARGET !== 'number') return;
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
