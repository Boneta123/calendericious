import { defineConfig, env } from "prisma/config";

// Prisma 7 config (repo root — auto-discovered by the CLI alongside package.json).
// The datasource URL moved out of schema.prisma to here. Prisma 7 no longer
// auto-loads .env, so we use Node 24's built-in loader (no dotenv dependency).
// DATABASE_URL is read from the environment only — never hardcode a URL/secret.
try {
  process.loadEnvFile();
} catch {
  // no .env present (e.g. CI with real env vars) — fine
}

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
