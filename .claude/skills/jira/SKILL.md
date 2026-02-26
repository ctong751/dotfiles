---
name: jira
description: Fetch and display Jira ticket details using the Atlassian CLI (acli).
argument-hint: [ticket-id]
disable-model-invocation: false
allowed-tools: Bash
---

# Jira Ticket Lookup

Fetch details for Jira ticket: **$ARGUMENTS**

## Steps

1. Fetch the ticket overview:

```bash
acli jira workitem view $ARGUMENTS --fields '*all'
```

2. Fetch linked tickets, parent, and subtasks (run in parallel with step 1):

```bash
acli jira workitem view $ARGUMENTS --fields '*navigable' --json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
fields = data.get('fields', {})
for key in ('issuelinks', 'parent', 'subtasks'):
    val = fields.get(key)
    if val:
        print(f'{key}: {json.dumps(val, indent=2)}')
"
```

3. Fetch comments — the `--fields comment` flag does NOT return comment bodies. Always use the JSON approach:

```bash
acli jira workitem view $ARGUMENTS --fields '*all' --json 2>/dev/null | python3 -c "
import json, sys

def extract_text(node):
    texts = []
    if isinstance(node, dict):
        ntype = node.get('type', '')
        if ntype == 'text':
            texts.append(node.get('text', ''))
        elif ntype == 'hardBreak':
            texts.append('\n')
        elif ntype == 'codeBlock':
            lang = node.get('attrs', {}).get('language', '')
            inner = []
            for child in node.get('content', []):
                inner.extend(extract_text(child))
            texts.append('\n\`\`\`' + lang + '\n' + ''.join(inner) + '\n\`\`\`\n')
        elif ntype == 'paragraph':
            inner = []
            for child in node.get('content', []):
                inner.extend(extract_text(child))
            texts.append(''.join(inner) + '\n')
        elif ntype == 'listItem':
            inner = []
            for child in node.get('content', []):
                inner.extend(extract_text(child))
            texts.append('- ' + ''.join(inner).strip() + '\n')
        else:
            for child in node.get('content', []):
                texts.extend(extract_text(child))
    return texts

data = json.load(sys.stdin)
comments = data.get('fields', {}).get('comment', {}).get('comments', [])
if not comments:
    print('No comments')
else:
    for c in comments:
        cid = c.get('id')
        author = c.get('author', {}).get('displayName', '?')
        created = c.get('created', '')[:10]
        body = c.get('body', {})
        text = ''.join(extract_text(body)).strip()
        print(f'=== [{cid}] {author} ({created}) ===')
        print(text[:3000])
        print()
"
```

4. Present the information clearly to the user, highlighting:
   - Summary, Status, Assignee, Priority
   - Description / requirements
   - Linked tickets (blocked by, blocks, duplicates, etc.) with their status
   - Parent epic if any
   - Any comments or discussion (include comment IDs for reference)
   - Link to the ticket

5. If the user provided multiple ticket IDs (space-separated), fetch each one.

## Creating Comments

### Plain text comments

```bash
acli jira workitem comment create --key TICKET-ID --body "comment text"
# Or for long comments:
acli jira workitem comment create --key TICKET-ID --body-file /tmp/comment.txt
```

Note: `--body` and `--body-file` claim to support ADF but **do not** — ADF JSON renders as literal text.

### Formatted comments (code blocks, @mentions, etc.)

`comment create` does NOT support ADF despite the docs. Use a two-step workaround:
1. Create a placeholder comment and capture its ID
2. Update it with `--body-adf` (which DOES work)

```bash
# Step 1: Create placeholder, capture comment ID
COMMENT_ID=$(acli jira workitem comment create --key TICKET-ID --body "..." --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")

# Step 2: Update with ADF formatting
acli jira workitem comment update --key TICKET-ID --id "$COMMENT_ID" --body-adf /tmp/comment-adf.json
```

#### ADF JSON structure

Write an ADF JSON file (e.g., `/tmp/comment-adf.json`) with this structure:

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "mention",
          "attrs": {
            "id": "712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "text": "@Sarah Kennedy",
            "userType": "DEFAULT"
          }
        },
        { "type": "text", "text": " here's the update:" }
      ]
    },
    {
      "type": "codeBlock",
      "attrs": { "language": "json" },
      "content": [
        { "type": "text", "text": "{ \"key\": \"value\" }" }
      ]
    }
  ]
}
```

Key ADF node types:
- **Mention**: `{"type": "mention", "attrs": {"id": "<accountId>", "text": "@Display Name", "userType": "DEFAULT"}}`
- **Code block**: `{"type": "codeBlock", "attrs": {"language": "json"}, "content": [{"type": "text", "text": "..."}]}`
- **Paragraph**: `{"type": "paragraph", "content": [...]}`
- **Text**: `{"type": "text", "text": "..."}`

Ref: [ADF structure docs](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/)

### Known Limitations

- **No reply/threading.** Neither `comment create` nor `comment update` supports replying to a specific comment. All comments are top-level.
- **No wiki markup.** Jira wiki syntax (`{code:json}`, `[~accountId:...]`) renders as literal text — always use ADF via the update workaround above.
- **For threaded replies:** The user must post manually via the Jira UI. Inform them and provide the text to copy-paste.
