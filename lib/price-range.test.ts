import { describe, expect, it } from 'vitest';
import { getPriceRange } from './price-range';

describe('getPriceRange', () => {
  it.each([
    ['', '', { min: null, max: null }],
    ['4000', '', { min: 4000, max: null }],
    ['', '6000', { min: null, max: 6000 }],
    ['4000', '6000', { min: 4000, max: 6000 }],
    ['4x00', '6000x', { min: null, max: null }],
  ])('%s / %s', (min, max, expected) => {
    expect(getPriceRange(min, max)).toEqual(expected);
  });
});
