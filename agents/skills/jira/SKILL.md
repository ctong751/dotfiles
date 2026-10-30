---
name: jira
description: Look up and search Jira tickets using the Atlassian CLI (acli). Use when the user provides a Jira key or URL, asks about ticket requirements, status, links, or comments, or requests a Jira update.
allowed-tools: Bash
---

# Jira

Use the Jira site from the supplied ticket URL, repository instructions, or
authenticated CLI configuration. Do not assume an organization or project. If
those sources point to different sites, resolve the target before making changes.

## Setup

Requires the [Atlassian CLI](https://developer.atlassian.com/cloud/acli/guides/install-acli/).
Check authentication with `acli jira auth status`. If the CLI is missing or
authentication fails, explain what is needed. Have the user run
`acli auth login` and complete OAuth themselves. Do not drive the OAuth flow or
read credentials. Jira and Confluence tokens are product-scoped.

## Read a ticket

Extract the key from the user's request or Jira URL. Quote ticket keys in shell
commands; do not interpolate arbitrary user text as shell code. For multiple
keys, fetch each ticket. `PROJECT-123` below is a placeholder; use the actual
project key and issue number from the request. Do not assume a project prefix.

```bash
acli jira workitem view 'PROJECT-123' --fields '*all' --json
```

Read summary, status, assignee, priority, description, parent, subtasks, and issue
links from `fields`. If relationship fields are absent, fetch them explicitly:

```bash
acli jira workitem view 'PROJECT-123' --fields '*navigable' --json
```

Fetch linked tickets separately when their status or requirements are needed.
Distinguish `inwardIssue` and `outwardIssue` and use the matching relation
description from the link's `type`.

### Comments and rich text

```bash
acli jira workitem view 'PROJECT-123' --fields comment --json
```

Table-mode `--fields comment` omits comment bodies. `comment list` can strip
mentions and ticket links, and its JSON has been observed omitting timestamps.
Prefer `fields.comment.comments` from `view` for faithful content. Check any
pagination metadata before describing a comment list as complete.

Descriptions and comments can contain Atlassian Document Format (ADF). Walk
`content` recursively, preserving paragraph/list boundaries, hard breaks and code
blocks. Preserve `text` nodes, mention `attrs.text`, inline-card `attrs.url`,
emoji text, and link marks. Include comment IDs, authors, and dates when reporting
discussion. Do not silently truncate requirements or relevant comments.

Present the ticket's requirements and current state, relevant relationships and
discussion, and a ticket link using the resolved Jira site and `/browse/PROJECT-123`.
State when fields or comments could not be retrieved.

## Search

```bash
acli jira workitem search --jql 'parent = PROJECT-123 ORDER BY rank' --fields key,summary,status,assignee,issuetype --json
```

Search JSON is a top-level array, not an `issues` object. Search rejects
`issuelinks` in `--fields`; fetch links with `workitem view` per ticket. Check
`search --help` for pagination options when the complete result set is needed.

## Requested updates

A lookup or implementation request does not authorize posting comments or changing
Jira state. Make mutations only when the user requests them, within that scope.
Prepare long descriptions or comments in files and pass the file path.

Check the installed command's `--help` before unfamiliar mutations. Use `--yes`
on commands that support it to avoid interactive confirmation prompts; comment
`create` and `update` do not support it in the locally checked CLI.

```bash
acli jira workitem edit --key 'PROJECT-123' --description-file /tmp/jira-description-adf.json --yes
acli jira workitem transition --key 'PROJECT-123' --status 'In Progress' --yes
acli jira workitem comment create --key 'PROJECT-123' --body-file /tmp/jira-comment.txt
```

`edit --description-file` accepts ADF JSON. For comments, ADF passed to
`create --body` or `--body-file` has been observed rendering as literal JSON
despite the help text. For a formatted comment, prepare the final ADF file first, create
a plain-text version, capture the returned comment ID, then update that same
comment:

```bash
acli jira workitem comment update --key 'PROJECT-123' --id 'COMMENT-ID' --body-adf /tmp/jira-comment-adf.json
```

If ID capture fails, retrieve the existing comment before retrying to avoid
duplicates. If formatting fails, report the existing comment and failed update.
Comments are top-level; the CLI has no threaded-reply support. Wiki markup has
been observed rendering literally. Use ADF for formatting.

### Ticket links

In observed CLI behavior, `link create --out A --in B --type Blocks --yes`
creates **B blocks A**, while the success message claims the reverse. For that
link type, put the blocked ticket in `--out` and the blocker in `--in`. Other
link types need their direction checked separately.

Verify the actual relationship with `view --fields issuelinks --json` after
creation. `link list` has been observed omitting linked keys; use `view` instead.
If a link needs correction, identify its ID and correct only the link just
created within the authorized request. Avoid bulk CSV linking; it has been
observed failing on valid pairs.

## CLI pitfalls

- Prefer JSON. Tables can contain ANSI escapes and truncated cells.
- Errors may print non-JSON even with `--json`. Preserve stderr and inspect raw
  output before parsing; report CLI errors rather than treating them as no data.
- Batch operations can partially succeed. Inspect the reported success tally and
  verify affected tickets instead of relying only on the exit code.
- Some `--help` commands exit 1 while printing valid help.
- `--key` can accept comma-separated keys on batch commands; results can arrive
  out of order. Match results by ticket key.
- Use `workitem edit`, not `workitem update`. The checked CLI has no sprint or
  board commands. Do not invent unsupported commands.
