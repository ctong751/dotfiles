## Git Workflow

### Branch Naming

`<type>/<ticket-id>-<short-description>`

Types (most to least common): `feature/`, `bugfix/`, `epic/`, `hotfix/`, `release/`

Examples:
- `feature/HER-1510-group-class-charting`
- `bugfix/HER-1234-fix-login-redirect`
- `epic/HER-1452-group-class-attendance`

### Commit Messages

Always prefix commits with the ticket ID:

`<TICKET-ID>: <description>`

Examples:
- `HER-1510: Add charting notes migration`
- `URO-3174: Fix CTA not rendering on mobile`

### Worktrees

When creating worktrees, use the naming convention: `<ticket-id>-<short-feature-description>`

Examples:
- `HER-1510-group-class-charting`
- `URO-3174-cta-fix`

Place worktrees as siblings to the main repo directory (e.g., `../HER-1510-group-class-charting`).

## Environment

- **Editor**: Cursor (may switch to Neovim)
- **Terminal**: tmux with multiple sessions and tabs (windows)
- **Shell**: zsh with p10k
- **Dotfiles**: `~/repos/dotfiles` (symlinked to home directory)

## Code Preferences

- Prefer early returns over deeply nested conditionals
- Prefer named exports over default exports
- In JSX, prefer early returns and if blocks over ternaries for conditional rendering
- Use arrow functions for React components; use judgment for other functions

## Guardrails

### Destructive Actions
- Never force push, `reset --hard`, or delete branches without asking
- Never push to remote without asking
- When modifying shared libs (`/libs`), always call out which apps depend on the change

### Dependencies
- Never add new dependencies without asking

### Sensitive Data
- Never commit `.env` files, secrets, or credentials
- Never log or expose PII in code

### Code Review
- Never approve or merge PRs autonomously
- Always run lint, test, and build before suggesting a PR is ready
