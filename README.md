# dotfiles

Personal dotfiles for a portable terminal environment: Neovim, Zsh with Powerlevel10k, Claude Code statusline, and Pi agent skills/extensions.

## What's included

- **Neovim** (lazy.nvim) — Kanagawa theme, LSP via lsp-zero + Mason, Telescope, Treesitter, Diffview, Fugitive
- **Zsh** — oh-my-zsh with Powerlevel10k prompt and zsh-autosuggestions
- **Tmux** — custom two-line status bar with git branch, system stats
- **Git** — global gitconfig, gitignore, and Lazygit
- **Ghostty** — terminal theme and font config
- **Claude Code** — statusline config (ccstatusline)
- **Pi** — custom global skills/extensions plus a bootstrap script for third-party skills

## Prerequisites

- [Neovim](https://neovim.io/) (0.9+)
- [zsh](https://www.zsh.org/) + [oh-my-zsh](https://ohmyz.sh/)
- [Powerlevel10k](https://github.com/romkatv/powerlevel10k) — `brew install powerlevel10k` (Mac) or `git clone` (Linux)
- [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) — `brew install zsh-autosuggestions` (Mac) or `apt install` / `git clone` (Linux)
- [bun](https://bun.sh/) — for Claude Code statusline (the install script adds a wrapper so GUI-launched apps can still find `bunx`)

## Installation

```bash
git clone https://github.com/ctong751/dotfiles.git ~/repos/dotfiles
cd ~/repos/dotfiles
./install
```

The install script will:
- Symlink `nvim/` to `~/.config/nvim`
- Install `lazygit`
- Symlink `git/gitconfig` to `~/.gitconfig` and `git/gitignore` to `~/.gitignore`
- Symlink `ghostty/config` to `~/.config/ghostty/config`
- Symlink `zsh/zshrc` to `~/.zshrc` and `zsh/p10k.zsh` to `~/.p10k.zsh`
- Symlink `tmux/` to `~/.config/tmux`
- Install a Bun-resolving statusline launcher at `~/.config/ccstatusline/run`
- Merge Claude statusline config into `~/.claude/settings.json` with that launcher path
- Merge shared Pi package/settings config from `pi/settings.json` into `~/.pi/agent/settings.json`
- Symlink the custom Pi skill `agents/skills/git-commit-safety/` into `~/.agents/skills/` and `~/.pi/agent/skills/`
- Symlink every custom Pi extension in `pi/extensions/` into `~/.pi/agent/extensions/`
- Back up any existing files before overwriting

To also install third-party skills via skills.sh during setup:

```bash
INSTALL_AGENT_SKILLS=1 ./install
```

Or install them later with:

```bash
./scripts/install-agent-skills
```

## Pi / agent skills + extensions

Custom Pi resources managed in this repo live under:

- `agents/skills/`
- `pi/extensions/`
- `pi/settings.json`

Current custom skill:

- `git-commit-safety`

Current custom global extensions:

- `prompt-url-widget.ts` — shows a widget above the editor when a GitHub issue/PR URL appears in a prompt and updates the session name from the fetched title
- `lazygit.ts` — `/lg` extension that suspends Pi's TUI and opens `lazygit` in the current repo
- `pi-diff-viewer.ts` — `/annotate-diff` opens a GUI review bundle for diffs/files and feeds your annotations back into Pi

Notes:

- `prompt-url-widget.ts` uses the GitHub (`gh`), Atlassian (`acli`), and Linear (`linear`) CLIs for title/owner metadata when available.
- For ambiguous bare issue keys, you can set a project preference in `.pi/prompt-url-widget.json`, e.g. `{ "preferredTracker": "linear" }`.
- `lazygit.ts` expects `lazygit` to be installed.
- All `*.ts` files in `pi/extensions/` are auto-linked by `./install`.
- Pi npm/git packages are tracked by source in `pi/settings.json` (for example `npm:@calesennett/pi-codex-usage`) rather than vendoring the installed package files.
- Third-party skills are not vendored into this repo. Instead, they can be reinstalled with `./scripts/install-agent-skills`.

## Machine-specific config

Create `~/.zshrc.local` for anything specific to one machine (nvm, sdkman, API keys, custom install locations, etc.). It gets sourced before the shared PATH/tool setup in `.zshrc`, so machine-specific overrides (for example `BUN_INSTALL`) win.

## Nvim keybindings

Leader key: `Space`

| Key | Action |
|---|---|
| `<leader>ff` | Telescope find files |
| `<leader>fg` | Telescope live grep |
| `<leader>fb` | Telescope buffers |
| `<leader>fh` | Telescope help tags |
| `<leader>dv` | Diffview open |
| `<leader>dh` | Diffview file history |
| `<leader>gs` | Git status (Fugitive) |
| `<leader>re` | Return to netrw |
