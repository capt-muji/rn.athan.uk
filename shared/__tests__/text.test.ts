/**
 * Unit tests for shared/text.ts
 *
 * Tests text transformation utilities:
 * - toArabicNumbers() - converts English digits to Arabic-Indic numerals
 */

import { toArabicNumbers } from '../text';

// =============================================================================
// toArabicNumbers TESTS
// =============================================================================

describe('toArabicNumbers', () => {
  // ---------------------------------------------------------------------------
  // Digit conversion
  // ---------------------------------------------------------------------------

  describe('digit conversion', () => {
    it('converts all English digits to Arabic-Indic numerals', () => {
      expect(toArabicNumbers('0123456789')).toBe('٠١٢٣٤٥٦٧٨٩');
    });

    it('converts time format correctly', () => {
      expect(toArabicNumbers('5:30')).toBe('٥:٣٠');
    });

    it('converts date format correctly', () => {
      expect(toArabicNumbers('2024-01-15')).toBe('٢٠٢٤-٠١-١٥');
    });
  });

  // ---------------------------------------------------------------------------
  // Mixed text and numbers
  // ---------------------------------------------------------------------------

  describe('mixed text and numbers', () => {
    it('converts digits while preserving other characters', () => {
      expect(toArabicNumbers('Prayer at 5:30')).toBe('Prayer at ٥:٣٠');
    });

    it('handles Arabic text with English numbers', () => {
      expect(toArabicNumbers('الساعة 12:30')).toBe('الساعة ١٢:٣٠');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('does not modify already Arabic numerals', () => {
      // Arabic-Indic numerals should pass through unchanged
      expect(toArabicNumbers('٠١٢٣٤٥٦٧٨٩')).toBe('٠١٢٣٤٥٦٧٨٩');
    });
  });
});
