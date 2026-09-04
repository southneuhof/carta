#!/usr/bin/env python3
"""Create feature worksheet from template. Replaces manual copy-paste."""

import argparse
import pathlib

TEMPLATE = """# {feature} worksheet

- State: `INTAKE`
- Feature: `{feature}`
- Modules: `{modules}`
- Grouping reason: `{reason}`
- Folder: `plans/{feature}/`
- Design: `TBD during INTAKE`
- Active plan: `None`
- Next action: `Classify existing artifacts for {feature}`
- Read boundary: `AGENTS.md, request, plans/{feature}, exact code search hits`
- Write boundary: `plans/{feature}/worksheet.md`
- Last result: `None`
- Last evidence: `None`
- Blocker: `None`

## Artifact ledger

| Artifact | Approval | Current | Owns | Gaps or conflicts | Classification |
|---|---|---|---|---|---|
| `<path/request>` | `<state>` | `<yes/no>` | `<decisions>` | `<result>` | `<intent/draft/design/plan/code>` |

## Contract evidence

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| User journey and actions | `<path:line>` | `<answer>` | TODO |
| Data and relation ownership | `<path:line>` | `<answer>` | TODO |
| Permissions | `<path:line>` | `<answer>` | TODO |
| Routes and navigation | `<path:line>` | `<answer>` | TODO |
| UI states and validation | `<path:line>` | `<answer>` | TODO |
| Seed or migration need | `<path:line>` | `<answer>` | TODO |
| Acceptance outcomes | `<path:line>` | `<answer>` | TODO |
| Framework gap | `<path:line>` | `<answer>` | TODO |

## Plan map

| Plan | Observable result | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-<slice>.md` | `<slice>` | `none` | TODO | — |

## Decisions and blockers

- None.
"""

def main():
    p = argparse.ArgumentParser(description="Init feature worksheet")
    p.add_argument("feature", help="feature slug, e.g. support-app-reviews")
    p.add_argument("--modules", default="", help="comma-separated module list")
    p.add_argument("--reason", default="single module", help="grouping reason")
    p.add_argument("--path", default=None, help="override output path")
    args = p.parse_args()

    out = pathlib.Path(args.path) if args.path else pathlib.Path(f"plans/{args.feature}/worksheet.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        print(f"exists: {out} (not overwritten)")
        return 0
    content = TEMPLATE.format(feature=args.feature, modules=args.modules or args.feature, reason=args.reason)
    out.write_text(content, encoding="utf-8")
    print(f"created: {out}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
