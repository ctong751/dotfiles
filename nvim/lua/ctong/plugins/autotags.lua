return {
  "windwp/nvim-ts-autotag",
  ft = {
    "html",
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "tsx",
    "jsx",
    "xml",
    "markdown",
  },
  opts = {
    opts = {
      -- Work around nvim-ts-autotag trying to rename tags from buffers
      -- without an active treesitter parser (for example Telescope prompt).
      enable_rename = false,
      enable_close = true,
      enable_close_on_slash = false,
    },
  },
}
