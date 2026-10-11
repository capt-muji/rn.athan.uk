// Writes the catalog lock (D49): one sha256 of the JSON.stringify of the en catalog per
// translated locale. Run after a deliberate English change whose translations were
// re-checked; an accidental change is caught by shared/__tests__/catalogLock.test.ts.
//
// The catalog is read through @babel/parser (the scan-strings.mjs precedent) because the
// package is CommonJS while the catalog module uses ESM export syntax, so Node's own
// TypeScript stripping cannot load it.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from '@babel/parser';

const source = await readFile(new URL('../shared/i18n/en.ts', import.meta.url), 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });

const declaration = ast.program.body.find(
  (node) => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration'
);
const declarator = declaration?.declaration.declarations.find(
  (node) => node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === 'en'
);
let literal = declarator?.init;
while (literal && (literal.type === 'TSSatisfiesExpression' || literal.type === 'TSAsExpression')) {
  literal = literal.expression;
}
if (literal?.type !== 'ObjectExpression') {
  throw new Error('catalog lock: could not find the en object literal in shared/i18n/en.ts');
}

const catalog = {};
for (const property of literal.properties) {
  if (
    property.type !== 'ObjectProperty' ||
    property.key.type !== 'StringLiteral' ||
    property.value.type !== 'StringLiteral'
  ) {
    throw new Error('catalog lock: en.ts holds a non-literal member');
  }
  catalog[property.key.value] = property.value.value;
}

const LOCALES = ['ar', 'ms', 'so', 'hi', 'th'];
const englishHash = createHash('sha256').update(JSON.stringify(catalog)).digest('hex');

const lock = Object.fromEntries(LOCALES.map((loc) => [loc, englishHash]));
await writeFile(new URL('../shared/i18n/catalog-lock.json', import.meta.url), `${JSON.stringify(lock, null, 2)}\n`);
process.stdout.write(`catalog lock written for ${LOCALES.join(', ')}\n`);
