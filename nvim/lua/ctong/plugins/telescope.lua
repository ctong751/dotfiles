return {
  'nvim-telescope/telescope.nvim',
  dependencies = { 'nvim-lua/plenary.nvim' },
  config = function()
     local builtin = require('telescope.builtin')
     vim.keymap.set('n', '<leader>ff', builtin.find_files, {})
     vim.keymap.set('n', '<leader>fF', function() builtin.find_files({ no_ignore = true, hidden = true }) end, { desc = "Find all files (incl. gitignored)" })
     vim.keymap.set('n', '<leader>fg', builtin.live_grep, {})
     vim.keymap.set('n', '<leader>fb', builtin.buffers, {})
     vim.keymap.set('n', '<leader>fh', builtin.help_tags, {})
  end
}
