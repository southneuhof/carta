import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  const db = getDb()

  await db.execute(sql.raw(`
    create table if not exists users (
      id text primary key,
      name text not null,
      created_at timestamp not null default now()
    );

    create table if not exists products (
      id text primary key,
      name text not null,
      sku text not null,
      owner_id text references users(id),
      created_at timestamp not null default now()
    );

    alter table products add column if not exists owner_id text references users(id);

    create table if not exists product_variants (
      id text primary key,
      product_id text not null references products(id),
      sku text not null,
      created_at timestamp not null default now()
    );
  `))

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
