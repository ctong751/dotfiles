return {
    {
	'neovim/nvim-lspconfig',
	dependencies = {
	    'williamboman/mason.nvim',
	    'williamboman/mason-lspconfig.nvim',
	},
	config = function()
	    require('mason').setup()
	    require('mason-lspconfig').setup({
		ensure_installed = {
		    'ts_ls',
		    'eslint',
		    'jdtls',
		},
	    })

	    -- Enable installed servers via vim.lsp.enable (0.11+ native API)
	    vim.lsp.enable({ 'ts_ls', 'eslint', 'jdtls' })

	    -- LSP keymaps when a server attaches
	    vim.api.nvim_create_autocmd('LspAttach', {
		callback = function(ev)
		    local opts = { buffer = ev.buf }
		    vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
		    vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, opts)
		    vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, opts)
		    vim.keymap.set('n', 'gr', vim.lsp.buf.references, opts)
		    vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
		    vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, opts)
		    vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, opts)
		    vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, opts)
		    vim.keymap.set('n', ']d', vim.diagnostic.goto_next, opts)
		end,
	    })
	end,
    },

    -- Autocompletion
    {
	'hrsh7th/nvim-cmp',
	dependencies = {
	    'hrsh7th/cmp-nvim-lsp',
	    'L3MON4D3/LuaSnip',
	},
	config = function()
	    local cmp = require('cmp')
	    cmp.setup({
		snippet = {
		    expand = function(args)
			require('luasnip').lsp_expand(args.body)
		    end,
		},
		sources = {
		    { name = 'nvim_lsp' },
		    { name = 'luasnip' },
		},
		mapping = cmp.mapping.preset.insert({
		    ['<C-Space>'] = cmp.mapping.complete(),
		    ['<CR>'] = cmp.mapping.confirm({ select = true }),
		    ['<C-n>'] = cmp.mapping.select_next_item(),
		    ['<C-p>'] = cmp.mapping.select_prev_item(),
		}),
	    })
	end,
    },
}
