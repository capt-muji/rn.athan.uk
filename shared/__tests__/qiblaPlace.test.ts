/**
 * The place name under the compass: what the user is told about where their bearing came from
 */

import { placeName } from '@/shared/qiblaPlace';

describe('the place the bearing was computed from', () => {
  it('names the city and its country, which is how a person says where they are', () => {
    expect(placeName({ city: 'London', country: 'United Kingdom' })).toBe('London, United Kingdom');
  });

  it('keeps the country when the city is missing, because at sea that is the whole truth', () => {
    expect(placeName({ city: null, country: 'Norway' })).toBe('Norway');
  });

  it('keeps the locality when the country is missing, rather than printing nothing', () => {
    expect(placeName({ city: 'Makkah', country: null })).toBe('Makkah');
  });

  // The platform returns an object of nulls at sea and over unmapped ground
  it('says nothing at all when nothing is known, so the screen omits the line', () => {
    expect(placeName({ city: null, district: null, subregion: null, region: null, country: null })).toBeNull();
  });

  it('says nothing when the platform returns no address at all', () => {
    expect(placeName(null)).toBeNull();
    expect(placeName(undefined)).toBeNull();
  });
});

describe('widening out when the narrowest field is empty', () => {
  // Each step out is still true, just less precise, and the narrowest field is null in exactly the places with the
  // fewest landmarks
  it('falls back to the district when there is no city', () => {
    expect(placeName({ city: null, district: 'Shibuya', country: 'Japan' })).toBe('Shibuya, Japan');
  });

  it('falls back to the subregion when there is no city or district', () => {
    expect(placeName({ city: null, district: null, subregion: 'Orkney', country: 'United Kingdom' })).toBe(
      'Orkney, United Kingdom'
    );
  });

  it('falls back to the region last, which is the widest name still worth printing', () => {
    expect(placeName({ city: null, district: null, subregion: null, region: 'Nunavut', country: 'Canada' })).toBe(
      'Nunavut, Canada'
    );
  });

  it('prefers the narrowest field it is given, so a city beats the region it sits in', () => {
    expect(placeName({ city: 'Glasgow', district: 'Govan', subregion: 'Lanarkshire', region: 'Scotland' })).toBe(
      'Glasgow'
    );
  });
});

describe('what the platform pads, and what it duplicates', () => {
  it('trims the whitespace a platform pads its fields with', () => {
    expect(placeName({ city: '  Cairo  ', country: ' Egypt ' })).toBe('Cairo, Egypt');
  });

  it('collapses an inner run of whitespace rather than printing it', () => {
    expect(placeName({ city: 'Kuala\n  Lumpur', country: 'Malaysia' })).toBe('Kuala Lumpur, Malaysia');
  });

  it('treats a field of pure whitespace as absent', () => {
    expect(placeName({ city: '   ', country: 'France' })).toBe('France');
  });

  it('treats an empty string as absent, which is what Android returns for an unknown field', () => {
    expect(placeName({ city: '', district: 'Ikeja', country: 'Nigeria' })).toBe('Ikeja, Nigeria');
  });

  // A city state names both fields identically, and "Singapore, Singapore" reads like a bug
  it('prints a city state once rather than twice', () => {
    expect(placeName({ city: 'Singapore', country: 'Singapore' })).toBe('Singapore');
  });
});
