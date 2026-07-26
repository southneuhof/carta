import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  // Drops every table in `public` (schema ownership is not assumed) plus the migration history.
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
  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
