return {
  "kdheepak/lazygit.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  keys = {
    { "<leader>gg", "<cmd>LazyGit<cr>", desc = "Open LazyGit" },
  },
  config = function()
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "lazygit",
      callback = function()
        vim.wo.winhighlight = "NormalFloat:Normal,FloatBorder:Normal"
      end,
    })
    vim.g.lazygit_floating_window_scaling_factor = 0.9
  end,
}
