/**
 * The native face record's parse contract (modules/switchcover over device/switchCover).
 *
 * Jest cannot compile Kotlin, so the suites that pin the cover's face values all stop at the JS
 * binding: the values were correct on every build that showed a black cover anyway. The drop
 * happens in expo-modules-core's record conversion, which silently skips every property without
 * `@Field` and, with nothing `@Required`, constructs the record from its constructor defaults -
 * the black background and white spinner the owner watched for half a second (2026-10-19). This
 * suite reads both sides of the bridge and pins the contract: every property bound, every
 * property required, and the names the JS side sends equal the names the record declares.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const KOTLIN_PATH = join(
  ROOT,
  'modules',
  'switchcover',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'switchcover',
  'SwitchCoverModule.kt'
);
const BINDING_PATH = join(ROOT, 'device', 'switchCover.ts');

type FaceProperty = { name: string; field: boolean; required: boolean };

const kotlinSource = (): string => readFileSync(KOTLIN_PATH, 'utf8');

/** The record's declaration body, so the parse stays scoped to SwitchCoverFace alone */
const recordBody = (): string => {
  const match = kotlinSource().match(/data class SwitchCoverFace\(([\s\S]*?)\)\s*:\s*Record/);
  if (!match) throw new Error('SwitchCoverFace not found declaring a Record in SwitchCoverModule.kt');

  return match[1];
};

/**
 * The record's properties with their annotations.
 *
 * Annotations may sit on the property's own line or on lines above it, as both this module and
 * expo's own records format them.
 */
const recordProperties = (): FaceProperty[] => {
  const properties: FaceProperty[] = [];
  let pending: string[] = [];

  for (const line of recordBody().split('\n')) {
    const trimmed = line.trim();
    const bare = trimmed.match(/^((?:@[\w.]+\s+)*)val\s+(\w+)\s*:/);
    if (bare) {
      const annotations = [...pending, ...bare[1].trim().split(/\s+/)].filter(Boolean);
      properties.push({
        name: bare[2],
        field: annotations.includes('@Field'),
        required: annotations.includes('@Required'),
      });
      pending = [];
      continue;
    }

    if (trimmed.startsWith('@')) {
      pending.push(...trimmed.split(/\s+/));
    } else {
      pending = [];
    }
  }

  return properties;
};

/** The keys the JS side sends, read from the binding the commit passes them through */
const bindingKeys = (): string[] => {
  const match = readFileSync(BINDING_PATH, 'utf8').match(/export type SwitchCoverOptions = \{([\s\S]*?)\};/);
  if (!match) throw new Error('SwitchCoverOptions not found in device/switchCover.ts');

  return [...match[1].matchAll(/^ {2}(\w+):/gm)].map((key) => key[1]);
};

describe('the face record binds what the JS side sends', () => {
  it("declares exactly the binding's keys, no more and no fewer", () => {
    const names = recordProperties().map((property) => property.name);

    expect([...names].sort()).toEqual([...bindingKeys()].sort());
  });

  it('binds every property with @Field', () => {
    const unbound = recordProperties().filter((property) => !property.field);

    expect(unbound.map((property) => property.name)).toEqual([]);
  });

  it('requires every property with @Required', () => {
    const optional = recordProperties().filter((property) => !property.required);

    expect(optional.map((property) => property.name)).toEqual([]);
  });

  it('declares at least the eight face values the loader paints', () => {
    expect(recordProperties().length).toBeGreaterThanOrEqual(8);
  });
});
