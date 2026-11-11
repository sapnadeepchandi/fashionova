import postgres from 'postgres';

declare global { var __sql: ReturnType<typeof postgres> | undefined }

function make() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, {
    max: process.env.NODE_ENV === 'production' ? 5 : 10,
    idle_timeout: 20,
    prepare: false, // required for Supabase transaction pooler
    transform: { undefined: null },
    types: { numeric: { to: 1700, from: [1700], serialize: (x: any) => String(x), parse: (x: string) => Number(x) } } as any
  });
}

export const sql = globalThis.__sql ?? (globalThis.__sql = make());
