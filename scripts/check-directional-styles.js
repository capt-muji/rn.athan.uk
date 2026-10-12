#!/usr/bin/env node
/**
 * The gate behind plan 58a: app source carries no physical directional style, so an RTL
 * locale can mirror the layout by direction alone. Each site that is physical on purpose
 * sits in directional-styles-allowlist.json with its reason; a pending entry is a site a
 * plan step has not converted yet.
 *
 *   node scripts/check-directional-styles.js
 *
 * Exit 0 prints DIRECTIONAL STYLES OK. Exit 1 lists every hit outside the allowlist and
 * every allowlist entry whose line is gone, either of which means the tree and the
 * allowlist disagree.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ALLOWLIST = path.join(__dirname, 'directional-styles-allowlist.json');
const SCOPE = ['api', 'app', 'components', 'device', 'hooks', 'modules', 'shared', 'stores'];

// paddingLeft and friends are single words, so \bleft: cannot see them; each needs its own pattern
const BANNED = [
  /\bpaddingLeft\b/,
  /\bpaddingRight\b/,
  /\bmarginLeft\b/,
  /\bmarginRight\b/,
  /\bborderLeft\w*/,
  /\bborderRight\w*/,
  /textAlign:\s*['"`](?:left|right)['"`]/,
  /\bleft:/,
  /\bright:/,
];

const isTestFile = (file) => file.includes('__tests__/') || /\.(?:test|spec)\.[jt]sx?$/.test(file);

const walk = (dir, out) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out);
    else if (/\.[jt]sx?$/.test(entry.name) && !isTestFile(file)) out.push(file);
  }
  return out;
};

const scanTree = (root = ROOT) => {
  const hits = [];
  for (const dir of SCOPE) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    for (const file of walk(full, [])) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((text, index) => {
        if (BANNED.some((pattern) => pattern.test(text))) {
          hits.push({ file: path.relative(root, file), line: index + 1, text: text.trim() });
        }
      });
    }
  }
  return hits;
};

const applyAllowlist = (hits, entries = JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8'))) => {
  const consumed = new Set();
  const remainder = hits.filter((hit) => {
    // One entry absorbs one hit: a second copy of an allowlisted line must stay visible
    const index = entries.findIndex(
      (entry, i) => !consumed.has(i) && entry.file === hit.file && hit.text.includes(entry.snippet)
    );
    if (index === -1) return true;
    consumed.add(index);
    return false;
  });
  const stale = entries.filter((_, index) => !consumed.has(index));
  return { remainder, stale };
};

const main = () => {
  const { remainder, stale } = applyAllowlist(scanTree());
  for (const hit of remainder) {
    process.stderr.write(`physical directional style: ${hit.file}:${hit.line}  ${hit.text}\n`);
  }
  for (const entry of stale) {
    process.stderr.write(`allowlist entry matches nothing: ${entry.file}  ${entry.snippet}\n`);
  }
  if (remainder.length === 0 && stale.length === 0) {
    process.stdout.write('DIRECTIONAL STYLES OK\n');
    return;
  }
  process.exit(1);
};

if (require.main === module) main();

module.exports = { ROOT, scanTree, applyAllowlist };
