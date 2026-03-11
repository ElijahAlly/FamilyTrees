import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Check if we are in production to enable SSL
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  // Fix for some cloud providers (like Render) rejecting self-signed certs:
//   ssl: { rejectUnauthorized: false } 
});

export const db = drizzle(client, { schema });