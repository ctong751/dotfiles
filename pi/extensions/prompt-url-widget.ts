import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { DynamicBorder, type ExtensionAPI, type ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Container, Text } from "@mariozechner/pi-tui";

const GITHUB_PR_URL_RE = /https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)(?:[^\s<]*)?/i;
const GITHUB_ISSUE_URL_RE = /https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)(?:[^\s<]*)?/i;
const JIRA_URL_RE = /https?:\/\/[^\s<]+\/browse\/([A-Z][A-Z0-9]+-\d+)(?:[^\s<]*)?/i;
const LINEAR_URL_RE = /https?:\/\/linear\.app\/[^\s/]+\/issue\/([A-Z][A-Z0-9]+-\d+)(?:[^\s<]*)?/i;
const ISSUE_KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/;

type Provider = "github-pr" | "github-issue" | "jira" | "linear";
type TrackerProvider = "jira" | "linear";

type PromptMatch = {
	provider: Provider;
	reference: string;
	lookup: string;
	url?: string;
};

type Candidate = {
	index: number;
	match: PromptMatch;
	spanEnd: number;
};

type KeyCandidate = {
	index: number;
	key: string;
	contextHint?: TrackerProvider;
};

type Person = {
	name?: string | null;
	login?: string | null;
};

type IssueMetadata = {
	title?: string;
	author?: Person;
	url?: string;
};

type PromptUrlWidgetConfig = {
	preferredTracker?: TrackerProvider;
	preferredTrackers?: TrackerProvider[];
	issueTracker?: TrackerProvider;
};

function normalizeUrl(url: string): string {
	return url.replace(/[),.;:!?]+$/, "");
}

function buildCandidate(match: RegExpExecArray, promptMatch: PromptMatch): Candidate {
	return {
		index: match.index,
		spanEnd: match.index + match[0].length,
		match: promptMatch,
	};
}

function extractUrlCandidates(prompt: string): Candidate[] {
	const candidates: Candidate[] = [];

	const prMatch = GITHUB_PR_URL_RE.exec(prompt);
	if (prMatch?.[1] && prMatch[2]) {
		candidates.push(
			buildCandidate(prMatch, {
				provider: "github-pr",
				reference: `#${prMatch[2].trim()}`,
				lookup: normalizeUrl(prMatch[0].trim()),
				url: normalizeUrl(prMatch[0].trim()),
			}),
		);
	}

	const issueMatch = GITHUB_ISSUE_URL_RE.exec(prompt);
	if (issueMatch?.[1] && issueMatch[2]) {
		candidates.push(
			buildCandidate(issueMatch, {
				provider: "github-issue",
				reference: `#${issueMatch[2].trim()}`,
				lookup: normalizeUrl(issueMatch[0].trim()),
				url: normalizeUrl(issueMatch[0].trim()),
			}),
		);
	}

	const jiraMatch = JIRA_URL_RE.exec(prompt);
	if (jiraMatch?.[1]) {
		const url = normalizeUrl(jiraMatch[0].trim());
		candidates.push(
			buildCandidate(jiraMatch, {
				provider: "jira",
				reference: jiraMatch[1].trim(),
				lookup: jiraMatch[1].trim(),
				url,
			}),
		);
	}

	const linearMatch = LINEAR_URL_RE.exec(prompt);
	if (linearMatch?.[1]) {
		const url = normalizeUrl(linearMatch[0].trim());
		candidates.push(
			buildCandidate(linearMatch, {
				provider: "linear",
				reference: linearMatch[1].trim(),
				lookup: linearMatch[1].trim(),
				url,
			}),
		);
	}

	return candidates.sort((a, b) => a.index - b.index);
}

function inferKeyContext(prompt: string, keyIndex: number): TrackerProvider | undefined {
	const start = Math.max(0, keyIndex - 64);
	const end = Math.min(prompt.length, keyIndex + 64);
	const nearby = prompt.slice(start, end).toLowerCase();
	if (nearby.includes("linear")) return "linear";
	if (nearby.includes("jira")) return "jira";
	return undefined;
}

function extractKeyCandidate(prompt: string, urlCandidates: Candidate[]): KeyCandidate | undefined {
	const keyMatch = ISSUE_KEY_RE.exec(prompt);
	if (!keyMatch?.[1]) return undefined;

	const keyStart = keyMatch.index;
	const insideUrlCandidate = urlCandidates.some((candidate) => keyStart >= candidate.index && keyStart < candidate.spanEnd);
	if (insideUrlCandidate) return undefined;

	return {
		index: keyMatch.index,
		key: keyMatch[1].trim(),
		contextHint: inferKeyContext(prompt, keyMatch.index),
	};
}

async function commandExists(pi: ExtensionAPI, command: string, cache: Map<string, boolean>): Promise<boolean> {
	const cached = cache.get(command);
	if (cached !== undefined) return cached;
	try {
		const result = await pi.exec(command, ["--help"]);
		const exists = result.code === 0 || result.code === 1;
		cache.set(command, exists);
		return exists;
	} catch {
		cache.set(command, false);
		return false;
	}
}

async function getGitRoot(pi: ExtensionAPI, cwd: string): Promise<string | undefined> {
	try {
		const result = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd });
		if (result.code !== 0) return undefined;
		const gitRoot = result.stdout.trim();
		return gitRoot || undefined;
	} catch {
		return undefined;
	}
}

function normalizePreferredTrackers(config: PromptUrlWidgetConfig | undefined): TrackerProvider[] {
	if (!config) return [];
	const list = Array.isArray(config.preferredTrackers)
		? config.preferredTrackers
		: [config.preferredTracker, config.issueTracker].filter((value): value is TrackerProvider => value === "jira" || value === "linear");
	return list.filter((value): value is TrackerProvider => value === "jira" || value === "linear");
}

async function loadPreferredTrackers(
	pi: ExtensionAPI,
	cwd: string,
	configCache: Map<string, TrackerProvider[]>,
): Promise<TrackerProvider[]> {
	const cached = configCache.get(cwd);
	if (cached) return cached;

	const gitRoot = await getGitRoot(pi, cwd);
	const configPaths = [resolve(cwd, ".pi", "prompt-url-widget.json")];
	if (gitRoot && gitRoot !== cwd) {
		configPaths.push(resolve(gitRoot, ".pi", "prompt-url-widget.json"));
	}

	for (const path of configPaths) {
		try {
			const raw = await readFile(path, "utf8");
			const config = JSON.parse(raw) as PromptUrlWidgetConfig;
			const trackers = normalizePreferredTrackers(config);
			configCache.set(cwd, trackers);
			return trackers;
		} catch {
			continue;
		}
	}

	configCache.set(cwd, []);
	return [];
}

async function resolveKeyCandidate(
	pi: ExtensionAPI,
	candidate: KeyCandidate,
	cwd: string,
	commandCache: Map<string, boolean>,
	configCache: Map<string, TrackerProvider[]>,
): Promise<PromptMatch | undefined> {
	if (candidate.contextHint === "linear") {
		return {
			provider: "linear",
			reference: candidate.key,
			lookup: candidate.key,
		};
	}
	if (candidate.contextHint === "jira") {
		return {
			provider: "jira",
			reference: candidate.key,
			lookup: candidate.key,
		};
	}

	const preferredTrackers = await loadPreferredTrackers(pi, cwd, configCache);
	if (preferredTrackers.length > 0) {
		return {
			provider: preferredTrackers[0],
			reference: candidate.key,
			lookup: candidate.key,
		};
	}

	const [hasLinear, hasJira] = await Promise.all([
		commandExists(pi, "linear", commandCache),
		commandExists(pi, "acli", commandCache),
	]);

	if (hasLinear && !hasJira) {
		return {
			provider: "linear",
			reference: candidate.key,
			lookup: candidate.key,
		};
	}
	if (hasJira && !hasLinear) {
		return {
			provider: "jira",
			reference: candidate.key,
			lookup: candidate.key,
		};
	}

	return undefined;
}

async function resolvePromptMatch(
	pi: ExtensionAPI,
	prompt: string,
	cwd: string,
	commandCache: Map<string, boolean>,
	configCache: Map<string, TrackerProvider[]>,
): Promise<PromptMatch | undefined> {
	const urlCandidates = extractUrlCandidates(prompt);
	const keyCandidate = extractKeyCandidate(prompt, urlCandidates);

	const resolvedCandidates: Array<{ index: number; match: PromptMatch }> = urlCandidates.map((candidate) => ({
		index: candidate.index,
		match: candidate.match,
	}));

	if (keyCandidate) {
		const resolvedKeyMatch = await resolveKeyCandidate(pi, keyCandidate, cwd, commandCache, configCache);
		if (resolvedKeyMatch) {
			resolvedCandidates.push({ index: keyCandidate.index, match: resolvedKeyMatch });
		}
	}

	resolvedCandidates.sort((a, b) => a.index - b.index);
	return resolvedCandidates[0]?.match;
}

async function fetchGitHubMetadata(
	pi: ExtensionAPI,
	match: PromptMatch,
	commandCache: Map<string, boolean>,
): Promise<IssueMetadata | undefined> {
	if (!(await commandExists(pi, "gh", commandCache))) return undefined;

	const args =
		match.provider === "github-pr"
			? ["pr", "view", match.lookup, "--json", "title,author,url"]
			: ["issue", "view", match.lookup, "--json", "title,author,url"];

	try {
		const result = await pi.exec("gh", args);
		if (result.code !== 0 || !result.stdout.trim()) return undefined;
		const data = JSON.parse(result.stdout) as {
			title?: string;
			author?: { login?: string; name?: string | null };
			url?: string;
		};
		return {
			title: data.title?.trim(),
			author: data.author,
			url: data.url?.trim() || match.url,
		};
	} catch {
		return undefined;
	}
}

function jiraBrowseUrlFromApiUrl(apiUrl: string | undefined, key: string): string | undefined {
	if (!apiUrl) return undefined;
	const raw = apiUrl.trim();
	const match = raw.match(/^(https?:\/\/[^/]+)\/rest\/api\/(?:2|3)\/issue\/([^/?#]+)/i);
	if (!match) return undefined;
	return `${match[1]}/browse/${encodeURIComponent(key || match[2])}`;
}

function pickJiraAuthor(data: any): Person | undefined {
	const reporter = data?.fields?.reporter ?? data?.reporter;
	const creator = data?.fields?.creator ?? data?.creator;
	const assignee = data?.fields?.assignee ?? data?.assignee;
	const person = reporter ?? creator ?? assignee;
	if (!person) return undefined;
	return {
		name: person.displayName ?? person.name ?? person.publicName ?? undefined,
		login: person.accountId ?? person.emailAddress ?? person.key ?? person.accountType ?? undefined,
	};
}

function pickJiraTitle(data: any): string | undefined {
	const title = data?.fields?.summary ?? data?.summary ?? data?.title;
	return typeof title === "string" ? title.trim() : undefined;
}

async function getAcliJiraSite(): Promise<string | undefined> {
	try {
		const configPath = resolve(homedir(), ".config", "acli", "jira_config.yaml");
		const raw = await readFile(configPath, "utf8");
		const currentProfile = raw.match(/^current_profile:\s*([^\n]+)/m)?.[1]?.trim();
		const currentCloudId = currentProfile?.split(":")[0];

		const profilePattern = /^\s*-\s+site:\s*([^\n]+)\n(?:\s+.*\n)*?\s+cloud_id:\s*([^\n]+)/gm;
		let firstSite: string | undefined;
		for (const match of raw.matchAll(profilePattern)) {
			const site = match[1]?.trim();
			const cloudId = match[2]?.trim();
			if (!site) continue;
			firstSite ??= site;
			if (currentCloudId && cloudId === currentCloudId) return site;
		}

		return firstSite;
	} catch {
		return undefined;
	}
}

function pickJiraUrl(data: any, fallbackKey: string, jiraSite?: string, fallbackUrl?: string): string | undefined {
	if (jiraSite) return `https://${jiraSite}/browse/${encodeURIComponent(fallbackKey)}`;
	const directUrl = data?.url ?? data?.webUrl ?? data?.browseUrl ?? data?.permalink;
	if (typeof directUrl === "string" && directUrl.trim()) return directUrl.trim();
	return fallbackUrl ?? jiraBrowseUrlFromApiUrl(data?.self, fallbackKey);
}

async function fetchJiraMetadata(
	pi: ExtensionAPI,
	match: PromptMatch,
	commandCache: Map<string, boolean>,
): Promise<IssueMetadata | undefined> {
	if (!(await commandExists(pi, "acli", commandCache))) return undefined;

	try {
		const result = await pi.exec("acli", [
			"jira",
			"workitem",
			"view",
			match.lookup,
			"--json",
			"--fields",
			"summary,reporter,creator,assignee",
		]);
		if (result.code !== 0 || !result.stdout.trim()) return undefined;
		const data = JSON.parse(result.stdout) as any;
		const jiraSite = await getAcliJiraSite();
		return {
			title: pickJiraTitle(data),
			author: pickJiraAuthor(data),
			url: pickJiraUrl(data, match.reference, jiraSite, match.url),
		};
	} catch {
		return undefined;
	}
}

function pickLinearAuthor(data: any): Person | undefined {
	const person = data?.creator ?? data?.createdBy ?? data?.assignee;
	if (!person) return undefined;
	return {
		name: person.name ?? person.displayName ?? undefined,
		login: person.email ?? person.id ?? undefined,
	};
}

async function fetchLinearIssueUrl(pi: ExtensionAPI, key: string): Promise<string | undefined> {
	try {
		const result = await pi.exec("linear", ["issue", "url", key]);
		if (result.code !== 0) return undefined;
		const url = result.stdout.trim();
		return url || undefined;
	} catch {
		return undefined;
	}
}

async function fetchLinearMetadata(
	pi: ExtensionAPI,
	match: PromptMatch,
	commandCache: Map<string, boolean>,
): Promise<IssueMetadata | undefined> {
	if (!(await commandExists(pi, "linear", commandCache))) return undefined;

	try {
		const result = await pi.exec("linear", ["issue", "view", match.lookup, "--json", "--no-comments", "--no-pager", "--no-download"]);
		if (result.code !== 0 || !result.stdout.trim()) return undefined;
		const data = JSON.parse(result.stdout) as any;
		return {
			title: data?.title?.trim?.() ?? data?.title,
			author: pickLinearAuthor(data),
			url: match.url ?? data?.url ?? (await fetchLinearIssueUrl(pi, match.lookup)),
		};
	} catch {
		return undefined;
	}
}

async function fetchIssueMetadata(
	pi: ExtensionAPI,
	match: PromptMatch,
	commandCache: Map<string, boolean>,
): Promise<IssueMetadata | undefined> {
	switch (match.provider) {
		case "github-pr":
		case "github-issue":
			return fetchGitHubMetadata(pi, match, commandCache);
		case "jira":
			return fetchJiraMetadata(pi, match, commandCache);
		case "linear":
			return fetchLinearMetadata(pi, match, commandCache);
		default:
			return undefined;
	}
}

function formatAuthor(author?: Person): string | undefined {
	if (!author) return undefined;
	const name = author.name?.trim();
	const login = author.login?.trim();
	if (name && login) return `${name} (${login})`;
	if (login) return login;
	if (name) return name;
	return undefined;
}

function getUserText(content: string | { type: string; text?: string }[] | undefined): string {
	if (!content) return "";
	if (typeof content === "string") return content;
	return content
		.filter((block): block is { type: "text"; text: string } => block.type === "text" && typeof block.text === "string")
		.map((block) => block.text)
		.join("\n");
}

function labelForProvider(provider: Provider): string {
	switch (provider) {
		case "github-pr":
			return "PR";
		case "github-issue":
			return "Issue";
		case "jira":
			return "Jira";
		case "linear":
			return "Linear";
		default:
			return "Issue";
	}
}

function hyperlink(text: string, url?: string): string {
	if (!url) return text;
	return `\u001b]8;;${url}\u0007${text}\u001b]8;;\u0007`;
}

export default function promptUrlWidgetExtension(pi: ExtensionAPI) {
	let refreshToken = 0;
	const commandCache = new Map<string, boolean>();
	const configCache = new Map<string, TrackerProvider[]>();

	const setWidget = (ctx: ExtensionContext, match: PromptMatch, title?: string, authorText?: string, resolvedUrl?: string) => {
		ctx.ui.setWidget("prompt-url", (_tui: unknown, theme: any) => {
			const label = labelForProvider(match.provider);
			const headingBase = `${label} ${match.reference}`;
			const heading = title ? `${headingBase} — ${title}` : headingBase;
			const url = resolvedUrl ?? match.url;
			const lines = [theme.fg("accent", heading)];
			if (authorText) lines.push(theme.fg("muted", authorText));
			lines.push(theme.fg("dim", hyperlink(url ?? match.reference, url)));

			const container = new Container();
			container.addChild(new DynamicBorder((s: string) => theme.fg("muted", s)));
			container.addChild(new Text(lines.join("\n"), 1, 0));
			return container;
		});
	};

	const applySessionName = (match: PromptMatch, title?: string, resolvedUrl?: string) => {
		const label = labelForProvider(match.provider);
		const fallbackRef = resolvedUrl ?? match.url ?? match.reference;
		const fallbackName = `${label}: ${fallbackRef}`;
		const desiredName = title?.trim() ? `${label}: ${title.trim()} (${fallbackRef})` : fallbackName;
		const currentName = pi.getSessionName()?.trim();

		if (!currentName) {
			pi.setSessionName(desiredName);
			return;
		}

		if (currentName === fallbackRef || currentName === fallbackName) {
			pi.setSessionName(desiredName);
		}
	};

	const clearWidget = (ctx: ExtensionContext) => {
		refreshToken += 1;
		ctx.ui.setWidget("prompt-url", undefined);
	};

	const refreshWidget = async (ctx: ExtensionContext, match: PromptMatch) => {
		const token = ++refreshToken;
		setWidget(ctx, match);
		applySessionName(match);

		const metadata = await fetchIssueMetadata(pi, match, commandCache);
		if (token !== refreshToken) return;

		const title = metadata?.title?.trim();
		const authorText = formatAuthor(metadata?.author);
		const resolvedUrl = metadata?.url?.trim() || match.url;
		setWidget(ctx, match, title, authorText, resolvedUrl);
		applySessionName(match, title, resolvedUrl);
	};

	const rebuildFromSession = async (ctx: ExtensionContext) => {
		if (!ctx.hasUI) return;

		const branch = ctx.sessionManager.getBranch();
		for (const entry of [...branch].reverse()) {
			if (entry.type !== "message" || entry.message.role !== "user") continue;
			const text = getUserText(entry.message.content);
			const match = await resolvePromptMatch(pi, text, ctx.cwd, commandCache, configCache);
			if (!match) continue;
			await refreshWidget(ctx, match);
			return;
		}

		clearWidget(ctx);
	};

	pi.on("before_agent_start", async (event, ctx) => {
		if (!ctx.hasUI) return;
		const match = await resolvePromptMatch(pi, event.prompt, ctx.cwd, commandCache, configCache);
		if (!match) return;
		await refreshWidget(ctx, match);
	});

	pi.on("session_start", async (_event, ctx) => {
		await rebuildFromSession(ctx);
	});

	pi.on("session_tree", async (_event, ctx) => {
		await rebuildFromSession(ctx);
	});
}
