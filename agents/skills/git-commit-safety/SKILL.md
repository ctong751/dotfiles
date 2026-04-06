---
name: git-commit-safety
description: Default git safety policy for Pi. Use for branching, staging, commits, pushes, PRs, rebases, merges, resets, stashing, and other git actions. Keeps local work low-friction, requires approval for remote-impacting actions, and defers to repo-local rules.
license: Personal use
---

# Git / Commit Safety

Use for any git workflow task: branching, staging, commits, pushes, PRs, rebases, merges, resets, stashing, branch cleanup, or history changes.

## Precedence

Apply rules in this order:

1. Direct user instruction
2. Repo-local instructions
3. This skill

If rules conflict or the next safe action is unclear, ask.

## Default behavior

Optimize for fast local work, human approval for remote-impacting actions, predictable workflow, and repo-local overrides. Do not silently publish work.

## Allowed local actions

Unless repo-local instructions say otherwise, Pi may do these without asking first:

- create or switch branches
- inspect status, diff, and log
- stage or unstage files
- run `git add`
- use `git stash` for temporary local workspace management
- restore unstaged or staged local changes when no committed work is discarded
- create local commits

If `git stash` is used, mention it when relevant.

## Gated actions

Ask for approval before:

- push
- create or update a PR
- merge
- rebase
- cherry-pick
- delete branches
- hard reset
- force push
- rewrite published history
- any remote-impacting action not explicitly allowed
- any destructive or hard-to-reverse action with meaningful risk

Remote-impacting actions include modifying remote branches, opening or updating PRs, or rewriting published history.

## Approval summary

Before a gated action, give a short summary and wait for approval, rejection, or feedback.

Include relevant details such as:

- current branch
- target branch or remote
- commits involved
- PR title/body draft
- notable risks or uncertainty

## Protected branches

Treat these branches as protected by default:

- `main`
- `master`
- `develop`

Do not directly commit to or push to a protected branch unless the user explicitly asks or repo-local instructions allow it.

## Branch naming

Use short, readable, kebab-case descriptions.

When a ticket exists:

- `feature/JIRA-99-short-description`
- `bugfix/JIRA-99-short-description`
- `hotfix/JIRA-99-short-description`

When no ticket exists:

- ask whether a ticket exists or should be created
- if not, use:
  - `feature/short-description`
  - `bugfix/short-description`
  - `hotfix/short-description`

Choose the prefix that best fits the work.

## Commit and PR titles

Generate titles automatically.

When a ticket exists:

- `JIRA-99: Message here`

When no ticket exists:

- `Message here`

Keep commit messages concise, human-readable, scoped to the actual change, and free of AI-style fluff.

PR descriptions should briefly cover:

- what changed
- why
- checks run
- caveats or follow-ups

## Required checks before commit or push

Run at minimum:

- formatting
- lint
- typecheck

Discover commands from package scripts, Makefiles, task runners, CI config, or repo-local instructions. If one is missing, run the closest equivalent and say what was used.

## Required checks before PR creation

Run:

- formatting
- lint
- typecheck
- build
- test

Discover commands from package scripts, Makefiles, task runners, CI config, or repo-local instructions. If build/test are unavailable or too heavy, say so explicitly; do not imply they passed.

## Failure behavior

If a required check fails:

1. say what failed
2. attempt a fix when reasonable
3. rerun relevant checks
4. if still failing, stop and summarize clearly

Do not silently ignore failing checks.

## Hook safety

Do not bypass hooks with `--no-verify` unless the user explicitly asks or repo-local instructions allow it.

If hooks block progress, explain the failure instead of bypassing them.

## Communication style

Keep git workflow communication concise:

- no long essays unless asked
- no large plan docs unless asked
- short summaries before gated actions
- clear explanations when blocked by policy or failing checks
