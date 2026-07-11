import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  const db = getDb()

  await db.execute(sql.raw(`
    create table if not exists roles (
      id text primary key,
      name text not null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );

    create table if not exists permissions (
      id text primary key,
      name text not null
    );

    create table if not exists role_permissions (
      role_id text not null references roles(id) on delete cascade,
      permission_id text not null references permissions(id) on delete cascade,
      primary key (role_id, permission_id)
    );

    create table if not exists users (
      id text primary key,
      name text not null,
      email text not null unique,
      role_id text not null references roles(id),
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
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
      name text not null,
      created_at timestamp not null default now()
    );

    create table if not exists product_variant_assignments (
      product_id text not null references products(id),
      variant_id text not null references product_variants(id),
      primary key (product_id, variant_id)
    );

    insert into roles (id, name)
    values ('admin-role', 'Administrator')
    on conflict (id) do nothing;

    insert into permissions (id, name) values
      ('view-user', 'View users'), ('show-user', 'Show user'), ('create-user', 'Create user'), ('update-user', 'Update user'), ('delete-user', 'Delete user'),
      ('view-role', 'View roles'), ('show-role', 'Show role'), ('create-role', 'Create role'), ('update-role', 'Update role'), ('delete-role', 'Delete role')
    on conflict (id) do update set name = excluded.name;

    insert into role_permissions (role_id, permission_id)
    select 'admin-role', id from permissions
    on conflict do nothing;

    insert into users (id, name, email, role_id)
    values ('admin-user', 'Demo Administrator', 'admin@example.com', 'admin-role')
    on conflict (email) do nothing;
  `))

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
