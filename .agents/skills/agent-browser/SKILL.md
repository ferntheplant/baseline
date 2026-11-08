---
name: agent-browser
description: Drive a real Chrome to test a web app, including navigating, clicking, filling forms, screenshots, console and network checks. Use when a change needs checking in a browser. Prefer this over any other browser tool.
allowed-tools: Bash(agent-browser:*)
hidden: true
---

# agent-browser

Fast browser automation CLI for AI agents. Chrome/Chromium via CDP with accessibility-tree snapshots and compact `@eN` element refs.

The repo's `mise.toml` installs `agent-browser`, so run it from inside the checkout. On a machine with no Chrome for it yet, run `agent-browser install` once.

## Start here

This file is a discovery stub, not the usage guide. Before running any `agent-browser` command, load the actual workflow content from the CLI:

```bash
agent-browser skills get core             # start here: the loop, waits, common tasks, troubleshooting
```

The core guide ends with a table of references to load for detailed commands and flags. Use `agent-browser skills get core --full` only when you need every reference at once; it is several times larger.

The CLI serves skill content that matches the installed version. This stub cannot change between releases, which is why it only points at `skills get core`.

## Specialized skills

Load a specialized skill when the task falls outside browser web pages:

```bash
agent-browser skills get electron          # Electron desktop apps (VS Code, Slack, Discord, Figma, ...)
agent-browser skills get slack             # Slack workspace automation
agent-browser skills get dogfood           # Exploratory testing / QA / bug hunts
agent-browser skills get derive-client     # Record a HAR, derive a standalone API client for a site
agent-browser skills get webmcp-gen        # Build and validate WebMCP tools for a page
agent-browser skills get vercel-sandbox    # agent-browser inside Vercel Sandbox microVMs
agent-browser skills get protected-vercel-deployments  # Access protected Vercel deployments
agent-browser skills get agentcore         # AWS Bedrock AgentCore cloud browsers
```

Run `agent-browser skills list` to see everything available on the installed version.
