vim.g.mapleader = " "
local map = vim.api.nvim_set_keymap

map('n', '<leader>re', ':Rex<cr>', { noremap = true, silent = true })

-- Quit all Neovim windows/splits at once.
map('n', '<leader>q', ':qa<cr>', { noremap = true, silent = true })
map('n', '<leader>Q', ':qa!<cr>', { noremap = true, silent = true })

-- Move between Neovim windows/splits with Ctrl + h/j/k/l instead of Ctrl-w h/j/k/l.
-- Example: from the file explorer on the left, Ctrl-l jumps back to the editor split.
map('n', '<C-h>', '<C-w>h', { noremap = true, silent = true })
map('n', '<C-j>', '<C-w>j', { noremap = true, silent = true })
map('n', '<C-k>', '<C-w>k', { noremap = true, silent = true })
map('n', '<C-l>', '<C-w>l', { noremap = true, silent = true })
