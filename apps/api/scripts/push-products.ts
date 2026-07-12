import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { createAuth } from '../src/routes/auth/auth'

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
      email_verified boolean not null default false,
      image text,
      role_id text not null references roles(id),
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );

    alter table users add column if not exists email_verified boolean not null default false;
    alter table users add column if not exists image text;

    create table if not exists sessions (
      id text primary key,
      expires_at timestamp not null,
      token text not null unique,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      ip_address text,
      user_agent text,
      user_id text not null references users(id) on delete cascade
    );

    create table if not exists accounts (
      id text primary key,
      account_id text not null,
      provider_id text not null,
      user_id text not null references users(id) on delete cascade,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamp,
      refresh_token_expires_at timestamp,
      scope text,
      password text,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );

    create table if not exists verifications (
      id text primary key,
      identifier text not null,
      value text not null,
      expires_at timestamp not null,
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

  `))

  const existingCredential = await db.execute(sql.raw(`
    select accounts.id from accounts
    join users on users.id = accounts.user_id
    where users.email = 'admin@example.com' and accounts.provider_id = 'credential'
    limit 1
  `))

  if (existingCredential.rows.length === 0) {
    await db.execute(sql.raw(`delete from users where email = 'admin@example.com'`))
    await createAuth({ allowSignUp: true }).api.signUpEmail({
      body: {
        name: 'Demo Administrator',
        email: 'admin@example.com',
        password: 'demo-password',
        roleId: 'admin-role',
      },
    })
  }

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
