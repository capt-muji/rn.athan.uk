(() => {
  const REAL = Date;
  let t = Number(new URLSearchParams(location.search).get('__f'));
  if (!t || Number.isNaN(t)) return;
  function FakeDate(...args) {
    if (args.length === 0) return new REAL(t);
    return new REAL(...args);
  }
  FakeDate.prototype = REAL.prototype;
  FakeDate.now = () => t;
  FakeDate.parse = REAL.parse;
  FakeDate.UTC = REAL.UTC;
  window.Date = FakeDate;
})();
