return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  -- Load on startup so neo-tree can replace netrw when opening directories like `nvim .`.
  lazy = false,
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-tree/nvim-web-devicons",
    "MunifTanjim/nui.nvim",
  },
  keys = {
    { "<leader>e", "<cmd>Neotree toggle<cr>", desc = "Toggle file tree" },
    { "<leader>o", "<cmd>Neotree focus<cr>", desc = "Focus file tree" },
  },
  opts = {
    filesystem = {
      -- When opening a directory with `nvim .`, use neo-tree instead of the built-in netrw explorer.
      hijack_netrw_behavior = "open_current",
      follow_current_file = { enabled = true },
      filtered_items = {
        visible = true,
        hide_dotfiles = false,
        hide_gitignored = false,
      },
    },
    window = {
      position = "left",
      width = 35,
      mappings = {
        ["<space>"] = "none",
      },
    },
    default_component_configs = {
      git_status = {
        symbols = {
          added = "",
          modified = "",
          deleted = "✖",
          renamed = "󰁕",
          untracked = "",
          ignored = "",
          unstaged = "󰄱",
          staged = "",
          conflict = "",
        },
      },
    },
  },
}
