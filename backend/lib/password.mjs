/**
 * Password hashing — Node's built-in crypto (scrypt), no dependency.
 * Stored format: "<saltHex>:<hashHex>". Verification is constant-time.
 * Passwords are ONLY ever stored as this hash — never plaintext.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

/** Hash a plaintext password with a fresh random salt. */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** Verify a plaintext password against a stored "<saltHex>:<hashHex>" string. */
export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (salt.length === 0 || expected.length !== KEYLEN) return false;
  const actual = scryptSync(password, salt, KEYLEN);
  return timingSafeEqual(actual, expected);
}
