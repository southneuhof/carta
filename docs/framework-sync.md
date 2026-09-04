# Framework sync

Carta is the upstream template. Projects start private with full history, then
sync only framework paths as subtrees. `apps/`, `plans/`, `docs/` project
inventory, and `.env` files never go upstream.

## Sync boundary

| Synced upstream | Owned by the project |
|---|---|
| `packages/loom`, `packages/sprindle`, `packages/utilities`, `packages/sdk` | `apps/api`, `apps/web` |
| Shared tooling: `turbo.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`, `.github/workflows` | `plans/`, `docs/` project inventory |
| Skills live separately at `southneuhof/skills` (`skills/<name>/`) | `.env`, `.env.test`, `.env.e2e` secrets |

## Start a project from Carta

```sh
git clone https://github.com/southneuhof/carta my-project
cd my-project
git remote rename origin project-origin
git remote add origin <private-repo-url>
git remote add carta https://github.com/southneuhof/carta.git
git push -u origin main
```

## Pull newest Carta into a project

Pull each framework path as a subtree. Local patches to framework code merge
normally; resolve conflicts by hand and keep the patch commits local.

```sh
git fetch carta main
git subtree pull --prefix=packages/loom carta main --squash
git subtree pull --prefix=packages/sprindle carta main --squash
git subtree pull --prefix=packages/utilities carta main --squash
git subtree pull --prefix=packages/sdk carta main --squash
```

Without `--squash` the merge keeps full per-package history, which helps when a
project carries a long-lived local patch. With `--squash` the history is
coarser and later merges conflict more often.

## Propose a framework change upstream

Promote is manual. From the project, split the changed framework path,
push it to a branch on `southneuhof/carta`, and open a PR for maintainer
review. Never split `apps/`, `plans/`, `docs/` project files, or `.env` files.

```sh
git subtree split --prefix=packages/loom -b promote/loom-<topic>
git push carta promote/loom-<topic>
gh pr create --repo southneuhof/carta --base main --head promote/loom-<topic>
```

The maintainer merges worthy changes into Carta `main`. Projects then pull
newest Carta to receive improvements from every project.

## Local framework patches

A project-specific customization that must live in framework code stays as
normal commits under `packages/<name>/`. Mark the commits (for example with a
`local-patch:` prefix) so they are never split back upstream. Pulls from Carta
merge against them; conflicting hunks are resolved in the project.

## Skills

Skills are versioned separately at `southneuhof/skills`, one folder per skill
under `skills/`. Projects install what they need:

```sh
npx skills@latest add southneuhof/skills --skill <name>
```
