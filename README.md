# dotfiles

Personal dotfiles for a portable terminal environment: Neovim, Zsh with Powerlevel10k, Claude Code statusline, and Pi agent skills.

## What's included

- **Neovim** (lazy.nvim) — Kanagawa theme, LSP via lsp-zero + Mason, Telescope, Treesitter, Diffview, Fugitive
- **Zsh** — oh-my-zsh with Powerlevel10k prompt and zsh-autosuggestions
- **Tmux** — custom two-line status bar with git branch, system stats
- **Git** — global gitconfig and gitignore
- **Ghostty** — terminal theme and font config
- **Claude Code** — statusline config (ccstatusline)
- **Pi** — custom global skill(s) plus a bootstrap script for third-party skills

## Prerequisites

- [Neovim](https://neovim.io/) (0.9+)
- [zsh](https://www.zsh.org/) + [oh-my-zsh](https://ohmyz.sh/)
- [Powerlevel10k](https://github.com/romkatv/powerlevel10k) — `brew install powerlevel10k` (Mac) or `git clone` (Linux)
- [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) — `brew install zsh-autosuggestions` (Mac) or `apt install` / `git clone` (Linux)
- [bun](https://bun.sh/) — for Claude Code statusline

## Installation

```bash
git clone https://github.com/ctong751/dotfiles.git ~/repos/dotfiles
cd ~/repos/dotfiles
./install
```

The install script will:
- Symlink `nvim/` to `~/.config/nvim`
- Symlink `git/gitconfig` to `~/.gitconfig` and `git/gitignore` to `~/.gitignore`
- Symlink `ghostty/config` to `~/.config/ghostty/config`
- Symlink `zsh/zshrc` to `~/.zshrc` and `zsh/p10k.zsh` to `~/.p10k.zsh`
- Symlink `tmux/` to `~/.config/tmux`
- Merge Claude statusline config into `~/.claude/settings.json` (or symlink if none exists)
- Symlink the custom Pi skill `agents/skills/git-commit-safety/` into `~/.agents/skills/` and `~/.pi/agent/skills/`
- Back up any existing files before overwriting

To also install third-party skills via skills.sh during setup:

```bash
INSTALL_AGENT_SKILLS=1 ./install
```

Or install them later with:

```bash
./scripts/install-agent-skills
```

## Pi / agent skills

Custom skills managed in this repo live under:

- `agents/skills/`

Current custom skill:

- `git-commit-safety`

Third-party skills are not vendored into this repo. Instead, they can be reinstalled with `./scripts/install-agent-skills`.

## Machine-specific config

Create `~/.zshrc.local` for anything specific to one machine (nvm, sdkman, API keys, etc.). It gets sourced at the end of `.zshrc`.

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
