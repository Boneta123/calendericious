import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { haversineMi } from '../../frontend/utils/geo.ts';

describe('haversineMi', () => {
  it('is zero for identical points', () => {
    assert.equal(haversineMi(40.7128, -74.006, 40.7128, -74.006), 0);
  });

  it('matches a known distance (NYC to LA is about 2445 miles)', () => {
    const d = haversineMi(40.7128, -74.006, 34.0522, -118.2437);
    assert.ok(Math.abs(d - 2445) < 15, `got ${d}`);
  });

  it('is symmetric', () => {
    const a = haversineMi(41.88, -87.63, 29.76, -95.37);
    const b = haversineMi(29.76, -95.37, 41.88, -87.63);
    assert.ok(Math.abs(a - b) < 1e-9);
  });
});
