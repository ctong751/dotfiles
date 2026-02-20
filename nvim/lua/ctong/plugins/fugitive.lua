return {
    "tpope/vim-fugitive",
    config = function()
        vim.keymap.set('n', '<leader>gs', ':Git<cr>', { noremap = true, silent = true })
    end
}
