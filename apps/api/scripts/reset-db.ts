import { pathToFileURL } from 'node:url'
import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

export async function resetDatabase() {
  try {
    await getDb().execute(sql.raw(`
      do $$
      declare table_name text;
      begin
        for table_name in (select tablename from pg_tables where schemaname = 'public') loop
          execute format('drop table if exists public.%I cascade', table_name);
        end loop;
      end $$;
      drop schema if exists drizzle cascade;
    `))
  } finally {
    await closeDb()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await resetDatabase()
}
