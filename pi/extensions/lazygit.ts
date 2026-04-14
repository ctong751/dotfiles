/**
 * Lazygit Extension
 *
 * /lg temporarily suspends pi's TUI and launches lazygit in the current
 * repository.
 */

import { spawnSync } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("lg", {
		description: "Open lazygit in the current repository",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("/lg requires interactive mode", "error");
				return;
			}

			let launchError: Error | null = null;
			const exitCode = await ctx.ui.custom<number | null>((tui, _theme, _kb, done) => {
				tui.stop();
				process.stdout.write("\x1b[2J\x1b[H");

				try {
					const result = spawnSync("lazygit", [], {
						cwd: ctx.cwd,
						stdio: "inherit",
						env: process.env,
					});

					launchError = result.error ?? null;
					done(result.status ?? (launchError ? 1 : 0));
				} finally {
					tui.start();
					tui.requestRender(true);
				}

				return { render: () => [], invalidate: () => {} };
			});

			if (launchError) {
				ctx.ui.notify(`Failed to launch lazygit: ${launchError.message}`, "error");
				return;
			}

			if (exitCode && exitCode !== 0) {
				ctx.ui.notify(`lazygit exited with code ${exitCode}`, "warning");
			}
		},
	});
}
