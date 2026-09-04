import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { assertConnectedE2eTarget } from './e2e-target'

export async function resetE2eDatabase() {
  await assertConnectedE2eTarget()
  await getDb().execute(
    sql.raw(`
    do $$
    declare table_name text;
    declare enum_name text;
    begin
      for table_name in (select tablename from pg_tables where schemaname = 'public') loop
        execute format('drop table if exists public.%I cascade', table_name);
      end loop;
      for enum_name in (
        select typname
        from pg_type
        join pg_namespace on pg_namespace.oid = pg_type.typnamespace
        where pg_namespace.nspname = 'public' and pg_type.typtype = 'e'
      ) loop
        execute format('drop type if exists public.%I cascade', enum_name);
      end loop;
    end $$;
    drop schema if exists drizzle cascade;
  `)
  )
}

resetE2eDatabase()
  .then(closeDb)
  .catch(async (error: unknown) => {
    await closeDb()
    throw error
  })
