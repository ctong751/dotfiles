---
name: private-project-placeholder
description: Placeholder only. Keep project-specific Claude skills in local-only, untracked files.
allowed-tools: Bash
---

# Private Project Skill Placeholder

This public dotfiles repo intentionally does not include project-specific Claude skills.

If you need a private skill for work or personal projects, create it locally in an untracked path such as:

- `~/.claude/skills/<project>/SKILL.md`
- a machine-local dotfiles overlay that is not pushed to this public repo

Guidelines:
- Do not include internal project names, ticket prefixes, repo paths, package names, or service architecture here.
- Do not include customer data, credentials, tokens, or private URLs.
- Keep examples generic, e.g. `PROJ-123`, `~/repos/project`, `apps/web`, `packages/core`.
