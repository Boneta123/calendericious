/**
 * Server-side sessions. On login we mint a random opaque token, store only its
 * SHA-256 hash in the Session table, and hand the raw token to the client. Every
 * authed request sends it as `Authorization: Bearer <token>`; the auth
 * middleware hashes it and looks up the session. Logout deletes the row.
 */
import { createHash, randomBytes } from 'node:crypto';

import { prisma } from '../db.mjs';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** SHA-256 hex of a token (fast; the token itself is high-entropy random). */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Create a session for a user; returns the RAW token to send to the client. */
export async function createSession(userId) {
  const token = randomBytes(32).toString('hex'); // 256-bit opaque token
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

/** Resolve a raw token to a userId, or null if missing/expired. */
export async function userIdForToken(token) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session.userId;
}

/** Delete the session for a raw token (logout). Safe if it doesn't exist. */
export async function destroySession(token) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}
