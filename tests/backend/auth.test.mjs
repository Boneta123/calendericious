import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { requireSelf } from '../../backend/middleware/auth.mjs';
import { hashToken } from '../../backend/lib/session.mjs';

function run(req) {
  const out = { status: null, body: null, nextCalled: false };
  const res = {
    status(code) { out.status = code; return res; },
    json(body) { out.body = body; return res; },
  };
  requireSelf(req, res, () => { out.nextCalled = true; });
  return out;
}

describe('requireSelf (ownership check)', () => {
  it('lets a user act on their own :id', () => {
    const out = run({ user: { id: 'u1' }, params: { id: 'u1' } });
    assert.equal(out.nextCalled, true);
  });

  it("blocks a user from touching someone else's :id with 403", () => {
    const out = run({ user: { id: 'u1' }, params: { id: 'u2' } });
    assert.equal(out.nextCalled, false);
    assert.equal(out.status, 403);
  });

  it('blocks when no user is attached to the request', () => {
    const out = run({ params: { id: 'u1' } });
    assert.equal(out.status, 403);
  });
});

describe('session token hashing', () => {
  it('is deterministic SHA-256 hex', () => {
    assert.equal(hashToken('abc'), hashToken('abc'));
    assert.match(hashToken('abc'), /^[0-9a-f]{64}$/);
  });

  it('differs for different tokens and never equals the raw token', () => {
    assert.notEqual(hashToken('abc'), hashToken('abd'));
    assert.notEqual(hashToken('abc'), 'abc');
  });
});
