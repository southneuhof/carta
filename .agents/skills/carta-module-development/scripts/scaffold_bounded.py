#!/usr/bin/env python3
"""Wrapper for bounded scaffold pipeline. Runs scaffold → integrate → dev migrate/seed → verify."""
import argparse
import json
import pathlib
import subprocess
import sys

def run(cmd, cwd=None):
    print(f"$ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result

def main():
    p = argparse.ArgumentParser(description="Scaffold a bounded module")
    p.add_argument("--manifest", required=True, help="absolute path to module.json")
    p.add_argument("--json", action="store_true", help="emit json output")
    p.add_argument("--with-seed", action="store_true", help="pass --with-seed to verify:module --run")
    args = p.parse_args()

    manifest = pathlib.Path(args.manifest).resolve()
    if not manifest.exists():
        print(f"manifest not found: {manifest}", file=sys.stderr)
        return 1

    # auto-detect seed in manifest so agents do not forget --with-seed
    try:
        data = json.loads(manifest.read_text())
        has_seed = bool(data.get("seed"))
    except Exception:
        has_seed = False
    with_seed = args.with_seed or has_seed
    if has_seed and not args.with_seed:
        print(f"auto --with-seed: manifest has seed block")

    cwd = pathlib.Path.cwd()
    cmds = [
        ["pnpm", "scaffold:bounded-module", "--config", str(manifest), "--json"],
        ["pnpm", "integrate:bounded-module", "--manifest", str(manifest), "--check"],
        ["pnpm", "integrate:bounded-module", "--manifest", str(manifest), "--apply"],
        # dev DB must be migrated and seeded — test:focused only touches .env.test
        ["pnpm", "--filter", "@southneuhof/api", "db:migrate"],
        ["pnpm", "--filter", "@southneuhof/api", "db:seed"],
        ["pnpm", "--silent", "verify:module", "--manifest", str(manifest), "--check-only", "--json"],
    ]
    run_cmd = ["pnpm", "--silent", "verify:module", "--manifest", str(manifest), "--run", "--json"]
    if with_seed:
        run_cmd.append("--with-seed")
    cmds.append(run_cmd)

    for cmd in cmds:
        r = run(cmd, cwd=str(cwd))
        if r.returncode != 0:
            print(f"failed: {' '.join(cmd)} (exit {r.returncode})", file=sys.stderr)
            print("Do not claim VERIFY/PASS — dev db:seed or navigation is missing. See bounded.md.", file=sys.stderr)
            return 1

    # verify navigation entry exists
    nav = pathlib.Path("apps/web/src/manifest/navigation.ts")
    if nav.exists():
        txt = nav.read_text()
        # manifest slug from config
        slug = data.get("slug") if isinstance(data, dict) else None
        if slug and slug not in txt:
            print(f"WARN: navigation.ts has no entry for slug '{slug}' — module will be invisible in sidebar.", file=sys.stderr)
            print("Add entry under the selected group with permission list-<slug> before Playwright.", file=sys.stderr)

    print("bounded pipeline complete — dev db:seed done, verify reports captured")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
