return {
  "rose-pine/neovim",
  name = "rose-pine",
  lazy = false,
  priority = 1000,
  config = function()
    require("rose-pine").setup({
      variant = "main",
    })
    vim.cmd("colorscheme rose-pine")

    -- Clear terminal color overrides so lazygit/other TUI apps
    -- use the terminal emulator's native palette
    for i = 0, 15 do
      vim.g["terminal_color_" .. i] = nil
    end
  end,
}
