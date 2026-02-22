return {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
	require("nvim-treesitter.configs").setup({
	    ensure_installed = {
		"lua", "javascript", "typescript", "tsx",
		"java", "json", "html", "css", "markdown",
	    },
	    highlight = { enable = true },
	    indent = { enable = true },
	})
    end,
}
