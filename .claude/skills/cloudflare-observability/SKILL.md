---
name: cloudflare-observability
description: Query Cloudflare Worker logs and analytics. Use when asked to check worker errors, tail logs, or inspect Cloudflare observability data.
allowed-tools: Bash
---

# Cloudflare Observability

## MCP Server Setup

The `cloudflare-observability` MCP is configured via `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "cloudflare-observability": {
      "command": "npx",
      "args": ["mcp-remote", "https://observability.mcp.cloudflare.com/mcp"]
    }
  }
}
```

**Important:** This MCP requires OAuth browser authentication on first use. If the server shows as "not found" or disconnected:

1. Exit the current Claude Code session (`/exit` or `Ctrl+C`)
2. Run `claude` again — the MCP connects at startup
3. On first launch it will open a browser for OAuth with your Cloudflare account
4. After auth completes, the `cloudflare-observability` tools will be available

## Fallback: Cloudflare API directly

If the MCP is unavailable, query logs via the Cloudflare API:

```bash
# Get account ID
CF_ACCOUNT_ID=$(cat ~/.cloudflare/account_id 2>/dev/null || grep CLOUDFLARE_ACCOUNT_ID .env 2>/dev/null | cut -d= -f2)
CF_API_TOKEN=$(cat ~/.cloudflare/api_token 2>/dev/null || grep CLOUDFLARE_API_TOKEN .env 2>/dev/null | cut -d= -f2)

# List workers
curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/scripts" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[].id'

# Get analytics (last hour)
curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/analytics/query" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT sum(requests), sum(errors), scriptName FROM WorkersInvocations WHERE date > NOW() - INTERVAL 1 HOUR GROUP BY scriptName"}'
```

## Fallback: wrangler tail (if installed)

```bash
# Stream live logs from a worker
npx wrangler tail <worker-name> --format=pretty

# Filter to errors only
npx wrangler tail <worker-name> --status=error
```
