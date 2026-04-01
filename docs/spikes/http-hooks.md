# Spike: HTTP Hooks for External Integrations

**Date:** 2026-04-01
**Task:** SDK.FUT.4
**Status:** Evaluated — SDK supports HTTP hooks natively via settings

## Summary

The Claude Agent SDK supports HTTP hooks that POST hook event data to external URLs. This enables webhook notifications to Slack, Discord, PagerDuty, or any HTTP endpoint without custom notification code.

## SDK HTTP Hook API

HTTP hooks are configured alongside command/prompt/agent hooks in the settings:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "http",
          "url": "https://hooks.slack.com/services/T.../B.../xxx",
          "headers": {
            "Authorization": "Bearer $SLACK_TOKEN"
          },
          "allowedEnvVars": ["SLACK_TOKEN"],
          "timeout": 10
        }]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [{
          "type": "http",
          "url": "https://api.pagerduty.com/incidents",
          "headers": { "Authorization": "Token token=$PD_TOKEN" },
          "allowedEnvVars": ["PD_TOKEN"],
          "timeout": 15,
          "if": "stop_reason == 'error'"
        }]
      }
    ]
  }
}
```

### Hook Types Available

| Type | Description |
|---|---|
| `command` | Shell command execution |
| `prompt` | LLM prompt evaluation |
| `agent` | Agentic verifier (spawns sub-agent) |
| **`http`** | HTTP POST to external URL |

### HTTP Hook Fields

| Field | Type | Description |
|---|---|---|
| `type` | `"http"` | Hook type |
| `url` | `string` | URL to POST hook input JSON to |
| `headers` | `Record<string, string>` | Additional headers (supports `$VAR_NAME` interpolation) |
| `allowedEnvVars` | `string[]` | Env vars allowed for header interpolation |
| `timeout` | `number` | Request timeout in seconds |
| `if` | `string` | Permission rule syntax filter |

### Security

- `allowedHttpHookUrls` in settings restricts which URLs hooks can target (wildcard patterns)
- `httpHookAllowedEnvVars` restricts which env vars can be interpolated
- Both settings merge across sources (user, project, managed)

## Integration with AgentOps

### Option A: Settings File Configuration

Configure HTTP hooks in the project's `.claude/settings.json`. Users edit the settings file directly or via the Settings UI.

```json
{
  "hooks": {
    "SessionEnd": [{
      "hooks": [{
        "type": "http",
        "url": "https://hooks.slack.com/services/...",
        "timeout": 10
      }]
    }]
  }
}
```

**Pros:** Zero code changes — SDK handles everything.
**Cons:** Settings file not exposed in AgentOps UI yet.

### Option B: UI-Configured Webhooks

Add "Integrations" section to Settings with:
1. Webhook URL input per event type
2. Test button to verify endpoint
3. Headers configuration with secret management
4. Event type selector (SessionEnd, PostToolUse, etc.)

Store in project settings, pass to `query()` via `hooks` option alongside existing programmatic hooks.

**Pros:** User-friendly, discoverable.
**Cons:** Need to merge UI-configured hooks with programmatic hooks.

## Recommended Events for Webhooks

| Event | Use Case |
|---|---|
| `SessionEnd` | Notify on execution complete/error |
| `PostToolUse` (Bash) | Alert on specific tool executions |
| `Stop` | Notify when agent stops unexpectedly |
| `SessionStart` | Track agent activity |

## Recommendation

**Start with Option A.** HTTP hooks work today with zero code changes — just configure the settings file. Add a "Webhooks" section to the Settings UI (Option B) when users request it.

## Complexity Estimate

| Component | Effort |
|---|---|
| Option A: Settings file | None — already works |
| Option B: Settings UI | Medium — webhook config form + hook merging |
