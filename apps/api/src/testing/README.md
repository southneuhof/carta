# Test session helpers

`src/testing/session.ts` owns authenticated-session fixtures for route specs.
Tests hit real Postgres; sessions are registered on creation.

## Helpers

- `createSystemSession(permissions, moduleName)` — system-scoped user +
  role + permission rows; returns `{ userId, moduleId, roleId, cookie }`.
- `createProjectSession(...)` — project-scoped variant. **Currently has no
  consumer; kept deliberately (owner decision 2026-08-23) as the
  project-scope counterpart of `createSystemSession`. Do not delete without
  an owner decision.**
- `testId(label)` — unique fixture identifier for business rows.
- `cleanupSessions()` — deletes every registered session's rows (users,
  roles, permissions, assignments). Specs may call it in afterEach/afterAll,
  but they do not have to: it is also registered on the pool-close hook, so
  every spec's `closeDb()` flushes pending teardowns first.

## Seeded project trees — `src/testing/project.ts`

`seedProject({ count?, label? })` inserts businessCategory → division →
`count` projects (default 2) and registers FK-safe teardown.
`cleanupSeededProjects()` deletes the trees in FK order — call it in the
spec's afterEach after deleting rows that reference them.

## Conventions

- Delete business rows before `cleanupSeededProjects()`/`cleanupSessions()`
  when FKs reference them.
- Session teardown is automatic at pool close; only add explicit calls when
  a mid-file cleanup is genuinely needed.
