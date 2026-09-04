# Verification

## Focused automated checks

Run checks for the changed module first:

```sh
pnpm --filter @southneuhof/framework-web test:focused -- <route-or-resource-spec>
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web lint:focused -- <changed-files>
git diff --check
```

When resource route names or navigation change, also run the route-resource
boundary and manifest specs. Run framework package tests only when approved
framework code changed.

Do not replace a module-scoped test with the full app suite unless a focused
failure shows cross-module risk or the user asks for the full suite.

## Focused Playwright gate

For every changed route, verify the real authenticated flow in its focused
Playwright journey:

- The control is on the intended list, detail, row, form, or custom surface.
- The page shell, action slots, action alignment, copy, spacing, field labels,
  and collection states match the applicable `docs/ui` contract.
- Other surfaces keep their intended controls.
- First load, empty, loading, error, success, and reload states are correct as
  applicable.
- Create or update submits all required visible fields.
- Permission and server record capability hide or show actions correctly.
- Destructive actions confirm, report errors, refresh data, and do not show
  duplicate controls.
- Custom actions invalidate and reload the affected collection or record.
- Keyboard focus, labels, and accessible names are usable.

Use the fixed E2E fixture and isolated E2E database and storage. If the focused
journey cannot run or does not pass, report `BLOCKED` or `REWORK`. Do not report
completion. Do not substitute another UI evidence method.

## Final evidence

Report:

```text
Reused: <exact resource API, component, renderer, slot, or app helper>
Searched: <framework and app paths>
Gap: <None or exact missing capability>
Checks: <focused test, type-check, lint, diff check, focused Playwright report>
```
