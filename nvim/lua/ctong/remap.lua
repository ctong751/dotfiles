vim.g.mapleader = " "
local map = vim.api.nvim_set_keymap
map('n', '<leader>re', ':Rex<cr>', { noremap = true, silent = true })
