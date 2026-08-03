/**
 * Single Prisma client for the whole backend.
 *
 * Prisma 7 requires a driver adapter for a direct connection — we use the
 * Postgres adapter (`@prisma/adapter-pg`) reading the connection string from
 * the process env (loaded by Node's --env-file / process.loadEnvFile; we never
 * read .env ourselves). Import THIS module everywhere — never `new PrismaClient()`
 * elsewhere, so the app keeps one connection pool.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
