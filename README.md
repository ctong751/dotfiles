# dotfiles

Personal dotfiles for a portable terminal environment: Neovim, Zsh with Powerlevel10k, and Claude Code statusline.

## What's included

- **Neovim** (lazy.nvim) — Kanagawa theme, LSP via lsp-zero + Mason, Telescope, Treesitter, Diffview, Fugitive
- **Zsh** — oh-my-zsh with Powerlevel10k prompt and zsh-autosuggestions
- **Claude Code** — statusline config (ccstatusline)

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
- Symlink `zsh/zshrc` to `~/.zshrc` and `zsh/p10k.zsh` to `~/.p10k.zsh`
- Merge Claude statusline config into `~/.claude/settings.json` (or symlink if none exists)
- Back up any existing files before overwriting

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
