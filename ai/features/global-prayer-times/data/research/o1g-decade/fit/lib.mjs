// The 2027 source table, keyed YYYY-MM-DD.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export const data = require('../data/2027.json');
export const DAYS = Object.keys(data);
export const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
