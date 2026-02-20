# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal dotfiles repository containing Neovim, Zsh, and Claude Code configuration. All nvim config files are Lua.

## Installation

```bash
./install  # Symlinks nvim, zsh, p10k, and claude configs into place
```

## Repository Structure

```
dotfiles/
├── CLAUDE.md
├── README.md
├── install
├── claude/
│   └── settings.json          # Claude Code statusline config
├── nvim/
│   ├── init.lua               # Entry point: require("ctong")
│   └── lua/ctong/
│       ├── init.lua            # Loads set, remap, bootstraps lazy.nvim
│       ├── set.lua             # Editor settings
│       ├── remap.lua           # Global keymaps (leader = Space)
│       └── plugins/            # Each file returns a lazy.nvim plugin spec
│           ├── autotags.lua
│           ├── colorizer.lua
│           ├── devicons.lua
│           ├── diffview.lua
│           ├── fugitive.lua
│           ├── galaxyline.lua
│           ├── lsp/init.lua
│           ├── prettier.lua
│           ├── telescope.lua
│           ├── theme.lua
│           └── treesitter.lua
└── zsh/
    ├── zshrc                  # Core shell config (cross-platform)
    └── p10k.zsh               # Powerlevel10k prompt config
```

## Neovim Config Architecture

**Entry point:** `nvim/init.lua` loads `require("ctong")`.

**Core config** (`nvim/lua/ctong/`):
- `init.lua` — Loads `set` and `remap`, bootstraps lazy.nvim, loads plugins
- `set.lua` — Editor settings (4-space tabs, relative line numbers)
- `remap.lua` — Global keymaps (Space as leader)

**Plugin specs** (`nvim/lua/ctong/plugins/`): Each file returns a lazy.nvim plugin spec table. lazy.nvim auto-discovers all files in this directory.

## Zsh Config

- `zsh/zshrc` — Cross-platform (Mac/Linux) shell config with oh-my-zsh, Powerlevel10k, zsh-autosuggestions
- `zsh/p10k.zsh` — Generated Powerlevel10k config (edit via `p10k configure`)
- Machine-specific config goes in `~/.zshrc.local` (not tracked)

## Key Conventions

- Leader key is Space
- Colorscheme: Kanagawa Wave
- LSP managed via lsp-zero + Mason
- Plugin manager: lazy.nvim
- Indentation: 4 spaces (tabs in files, expandtab off)
