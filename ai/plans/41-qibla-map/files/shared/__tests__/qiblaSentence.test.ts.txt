/**
 * The line the user reads under the map
 */

import { qiblaSentence } from '@/shared/qiblaSentence';
import type { NearbyStreet } from '@/shared/qiblaStreet';

const street = (name: string): NearbyStreet => ({ name, bearing: 172, distance: 15, length: 289 });

describe('the qibla sentence', () => {
  it('names the street and the turn', () => {
    const answer = { street: street('Whitehall'), turn: 53, side: 'left' as const };

    expect(qiblaSentence(answer)).toBe('Stand along Whitehall, then turn 53 degrees to the left.');
  });

  it('names the other side when the turn is the other way', () => {
    const answer = { street: street('Broadway'), turn: 25, side: 'right' as const };

    expect(qiblaSentence(answer)).toBe('Stand along Broadway, then turn 25 degrees to the right.');
  });

  it('rounds the turn, because a decimal claims a precision the map cannot support', () => {
    const answer = { street: street('Maiden Lane'), turn: 84.7, side: 'left' as const };

    expect(qiblaSentence(answer)).toBe('Stand along Maiden Lane, then turn 85 degrees to the left.');
  });

  it('says the qibla runs along the street when the turn is under 5 degrees', () => {
    const answer = { street: street('Gang Bhakti IV'), turn: 3, side: 'left' as const };

    expect(qiblaSentence(answer)).toBe('The qibla runs along Gang Bhakti IV.');
  });

  it('says so for a turn of zero', () => {
    const answer = { street: street('Jalan Sultan Agung'), turn: 0, side: 'right' as const };

    expect(qiblaSentence(answer)).toBe('The qibla runs along Jalan Sultan Agung.');
  });

  it('names the turn at exactly 5 degrees, the first value worth stating', () => {
    const answer = { street: street('Nassau Street'), turn: 5, side: 'right' as const };

    expect(qiblaSentence(answer)).toBe('Stand along Nassau Street, then turn 5 degrees to the right.');
  });

  it('rounds 4.6 degrees up to a stated turn rather than reading the rounded value twice', () => {
    const answer = { street: street('John Street'), turn: 4.6, side: 'left' as const };

    expect(qiblaSentence(answer)).toBe('Stand along John Street, then turn 5 degrees to the left.');
  });

  it('carries a street name in another script unchanged', () => {
    const answer = { street: street('طريق المسجد الحرام'), turn: 48, side: 'right' as const };

    expect(qiblaSentence(answer)).toBe('Stand along طريق المسجد الحرام, then turn 48 degrees to the right.');
  });
});
