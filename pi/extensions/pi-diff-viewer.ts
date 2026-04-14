import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";

type GitChange = {
	path: string;
	status: string;
	tracked: boolean;
};

type ReviewTarget =
	| {
			kind: "working-tree";
			label: string;
			gitRoot: string;
			changedFiles: GitChange[];
	  }
	| {
			kind: "file";
			label: string;
			path: string;
			gitRoot?: string;
			status?: string;
			tracked: boolean;
	  };

type ReviewBundle = {
	dir: string;
	notesPath: string;
	contextPaths: string[];
	diffPair?: [string, string];
};

async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function sanitizeName(value: string): string {
	return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "review";
}

function parseGitStatus(stdout: string): GitChange[] {
	const seen = new Set<string>();
	const files: GitChange[] = [];

	for (const rawLine of stdout.split("\n")) {
		if (!rawLine.trim()) continue;
		const status = rawLine.slice(0, 2);
		let file = rawLine.slice(3).trim();
		if (!file) continue;
		if (file.includes(" -> ")) {
			file = file.split(" -> ").pop()?.trim() ?? file;
		}
		if (seen.has(file)) continue;
		seen.add(file);
		files.push({
			path: file,
			status: status.trim() || "??",
			tracked: !status.includes("?"),
		});
	}

	return files;
}

async function getGitRoot(pi: ExtensionAPI, cwd: string): Promise<string | undefined> {
	try {
		const result = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd });
		if (result.code !== 0) return undefined;
		const root = result.stdout.trim();
		return root || undefined;
	} catch {
		return undefined;
	}
}

async function getChangedFiles(pi: ExtensionAPI, cwd: string): Promise<GitChange[]> {
	try {
		const result = await pi.exec("git", ["status", "--short"], { cwd });
		if (result.code !== 0) return [];
		return parseGitStatus(result.stdout);
	} catch {
		return [];
	}
}

async function isTrackedPath(pi: ExtensionAPI, gitRoot: string | undefined, path: string): Promise<boolean> {
	if (!gitRoot) return false;
	const repoRelativePath = relative(gitRoot, path).replace(/\\/g, "/");
	try {
		const result = await pi.exec("git", ["ls-files", "--error-unmatch", "--", repoRelativePath], { cwd: gitRoot });
		return result.code === 0;
	} catch {
		return false;
	}
}

function buildNotesTemplate(target: ReviewTarget, contextPaths: string[]): string {
	const contextList = contextPaths.length > 0 ? contextPaths.map((path) => `- ${path}`).join("\n") : "- (opened from working tree)";

	return `# Pi diff review\n\nTarget: ${target.label}\n\nContext files\n${contextList}\n\nLeave concrete, actionable review annotations below.\nGood annotations usually:\n- mention file paths, functions, or symbols\n- describe the desired change, not just the problem\n- stay scoped to this target\n\n## Annotations\n- \n`;
}

function extractAnnotations(notes: string): string | undefined {
	const marker = "## Annotations";
	const start = notes.indexOf(marker);
	const body = (start >= 0 ? notes.slice(start + marker.length) : notes).trim();
	if (!body || body === "-" || body === "- [ ]") return undefined;
	return body;
}

async function ensureBundleDir(target: ReviewTarget): Promise<string> {
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const dir = join(tmpdir(), "pi-diff-viewer", `${stamp}-${sanitizeName(target.label)}`);
	await mkdir(dir, { recursive: true });
	return dir;
}

async function createWorkingTreeBundle(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	target: Extract<ReviewTarget, { kind: "working-tree" }>,
): Promise<ReviewBundle> {
	const dir = await ensureBundleDir(target);
	const notesPath = join(dir, "ANNOTATIONS.md");
	const contextPaths: string[] = [];

	const summaryPath = join(dir, "CHANGED_FILES.txt");
	const summary = target.changedFiles.length
		? target.changedFiles.map((file) => `${file.status.padEnd(2, " ")} ${file.path}`).join("\n")
		: "No changed files reported by git status.";
	await writeFile(summaryPath, `${summary}\n`, "utf8");
	contextPaths.push(summaryPath);

	const staged = await pi.exec("git", ["diff", "--cached", "--no-ext-diff", "--"], { cwd: ctx.cwd });
	if (staged.code === 0 && staged.stdout.trim()) {
		const stagedPath = join(dir, "STAGED.patch");
		await writeFile(stagedPath, staged.stdout, "utf8");
		contextPaths.push(stagedPath);
	}

	const unstaged = await pi.exec("git", ["diff", "--no-ext-diff", "--"], { cwd: ctx.cwd });
	if (unstaged.code === 0 && unstaged.stdout.trim()) {
		const unstagedPath = join(dir, "WORKTREE.patch");
		await writeFile(unstagedPath, unstaged.stdout, "utf8");
		contextPaths.push(unstagedPath);
	}

	const untracked = target.changedFiles.filter((file) => !file.tracked).map((file) => file.path);
	if (untracked.length > 0) {
		const untrackedPath = join(dir, "UNTRACKED_FILES.txt");
		await writeFile(untrackedPath, `${untracked.join("\n")}\n`, "utf8");
		contextPaths.push(untrackedPath);
	}

	await writeFile(notesPath, buildNotesTemplate(target, contextPaths.map((path) => basename(path))), "utf8");
	return { dir, notesPath, contextPaths };
}

async function createFileBundle(
	pi: ExtensionAPI,
	target: Extract<ReviewTarget, { kind: "file" }>,
): Promise<ReviewBundle> {
	const dir = await ensureBundleDir(target);
	const notesPath = join(dir, "ANNOTATIONS.md");
	const contextPaths: string[] = [];
	let diffPair: [string, string] | undefined;

	const currentExists = await pathExists(target.path);
	const currentLabel = target.gitRoot
		? relative(target.gitRoot, target.path).replace(/\\/g, "/") || target.path
		: target.path;

	if (target.gitRoot && target.tracked) {
		const repoRelativePath = relative(target.gitRoot, target.path).replace(/\\/g, "/");
		const baseResult = await pi.exec("git", ["show", `HEAD:${repoRelativePath}`], { cwd: target.gitRoot });
		if (baseResult.code === 0) {
			const baseSnapshotPath = join(dir, `BASE-${sanitizeName(repoRelativePath)}`);
			await writeFile(baseSnapshotPath, baseResult.stdout, "utf8");
			contextPaths.push(baseSnapshotPath);
			if (currentExists) {
				diffPair = [baseSnapshotPath, target.path];
			} else {
				const deletedPath = join(dir, "DELETED.txt");
				await writeFile(
					deletedPath,
					`${repoRelativePath} does not exist in the working tree. Review the base snapshot and annotations to guide Pi.\n`,
					"utf8",
				);
				contextPaths.push(deletedPath);
			}
		}
	}

	if (currentExists) {
		contextPaths.push(target.path);
		const snapshotPath = join(dir, `CURRENT-${sanitizeName(basename(target.path))}`);
		await copyFile(target.path, snapshotPath);
		if (!diffPair) {
			contextPaths.push(snapshotPath);
		}
	}

	if (!currentExists && contextPaths.length === 0) {
		const missingPath = join(dir, "MISSING.txt");
		await writeFile(missingPath, `${currentLabel} was not found. Add annotations describing the changes you want Pi to make.\n`, "utf8");
		contextPaths.push(missingPath);
	}

	await writeFile(notesPath, buildNotesTemplate(target, contextPaths.map((path) => basename(path))), "utf8");
	return { dir, notesPath, contextPaths, diffPair };
}

async function createReviewBundle(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	target: ReviewTarget,
): Promise<ReviewBundle> {
	if (target.kind === "working-tree") return createWorkingTreeBundle(pi, ctx, target);
	return createFileBundle(pi, target);
}

async function tryExec(pi: ExtensionAPI, command: string, args: string[], cwd: string): Promise<boolean> {
	try {
		const result = await pi.exec(command, args, { cwd });
		return result.code === 0;
	} catch {
		return false;
	}
}

async function openBundle(pi: ExtensionAPI, ctx: ExtensionCommandContext, bundle: ReviewBundle): Promise<string | undefined> {
	const editorCandidates = ["code", "cursor", "windsurf"];

	for (const editor of editorCandidates) {
		const openedNotes = await tryExec(pi, editor, ["-n", bundle.notesPath], ctx.cwd);
		if (!openedNotes) continue;

		if (bundle.diffPair) {
			await tryExec(pi, editor, ["--diff", bundle.diffPair[0], bundle.diffPair[1]], ctx.cwd);
		}
		if (bundle.contextPaths.length > 0) {
			await tryExec(pi, editor, bundle.contextPaths, ctx.cwd);
		}
		return editor;
	}

	if (await tryExec(pi, "zed", [bundle.notesPath, ...bundle.contextPaths], ctx.cwd)) {
		return "zed";
	}

	if (process.platform === "darwin" && (await tryExec(pi, "open", [bundle.dir], ctx.cwd))) {
		return "open";
	}

	if (process.platform === "linux" && (await tryExec(pi, "xdg-open", [bundle.dir], ctx.cwd))) {
		return "xdg-open";
	}

	return undefined;
}

async function chooseTarget(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	args: string,
): Promise<ReviewTarget | undefined> {
	const trimmedArgs = args.trim();
	const gitRoot = await getGitRoot(pi, ctx.cwd);

	if (trimmedArgs) {
		const resolvedPath = resolve(ctx.cwd, trimmedArgs);
		if (!(await pathExists(resolvedPath))) {
			ctx.ui.notify(`Path not found: ${trimmedArgs}`, "error");
			return undefined;
		}
		return {
			kind: "file",
			label: `File review — ${trimmedArgs}`,
			path: resolvedPath,
			gitRoot,
			tracked: await isTrackedPath(pi, gitRoot, resolvedPath),
		};
	}

	if (gitRoot) {
		const changedFiles = await getChangedFiles(pi, ctx.cwd);
		if (changedFiles.length > 0) {
			const fileChoices = changedFiles.map((file) => ({
				label: `${file.status.padEnd(2, " ")} ${file.path}`,
				file,
			}));
			const items = ["Working tree diff", ...fileChoices.map((choice) => choice.label), "Enter a file path manually"];
			const choice = await ctx.ui.select("Annotate diff or file", items);
			
			if (!choice) return undefined;
			if (choice === "Working tree diff") {
				return {
					kind: "working-tree",
					label: "Working tree diff",
					gitRoot,
					changedFiles,
				};
			}
			if (choice !== "Enter a file path manually") {
				const selected = fileChoices.find((item) => item.label === choice)?.file;
				if (selected) {
					return {
						kind: "file",
						label: `File review — ${selected.path}`,
						path: resolve(gitRoot, selected.path),
						gitRoot,
						status: selected.status,
						tracked: selected.tracked,
					};
				}
			}
		}
	}

	const manualPath = await ctx.ui.input("Path to file for review", "path/to/file.ts");
	if (!manualPath?.trim()) return undefined;
	const resolvedPath = resolve(ctx.cwd, manualPath.trim());
	if (!(await pathExists(resolvedPath))) {
		ctx.ui.notify(`Path not found: ${manualPath}`, "error");
		return undefined;
	}

	return {
		kind: "file",
		label: `File review — ${manualPath.trim()}`,
		path: resolvedPath,
		gitRoot,
		tracked: await isTrackedPath(pi, gitRoot, resolvedPath),
	};
}

function buildFollowUpPrompt(target: ReviewTarget, annotations: string): string {
	const scope = target.kind === "working-tree" ? "the current working tree diff" : `the file ${target.path}`;
	return `Please act on these review annotations for ${scope}.\n\nTarget: ${target.label}\n\nAnnotations:\n${annotations}\n\nUse the current repository state as the source of truth. Read any files you need, then make the requested changes conservatively.`;
}

function registerAnnotateDiffCommand(pi: ExtensionAPI, name: string, description: string) {
	pi.registerCommand(name, {
		description,
		handler: async (args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("This command needs an interactive UI", "error");
				return;
			}

			const target = await chooseTarget(pi, ctx, args);
			if (!target) return;

			const bundle = await createReviewBundle(pi, ctx, target);
			const opener = await openBundle(pi, ctx, bundle);
			if (!opener) {
				ctx.ui.notify(
					`Couldn't find a GUI editor. Review bundle saved at ${bundle.dir}`,
					"warning",
				);
			} else {
				ctx.ui.notify(`Opened review bundle with ${opener}: ${bundle.dir}`, "info");
			}

			while (true) {
				const choice = await ctx.ui.select("Import review annotations when you're done", [
					"Import annotations",
					"Reopen review bundle",
					"Cancel",
				]);

				if (!choice || choice === "Cancel") return;
				if (choice === "Reopen review bundle") {
					await openBundle(pi, ctx, bundle);
					continue;
				}
				break;
			}

			const notes = await readFile(bundle.notesPath, "utf8");
			const annotations = extractAnnotations(notes);
			if (!annotations) {
				ctx.ui.notify("No annotations found in ANNOTATIONS.md", "warning");
				return;
			}

			const prompt = buildFollowUpPrompt(target, annotations);
			if (ctx.isIdle()) {
				pi.sendUserMessage(prompt);
			} else {
				pi.sendUserMessage(prompt, { deliverAs: "followUp" });
			}
			ctx.ui.notify("Sent annotations back to pi", "info");
		},
	});
}

export default function piDiffViewerExtension(pi: ExtensionAPI) {
	registerAnnotateDiffCommand(
		pi,
		"annotate-diff",
		"Open a GUI review bundle for the working tree diff or a file, then feed annotations back to pi",
	);
	registerAnnotateDiffCommand(
		pi,
		"diff-review",
		"Alias for /annotate-diff",
	);
}
