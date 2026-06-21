import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Enable SSL in production. Coolify's Postgres uses a self-signed cert, so we
// encrypt the connection but skip CA verification (rejectUnauthorized: false).
// This pairs with Coolify's SSL mode set to `require`.
// To upgrade to full verification later: set Coolify to `verify-full`, then use
//   ssl: { ca: process.env.DB_CA_CERT, rejectUnauthorized: true }
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(client, { schema });