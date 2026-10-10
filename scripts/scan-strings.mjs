#!/usr/bin/env node
// Sob 38's string census and guard. Parses the tree with @babel/parser and
// classifies every JSX text node, string literal and template literal it can
// see. Deterministic rules, in priority order:
//   1. JSXText holding a letter -> display
//   2. StringLiteral as a JSX attribute value -> display
//   3. String/Template argument to a display-sink callee -> display
//   4. Template literal starting with a capital letter and holding a space -> review
//   5. Anything inside a logger.* / perf* call -> code
// Everything else -> code. Output: JSON on stdout, or --guard to exit 1 when
// any display hit sits outside the allowlisted modules.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOTS = process.argv[2]
  ? [process.argv[2]]
  : ['components', 'app', 'hooks', 'shared', 'stores', 'device', 'widgets'];
const DISPLAY_SINKS =
  /(label|title|text|body|message|placeholder|alert|confirm|question|answer|explanation|content|caption|subtitle|description)$/i;
const NON_DISPLAY_CALLEES = /^(logger|perfMark|perfMeasure|require|import|jest|test|it|describe|expect)$/;

const rows = [];

const walk = (node, file, ctx) => {
  if (!node || typeof node.type !== 'string') return;
  const line = node.loc ? node.loc.start.line : 0;
  let kind = null;
  let value = null;

  if (node.type === 'JSXText' && /[a-zA-Z\u00C0-\uFFFF]/.test(node.value)) {
    kind = 'display-jsx';
    value = node.value.trim();
  } else if (node.type === 'StringLiteral') {
    const parent = ctx.parent;
    if (parent && parent.type === 'JSXAttribute') {
      kind = 'display-jsx-attr';
      value = node.value;
    } else if (parent && (parent.type === 'CallExpression' || parent.type === 'NewExpression')) {
      const callee = parent.callee;
      const calleeName = callee.property ? callee.property.name : callee.name;
      if (typeof calleeName === 'string' && DISPLAY_SINKS.test(calleeName) && !NON_DISPLAY_CALLEES.test(calleeName)) {
        kind = 'display-sink';
        value = node.value;
      }
    }
  } else if (node.type === 'TemplateLiteral') {
    const cooked = node.quasis.map((q) => q.value.cooked).join('#');
    if (/^[A-Z]/.test(cooked) && / /.test(cooked)) {
      kind = 'review-template';
      value = cooked;
    }
  }

  if (kind) rows.push({ file, line, kind, value });

  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments' || key === 'trailingComments')
      continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === 'string') walk(item, file, { parent: node });
      }
    } else if (child && typeof child.type === 'string') {
      walk(child, file, { parent: node });
    }
  }
};

const files = [];
const collect = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
};
for (const root of ROOTS) {
  if (fs.existsSync(root)) collect(root);
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decoratorAutoAccessors'],
      attachComment: false,
      errorRecovery: true,
    });
  } catch {
    rows.push({ file, line: 0, kind: 'parse-error', value: '' });
    continue;
  }
  walk(ast.program, file, { parent: null });
}

if (process.argv.includes('--guard')) {
  // The allowlist of modules still holding display text (all display kinds: JSX
  // text, JSX attribute literals, display-sink arguments). Stage one ends with
  // this list empty; the data modules (help, whatsNew) are guarded by rule 3 of
  // the plan instead (they export catalog keys only).
  const allowlist = JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--guard') + 1], 'utf8'));
  const offenders = rows.filter((row) => row.kind.startsWith('display') && !allowlist.includes(row.file));
  if (offenders.length > 0) {
    for (const row of offenders) {
      process.stderr.write(`${row.file}:${row.line} ${row.kind} ${JSON.stringify(row.value)}\n`);
    }
    process.exit(1);
  }
  process.exit(0);
}

const byKind = {};
for (const row of rows) byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
const byFile = {};
for (const row of rows) {
  if (row.kind.startsWith('display') || row.kind === 'review-template') {
    byFile[row.file] = (byFile[row.file] ?? 0) + 1;
  }
}
process.stdout.write(JSON.stringify({ byKind, byFile, rows }, null, 1));
