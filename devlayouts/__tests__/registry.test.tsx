/**
 * The fasting layout registry against its catalog (T-623): every catalog row
 * must bind a distinct component, in order, with the row's own metadata. The
 * registry is dev-only (the route gates on __DEV__), so this suite is the one
 * place the wiring is proven.
 */

import { render, screen } from '@testing-library/react-native';

import catalog from '@/devlayouts/catalog.json';
import { archetypeCount, hiddenCount, VARIANTS } from '@/devlayouts/registry';
import { t } from '@/shared/i18n';

describe('the fasting layout registry', () => {
  it('binds exactly one entry per catalog row, in order', () => {
    expect(VARIANTS.length).toBe(catalog.length);
    for (let position = 0; position < catalog.length; position += 1) {
      expect(VARIANTS[position].index).toBe(catalog[position].index);
      expect(VARIANTS[position].id).toBe(catalog[position].id);
      expect(VARIANTS[position].name).toBe(catalog[position].name);
      expect(VARIANTS[position].archetype).toBe(catalog[position].archetype);
      expect(VARIANTS[position].hidesExplanations).toBe(catalog[position].hidesExplanations);
      expect(VARIANTS[position].open).toBe(catalog[position].open);
    }
  });

  it('gives every entry a renderable component', () => {
    for (const variant of VARIANTS) expect(typeof variant.Component).toBe('function');
  });

  it('counts its archetypes and explanation-hiding rows', () => {
    expect(archetypeCount()).toBe(new Set(VARIANTS.map((variant) => variant.archetype)).size);
    expect(hiddenCount()).toBe(VARIANTS.filter((variant) => variant.hidesExplanations).length);
  });

  it('spans at least eight distinct archetypes', () => {
    expect(archetypeCount()).toBeGreaterThanOrEqual(8);
  });

  it('hides explanations in at least half the set', () => {
    expect(hiddenCount()).toBeGreaterThanOrEqual(25);
  });

  it('renders the first variant settled with its mode labels', async () => {
    const First = VARIANTS[0].Component;
    await render(<First />);
    // The labels ride the production catalog keys, whose values the design-427 build re-cut
    expect(screen.getByText(t('fasting.mode.muhammad'))).toBeOnTheScreen();
    expect(screen.getByText(t('fasting.mode.everyDay'))).toBeOnTheScreen();
  });
});
