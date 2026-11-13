
import postgres from 'postgres';

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

function make() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  return postgres(url, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    query_timeout: 20000,
    max_pipeline: 1,
    prepare: false,
    transform: { undefined: null },
    types: {
      numeric: {
        to: 1700,
        from: [1700],
        serialize: (x: any) => String(x),
        parse: (x: string) => Number(x),
      },
    } as any,
  });
}

export const sql = globalThis.__sql ?? (globalThis.__sql = make());
