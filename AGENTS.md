# Agent rules

- Use ASD-STE100 Simplified Technical English.
- DO NOT WRITE ANY COMMENTS in your code implementation.
- Make sure each code that you write justifies itself.
- Make sure each test that you write justifies itself. Tautological tests ARE BANNED.
- Keep changes within the user request and preserve unrelated work.
- Prefer existing code and the smallest change that meets the requirement.
- Use `$verify-carta-module` to select proof for application modules and `$test-audit` before writing, changing, or reviewing tests.
- Implement the current contract. Add no compatibility alias or wrapper unless the user request requires it.
- Change framework packages only when the user request explicitly includes them. Keep unsupported behavior local.
- For an update from upstream, read [the update procedure](docs/framework-sync.md#update-carta-packages-in-a-project). It defines authorization, local work protection, conflict resolution, and required checks.
- Use `$carta-audit` for a Sprindle plus Loom framework audit.
- Before implementing or reviewing a module (including from `plans/*/design.md`), open [carta-module-development](.agents/skills/carta-module-development/SKILL.md). Use [carta-module-design](.agents/skills/carta-module-design/SKILL.md) for initial designs or material contract revisions.
- Before changing `apps/api`, open [api-conventions](.agents/skills/api-conventions/SKILL.md). Before changing `apps/web` routes, resources, forms, or pages, open [web-ui-surfaces](.agents/skills/web-ui-surfaces/SKILL.md) and [DESIGN.md](DESIGN.md).
- Read [the resource architecture](docs/resource_system_overhaul/ARCHITECTURE.md) only when changing `packages/loom` resource internals or `scripts/check-surface-architecture.mjs`. For application modules, use [web-ui-surfaces](.agents/skills/web-ui-surfaces/SKILL.md) and search [packages/loom/CATALOG.md](packages/loom/CATALOG.md) on demand.
- Report failed checks, blocked work, and unverified results.
