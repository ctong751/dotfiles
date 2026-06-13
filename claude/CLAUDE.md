## Environment

- **Editor**: Neovim and Cursor
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
- Never log or expose PII, PHI, or other sensitive data in code

### Code Review
- Never approve or merge PRs autonomously
- Always run relevant checks before suggesting a PR is ready
