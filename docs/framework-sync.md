# Framework sync

Carta is the project template. Projects start private with full history, then
sync only framework packages as subtrees. `apps/`, `plans/`, project documents,
and `.env` files never change during an update.

## Sync boundary

| Updated from package repositories | Owned by the project |
|---|---|
| `packages/loom`, `packages/sprindle`, `packages/utilities`, `packages/sdk` | `apps/api`, `apps/web` |
|  | Root tooling, `.github/workflows`, `plans/`, and project documents |
| Skills live separately at `southneuhof/skills` (`skills/<name>/`) | `.env`, `.env.test`, `.env.e2e` secrets |

Router integration under `apps/web` is project-owned. A routing convention
change needs a separate reviewed adoption in each project.

## Start a project from Carta

```sh
git clone https://github.com/southneuhof/carta my-project
cd my-project
git remote rename origin project-origin
git remote add origin <private-repo-url>
git remote add carta https://github.com/southneuhof/carta.git
git push -u origin main
```

## Update Carta packages in a project

Run the safe update command from a clean working tree:

```sh
pnpm carta:update
```

This command pulls each framework package from its package repository, installs
dependencies, and runs type checks and tests. It does not write to `apps/`.
Local framework patches merge normally. Resolve any conflict by hand and keep
the patch commits local.

Root tooling does not update automatically. A Carta release that needs a root
change must include a small migration or manual instructions. Review and apply
that change in each project.

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
