import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hashPassword, verifyPassword } from '../../backend/lib/password.mjs';

describe('password hashing', () => {
  it('verifies the correct password', () => {
    const stored = hashPassword('hunter2!!');
    assert.equal(verifyPassword('hunter2!!', stored), true);
  });

  it('rejects a wrong password', () => {
    const stored = hashPassword('hunter2!!');
    assert.equal(verifyPassword('hunter3!!', stored), false);
  });

  it('never stores the plaintext and salts every hash', () => {
    const a = hashPassword('same-password!');
    const b = hashPassword('same-password!');
    assert.ok(!a.includes('same-password!'));
    assert.notEqual(a, b);
  });

  it('stores "<saltHex>:<hashHex>"', () => {
    const [salt, hash] = hashPassword('abcdefg!').split(':');
    assert.match(salt, /^[0-9a-f]{32}$/);
    assert.match(hash, /^[0-9a-f]{128}$/);
  });

  it('returns false for malformed stored values instead of throwing', () => {
    assert.equal(verifyPassword('x', undefined), false);
    assert.equal(verifyPassword('x', 'no-colon-here'), false);
    assert.equal(verifyPassword('x', ':'), false);
    assert.equal(verifyPassword('x', 'abcd:abcd'), false);
  });
});
