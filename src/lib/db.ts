import "server-only";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __djpressDbPool: Pool | undefined;
}

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: 10
  });
}

export function getDb() {
  if (!global.__djpressDbPool) {
    global.__djpressDbPool = createPool();
  }

  return global.__djpressDbPool;
}
