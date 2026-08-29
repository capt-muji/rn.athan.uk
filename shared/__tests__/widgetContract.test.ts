/**
 * Contract tests for the widget layout modules (widgets/*.tsx)
 *
 * The 'widget' directive serializes ONLY the widget function body into the
 * widget extension's JS runtime, where @expo/ui components resolve as
 * globals. These tests turn the handoff landmines into automated guards:
 *
 * 1. The widget function may only reference its own params/locals — never
 *    module-scope values or imports (they resolve to undefined in the
 *    extension and crash the layout).
 * 2. Palette literals in the layouts must match the app theme constants
 *    (COLORS / COUNTDOWN_BAR) so the widget cannot drift from the app.
 * 3. Widget modules must be statically imported (dynamic import() lazy-
 *    bundles without the widget babel transform -> native crash).
 * 4. Each layout exports exactly one 'widget'-directive function.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import type { ArrowFunctionExpression, File, ImportDeclaration } from '@babel/types';

import { COLORS, COUNTDOWN_BAR } from '@/shared/constants';

const WIDGET_FILES = [
  { name: 'PrayerWidget', path: join(__dirname, '../../widgets/PrayerWidget.tsx') },
  { name: 'PrayerLockWidget', path: join(__dirname, '../../widgets/LockPrayerWidget.tsx') },
] as const;

const parseFile = (path: string): File =>
  parse(readFileSync(path, 'utf8'), {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

/** Identifiers allowed to resolve outside the widget function: JS stdlib only */
const JS_GLOBALS = new Set([
  'Date',
  'Math',
  'JSON',
  'Infinity',
  'NaN',
  'undefined',
  'String',
  'Number',
  'Boolean',
  'Array',
  'Object',
]);

/**
 * Names imported from @expo/ui sources: inside the widget extension these
 * resolve as globals, so the serialized body MAY reference them. Imports from
 * any other module (or same-file module consts) must NOT appear in the body —
 * they are undefined in the extension and crash the layout.
 */
const collectExpoUiRuntimeGlobals = (ast: File): Set<string> => {
  const names = new Set<string>();

  traverse(ast, {
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      if (!path.node.source.value.startsWith('@expo/ui/')) return;
      for (const specifier of path.node.specifiers) {
        names.add(specifier.local.name);
      }
    },
  });

  return names;
};

/** Locates the arrow function carrying the 'widget' directive in a parsed file */
const findWidgetFunction = (ast: File): NodePath<ArrowFunctionExpression> | null => {
  let found: NodePath<ArrowFunctionExpression> | null = null;

  traverse(ast, {
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
      const body = path.node.body;
      if (body.type !== 'BlockStatement') return;
      const hasDirective = body.directives.some((directive) => directive.value.value === 'widget');
      if (hasDirective && !found) {
        found = path;
      }
    },
  });

  return found;
};

// =============================================================================
// 1. NO MODULE-SCOPE REFERENCES INSIDE THE WIDGET FUNCTION
// =============================================================================

describe('widget function closure', () => {
  for (const { name, path } of WIDGET_FILES) {
    it(`${name}: references only its own params, locals, and @expo/ui globals`, () => {
      const ast = parseFile(path);
      const widgetPath = findWidgetFunction(ast);
      expect(widgetPath).not.toBeNull();
      if (!widgetPath) return;

      const runtimeGlobals = collectExpoUiRuntimeGlobals(ast);
      const violations = new Set<string>();

      widgetPath.traverse({
        ReferencedIdentifier(identifierPath) {
          // Type annotations are erased before serialization — only value
          // references can reach the widget runtime
          const parentType = identifierPath.parent.type;
          if (
            parentType === 'TSTypeReference' ||
            parentType === 'TSQualifiedName' ||
            parentType === 'TSTypeParameterInstantiation'
          ) {
            return;
          }

          const identifierName = identifierPath.node.name;
          const binding = identifierPath.scope.getBinding(identifierName);

          if (!binding) {
            // True global (Date, Infinity, ...) — allowed
            if (!JS_GLOBALS.has(identifierName)) {
              violations.add(`unresolvable identifier: ${identifierName}`);
            }
            return;
          }

          // Binding must live inside the widget function (params or body).
          // The one exception: @expo/ui imports, which the widget extension
          // provides as globals — that reference is legal by design.
          const declaredInside = binding.scope.path === widgetPath || widgetPath.isAncestor(binding.scope.path);
          if (!declaredInside && !runtimeGlobals.has(identifierName)) {
            violations.add(`module-scope reference: ${identifierName}`);
          }
        },
      });

      expect([...violations]).toEqual([]);
    });
  }
});

// =============================================================================
// 2. PALETTE LITERALS MATCH THE APP THEME
// =============================================================================

/** Parses '#rrggbb' / '#rrggbbaa' / 'rgba(r, g, b, a)' into [r, g, b, a] */
const normalizeColor = (value: string): [number, number, number, number] | null => {
  const hexMatch = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value);
  if (hexMatch) {
    const rgb = parseInt(hexMatch[1].slice(0, 2), 16);
    const g = parseInt(hexMatch[1].slice(2, 4), 16);
    const b = parseInt(hexMatch[1].slice(4, 6), 16);
    const a = hexMatch[2] ? parseInt(hexMatch[2], 16) / 255 : 1;
    return [rgb, g, b, a];
  }

  const rgbaMatch = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(value);
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1]);
    const g = Number(rgbaMatch[2]);
    const b = Number(rgbaMatch[3]);
    const alphaRaw = rgbaMatch[4];
    const a =
      alphaRaw === undefined ? 1 : alphaRaw.endsWith('%') ? Number(alphaRaw.slice(0, -1)) / 100 : Number(alphaRaw);
    return [r, g, b, a];
  }

  return null;
};

describe('palette literals', () => {
  const collectColorLiterals = (path: string): string[] => {
    const ast = parseFile(path);
    const literals: string[] = [];

    traverse(ast, {
      StringLiteral({ node }) {
        const value = node.value;
        if (/^#[0-9a-fA-F]{6,8}$/.test(value) || /^rgba?\(/.test(value)) {
          literals.push(value);
        }
      },
    });

    return literals;
  };

  it('home widget palette stays anchored to the app theme constants', () => {
    const literals = collectColorLiterals(WIDGET_FILES[0].path).map(normalizeColor);
    expect(literals).not.toContain(null);

    // App-theme anchors the widget must mirror (from COLORS / COUNTDOWN_BAR)
    const anchors = [
      COLORS.gradient.screen.start,
      COLORS.gradient.screen.end,
      COLORS.text.primary,
      COLORS.text.secondary,
      COLORS.text.muted,
      COLORS.prayer.activeBackground,
      COUNTDOWN_BAR.TRACK_COLOR,
      COLORS.icon.primary, // widget spells it as #a5b4fc — same color
    ].map(normalizeColor);

    for (const anchor of anchors) {
      expect(anchor).not.toBeNull();
      if (!anchor) continue;
      expect(literals).toContainEqual(anchor);
    }
  });

  it('every literal in both widgets is an app-theme color or an explicit widget-specific value', () => {
    // Deliberate widget-only colors: Lock Screen vibrant whites and the
    // divider tone (slightly stronger than border.subtle for the 1px rule)
    const widgetSpecific = [
      'rgba(255, 255, 255, 0.6)', // lock secondary text
      'rgba(255, 255, 255, 0.08)', // divider
      '#ffd000', // default accent fallback (app default countdown color)
    ].map(normalizeColor);

    const appTheme = [
      COLORS.gradient.screen.start,
      COLORS.gradient.screen.end,
      COLORS.text.primary,
      COLORS.text.secondary,
      COLORS.text.muted,
      COLORS.prayer.activeBackground,
      COLORS.icon.primary,
      COUNTDOWN_BAR.TRACK_COLOR,
    ].map(normalizeColor);

    const allowed = new Set([...appTheme, ...widgetSpecific].map((c) => JSON.stringify(c)));

    for (const { path } of WIDGET_FILES) {
      const literals = collectColorLiterals(path).map(normalizeColor);
      for (const literal of literals) {
        expect(literal).not.toBeNull();
        if (!literal) continue;
        expect(allowed.has(JSON.stringify(literal))).toBe(true);
      }
    }
  });
});

// =============================================================================
// 3. STATIC IMPORTS ONLY (dynamic import breaks the widget transform)
// =============================================================================

describe('static import discipline', () => {
  it('widget layout files contain no dynamic import()', () => {
    for (const { path } of WIDGET_FILES) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/import\s*\(/);
    }
  });

  it('stores/widget.ts statically imports both widget modules', () => {
    const source = readFileSync(join(__dirname, '../../stores/widget.ts'), 'utf8');
    expect(source).toMatch(/import PrayerWidget from '@\/widgets\/PrayerWidget'/);
    expect(source).toMatch(/import PrayerLockWidget from '@\/widgets\/LockPrayerWidget'/);
    expect(source).not.toMatch(/import\s*\(/);
  });
});

// =============================================================================
// 4. EXACTLY ONE 'widget' DIRECTIVE FUNCTION PER LAYOUT FILE
// =============================================================================

describe('widget directive', () => {
  for (const { name, path } of WIDGET_FILES) {
    it(`${name}: has exactly one widget-directive function`, () => {
      const ast = parseFile(path);
      let count = 0;

      traverse(ast, {
        ArrowFunctionExpression({ node }) {
          const body = node.body;
          if (body.type !== 'BlockStatement') return;
          if (body.directives.some((directive) => directive.value.value === 'widget')) {
            count += 1;
          }
        },
      });

      expect(count).toBe(1);
    });
  }
});
