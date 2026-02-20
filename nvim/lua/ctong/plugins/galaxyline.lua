return {
    "NTBBloodbath/galaxyline.nvim",
    config = function()
	require("galaxyline.themes.eviline")
    end,
    -- some optional icons
    requires = { "kyazdani42/nvim-web-devicons", opt = true }
}
