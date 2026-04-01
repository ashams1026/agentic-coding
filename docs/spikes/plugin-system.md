# Spike: Plugin System Integration

**Date:** 2026-04-01
**Task:** SDK.FUT.3
**Status:** Evaluated — local plugins work now, marketplace is settings-based

## Summary

The Claude Agent SDK supports a plugin system that allows loading custom commands, agents, MCP servers, and hooks from local directories or marketplace registries. This can be used to let users install community-built persona skills and tools.

## SDK Plugin API

### Local Plugins

```typescript
const q = query({
  prompt,
  options: {
    plugins: [
      { type: 'local', path: './my-plugin' },
      { type: 'local', path: '/absolute/path/to/plugin' },
    ],
  },
});
```

Currently only `type: 'local'` is supported in `SdkPluginConfig`. Plugins are directories containing configuration files that define commands, agents, MCP servers, and hooks.

### Marketplace Plugins (Settings-Based)

Marketplace plugins are configured via settings files, not the `query()` API:

```json
// .claude/settings.json
{
  "enabledPlugins": {
    "formatter@anthropic-tools": true,
    "linter@community-plugins": { "version": ">=1.0.0" }
  },
  "extraKnownMarketplaces": [
    {
      "name": "my-team-plugins",
      "source": { "type": "url", "url": "https://plugins.example.com/marketplace.json" }
    }
  ]
}
```

### Plugin Reload

```typescript
await q.reloadPlugins();
// Returns refreshed: commands, agents, plugins, MCP server status
```

## Integration Options for AgentOps

### Option A: Local Plugin Directory per Project

Each project gets a `plugins/` directory. Users place plugin folders there, and the executor loads them via `plugins: [{ type: 'local', path }]`.

**Pros:** Simple, works now, no marketplace infrastructure.
**Cons:** Manual installation, no versioning, no discovery.

### Option B: Settings-Based Marketplace

Configure `enabledPlugins` and `extraKnownMarketplaces` in the project's `.claude/settings.json`. The SDK handles plugin discovery, installation, and loading.

**Pros:** Versioning, community sharing, auto-updates.
**Cons:** Requires marketplace infrastructure (git repos or URL hosting), settings file management.

### Option C: UI-Managed Plugin Browser

Add a "Plugins" section in Settings that:
1. Lists installed plugins (from `reloadPlugins()` response)
2. Browses available plugins from configured marketplaces
3. Enables/disables plugins via `enabledPlugins` settings
4. Adds custom marketplace sources

**Pros:** Full UX, discoverability.
**Cons:** Highest implementation effort, requires Options A or B as foundation.

## Recommendation

**Start with Option A (local plugins) as a simple first step.** Add a `plugins` path to project settings, load them in the executor. This unblocks power users who want custom tools without requiring marketplace infrastructure.

**Revisit Option C when:**
- Multiple users share plugins across projects
- A public Claude Code plugin marketplace exists
- Community plugin demand emerges

## Complexity Estimate

| Component | Effort |
|---|---|
| Option A: Local plugins | Low — path config + `plugins` option |
| Option B: Settings marketplace | Medium — settings file management |
| Option C: Plugin browser UI | High — full feature with marketplace |
