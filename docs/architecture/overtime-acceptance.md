# Overtime parity acceptance

Automated coverage owns:

- section, applicant, date range, job position, and status filter parsing;
- organization scope and default-deny behavior;
- dependent applicant field visibility/reset behavior;
- draft submit, duplicate/unauthorized submit, authorized and unauthorized
  verification, approval/rejection terminal states, and timeline visibility;
- typed web submit/verify/steps calls and route control visibility.

On 2026-07-29 the operator explicitly confirmed remote database
`10.8.69.67/playground` is disposable and authorized destructive reset.
Acceptance completed in this order:

```sh
pnpm --filter @southneuhof/api test
pnpm --filter @southneuhof/api db:refresh
pnpm --filter @southneuhof/api db:smoke
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web build
```

Results: API 69/69 tests passed, database migrations and seed completed, DB
smoke passed, web 172/172 tests passed, and production build passed.
