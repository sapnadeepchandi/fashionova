import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
await sql.unsafe(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
console.log('✓ Database schema is up to date');
await sql.end();
