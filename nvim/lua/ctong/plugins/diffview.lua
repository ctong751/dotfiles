return {
    "sindrets/diffview.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
        vim.keymap.set('n', '<leader>dv', ':DiffviewOpen<cr>', { noremap = true, silent = true })
        vim.keymap.set('n', '<leader>dh', ':DiffviewFileHistory %<cr>', { noremap = true, silent = true })
        vim.keymap.set('n', '<leader>dc', ':DiffviewClose<cr>', { noremap = true, silent = true })
    end
}
