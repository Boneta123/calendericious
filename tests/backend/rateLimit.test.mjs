import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { rateLimit } from '../../backend/middleware/rateLimit.mjs';

/** Minimal Express-like req/res pair that records what the limiter did. */
function call(limiter, ip = '1.1.1.1') {
  const out = { status: 200, headers: {}, body: null, nextCalled: false };
  const res = {
    set(k, v) { out.headers[k] = v; return res; },
    status(code) { out.status = code; return res; },
    json(body) { out.body = body; return res; },
  };
  limiter({ ip }, res, () => { out.nextCalled = true; });
  return out;
}

describe('rateLimit', () => {
  it('allows requests up to the max, then returns 429', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3 });
    for (let i = 0; i < 3; i++) assert.equal(call(limiter).nextCalled, true);

    const blocked = call(limiter);
    assert.equal(blocked.nextCalled, false);
    assert.equal(blocked.status, 429);
  });

  it('sends Retry-After and the custom message when blocked', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, message: 'slow down' });
    call(limiter);
    const blocked = call(limiter);
    assert.equal(blocked.body.error, 'slow down');
    assert.ok(Number(blocked.headers['Retry-After']) > 0);
  });

  it('tracks each client separately', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    assert.equal(call(limiter, 'a').nextCalled, true);
    assert.equal(call(limiter, 'a').nextCalled, false);
    assert.equal(call(limiter, 'b').nextCalled, true);
  });

  it('supports a custom key function', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, keyFn: () => 'shared' });
    assert.equal(call(limiter, 'a').nextCalled, true);
    assert.equal(call(limiter, 'b').nextCalled, false);
  });

  it('lets requests through again after the window passes', async () => {
    const limiter = rateLimit({ windowMs: 30, max: 1 });
    assert.equal(call(limiter).nextCalled, true);
    assert.equal(call(limiter).nextCalled, false);
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(call(limiter).nextCalled, true);
  });
});
